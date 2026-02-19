'use client';

import React, { useState, useEffect } from 'react';
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
    const [dpi, setDpi] = useState(150);
    const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleFileSelected = (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success('PDF uploaded successfully');
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    // const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    const handleConvertToJPG = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            // 1. Determine Scale and Quality based on selection
            const { convertPDFToImages } = await import('@/lib/services/pdf/manipulators/organization');
            const generator = convertPDFToImages(file, {
                format,
                scale: dpi / 72,
                quality: 0.9
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
                setResult({ blob: convertedFiles[0], fileName: convertedFiles[0].name });
                toast.success(`Converted to ${format.toUpperCase()}!`);
            } else if (convertedFiles.length > 1) {
                const zip = new JSZip();
                convertedFiles.forEach((f) => zip.file(f.name, f));
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                setResult({ blob: zipBlob, fileName: `${file.name.replace('.pdf', '')}_images.zip` });
                toast.success(`Converted ${convertedFiles.length} pages! Ready to download.`);
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

            {/* Result Card */}
            {result && (
                <GlassCard className="p-6 mb-8 text-center animate-in zoom-in-95 duration-500 max-w-md mx-auto">
                    <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                        <ImageIcon className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Conversion Complete!</h3>

                    <div className="flex justify-center mt-6">
                        <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
                            <input
                                type="text"
                                value={downloadFileName}
                                onChange={(e) => setDownloadFileName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 w-full flex-grow text-center sm:text-left"
                                placeholder="Filename"
                            />
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                icon={<Download className="w-5 h-5" />}
                                className="w-full sm:w-auto"
                            >
                                Download
                            </Button>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => setResult(null)} className="mt-4 text-sm">
                        Convert Another
                    </Button>
                </GlassCard>
            )}

            {file && !processing && !result && (
                <GlassCard className="p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-end justify-between gap-6">
                        <div className="w-full flex-grow">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-300">Resolution (DPI)</label>
                                <span className="text-orange-500 font-bold">{dpi} DPI {dpi >= 300 && '🚀'}</span>
                            </div>
                            <input
                                type="range"
                                min="72"
                                max="600"
                                step="1"
                                value={dpi}
                                onChange={(e) => setDpi(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                            />
                            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                                <span>72 (Web)</span>
                                <span>150 (Standard)</span>
                                <span>300 (Print)</span>
                                <span>600 (Ultra-High)</span>
                            </div>
                        </div>

                        <div className="w-full md:w-auto">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
                            <div className="flex gap-2 bg-white/5 p-1 rounded-lg">
                                {(['jpeg', 'png', 'webp'] as const).map((f) => (
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
