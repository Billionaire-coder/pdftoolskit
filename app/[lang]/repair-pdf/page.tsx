'use client';

import React, { useState } from 'react';
import { Wrench, Download, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { repairPDF } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function RepairPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFileSelected = (files: File[]) => {
        // We use a custom validation here as we might want to allow "invalid" PDFs to try and fix them,
        // but pdf-lib creates a valid structure if it can load it. 
        // If it sends "can't load", we can't fix it client-side.
        // So we stick to standard validation but emphasize the "Try" aspect.
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success('File uploaded');
        } else {
            // In repair mode, we might want to try anyway? 
            // But existing utils strict check mime type.
            toast.error(validation.error || 'Invalid file');
        }
    };

    const handleRepairPDF = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const newPdfBytes = await repairPDF(file);

            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);
            downloadFile(blob, `${baseName}_repaired.pdf`);

            toast.success('Repaired PDF structure successfully!');
            setProgress(0);

        } catch (error) {
            console.error('Error repairing PDF:', error);
            const msg = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Repair failed: ${msg}. The file might be too corrupted.`);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="repairPdf"
                title="Repair PDF"
                description="Attempt to fix corrupted PDF files and structural errors"
                icon={Wrench}
                color="from-green-500 to-emerald-600"
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

            {file && !processing && (
                <GlassCard className="p-6 mb-8 text-center">
                    <p className="text-white">
                        This tool rebuilds the PDF structure (XRef table) which fixes many common corruption issues.
                        It cannot recover data from completely empty or overwritten files.
                    </p>
                </GlassCard>
            )}

            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label="Analyzing and repairing..." />
                </div>
            )}

            {file && (
                <GlassCard className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-white font-semibold">Ready to repair</p>
                        <Button
                            variant="primary"
                            onClick={handleRepairPDF}
                            loading={processing}
                            icon={<ShieldCheck className="w-5 h-5" />}
                        >
                            Repair PDF
                        </Button>
                    </div>
                </GlassCard>
            )}
            <QuickGuide steps={toolGuides['/repair-pdf']} />
            <ToolContent toolName="/repair-pdf" />
            <RelatedTools currentToolHref="/repair-pdf" />
        </div>
    );
}
