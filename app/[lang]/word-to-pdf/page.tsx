'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, Sparkles, Layout, ShieldCheck, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { wordToPdf } from '@/lib/services/pdf/converters/wordToPdf';
import { downloadFile, getBaseFileName } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function WordToPDFPage() {
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
            setFile(files[0]);
            toast.success('Word document linked');
        }
    };

    const handleConvertToPDF = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 95));
            }, 500);

            const pdfBytes = await wordToPdf(file, { addBranding: isPro });
            clearInterval(progressInterval);
            setProgress(100);

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const filename = getBaseFileName(file.name) + '.pdf';

            setResult({ blob, fileName: filename });
            toast.success('Conversion complete!');
            setFile(null);
            setProgress(0);
        } catch (error) {
            console.error('Word conversion error:', error);
            toast.error('Failed to convert. Check file integrity.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-5xl">
            <ToolHeader
                toolId="wordToPdf"
                title="Professional Word to PDF"
                description="Convert Office documents with vector accuracy and layout preservation."
                icon={FileText}
                color="from-blue-500 to-indigo-600"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {!file && !result && (
                        <FileUpload
                            onFilesSelected={handleFileSelected}
                            files={[]}
                            onRemoveFile={() => { }}
                            multiple={false}
                            maxSize={limits.maxFileSize}
                            isPro={isPro}
                            accept={{
                                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
                                'application/msword': ['.doc']
                            }}
                        />
                    )}

                    {file && !processing && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <GlassCard className="p-8 border-dashed border-slate-700/50 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-4">
                                    <FileText className="w-8 h-8" />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-1">{file.name}</h3>
                                <p className="text-slate-500 text-sm mb-6">DOCX Analysis Ready • Font Matching Active</p>
                                <div className="flex gap-3">
                                    <Button variant="secondary" onClick={() => setFile(null)}>Change File</Button>
                                    <Button variant="primary" onClick={handleConvertToPDF} className="bg-blue-600 hover:bg-blue-500">Convert to PDF</Button>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {processing && (
                        <div className="p-12 bg-slate-800/20 rounded-3xl border border-slate-700/50 text-center">
                            <ProgressBar progress={progress} label="Reconstructing Layout..." />
                            <div className="flex justify-center gap-6 mt-8">
                                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">
                                    <Zap className="w-3 h-3 text-blue-500" />
                                    Vector Scaling
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest animate-pulse delay-75">
                                    <Layout className="w-3 h-3 text-blue-500" />
                                    Style Embedding
                                </span>
                            </div>
                        </div>
                    )}

                    {result && (
                        <GlassCard className="p-10 text-center animate-in zoom-in-95 duration-500">
                            <div className="mx-auto w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                                <ShieldCheck className="w-10 h-10 text-blue-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">High-Fidelity PDF Ready</h3>
                            <p className="text-slate-400 mb-8 max-w-sm mx-auto">Your document has been optimized for cross-platform compatibility and printing.</p>

                            <div className="flex flex-col gap-4 max-w-md mx-auto">
                                <input
                                    type="text"
                                    value={downloadFileName}
                                    onChange={(e) => setDownloadFileName(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white text-center focus:outline-none focus:border-blue-500"
                                />
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                    icon={<Download className="w-5 h-5" />}
                                    className="py-6 text-xl bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20"
                                >
                                    Download PDF
                                </Button>
                                <Button variant="ghost" onClick={() => setResult(null)} className="text-slate-500">
                                    Convert More Files
                                </Button>
                            </div>
                        </GlassCard>
                    )}
                </div>

                <div className="space-y-6">
                    <GlassCard className="p-6 sticky top-24">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-blue-500" />
                            Render Matrix
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                <p className="text-xs font-bold text-white mb-1">Vector Re-composition</p>
                                <p className="text-[10px] text-slate-500 uppercase">Ensures sharp text at any zoom</p>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                <p className="text-xs font-bold text-white mb-1">Image Upscaling</p>
                                <p className="text-[10px] text-slate-500 uppercase">Auto-enhancement for embedded jpgs</p>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                <p className="text-xs font-bold text-white mb-1">Font Policy</p>
                                <p className="text-[10px] text-slate-500 uppercase">System font matching (Inter/Arial)</p>
                            </div>
                        </div>
                    </GlassCard>
                    <RelatedTools currentToolHref="/word-to-pdf" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                <QuickGuide steps={toolGuides['/word-to-pdf']} />
                <ToolContent toolName="/word-to-pdf" />
            </div>
        </div>
    );
}
