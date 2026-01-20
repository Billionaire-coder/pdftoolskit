'use client';

import React, { useState } from 'react';
import { FileText, Download, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { mergePDFs } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { AdSense } from '@/components/shared/AdSense';
import { useTranslation } from 'react-i18next';


export default function MergePDFPage() {
    const { t } = useTranslation('common');
    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFilesSelected = (newFiles: File[]) => {
        const validFiles: File[] = [];

        for (const file of newFiles) {
            const validation = validatePDFFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                toast.error(`${file.name}: ${t('toasts.invalidFile')}`);
            }
        }

        if (validFiles.length > 0) {
            setFiles((prev) => [...prev, ...validFiles]);
            toast.success(t('toasts.filesAdded', { count: validFiles.length }));
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        toast.success(t('toasts.fileRemoved'));
    };

    const handleMergePDFs = async () => {
        if (files.length < 2) {
            toast.error(t('toasts.atLeastTwo'));
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const mergedPdfBytes = await mergePDFs(files);
            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            downloadFile(blob, 'merged.pdf');

            toast.success(t('toasts.mergeSuccess'));
            setFiles([]);
            setProgress(0);
        } catch (error) {
            console.error('Error merging PDFs:', error);
            toast.error(t('toasts.mergeError'));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-6 shadow-glow">
                    <FileText className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold gradient-text mb-4">
                    {t('toolPages.merge.title')}
                </h1>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                    {t('toolPages.merge.description')}
                </p>
            </div>

            {/* File Upload */}
            <div className="mb-8">
                <FileUpload
                    onFilesSelected={handleFilesSelected}
                    files={files}
                    onRemoveFile={handleRemoveFile}
                    multiple={true}
                />
            </div>

            {/* Processing Progress */}
            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label={t('toolPages.merge.merging')} />
                </div>
            )}

            {/* Actions */}
            {files.length > 0 && (
                <GlassCard className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-white font-semibold mb-1">
                                {t('toolPages.merge.readyToMerge', { count: files.length })}
                            </p>
                            <p className="text-sm text-slate-400">
                                {t('toolPages.merge.orderHint')}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setFiles([])}
                                disabled={processing}
                            >
                                {t('toolPages.common.clearAll')}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleMergePDFs}
                                loading={processing}
                                icon={<Download className="w-5 h-5" />}
                            >
                                {t('toolPages.merge.button')}
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            )}


            <div className="my-12">
                <AdSense slot="merge-pdf-bottom" />
            </div>

            <QuickGuide steps={toolGuides['/merge-pdf']} />
            <ToolContent toolName="/merge-pdf" />
            <RelatedTools currentToolHref="/merge-pdf" />
        </div >
    );
}
