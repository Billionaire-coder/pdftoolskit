'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Download, Stamp, ShieldCheck, Info, CheckCircle2, AlertTriangle, Settings2, FileLock2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { flattenPDF } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName, cn } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function FlattenPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Initializing Sealant...');
    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    const [options, setOptions] = useState({
        forms: true,
        annotations: true,
        layers: true
    });

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleFileSelected = (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success('Ready for Consolidation');
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const handleFlattenPDF = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);
        setStatusMessage('Analyzing content streams...');

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    if (prev < 40) return prev + 5;
                    if (prev < 80) return prev + 2;
                    return prev;
                });
            }, 300);

            setStatusMessage('Baking annotations into content...');
            const newPdfBytes = await flattenPDF(file, options);

            clearInterval(progressInterval);
            setProgress(100);
            setStatusMessage('Document Sealed.');

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);

            setResult({ blob, fileName: `${baseName}_flattened.pdf` });
            toast.success('Immutable PDF Generated');
            setProgress(0);

        } catch (error) {
            console.error('Error flattening PDF:', error);
            toast.error('Flattening failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-7xl">
            <ToolHeader
                toolId="flattenPdf"
                title="Universal Document Sealant"
                description="Consolidate forms, comments, and layers into an immutable, high-compatibility PDF."
                icon={Layers}
                color="from-indigo-600 via-purple-600 to-violet-600"
            />

            {!file ? (
                <div className="max-w-2xl mx-auto">
                    <FileUpload
                        onFilesSelected={handleFileSelected}
                        files={[]}
                        multiple={false}
                        maxSize={limits.maxFileSize}
                        isPro={isPro}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* OPTIONS SIDEBAR */}
                    <div className="lg:col-span-4 space-y-6">
                        <GlassCard className="p-6 border-indigo-500/20 shadow-xl">
                            <div className="flex items-center gap-2 mb-6 text-white font-bold">
                                <Settings2 className="w-5 h-5 text-indigo-400" />
                                <span>Sealant Scope</span>
                            </div>

                            <div className="space-y-4">
                                <label className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
                                    options.forms ? "bg-indigo-500/10 border-indigo-500/30" : "bg-white/5 border-white/5 hover:border-white/10"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", options.forms ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-400")}>
                                            <FileLock2 className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Form Fields</p>
                                            <p className="text-[10px] text-slate-500">Lock fillable inputs</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={options.forms}
                                        onChange={(e) => setOptions({ ...options, forms: e.target.checked })}
                                        className="sr-only"
                                    />
                                    {options.forms && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                                </label>

                                <label className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
                                    options.annotations ? "bg-indigo-500/10 border-indigo-500/30" : "bg-white/5 border-white/5 hover:border-white/10"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", options.annotations ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-400")}>
                                            <Zap className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Annotations</p>
                                            <p className="text-[10px] text-slate-500">Bake comments & ink</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={options.annotations}
                                        onChange={(e) => setOptions({ ...options, annotations: e.target.checked })}
                                        className="sr-only"
                                    />
                                    {options.annotations && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                                </label>

                                <label className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer group",
                                    options.layers ? "bg-indigo-500/10 border-indigo-500/30" : "bg-white/5 border-white/5 hover:border-white/10"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", options.layers ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-400")}>
                                            <Layers className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">Doc Layers</p>
                                            <p className="text-[10px] text-slate-500">Collapse OCG groups</p>
                                        </div>
                                    </div>
                                    <input
                                        type="checkbox"
                                        checked={options.layers}
                                        onChange={(e) => setOptions({ ...options, layers: e.target.checked })}
                                        className="sr-only"
                                    />
                                    {options.layers && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                                </label>
                            </div>

                            <div className="mt-8 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-amber-500 leading-relaxed font-bold uppercase tracking-wider">
                                        This process is destructive. Interactive elements cannot be uncompressed after sealing.
                                    </p>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* MAIN CONSOLE */}
                    <div className="lg:col-span-8 flex flex-col items-center justify-center space-y-8">
                        {!result && !processing && (
                            <div className="text-center space-y-6 max-w-md">
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10 shadow-2xl">
                                    <Stamp className="w-12 h-12 text-indigo-500 animate-pulse" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Ready to Seal</h3>
                                    <p className="text-slate-500 text-sm">Target document: <span className="text-indigo-400 font-mono font-bold text-[10px]">{file.name}</span></p>
                                </div>
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={handleFlattenPDF}
                                    icon={<Stamp className="w-6 h-6" />}
                                    className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 px-12 py-8 text-xl"
                                >
                                    Flatten & Lock
                                </Button>
                            </div>
                        )}

                        {processing && (
                            <div className="w-full max-w-md text-center space-y-6">
                                <h3 className="text-lg font-bold text-white flex items-center justify-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-indigo-400 animate-bounce" />
                                    {statusMessage}
                                </h3>
                                <ProgressBar progress={progress} />
                                <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                    <span>Stream Analysis</span>
                                    <span>{progress}%</span>
                                    <span>OCG Removal</span>
                                </div>
                            </div>
                        )}

                        {result && (
                            <GlassCard className="max-w-xl w-full p-10 border-emerald-500/30 text-center space-y-8 animate-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 bg-emerald-600 rounded-full mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                                    <CheckCircle2 className="w-12 h-12 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Immutable Copy Ready</h2>
                                    <p className="text-slate-400 text-sm italic font-mono uppercase tracking-widest">AcroForm Logic: Flattened | OCG Logic: Deleted</p>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input
                                        type="text"
                                        value={downloadFileName}
                                        onChange={(e) => setDownloadFileName(e.target.value)}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-emerald-500 font-bold"
                                        placeholder="filename.pdf"
                                    />
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                        icon={<Download className="w-6 h-6" />}
                                        className="bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 px-8"
                                    >
                                        Download
                                    </Button>
                                </div>

                                <Button variant="ghost" onClick={() => { setResult(null); setFile(null); }} className="text-slate-500 hover:text-white">Seal New Document</Button>
                            </GlassCard>
                        )}
                    </div>
                </div>
            )}

            <div className="mt-20">
                <QuickGuide steps={toolGuides['/flatten-pdf']} />
                <ToolContent toolName="/flatten-pdf" />
                <RelatedTools currentToolHref="/flatten-pdf" />
            </div>
        </div>
    );
}

