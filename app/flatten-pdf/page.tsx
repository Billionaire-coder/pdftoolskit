'use client';

import React, { useState } from 'react';
import { Layers, Download, Stamp } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { flattenPDF } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';

export default function FlattenPDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileSelected = (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success('PDF uploaded successfully');
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const handleFlattenPDF = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const newPdfBytes = await flattenPDF(file);

            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);
            downloadFile(blob, `${baseName}_flattened.pdf`);

            toast.success('PDF flattened successfully!');
            // Optional: reset or keep file
            setProgress(0);

        } catch (error) {
            console.error('Error flattening PDF:', error);
            toast.error('Failed to flatten PDF');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-800 to-purple-800 mb-6 shadow-glow">
                    <Layers className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold gradient-text mb-4">
                    Flatten PDF
                </h1>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                    Merge layers and lock form fields to prevent further editing
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

            {file && !processing && (
                <GlassCard className="p-6 mb-8 text-center">
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-white">
                            This will convert all fillable forms into static content.
                            Interactive elements will no longer be editable.
                        </p>
                    </div>
                </GlassCard>
            )}

            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label="Flattening layers..." />
                </div>
            )}

            {file && (
                <GlassCard className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-white font-semibold">Ready to flatten PDF</p>
                        <Button
                            variant="primary"
                            onClick={handleFlattenPDF}
                            loading={processing}
                            icon={<Stamp className="w-5 h-5" />}
                        >
                            Flatten PDF
                        </Button>
                    </div>
                </GlassCard>
            )}


            <QuickGuide steps={toolGuides['/flatten-pdf']} />
            <ToolContent toolName="/flatten-pdf" />
            <RelatedTools currentToolHref="/flatten-pdf" />
        </div>
    );
}
