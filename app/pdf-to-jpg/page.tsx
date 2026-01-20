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
import { AdSense } from '@/components/shared/AdSense';



export default function PDFtoJPGPage() {
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
            // 1. Determine Scale based on Quality
            let scale = 1.5; // Default standard
            if (quality === 'low') scale = 1.0;     // 72 DPI
            if (quality === 'standard') scale = 2.0; // 144 DPI
            if (quality === 'high') scale = 4.16;    // 300 DPI (300/72 ≈ 4.16)

            console.log(`Starting PDF to JPG conversion. Quality: ${quality}, Scale: ${scale}`);

            // Load PDF.js dynamically
            const pdfjsLib = await import('pdfjs-dist');
            const workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
            pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({
                data: arrayBuffer,
                verbosity: 0
            }).promise;

            const imageBlobs: { blob: Blob; name: string }[] = [];
            const baseFileName = file.name.replace('.pdf', '');

            // Convert each page
            for (let i = 1; i <= pdf.numPages; i++) {
                setProgress(Math.round(((i - 1) / pdf.numPages) * 100));

                // Allow UI to breathe
                await sleep(10);

                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d', { willReadFrequently: true });

                if (!context) throw new Error('Failed to get canvas context');

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport }).promise;

                const blob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob(
                        (b) => b ? resolve(b) : reject(new Error(`Page ${i} conversion failed`)),
                        `image/${format}`,
                        quality === 'high' ? 0.95 : 0.85
                    );
                });

                imageBlobs.push({
                    blob,
                    name: `${baseFileName}_page${i}.${format === 'jpeg' ? 'jpg' : 'png'}`,
                });

                // Cleanup to prevent memory leaks
                page.cleanup();
                canvas.width = 0;
                canvas.height = 0;
            }

            setProgress(100);

            // Download Logic
            if (imageBlobs.length === 1) {
                downloadFile(imageBlobs[0].blob, imageBlobs[0].name);
                toast.success(`Converted to ${format.toUpperCase()}!`);
            } else {
                const zip = new JSZip();
                imageBlobs.forEach((img) => zip.file(img.name, img.blob));
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                downloadFile(zipBlob, `${baseFileName}_images.zip`);
                toast.success(`Converted ${pdf.numPages} pages! Downloaded as ZIP.`);
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
            <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 mb-6 shadow-glow">
                    <ImageIcon className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold gradient-text mb-4">
                    PDF to Image
                </h1>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                    Convert PDF pages to high-quality JPG or PNG images
                </p>
            </div>

            <div className="mb-8">
                <FileUpload
                    onFilesSelected={handleFileSelected}
                    files={file ? [file] : []}
                    onRemoveFile={() => setFile(null)}
                    multiple={false}
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

            <div className="my-12">
                <AdSense slot="pdf-to-jpg-bottom" />
            </div>

            <QuickGuide steps={toolGuides['/pdf-to-jpg']} />
            <ToolContent toolName="/pdf-to-jpg" />
            <RelatedTools currentToolHref="/pdf-to-jpg" />
        </div>
    );
}
