'use client';

import React, { useState } from 'react';
import { Scissors, Download, CheckCircle, Database, Layers, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { PDFGrid } from '@/components/pdf/PDFGrid';
import { SplitService, SplitOptions } from '@/lib/services/pdf/splitService';
import { downloadFile, validatePDFFile, formatFileSize, cn } from '@/lib/utils';
// import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/components/providers/SubscriptionProvider';

type SplitMode = 'manual' | 'interval' | 'range';

export function SplitTool() {
    // const { t } = useTranslation('common');
    const { limits, isPro } = useSubscription();

    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("Preparing Document...");

    // Split Config
    const [splitMode, setSplitMode] = useState<SplitMode>('manual');
    const [intervalValue, setIntervalValue] = useState<number>(1);
    const [rangeValue, setRangeValue] = useState<string>('');
    const [selectedPages, setSelectedPages] = useState<number[]>([]);

    // Result State
    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);

    const handleFileSelected = async (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            setResult(null);
            setSelectedPages([]);

            try {
                const arrayBuffer = await files[0].arrayBuffer();
                const { PDFDocument } = await import('pdf-lib');
                const doc = await PDFDocument.load(arrayBuffer);
                setPageCount(doc.getPageCount());
                toast.success("Document analyzed");
            } catch (_e) {
                toast.error("Failed to load PDF structure");
            }
        } else {
            toast.error(validation.error || "Invalid file");
        }
    };

    const togglePageSelection = (pageIndex: number) => {
        const pageNum = pageIndex + 1;
        setSelectedPages(prev =>
            prev.includes(pageNum)
                ? prev.filter(p => p !== pageNum)
                : [...prev, pageNum]
        );
    };

    const handleSplit = async () => {
        if (!file) return;
        setProcessing(true);
        setProgress(10);
        setStatusMessage("Isolating page objects...");

        try {
            const interval = setInterval(() => {
                setProgress(prev => {
                    const next = prev + (Math.random() * 5);
                    if (next > 40 && next < 80) setStatusMessage("Bundling into ZIP...");
                    return next > 90 ? 90 : next;
                });
            }, 400);

            const options: SplitOptions = {
                mode: splitMode,
                interval: splitMode === 'interval' ? intervalValue : undefined,
                ranges: splitMode === 'range' ? rangeValue : undefined,
                selectedPages: splitMode === 'manual' ? (selectedPages.length > 0 ? selectedPages : undefined) : undefined
            };

            const splitResult = await SplitService.split(file, options);

            clearInterval(interval);
            setProgress(100);
            setResult(splitResult);
            toast.success("Extraction Complete");
        } catch (_error) {
            toast.error("Split failed");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="w-full">
            {!file && !result && (
                <div className="animate-in fade-in zoom-in-95 duration-700">
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
                <div className="space-y-8 animate-in slide-up duration-500">
                    {/* Header Controls */}
                    <GlassCard className="p-6 sticky top-24 z-30 flex flex-col md:flex-row items-center justify-between gap-6 border-indigo-500/20">
                        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
                            {(['manual', 'interval', 'range'] as SplitMode[]).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setSplitMode(mode)}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                                        splitMode === mode
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                            : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>

                        {splitMode === 'interval' && (
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-slate-400 font-bold uppercase">Every</span>
                                <input
                                    type="number"
                                    min="1"
                                    max={pageCount}
                                    value={intervalValue}
                                    onChange={(e) => setIntervalValue(parseInt(e.target.value) || 1)}
                                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-center font-bold focus:border-indigo-500 focus:outline-none"
                                />
                                <span className="text-xs text-slate-400 font-bold uppercase text-left">Pages</span>
                            </div>
                        )}

                        {splitMode === 'range' && (
                            <div className="flex-1 max-w-md w-full">
                                <input
                                    type="text"
                                    placeholder="e.g. 1-5, 8, 10-12"
                                    value={rangeValue}
                                    onChange={(e) => setRangeValue(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs text-white font-bold">{selectedPages.length > 0 ? `${selectedPages.length} selected` : 'All Pages'}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-widest">{pageCount} total</div>
                            </div>
                            <Button
                                variant="primary"
                                onClick={handleSplit}
                                icon={<Scissors className="w-5 h-5" />}
                                className="bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 rounded-full px-8"
                            >
                                Process Split
                            </Button>
                        </div>
                    </GlassCard>

                    {/* Manual Selection Grid */}
                    {splitMode === 'manual' && (
                        <div className="animate-in fade-in duration-500">
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6 flex items-center gap-3">
                                <LayoutGrid className="w-3 h-3 text-indigo-500" />
                                Visual Selection Canvas
                            </h4>
                            <PDFGrid
                                file={file}
                                pageCount={pageCount}
                                selectedPages={selectedPages}
                                onPageClick={togglePageSelection}
                                customOverlay={(idx) => selectedPages.includes(idx + 1) ? (
                                    <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                                        <CheckCircle className="w-12 h-12 text-white drop-shadow-lg fill-indigo-600" />
                                    </div>
                                ) : null}
                            />
                        </div>
                    )}

                    {/* Non-visual Modes Info */}
                    {(splitMode === 'interval' || splitMode === 'range') && (
                        <GlassCard className="p-12 text-center border-dashed border-slate-800">
                            <Layers className="w-12 h-12 text-slate-700 mx-auto mb-6" />
                            <h3 className="text-xl font-bold text-white mb-2">Automated Segmentation Active</h3>
                            <p className="text-slate-500 max-w-sm mx-auto text-sm">
                                {splitMode === 'interval'
                                    ? `This document will be automatically split every ${intervalValue} page(s), resulting in ${Math.ceil(pageCount / intervalValue)} separate files.`
                                    : "Range extraction will isolate specific page blocks based on your input above."}
                            </p>
                        </GlassCard>
                    )}
                </div>
            )}

            {processing && (
                <div className="max-w-xl mx-auto py-20 text-center animate-in zoom-in-95 duration-500">
                    <div className="relative w-24 h-24 mx-auto mb-10">
                        <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full" />
                        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <Scissors className="absolute inset-0 m-auto w-8 h-8 text-indigo-500 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Segmenting Document...</h3>
                    <ProgressBar progress={progress} label={statusMessage} />
                </div>
            )}

            {result && (
                <div className="max-w-2xl mx-auto animate-in scale-in duration-500">
                    <GlassCard className="p-12 text-center border-emerald-500/20">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                            <CheckCircle className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-2">Split Success!</h3>
                        <p className="text-slate-400 mb-10">All segments have been bundled into a highly compressed archive.</p>

                        <div className="bg-slate-900/50 p-8 rounded-3xl border border-white/5 mb-10 flex flex-col items-center">
                            <Database className="w-8 h-8 text-indigo-400 mb-4" />
                            <div className="text-2xl text-white font-black">{result.fileName}</div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-2">{formatFileSize(result.blob.size)} Bundle</div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => downloadFile(result.blob, result.fileName)}
                                icon={<Download className="w-6 h-6" />}
                                className="py-8 text-2xl bg-emerald-600 hover:bg-emerald-500 shadow-2xl shadow-emerald-500/20 rounded-2xl"
                            >
                                Download ZIP Archive
                            </Button>
                            <Button variant="ghost" onClick={() => { setFile(null); setResult(null); }} className="text-slate-500 mt-4 underline underline-offset-4">
                                Start Another Extraction
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            )}
        </div>
    );
}
