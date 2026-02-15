'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { downloadFile, validatePDFFile } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
// import { AdSense } from '@/components/shared/AdSense';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';



export default function PDFtoJPGPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [quality, setQuality] = useState<'low' | 'standard' | 'high'>('standard');
    const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');

    const handleFileSelected = (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success('PDF uploaded successfully');
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    const handleConvertToJPG = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            // 1. Determine Scale and Quality based on selection
            let scale = 2.0;
            let qualityValue = 0.85;

            if (quality === 'low') {
                scale = 1.0;
                qualityValue = 0.7;
            } else if (quality === 'high') {
                scale = 4.16; // ~300 DPI
                qualityValue = 0.95;
            }

            const { convertPDFToImages } = await import('@/lib/services/pdf/manipulators/organization');
            const generator = convertPDFToImages(file, {
                format,
                scale,
                quality: qualityValue
            });

            const convertedFiles: File[] = [];
            const pdfjsLib = await import('pdfjs-dist');
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const totalPages = pdf.numPages;
            await pdf.destroy();

            let processedCount = 0;
            for await (const convertedFile of generator) {
                processedCount++;
                setProgress(Math.round((processedCount / totalPages) * 100));
                convertedFiles.push(convertedFile);
            }

            // Download Logic
            if (convertedFiles.length === 1) {
                downloadFile(convertedFiles[0], convertedFiles[0].name);
                toast.success(`Converted to ${format.toUpperCase()}!`);
            } else if (convertedFiles.length > 1) {
                const zip = new JSZip();
                convertedFiles.forEach((f) => zip.file(f.name, f));
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                downloadFile(zipBlob, `${file.name.replace('.pdf', '')}_images.zip`);
                toast.success(`Converted ${convertedFiles.length} pages! Downloaded as ZIP.`);
            }

            setFile(null);
            setProgress(0);
        } catch (error) {
            console.error('Conversion Failed:', error);
            toast.error('Conversion failed. See console for details.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="pdfToJpg"
                title="PDF to Image"
                description="Convert PDF pages to high-quality JPG or PNG images"
                icon={ImageIcon}
                color="from-orange-500 to-red-500"
            />

            <div className="mb-8">
                <FileUpload
                    onFilesSelected={handleFileSelected}
                    files={file ? [file] : []}
                    onRemoveFile={() => setFile(null)}
                    multiple={false}
                    maxSize={limits.maxFileSize}
                    isPro={isPro}
                />
            </div>

            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label={`Converting page ${Math.ceil((progress / 100) * (file ? 1 : 1))}...`} />
                </div>
            )}

            {file && !processing && (
                <GlassCard className="p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="w-full md:w-auto">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Image Quality</label>
                            <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
                                {(['low', 'standard', 'high'] as const).map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setQuality(q)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${quality === q
                                            ? 'bg-gradient-primary text-white shadow-lg'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        {q.charAt(0).toUpperCase() + q.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="w-full md:w-auto">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
                            <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
                                {(['jpeg', 'png'] as const).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFormat(f)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${format === f
                                            ? 'bg-gradient-primary text-white shadow-lg'
                                            : 'text-slate-400 hover:text-white'
                                            }`}
                                    >
                                        {f.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            onClick={handleConvertToJPG}
                            loading={processing}
                            icon={<Download className="w-5 h-5" />}
                            className="w-full md:w-auto"
                        >
                            Convert to {format.toUpperCase()}
                        </Button>
                    </div>
                </GlassCard>
            )}

            {/* <div className="my-12">
                <AdSense slot="pdf-to-jpg-bottom" />
            </div> */}

            <QuickGuide steps={toolGuides['/pdf-to-jpg']} />
            <ToolContent toolName="/pdf-to-jpg" />
            <RelatedTools currentToolHref="/pdf-to-jpg" />
        </div>
    );
}
