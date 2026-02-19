'use client';

import React, { useState, useEffect } from 'react';
import { Download, LayoutTemplate } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { addPageNumbers } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';
import clsx from 'clsx';

type Position = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

export default function AddPageNumbersPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [position, setPosition] = useState<Position>('bottom-center');
    const [startFrom, setStartFrom] = useState<number>(1);
    const [textPattern, setTextPattern] = useState<string>('{n}');
    const [margin, setMargin] = useState<number>(20);
    const [mirror, setMirror] = useState<boolean>(false);
    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleFileSelected = (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success('PDF uploaded successfully');
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const handleAddPageNumbers = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const newPdfBytes = await addPageNumbers(file, {
                position,
                startFrom,
                textPattern,
                margin,
                mirror
            });

            clearInterval(progressInterval);
            setProgress(100);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([newPdfBytes as any], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);

            setResult({ blob, fileName: `${baseName}_numbered.pdf` });

            toast.success('Page numbers added successfully!');
            setFile(null);
            setProgress(0);
        } catch (error) {
            console.error('Error adding page numbers:', error);
            toast.error('Failed to add page numbers');
        } finally {
            setProcessing(false);
        }
    };

    const PositionButton = ({ pos, label }: { pos: Position; label: string }) => (
        <button
            onClick={() => setPosition(pos)}
            className={clsx(
                "p-3 rounded-lg border flex flex-col items-center justify-center transition-all",
                position === pos
                    ? "bg-blue-600 border-blue-500 text-white shadow-lg scale-105"
                    : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700"
            )}
        >
            <div className="w-8 h-10 border border-current rounded-sm relative mb-2 opacity-50">
                <span className={clsx(
                    "absolute text-[10px] font-bold",
                    pos.includes('top') ? "top-1" : "bottom-1",
                    pos.includes('left') ? "left-1" : pos.includes('right') ? "right-1" : "left-1/2 -translate-x-1/2"
                )}>#</span>
            </div>
            <span className="text-xs font-medium">{label}</span>
        </button>
    );

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="addPageNumbers"
                title="Add Page Numbers"
                description="Insert page numbers into your PDF with custom positioning"
                icon={LayoutTemplate}
                color="from-green-500 to-emerald-500"
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

            {/* Result Card */}
            {result && (
                <GlassCard className="p-6 mb-8 text-center animate-in zoom-in-95 duration-500">
                    <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                        <LayoutTemplate className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Page Numbers Added!</h3>

                    <div className="flex justify-center mt-6">
                        <div className="flex flex-col sm:flex-row gap-3 items-center w-full max-w-md">
                            <input
                                type="text"
                                value={downloadFileName}
                                onChange={(e) => setDownloadFileName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 w-full sm:w-auto flex-grow text-center sm:text-left"
                                placeholder="Filename"
                            />
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                icon={<Download className="w-5 h-5" />}
                                className="w-full sm:w-auto"
                            >
                                Download PDF
                            </Button>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => setResult(null)} className="mt-4 text-sm">
                        Process Another
                    </Button>
                </GlassCard>
            )}

            {file && !processing && !result && (
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <GlassCard className="p-6">
                        <label className="block text-white font-semibold mb-4">
                            Position
                        </label>
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <PositionButton pos="top-left" label="Top Left" />
                            <PositionButton pos="top-center" label="Top Center" />
                            <PositionButton pos="top-right" label="Top Right" />
                            <PositionButton pos="bottom-left" label="Bottom Left" />
                            <PositionButton pos="bottom-center" label="Bottom Center" />
                            <PositionButton pos="bottom-right" label="Bottom Right" />
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                            <span className="text-sm text-slate-300">Mirror (Book Mode)</span>
                            <button
                                onClick={() => setMirror(!mirror)}
                                className={clsx(
                                    "w-12 h-6 rounded-full transition-colors relative",
                                    mirror ? "bg-green-500" : "bg-slate-600"
                                )}
                            >
                                <span className={clsx(
                                    "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                                    mirror ? "translate-x-6" : "translate-x-0"
                                )} />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Swaps Left/Right positions on even pages for double-sided printing.
                        </p>
                    </GlassCard>

                    <GlassCard className="p-6 space-y-6">
                        <div>
                            <label className="block text-white font-semibold mb-2">
                                Text Pattern
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={textPattern}
                                    onChange={(e) => setTextPattern(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl glass text-white placeholder-slate-500 focus-ring"
                                    placeholder="{n}"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTextPattern(p => p + "{n}")}
                                    className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
                                >
                                    + Page {"{n}"}
                                </button>
                                <button
                                    onClick={() => setTextPattern(p => p + "{total}")}
                                    className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
                                >
                                    + Total {"{total}"}
                                </button>
                                <button
                                    onClick={() => setTextPattern("Page {n} of {total}")}
                                    className="px-2 py-1 text-xs bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
                                >
                                    Preset: &quot;1 of 10&quot;
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-white font-semibold mb-2">
                                    Start From
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={startFrom}
                                    onChange={(e) => setStartFrom(parseInt(e.target.value) || 1)}
                                    className="w-full px-4 py-3 rounded-xl glass text-white placeholder-slate-500 focus-ring"
                                />
                            </div>
                            <div>
                                <label className="block text-white font-semibold mb-2">
                                    Margin (px)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="200"
                                    value={margin}
                                    onChange={(e) => setMargin(parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-3 rounded-xl glass text-white placeholder-slate-500 focus-ring"
                                />
                            </div>
                        </div>
                    </GlassCard>
                </div>
            )}

            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label="Adding page numbers..." />
                </div>
            )}

            {file && !result && (
                <GlassCard className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-white font-semibold">Ready to add page numbers</p>
                        <Button
                            variant="primary"
                            onClick={handleAddPageNumbers}
                            loading={processing}
                            icon={<Download className="w-5 h-5" />}
                        >
                            Add Page Numbers
                        </Button>
                    </div>
                </GlassCard>
            )}


            <QuickGuide steps={toolGuides['/add-page-numbers']} />
            <ToolContent toolName="/add-page-numbers" />
            <RelatedTools currentToolHref="/add-page-numbers" />
        </div>
    );
}
