'use client';

import React, { useState } from 'react';
import { FileType, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { powerPointToPdf } from '@/lib/ppt-to-pdf';
import { downloadFile } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function PowerPointToPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            const f = files[0];
            if (f.name.endsWith('.pptx')) {
                setFile(f);
                toast.success('PowerPoint file uploaded');
            } else {
                toast.error('Please upload a .pptx file');
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        toast.success('File removed');
    };

    const handleConvert = async () => {
        if (!file) {
            toast.error('Please upload a PPTX file');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 5, 90));
            }, 300);

            const pdfBytes = await powerPointToPdf(file);
            clearInterval(progressInterval);
            setProgress(100);

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const filename = file.name.replace(/\.[^/.]+$/, "") + '.pdf';
            downloadFile(blob, filename);

            toast.success('PowerPoint converted to PDF!');
            setFile(null);
            setProgress(0);
        } catch (error) {
            console.error('Error converting PPTX to PDF:', error);
            toast.error('Failed to convert. Ensure it is a valid .pptx file.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="powerpointToPdf"
                title="PowerPoint to PDF"
                description="Convert PowerPoint presentations (.pptx) to PDF documents. Extracts text and content for easy sharing."
                icon={FileType}
                color="from-red-600 to-orange-600"
            />

            <div className="mb-8">
                <FileUpload
                    onFilesSelected={handleFileSelected}
                    files={file ? [file] : []}
                    onRemoveFile={handleRemoveFile}
                    multiple={false}
                    maxSize={limits.maxFileSize}
                    isPro={isPro}
                    accept={{
                        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
                    }}
                />
            </div>

            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label="Extracting content to PDF..." />
                </div>
            )}

            {file && (
                <GlassCard className="p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-white font-semibold mb-1">Ready to convert</p>
                            <p className="text-sm text-slate-400">Content will be extracted to PDF</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" onClick={() => setFile(null)} disabled={processing}>
                                Cancel
                            </Button>
                            <Button variant="primary" onClick={handleConvert} loading={processing} icon={<Download className="w-5 h-5" />}>
                                Convert to PDF
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            )}

            <GlassCard className="p-6 mb-8 border-yellow-500/30 bg-yellow-500/10">
                <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="text-white font-semibold mb-2">Note on Formatting</h3>
                        <p className="text-sm text-slate-300">
                            This tool extracts text and images from your slides and places them in a PDF.
                            Complex slide layouts, animations, and transitions cannot be preserved perfectly
                            client-side.
                        </p>
                    </div>
                </div>
            </GlassCard>
            <QuickGuide steps={toolGuides['/powerpoint-to-pdf']} />
            <ToolContent toolName="/powerpoint-to-pdf" />
            <RelatedTools currentToolHref="/powerpoint-to-pdf" />
        </div >
    );
}
