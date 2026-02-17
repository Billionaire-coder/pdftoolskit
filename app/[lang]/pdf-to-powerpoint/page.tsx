'use client';

import React, { useState, useEffect } from 'react';
import { Presentation, Download, LayoutTemplate, Layers } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { pdfToPowerPoint } from '@/lib/pdf-to-ppt';
import { downloadFile, validatePDFFile } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function PDFToPowerPointPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            const validation = validatePDFFile(files[0]);
            if (validation.valid) {
                setFile(files[0]);
                toast.success('PDF file uploaded');
            } else {
                toast.error(validation.error || 'Invalid PDF file');
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        toast.success('File removed');
    };

    const handleConvert = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 5, 90));
            }, 500);

            const pptxBytes = await pdfToPowerPoint(file);
            clearInterval(progressInterval);
            setProgress(100);

            const blob = new Blob([pptxBytes as any], {
                type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            });
            const filename = file.name.replace('.pdf', '.pptx');

            setResult({ blob, fileName: filename });

            toast.success('PDF converted to PowerPoint successfully!');
            setFile(null);
            setProgress(0);
        } catch (error) {
            console.error('Error converting PDF to PPTX:', error);
            toast.error('Failed to convert. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="pdfToPowerpoint"
                title="PDF to PowerPoint"
                description="Convert PDF slides into editable PowerPoint presentations (PPTX). Each page becomes a high-quality slide."
                icon={Presentation}
                color="from-orange-500 to-red-500"
            />

            <div className="mb-8">
                <FileUpload
                    onFilesSelected={handleFileSelected}
                    files={file ? [file] : []}
                    onRemoveFile={handleRemoveFile}
                    multiple={false}
                    accept={{ 'application/pdf': ['.pdf'] }}
                    maxSize={limits.maxFileSize}
                    isPro={isPro}
                />
            </div>

            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label="Converting to PowerPoint..." />
                </div>
            )}

            {/* Result Card */}
            {result && (
                <GlassCard className="p-6 mb-8 text-center animate-in zoom-in-95 duration-500 max-w-md mx-auto">
                    <div className="mx-auto w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                        <Presentation className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">PowerPoint Ready!</h3>

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
                                Download PPTX
                            </Button>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => setResult(null)} className="mt-4 text-sm">
                        Convert Another
                    </Button>
                </GlassCard>
            )}

            {file && !result && (
                <GlassCard className="p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-white font-semibold mb-1">Ready to convert</p>
                            <p className="text-sm text-slate-400">Pages will be converted to slides</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => setFile(null)} disabled={processing}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleConvert} loading={processing} icon={<Download className="w-5 h-5" />}>
                                Convert to PPTX
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            )}

            <GlassCard className="p-6 mb-8">
                <div className="flex items-start space-x-3">
                    <LayoutTemplate className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="text-white font-semibold mb-2">High Fidelity Slides</h3>
                        <p className="text-sm text-slate-300 mb-3">
                            We render your PDF pages as high-resolution images on each slide, ensuring that fonts,
                            layouts, and graphics appear exactly as they do in the original document.
                        </p>
                    </div>
                </div>
            </GlassCard>
            <QuickGuide steps={toolGuides['/pdf-to-powerpoint']} />
            <ToolContent toolName="/pdf-to-powerpoint" />
            <RelatedTools currentToolHref="/pdf-to-powerpoint" />
        </div >
    );
}
