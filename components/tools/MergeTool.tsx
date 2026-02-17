'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { mergePDFs } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/components/providers/SubscriptionProvider';

interface MergeToolProps {
    initialFiles?: File[];
}

export function MergeTool({ initialFiles = [] }: MergeToolProps) {
    const { t } = useTranslation('common');
    const { limits, isPro } = useSubscription();
    const [files, setFiles] = useState<File[]>(initialFiles);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

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
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const mergedPdfBytes = await mergePDFs(files);
            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            // downloadFile(blob, 'merged.pdf'); // Moved to handleDownload

            setResult({ blob, fileName: 'merged.pdf' });
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
        <div className="w-full">
            <div className="mb-6">
                <FileUpload
                    onFilesSelected={handleFilesSelected}
                    files={files}
                    onRemoveFile={handleRemoveFile}
                    multiple={true}
                    maxSize={limits.maxFileSize}
                    isPro={isPro}
                />
            </div>

            {processing && (
                <div className="mb-6">
                    <ProgressBar progress={progress} label={t('toolPages.merge.merging')} />
                </div>
            )}

            {files.length > 0 && !result && (
                <GlassCard className="p-4 border-purple-500/20">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left text-xs">
                            <p className="text-white font-semibold mb-0.5">
                                {t('toolPages.merge.readyToMerge', { count: files.length })}
                            </p>
                            <p className="text-[10px] text-slate-400">
                                {t('toolPages.merge.orderHint')}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setFiles([])}
                                disabled={processing}
                                className="text-xs py-1.5 h-auto min-h-0"
                            >
                                {t('toolPages.common.clearAll')}
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleMergePDFs}
                                loading={processing}
                                icon={<Download className="w-4 h-4" />}
                                className="text-xs py-1.5 h-auto min-h-0"
                            >
                                {t('toolPages.merge.button')}
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            )}

            {result && (
                <GlassCard className="p-6 text-center animate-in zoom-in-95 duration-500">
                    <div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <Download className="w-6 h-6 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">PDFs Merged Successfully!</h3>
                    <div className="flex justify-center mt-4">
                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                            <input
                                type="text"
                                value={downloadFileName}
                                onChange={(e) => setDownloadFileName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-64 text-center sm:text-left"
                                placeholder="Filename"
                            />
                            <Button
                                variant="primary"
                                onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                icon={<Download className="w-5 h-5" />}
                            >
                                Download Merged PDF
                            </Button>
                            <Button variant="ghost" onClick={() => setResult(null)}>
                                Merge Another
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            )}
        </div>
    );
}
