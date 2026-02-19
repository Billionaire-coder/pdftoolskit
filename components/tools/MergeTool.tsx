'use client';

import React, { useState } from 'react';
import { Download, Plus, Layers, Cpu, Trash2, ArrowUp, ArrowDown, Sparkles, CheckCircle, Gauge } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { mergePDFs } from '@/lib/services/pdf/manipulators/basic';
import { downloadFile, validatePDFFile, formatFileSize } from '@/lib/utils';
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
    const [statusMessage, setStatusMessage] = useState("Awaiting command...");

    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);

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
    };

    const moveFile = (index: number, direction: 'up' | 'down') => {
        const newFiles = [...files];
        if (direction === 'up' && index > 0) {
            // eslint-disable-next-line security/detect-object-injection
            [newFiles[index], newFiles[index - 1]] = [newFiles[index - 1], newFiles[index]];
        } else if (direction === 'down' && index < files.length - 1) {
            // eslint-disable-next-line security/detect-object-injection
            [newFiles[index], newFiles[index + 1]] = [newFiles[index + 1], newFiles[index]];
        }
        setFiles(newFiles);
    };

    const handleMergePDFs = async () => {
        if (files.length < 2) {
            toast.error(t('toasts.atLeastTwo'));
            return;
        }

        setProcessing(true);
        setProgress(5);
        setStatusMessage("Initializing assembly engine...");

        try {
            const interval = setInterval(() => {
                setProgress(prev => {
                    const next = prev + (Math.random() * 5);
                    if (next > 20 && next < 40) setStatusMessage("Allocating buffers...");
                    if (next > 40 && next < 60) setStatusMessage("Synthesizing page objects...");
                    if (next > 60 && next < 80) setStatusMessage("Preserving bookmarks...");
                    if (next > 80 && next < 95) setStatusMessage("Finalizing vector stream...");
                    return next > 95 ? 95 : next;
                });
            }, 300);

            const mergedPdfBytes = await mergePDFs(files);
            clearInterval(interval);
            setProgress(100);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([mergedPdfBytes as any], { type: 'application/pdf' });
            setResult({ blob, fileName: `merged_${new Date().getTime()}.pdf` });
            toast.success("Document assembly complete!");
        } catch (error) {
            console.error('Error merging PDFs:', error);
            toast.error(t('toasts.mergeError'));
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="w-full space-y-8 animate-in slide-up duration-500">
            {result && (
                <div className="max-w-2xl mx-auto py-10">
                    <GlassCard className="p-12 text-center border-purple-500/20 shadow-2xl shadow-purple-500/10">
                        <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-purple-500/20">
                            <CheckCircle className="w-10 h-10 text-purple-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-2 text-glow-purple">Assembly Complete</h3>
                        <p className="text-slate-400 mb-10">Files have been merged with structural integrity.</p>

                        <div className="flex flex-col gap-4">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => downloadFile(result.blob, result.fileName)}
                                icon={<Download className="w-6 h-6" />}
                                className="py-8 text-2xl bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-500/20"
                            >
                                Download Merged PDF
                            </Button>
                            <Button variant="ghost" onClick={() => setResult(null)} className="text-slate-500 mt-4 text-[10px] uppercase font-black tracking-widest">
                                Start New Assembly
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {!result && !processing && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <FileUpload
                            onFilesSelected={handleFilesSelected}
                            files={files}
                            onRemoveFile={handleRemoveFile}
                            multiple={true}
                            maxSize={limits.maxFileSize}
                            isPro={isPro}
                        />

                        {files.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-[10px] uppercase font-black tracking-widest text-slate-500 px-2 flex items-center gap-2">
                                    <Layers className="w-3 h-3" />
                                    Sequence Order
                                </h4>
                                {files.map((file, idx) => (
                                    <div
                                        key={`${file.name}-${idx}`}
                                        className="group bg-slate-900/50 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:border-purple-500/30 transition-all shadow-lg"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-white font-bold text-sm truncate">{file.name}</p>
                                                <p className="text-[10px] text-slate-500 font-mono uppercase">{formatFileSize(file.size)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => moveFile(idx, 'up')} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white" title="Move Up">
                                                <ArrowUp className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => moveFile(idx, 'down')} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white" title="Move Down">
                                                <ArrowDown className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleRemoveFile(idx)} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-400" title="Remove">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <GlassCard className="p-8 border-purple-500/30 bg-purple-500/5 items-center flex flex-col justify-center h-full min-h-[400px]">
                            <Sparkles className="w-12 h-12 text-purple-400 mb-6 animate-pulse" />
                            <h4 className="text-xl font-bold text-white mb-2 text-center">Intelligent Assembly</h4>
                            <p className="text-sm text-slate-400 text-center mb-8">Ready to unify {files.length} documents into a single high-fidelity asset.</p>

                            <div className="w-full space-y-3 mb-8">
                                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black">
                                    <span>Total Files</span>
                                    <span className="text-purple-400">{files.length}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black">
                                    <span>Engine</span>
                                    <span className="text-purple-400">Memory-Stream</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black">
                                    <span>Bookmarks</span>
                                    <span className="text-green-400">Preserved</span>
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleMergePDFs}
                                disabled={files.length < 2}
                                size="lg"
                                className="w-full py-6 bg-purple-600 hover:bg-purple-500 shadow-xl shadow-purple-600/20 rounded-2xl flex items-center justify-center gap-3 group"
                            >
                                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                                Merge Documents
                            </Button>

                            {files.length > 0 && (
                                <button onClick={() => setFiles([])} className="mt-4 text-[10px] uppercase font-black text-slate-600 hover:text-slate-400 transition-colors">
                                    Purge Workspace
                                </button>
                            )}
                        </GlassCard>

                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { icon: Cpu, label: "Efficiency", val: "High" },
                                { icon: Gauge, label: "Speed", val: "Turbo" }
                            ].map((stat, i) => (
                                <GlassCard key={i} className="p-4 flex flex-col items-center justify-center text-center">
                                    <stat.icon className="w-4 h-4 text-purple-400 mb-2" />
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{stat.label}</p>
                                    <p className="text-xs text-white font-bold leading-none">{stat.val}</p>
                                </GlassCard>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {processing && (
                <div className="max-w-2xl mx-auto py-20 text-center animate-in zoom-in-95 duration-500">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 border-4 border-purple-500/10 rounded-full" />
                        <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
                        <Layers className="absolute inset-0 m-auto w-8 h-8 text-purple-400 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 italic">Synthesizing Document Stream...</h3>
                    <ProgressBar progress={progress} label={statusMessage} />
                </div>
            )}
        </div>
    );
}
