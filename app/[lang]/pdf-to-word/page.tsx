'use client';

import React, { useState, useEffect } from 'react';
import { FileEdit, Download, Sparkles, Wand2, Type, FileType, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { pdfToWord } from '@/lib/services/pdf/converters/pdfToWord';
import { downloadFile, getBaseFileName } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function PDFToWordPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob; fileName: string; isScanned: boolean } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            toast.success('Document loaded for analysis');
        }
    };

    const handleConvertToWord = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 5, 95));
            }, 600);

            const { data, isScanned } = await pdfToWord(file);
            clearInterval(progressInterval);
            setProgress(100);

            const blob = new Blob([data as any], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
            const filename = getBaseFileName(file.name) + '.docx';

            setResult({ blob, fileName: filename, isScanned });
            toast.success('Document reconstructed!');
            setFile(null);
            setProgress(0);
        } catch (error) {
            console.error('PDF to Word Error:', error);
            toast.error('Reconstruction failed. PDF might be encrypted.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-5xl">
            <ToolHeader
                toolId="pdfToWord"
                title="Intelligent PDF to Word"
                description="Advanced layout reconstruction with automatic OCR for scanned pages."
                icon={FileEdit}
                color="from-indigo-500 to-purple-600"
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
                            accept={{ 'application/pdf': ['.pdf'] }}
                        />
                    )}

                    {file && !processing && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <GlassCard className="p-8 border-dashed border-slate-700/50 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-4">
                                    <FileEdit className="w-8 h-8" />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-1">{file.name}</h3>
                                <p className="text-slate-500 text-sm mb-6">Structural Analysis Ready • Paragraph Detection Active</p>
                                <div className="flex gap-3">
                                    <Button variant="secondary" onClick={() => setFile(null)}>Change File</Button>
                                    <Button variant="primary" onClick={handleConvertToWord} className="bg-indigo-600 hover:bg-indigo-500">Reconstruct DOCX</Button>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {processing && (
                        <div className="p-12 bg-slate-800/20 rounded-3xl border border-slate-700/50 text-center">
                            <ProgressBar progress={progress} label="Mapping Document Semantics..." />
                            <div className="flex justify-center gap-6 mt-8">
                                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">
                                    <Wand2 className="w-3 h-3 text-indigo-500" />
                                    Text-Flow Analysis
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest animate-pulse delay-75">
                                    <Type className="w-3 h-3 text-indigo-500" />
                                    Font Vectorization
                                </span>
                            </div>
                        </div>
                    )}

                    {result && (
                        <GlassCard className="p-10 text-center animate-in zoom-in-95 duration-500">
                            <div className="mx-auto w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-10 h-10 text-indigo-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Word Document Ready!</h3>
                            <p className="text-slate-400 mb-8 max-w-sm mx-auto">
                                {result.isScanned
                                    ? "Scanned pages detected. OCR was applied to recover the text layer."
                                    : "Native text preserved. Paragraphs and styles mapped to DOCX format."}
                            </p>

                            <div className="flex flex-col gap-4 max-w-md mx-auto">
                                <input
                                    type="text"
                                    value={downloadFileName}
                                    onChange={(e) => setDownloadFileName(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white text-center focus:outline-none focus:border-indigo-500"
                                />
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                    icon={<Download className="w-5 h-5" />}
                                    className="py-6 text-xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/20"
                                >
                                    Download DOCX
                                </Button>
                                <Button variant="ghost" onClick={() => setResult(null)} className="text-slate-500">
                                    Convert Another
                                </Button>
                            </div>
                        </GlassCard>
                    )}
                </div>

                <div className="space-y-6">
                    <GlassCard className="p-6 sticky top-24">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            Engine Logic
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                <p className="text-xs font-bold text-white mb-1 flex items-center gap-2">
                                    <FileType className="w-3 h-3" />
                                    Hybrid Mode
                                </p>
                                <p className="text-[10px] text-slate-500 uppercase">Seamless switching between Native Extraction & OCR fallback</p>
                            </div>
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                                <p className="text-xs font-bold text-white mb-1">Layout Preservation</p>
                                <p className="text-[10px] text-slate-500 uppercase">Fuzzy-matching for paragraph & line break reconstruction</p>
                            </div>
                        </div>
                    </GlassCard>
                    <RelatedTools currentToolHref="/pdf-to-word" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                <QuickGuide steps={toolGuides['/pdf-to-word']} />
                <ToolContent toolName="/pdf-to-word" />
            </div>
        </div>
    );
}
