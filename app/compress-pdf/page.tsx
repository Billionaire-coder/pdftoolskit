'use client';

import React, { useState } from 'react';
import { Minimize2, Download, CheckCircle, Zap, Shield, FileText, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { compressPDF } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, formatFileSize, cn } from '@/lib/utils';
import { PDFThumbnail } from '@/components/pdf/PDFThumbnail';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { ToolContent } from '@/components/shared/ToolContent';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { AdSense } from '@/components/shared/AdSense';
import { useTranslation } from 'react-i18next';

type CompressionLevel = 'extreme' | 'recommended' | 'less' | 'custom';




export default function CompressPDFPage() {
    const { t } = useTranslation('common');
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState(t('toolPages.compress.statusOptimizing'));
    const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('recommended');

    // Result State
    const [result, setResult] = useState<{
        originalSize: number;
        compressedSize: number;
        blob: Blob | null;
        fileName: string;
    } | null>(null);

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

    const handleRemoveFile = (index: number) => {
        setFile(null); // Assuming only one file is handled, so setting to null
        toast.success(t('toasts.fileRemoved'));
        setResult(null);
    };

    const [customSizeValue, setCustomSizeValue] = useState<string>('');
    const [customSizeUnit, setCustomSizeUnit] = useState<'mb' | 'kb'>('mb');

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

            // Map level to quality factor
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
                    if (customSizeUnit === 'mb') {
                        targetSizeBytes = val * 1024 * 1024;
                    } else {
                        targetSizeBytes = val * 1024;
                    }
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
            const baseFileName = file.name.replace('.pdf', '');
            const outputFileName = `${baseFileName}_compressed.pdf`;

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

    const handleDownload = () => {
        if (result?.blob) {
            downloadFile(result.blob, result.fileName);
            toast.success('Download started!');
        }
    };

    const reset = () => {
        setFile(null);
        setResult(null);
        setProgress(0);
        setCustomSizeValue('');
        setCustomSizeUnit('mb');
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
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-5xl">
            <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 mb-6 shadow-glow">
                    <Minimize2 className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold gradient-text mb-4">
                    {t('toolPages.compress.title')}
                </h1>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                    {t('toolPages.compress.description')}
                </p>
            </div>

            {!file && !result && (
                <div className="mb-8 max-w-4xl mx-auto">
                    <FileUpload
                        onFilesSelected={handleFileSelected}
                        files={[]}
                        multiple={false}
                    />
                </div>
            )}

            {file && !result && !processing && (
                <div className="grid lg:grid-cols-2 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Left: Preview File */}
                    <GlassCard className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="relative">
                            <PDFThumbnail
                                file={file}
                                pageNumber={1}
                                width={200}
                                disabled
                                className="shadow-2xl"
                            />
                            <div className="absolute -bottom-3 -right-3 bg-slate-800 text-white text-xs px-2 py-1 rounded-md border border-slate-600 shadow-md">
                                {formatFileSize(file.size)}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-white truncate max-w-[250px]">{file.name}</h3>
                            <Button variant="ghost" size="sm" onClick={reset} className="mt-2 text-red-400 hover:text-red-300">
                                Change File
                            </Button>
                        </div>
                    </GlassCard>

                    {/* Right: Options */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-white mb-4">{t('toolPages.compress.levelTitle')}</h3>

                        {getCompressionCard(
                            'extreme',
                            <Zap className="w-6 h-6" />,
                            t('toolPages.compress.extremeTitle'),
                            t('toolPages.compress.extremeDesc'),
                            "orange-500"
                        )}

                        {getCompressionCard(
                            'recommended',
                            <Shield className="w-6 h-6" />,
                            t('toolPages.compress.recommendedTitle'),
                            t('toolPages.compress.recommendedDesc'),
                            "green-500"
                        )}

                        {getCompressionCard(
                            'less',
                            <FileText className="w-6 h-6" />,
                            t('toolPages.compress.lessTitle'),
                            t('toolPages.compress.lessDesc'),
                            "blue-500"
                        )}

                        {/* Custom Size Card */}
                        <div
                            onClick={() => setCompressionLevel('custom')}
                            className={cn(
                                "cursor-pointer rounded-xl p-4 border-2 transition-all duration-200 relative overflow-hidden group",
                                compressionLevel === 'custom'
                                    ? "bg-slate-800/80 border-purple-500 shadow-lg shadow-purple-500/20"
                                    : "bg-slate-900/40 border-slate-700 hover:border-slate-600 hover:bg-slate-800/60"
                            )}
                        >
                            <div className="flex items-start gap-3 relative z-10">
                                <div className={cn("p-2 rounded-lg bg-slate-800 text-white", compressionLevel === 'custom' ? "text-purple-500" : "text-slate-400")}>
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div className="w-full">
                                    <h3 className="font-bold text-white mb-1">{t('toolPages.compress.customTitle')}</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{t('toolPages.compress.customDesc')}</p>

                                    {compressionLevel === 'custom' && (
                                        <div className="mt-2 animate-in fade-in slide-in-from-top-2">
                                            <div className="flex gap-2 relative">
                                                <div className="relative flex-1">
                                                    <input
                                                        type="number"
                                                        value={customSizeValue}
                                                        onChange={(e) => setCustomSizeValue(e.target.value)}
                                                        placeholder={t('toolPages.compress.targetPlaceholder')}
                                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-2 py-2 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                                                        step="0.1"
                                                        min="0.1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <select
                                                    value={customSizeUnit}
                                                    onChange={(e) => setCustomSizeUnit(e.target.value as 'mb' | 'kb')}
                                                    className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-2 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors cursor-pointer"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <option value="mb">MB</option>
                                                    <option value="kb">KB</option>
                                                </select>
                                            </div>
                                            <p className="text-[10px] text-purple-400 mt-1">
                                                {t('toolPages.compress.customLimitHint')}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {compressionLevel === 'custom' && (
                                <div className="absolute inset-0 opacity-10 pointer-events-none bg-gradient-to-br from-purple-500 to-transparent" />
                            )}
                            {compressionLevel === 'custom' && (
                                <div className="absolute top-3 right-3 text-white">
                                    <CheckCircle className="w-5 h-5 text-purple-500" />
                                </div>
                            )}
                        </div>

                        <Button
                            variant="primary"
                            onClick={handleCompressPDF}
                            className="w-full mt-6 py-6 text-lg"
                            disabled={compressionLevel === 'custom' && !customSizeValue}
                            icon={<Minimize2 className="w-6 h-6" />}
                        >
                            {compressionLevel === 'custom' ? t('toolPages.compress.buttonTarget') : t('toolPages.compress.buttonDirect')}
                        </Button>
                    </div>
                </div>
            )}

            {processing && (
                <div className="max-w-xl mx-auto text-center space-y-6">
                    <ProgressBar progress={progress} label={statusMessage} />
                    <p className="text-slate-400 animate-pulse">{statusMessage}</p>
                </div>
            )}

            {result && (
                <div className="max-w-3xl mx-auto animate-in zoom-in-95 duration-500">
                    <GlassCard className="p-8 md:p-12 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600" />

                        <div className="inline-flex items-center justify-center p-4 bg-green-500/20 rounded-full mb-6">
                            <CheckCircle className="w-16 h-16 text-green-500" />
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-2">{t('toolPages.compress.completeTitle')}</h2>
                        <p className="text-slate-300 mb-8">{t('toolPages.compress.completeSub')}</p>

                        <div className="flex flax-col md:flex-row items-center justify-center gap-8 mb-10 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                            <div className="text-center">
                                <p className="text-sm text-slate-400 mb-1">{t('toolPages.compress.originalSize')}</p>
                                <p className="text-xl font-mono text-slate-300 line-through decoration-red-500 decoration-2">
                                    {formatFileSize(result.originalSize)}
                                </p>
                            </div>

                            <ArrowRight className="w-8 h-8 text-slate-500 hidden md:block" />

                            <div className="text-center">
                                <p className="text-sm text-slate-400 mb-1">{t('toolPages.compress.compressedSize')}</p>
                                <p className="text-2xl font-mono font-bold text-green-400">
                                    {formatFileSize(result.compressedSize)}
                                </p>
                            </div>

                            <div className="bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/30">
                                <span className="text-green-400 font-bold block text-sm">{t('toolPages.compress.saved')}</span>
                                <span className="text-xl font-bold text-green-400">
                                    {result.originalSize > result.compressedSize
                                        ? `-${(((result.originalSize - result.compressedSize) / result.originalSize) * 100).toFixed(0)}%`
                                        : '0%'}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button
                                variant="primary"
                                onClick={handleDownload}
                                icon={<Download className="w-5 h-5" />}
                                className="px-8"
                            >
                                {t('toolPages.compress.downloadButton')}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={reset}
                            >
                                {t('toolPages.compress.anotherButton')}
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {/* AdSense */}
            <div className="my-12">
                <AdSense slot="compress-pdf-bottom" />
            </div>

            {/* Quick Guide */}
            <QuickGuide steps={[
                { title: 'Upload PDF', description: 'Drag & drop your file or click to browse.' },
                { title: 'Choose Mode', description: 'Select "Recommended" for most files, or "Custom" for specific size limits.' },
                { title: 'Download', description: 'Get your perfectly optimized PDF file instantly.' },
            ]} />

            <ToolContent toolName="/compress-pdf" />

            {/* Related Tools */}
            <RelatedTools currentToolHref="/compress-pdf" />
        </div>
    );
}
