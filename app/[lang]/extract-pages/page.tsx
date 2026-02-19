'use client';

import React, { useState, useEffect } from 'react';
import { Files, Download, Check, ListFilter, Wand2, Archive, Scissors } from 'lucide-react';
import toast from 'react-hot-toast';
import JSZip from 'jszip';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { organizePDF, splitPDF } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName, cn } from '@/lib/utils';
import { PDFThumbnail } from '@/components/pdf/PDFThumbnail';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { Modal } from '@/components/ui/Modal';

interface PageItem {
    index: number;
    selected: boolean;
}

export default function ExtractPagesPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [numPages, setNumPages] = useState(0);
    const [pages, setPages] = useState<PageItem[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Initializing Extraction...');
    const [pageRange, setPageRange] = useState('');
    const [extractionMode, setExtractionMode] = useState<'single' | 'individual'>('single');
    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleFileSelected = async (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.loading('Analyzing document structure...', { id: 'load-pdf' });
            try {
                const { PDFDocument } = await import('pdf-lib');
                const arrayBuffer = await files[0].arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const count = pdf.getPageCount();
                setNumPages(count);
                setPages(Array.from({ length: count }, (_, i) => ({ index: i, selected: false })));
                toast.success(`Document loaded: ${count} pages`, { id: 'load-pdf' });
            } catch (_e) {
                toast.error('Failed to parse PDF architecture', { id: 'load-pdf' });
            }
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const togglePageSelection = (idx: number, e?: React.MouseEvent) => {
        setPages(prev => {
            const next = [...prev];
            if (e?.shiftKey && lastClickedIndex !== null) {
                const start = Math.min(lastClickedIndex, idx);
                const end = Math.max(lastClickedIndex, idx);
                // eslint-disable-next-line security/detect-object-injection
                const newState = !next[idx].selected;
                for (let i = start; i <= end; i++) {
                    // eslint-disable-next-line security/detect-object-injection
                    next[i].selected = newState;
                }
            } else {
                // eslint-disable-next-line security/detect-object-injection
                next[idx].selected = !next[idx].selected;
            }
            return next;
        });
        setLastClickedIndex(idx);
    };

    // Keep text range in sync with grid
    useEffect(() => {
        const selectedIndices = pages.filter(p => p.selected).map(p => p.index + 1);
        if (selectedIndices.length === 0) {
            setPageRange('');
            return;
        }

        const ranges: string[] = [];
        let rStart = selectedIndices[0];
        let rEnd = selectedIndices[0];

        for (let i = 1; i < selectedIndices.length; i++) {
            // eslint-disable-next-line security/detect-object-injection
            if (selectedIndices[i] === rEnd + 1) {
                // eslint-disable-next-line security/detect-object-injection
                rEnd = selectedIndices[i];
            } else {
                ranges.push(rStart === rEnd ? `${rStart}` : `${rStart}-${rEnd}`);
                // eslint-disable-next-line security/detect-object-injection
                rStart = selectedIndices[i];
                // eslint-disable-next-line security/detect-object-injection
                rEnd = selectedIndices[i];
            }
        }
        ranges.push(rStart === rEnd ? `${rStart}` : `${rStart}-${rEnd}`);
        setPageRange(ranges.join(', '));
    }, [pages]);

    const handleExtractPages = async () => {
        if (!file) return;
        const selectedIndices = pages.filter(p => p.selected).map(p => p.index);

        if (selectedIndices.length === 0) {
            toast.error('Please select at least one page');
            return;
        }

        setProcessing(true);
        setProgress(0);
        setStatusMessage('Collation in progress...');

        try {
            const baseName = getBaseFileName(file.name);

            if (extractionMode === 'single') {
                const newPdfBytes = await organizePDF(file, selectedIndices.map(i => ({ index: i })));
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const blob = new Blob([newPdfBytes as any], { type: 'application/pdf' });
                setResult({ blob, fileName: `${baseName}_extracted.pdf` });
            } else {
                setStatusMessage('Generating individual files (ZIP)...');
                const ranges = selectedIndices.map(i => ({ start: i, end: i }));
                const pdfs = await splitPDF(file, ranges);

                const zip = new JSZip();
                pdfs.forEach((bytes, i) => {
                    // eslint-disable-next-line security/detect-object-injection
                    zip.file(`${baseName}_page_${selectedIndices[i] + 1}.pdf`, bytes);
                    setProgress(Math.round(((i + 1) / pdfs.length) * 100));
                });

                const zipBlob = await zip.generateAsync({ type: 'blob' });
                setResult({ blob: zipBlob, fileName: `${baseName}_extracted_pages.zip` });
            }

            setProgress(100);
            toast.success('Pages isolated successfully!');
        } catch (error) {
            console.error(error);
            toast.error('Extraction failed');
        } finally {
            setProcessing(false);
        }
    };

    const selectedCount = pages.filter(p => p.selected).length;

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-7xl">
            <ToolHeader
                toolId="extractPages"
                title="Semantic Page Isolation"
                description="Extract specific pages or sections into new high-fidelity PDF documents."
                icon={Files}
                color="from-purple-600 via-pink-600 to-rose-600"
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
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* SELECTION HUD */}
                    <GlassCard className="p-4 sticky top-24 z-30 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl border-purple-500/30 shadow-lg shadow-purple-500/10">
                        <div className="flex items-center gap-3">
                            <div className="bg-purple-500/20 p-2 rounded-lg">
                                <ListFilter className="w-5 h-5 text-purple-400" />
                            </div>
                            <div className="text-white font-semibold flex flex-col">
                                <span className="text-sm">Selection HUD</span>
                                <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">
                                    {selectedCount} / {numPages} Pages Selected
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex bg-slate-900/50 rounded-full p-1 border border-white/5">
                                <button
                                    onClick={() => setExtractionMode('single')}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                        extractionMode === 'single' ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    Single PDF
                                </button>
                                <button
                                    onClick={() => setExtractionMode('individual')}
                                    className={cn(
                                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                        extractionMode === 'individual' ? "bg-purple-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                                    )}
                                >
                                    ZIP Archive
                                </button>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleExtractPages}
                                disabled={selectedCount === 0}
                                loading={processing}
                                icon={<Scissors className="w-5 h-5" />}
                                className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/20"
                            >
                                Extract {selectedCount || ''}
                            </Button>
                        </div>
                    </GlassCard>

                    {/* RANGE PREVIEW & ACTIONS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GlassCard className="p-4 border-purple-500/10 bg-slate-900/40">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">Active Range</span>
                                <span className="text-[10px] text-slate-500 font-mono">{pageRange || 'NO SELECTION'}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" className="text-[10px] uppercase font-bold text-slate-400" onClick={() => setPages(p => p.map(pi => ({ ...pi, selected: true })))}>Select All</Button>
                                <Button size="sm" variant="ghost" className="text-[10px] uppercase font-bold text-slate-400" onClick={() => setPages(p => p.map(pi => ({ ...pi, selected: false })))}>Clear</Button>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-4 border-purple-500/10 bg-slate-900/40 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                <Wand2 className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-white font-bold">Structural suggestions</p>
                                <p className="text-[10px] text-slate-500">I can analyze headings to find chapters soon.</p>
                            </div>
                        </GlassCard>
                    </div>

                    {/* GRID AREA */}
                    <div className="bg-slate-900/80 rounded-3xl border border-white/5 p-8 min-h-[500px]">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                            {pages.map((p) => (
                                <div
                                    key={p.index}
                                    onClick={(e) => togglePageSelection(p.index, e)}
                                    className={cn(
                                        "relative group cursor-pointer transition-all duration-300",
                                        p.selected ? "scale-95" : "hover:scale-105"
                                    )}
                                >
                                    <div className={cn(
                                        "rounded-xl overflow-hidden border-2 transition-all shadow-xl",
                                        p.selected ? "border-purple-500 ring-4 ring-purple-500/20" : "border-white/5"
                                    )}>
                                        <PDFThumbnail
                                            file={file}
                                            pageNumber={p.index + 1}
                                            className={cn("w-full transition-opacity", p.selected ? "opacity-100" : "opacity-60 grayscale hover:grayscale-0 hover:opacity-100")}
                                        />

                                        <div className={cn(
                                            "absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all border shadow-lg",
                                            p.selected ? "bg-purple-600 border-white text-white" : "bg-slate-900/80 border-white/20 text-transparent"
                                        )}>
                                            <Check className="w-3.5 h-3.5" />
                                        </div>

                                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/90 text-white text-[10px] font-bold border border-white/10">
                                            Page {p.index + 1}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={processing}
                onClose={() => { }}
                title="Isolating content"
                description={statusMessage}
                className="max-w-md"
            >
                <div className="py-4">
                    <ProgressBar progress={progress} />
                    <p className="text-[10px] text-slate-500 mt-4 text-center italic font-mono uppercase tracking-widest">Applying copy-pages filter...</p>
                </div>
            </Modal>

            {result && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <GlassCard className="max-w-xl w-full p-8 border-purple-500/30 text-center space-y-6">
                        <div className="w-20 h-20 bg-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(147,51,234,0.4)]">
                            <Archive className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Isolation Complete</h2>
                            <p className="text-slate-400 text-sm">Your extracted pages are ready for deployment.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="text"
                                value={downloadFileName}
                                onChange={(e) => setDownloadFileName(e.target.value)}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 font-bold"
                            />
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                icon={<Download className="w-5 h-5" />}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                Download
                            </Button>
                        </div>

                        <Button variant="ghost" onClick={() => { setResult(null); setFile(null); }} className="text-slate-500 hover:text-white">Start New Extraction</Button>
                    </GlassCard>
                </div>
            )}

            <div className="mt-20">
                <QuickGuide steps={toolGuides['/extract-pages']} />
                <ToolContent toolName="/extract-pages" />
                <RelatedTools currentToolHref="/extract-pages" />
            </div>
        </div>
    );
}
