'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { Minimize2, Download, CheckCircle, Zap, Shield, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { compressPDF } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, formatFileSize, cn } from '@/lib/utils';
import { PDFThumbnail } from '@/components/pdf/PDFThumbnail';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { useSearchParams } from 'next/navigation';

type CompressionLevel = 'extreme' | 'recommended' | 'less' | 'custom';

interface CompressToolProps {
    initialParams?: {
        targetSize?: number;
        unit?: 'mb' | 'kb';
        level?: CompressionLevel;
    };
}

function CompressToolContent({ initialParams }: CompressToolProps) {
    const { t } = useTranslation('common');
    const { limits, isPro } = useSubscription();
    const searchParams = useSearchParams();

    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState(t('toolPages.compress.statusOptimizing'));
    const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('recommended');
    const [customSizeValue, setCustomSizeValue] = useState<string>('');
    const [customSizeUnit, setCustomSizeUnit] = useState<'mb' | 'kb'>('mb');

    // Result State
    const [result, setResult] = useState<{
        originalSize: number;
        compressedSize: number;
        blob: Blob | null;
        fileName: string;
    } | null>(null);

    // Initial Params Handling
    useEffect(() => {
        const targetSize = searchParams?.get('targetSize') || initialParams?.targetSize;
        const unit = searchParams?.get('unit') || initialParams?.unit;
        const level = (searchParams?.get('level') || initialParams?.level) as CompressionLevel;

        if (targetSize) setCustomSizeValue(targetSize.toString());
        if (unit === 'kb' || unit === 'mb') setCustomSizeUnit(unit);
        if (level && ['extreme', 'recommended', 'less', 'custom'].includes(level)) {
            setCompressionLevel(level);
        } else if (targetSize) {
            setCompressionLevel('custom');
        }
    }, [searchParams, initialParams]);

    const handleFileSelected = (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            setResult(null);
            toast.success(t('toasts.filesAdded', { count: 1 }));
        } else {
            toast.error(validation.error || t('toasts.genericError'));
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        setResult(null);
        toast.success(t('toasts.fileRemoved'));
    };

    const handleCompressPDF = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    const next = Math.min(prev + 5, 90);
                    if (next > 20 && next < 50) setStatusMessage(t('toolPages.compress.statusAnalyzing'));
                    if (next >= 50 && next < 80) setStatusMessage(t('toolPages.compress.statusAssets'));
                    if (next >= 80) setStatusMessage(t('toolPages.compress.statusRebuilding'));
                    return next;
                });
            }, 800);

            const qualityMap = {
                extreme: 0.5,
                recommended: 0.7,
                less: 0.9,
                custom: 0.7
            };

            let targetSizeBytes: number | undefined;
            if (compressionLevel === 'custom' && customSizeValue) {
                const val = parseFloat(customSizeValue);
                if (!isNaN(val) && val > 0) {
                    targetSizeBytes = customSizeUnit === 'mb' ? val * 1024 * 1024 : val * 1024;
                }
            }

            const compressedPdfBytes = await compressPDF(
                file,
                qualityMap[compressionLevel],
                targetSizeBytes
            );

            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
            const outputFileName = `${file.name.replace('.pdf', '')}_compressed.pdf`;

            setResult({
                originalSize: file.size,
                compressedSize: compressedPdfBytes.length,
                blob,
                fileName: outputFileName
            });

            toast.success('Compression complete!');
        } catch (error) {
            console.error('Error compressing PDF:', error);
            toast.error('Failed to compress PDF');
        } finally {
            setProcessing(false);
        }
    };

    // Renaming State
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleDownload = () => {
        if (result?.blob) {
            downloadFile(result.blob, downloadFileName || result.fileName);
            toast.success('Download started!');
        }
    };

    const reset = () => {
        setFile(null);
        setResult(null);
        setProgress(0);
    };

    const getCompressionCard = (level: CompressionLevel, icon: React.ReactNode, title: string, desc: string, colorClass: string) => (
        <div
            onClick={() => setCompressionLevel(level)}
            className={cn(
                "cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 relative overflow-hidden group",
                compressionLevel === level
                    ? `bg-slate-800/80 border-${colorClass} shadow-lg shadow-${colorClass}/20`
                    : "bg-slate-900/40 border-slate-700 hover:border-slate-600 hover:bg-slate-800/60"
            )}
        >
            <div className="flex items-start gap-3 relative z-10">
                <div className={cn("p-2 rounded-lg bg-slate-800 text-white", compressionLevel === level ? `text-${colorClass}` : "text-slate-400")}>
                    {icon}
                </div>
                <div>
                    <h3 className="font-bold text-white mb-1">{title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                </div>
            </div>
            {compressionLevel === level && (
                <div className={cn("absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-br", `from-${colorClass} to-transparent`)} />
            )}
            {compressionLevel === level && (
                <div className="absolute top-3 right-3 text-white">
                    <CheckCircle className={cn("w-5 h-5", `text-${colorClass}`)} />
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full">
            {!file && !result && (
                <div className="mb-0 w-full mx-auto">
                    <FileUpload
                        onFilesSelected={handleFileSelected}
                        files={[]}
                        multiple={false}
                        maxSize={limits.maxFileSize}
                        isPro={isPro}
                    />
                </div>
            )}

            {file && !result && !processing && (
                <div className="grid lg:grid-cols-2 gap-6 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <GlassCard className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="relative">
                            <PDFThumbnail
                                file={file}
                                pageNumber={1}
                                width={180}
                                disabled
                                className="shadow-2xl rounded-lg"
                            />
                            <div className="absolute -bottom-3 -right-3 bg-slate-800 text-white text-[10px] px-2 py-1 rounded-md border border-slate-600 shadow-md">
                                {formatFileSize(file.size)}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white truncate max-w-[200px]">{file.name}</h3>
                            <Button variant="ghost" size="sm" onClick={reset} className="mt-1 text-red-400 hover:text-red-300 text-xs py-1 h-auto min-h-0">
                                Change File
                            </Button>
                        </div>
                    </GlassCard>

                    <div className="space-y-3">
                        {getCompressionCard('extreme', <Zap className="w-5 h-5" />, t('toolPages.compress.extremeTitle'), t('toolPages.compress.extremeDesc'), "orange-500")}
                        {getCompressionCard('recommended', <Shield className="w-5 h-5" />, t('toolPages.compress.recommendedTitle'), t('toolPages.compress.recommendedDesc'), "green-500")}

                        <div
                            onClick={() => setCompressionLevel('custom')}
                            className={cn(
                                "cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 relative overflow-hidden group",
                                compressionLevel === 'custom'
                                    ? "bg-slate-800/80 border-purple-500 shadow-lg shadow-purple-500/20"
                                    : "bg-slate-900/40 border-slate-700 hover:border-slate-600 hover:bg-slate-800/60"
                            )}
                        >
                            <div className="flex items-start gap-3 relative z-10 text-xs">
                                <div className={cn("p-2 rounded-lg bg-slate-800 text-white", compressionLevel === 'custom' ? "text-purple-500" : "text-slate-400")}>
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="w-full">
                                    <h3 className="font-bold text-white mb-1">{t('toolPages.compress.customTitle')}</h3>
                                    {compressionLevel === 'custom' && (
                                        <div className="mt-2 flex gap-2">
                                            <input
                                                type="number"
                                                value={customSizeValue}
                                                onChange={(e) => setCustomSizeValue(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-purple-500"
                                                step="0.1"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <select
                                                value={customSizeUnit}
                                                onChange={(e) => setCustomSizeUnit(e.target.value as 'mb' | 'kb')}
                                                className="bg-slate-900 border border-slate-700 rounded-lg px-1 py-1 text-white text-[10px]"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="mb">MB</option>
                                                <option value="kb">KB</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            onClick={handleCompressPDF}
                            className="w-full mt-2"
                            disabled={compressionLevel === 'custom' && !customSizeValue}
                            icon={<Minimize2 className="w-5 h-5" />}
                        >
                            {t('toolPages.compress.buttonDirect')}
                        </Button>
                    </div>
                </div>
            )}

            {processing && (
                <div className="w-full max-w-md mx-auto py-8">
                    <ProgressBar progress={progress} label={statusMessage} />
                </div>
            )}

            {result && (
                <GlassCard className="p-6 text-center animate-in zoom-in-95 duration-500">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">{t('toolPages.compress.completeTitle')}</h3>
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <span className="text-slate-400 line-through text-xs">{formatFileSize(result.originalSize)}</span>
                        <ArrowRight className="w-4 h-4 text-slate-600" />
                        <span className="text-green-400 font-bold">{formatFileSize(result.compressedSize)}</span>
                    </div>
                    <div className="flex gap-3 justify-center">
                        <div className="flex flex-col sm:flex-row gap-3 items-center">
                            <input
                                type="text"
                                value={downloadFileName}
                                onChange={(e) => setDownloadFileName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-64 text-center sm:text-left"
                                placeholder="Filename"
                            />
                            <Button variant="primary" onClick={handleDownload} icon={<Download className="w-5 h-5" />}>
                                {t('toolPages.compress.downloadButton')}
                            </Button>
                        </div>
                        <Button variant="outline" onClick={reset}>
                            {t('toolPages.compress.anotherButton')}
                        </Button>
                    </div>
                </GlassCard>
            )}
        </div>
    );
}

export function CompressTool(props: CompressToolProps) {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-12">
                <ProgressBar progress={30} label="Loading optimization engine..." />
            </div>
        }>
            <CompressToolContent {...props} />
        </Suspense>
    );
}
