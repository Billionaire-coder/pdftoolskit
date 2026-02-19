'use client';

import React, { useState, useEffect } from 'react';

import * as Lucide from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
// import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { cropPDF } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName, cn } from '@/lib/utils';
import { InteractiveOverlay, SelectionRect } from '@/components/pdf/InteractiveOverlay';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';
import dynamic from 'next/dynamic';

const PDFPageViewer = dynamic(() => import('@/components/pdf/PDFPageViewer').then(mod => mod.PDFPageViewer), {
    ssr: false,
    loading: () => <div className="w-full h-96 flex items-center justify-center glass animate-pulse">Loading PDF Viewer...</div>
});



type Margins = { top: number; bottom: number; left: number; right: number };
type CropMode = 'keep' | 'remove';

type PageConfig = Margins & { mode: CropMode };
type AspectRatio = 'free' | '1:1' | 'a4' | '16:9';

export default function CropPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [_progress, setProgress] = useState(0);

    // Current Interaction State
    const [margins, setMargins] = useState<Margins>({ top: 0, bottom: 0, left: 0, right: 0 });
    const [mode, setMode] = useState<CropMode>('keep');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('free');
    const [anonymize, setAnonymize] = useState(false);
    const [_applyToAllState, _setApplyToAllState] = useState(false);

    // Page Dimensions & State
    const [pageIndex, setPageIndex] = useState(1);
    const [pageDims, setPageDims] = useState({ width: 0, height: 0 });

    // Selection state
    const [selection, setSelection] = useState<SelectionRect>({ x: 0, y: 0, width: 0, height: 0 });

    // === MULTI-PAGE CROP STATE ===
    const [pendingCrops, setPendingCrops] = useState<Record<number, PageConfig>>({});

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
            resetPageState();
            setPendingCrops({});
            setPageIndex(1);
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const resetPageState = () => {
        setMargins({ top: 0, bottom: 0, left: 0, right: 0 });
        setSelection({ x: 0, y: 0, width: 0, height: 0 });
        setMode('keep');
        // We defer dimensions reset until load
    };

    // When page loads, check if we have a saved crop for this page
    const handlePageLoad = (w: number, h: number) => {
        setPageDims({ width: w, height: h });

        const savedCrop = pendingCrops[pageIndex - 1]; // 0-based
        if (savedCrop) {
            // Restore saved crop
            setMargins(savedCrop);
            setMode(savedCrop.mode);
            setSelection({
                x: savedCrop.left,
                y: savedCrop.top,
                width: w - savedCrop.left - savedCrop.right,
                height: h - savedCrop.top - savedCrop.bottom
            });
        } else {
            // Reset to default
            setMargins({ top: 0, bottom: 0, left: 0, right: 0 });
            setSelection({ x: 0, y: 0, width: w, height: h });
            setMode('keep');
        }
    };

    const handleSelectionChange = (rect: SelectionRect) => {
        const newRect = { ...rect };

        // Aspect Ratio Logic
        if (aspectRatio !== 'free') {
            let ratio = 1;
            if (aspectRatio === '1:1') ratio = 1;
            if (aspectRatio === 'a4') ratio = 210 / 297;
            if (aspectRatio === '16:9') ratio = 16 / 9;

            // Simple width-priority lock
            newRect.height = newRect.width / ratio;
        }

        setSelection(newRect);
        if (pageDims.width > 0 && pageDims.height > 0) {
            setMargins({
                top: Math.round(newRect.y),
                left: Math.round(newRect.x),
                right: Math.round(pageDims.width - (newRect.x + newRect.width)),
                bottom: Math.round(pageDims.height - (newRect.y + newRect.height))
            });
        }
    };

    const updateSelectionFromMargins = (newMargins: Margins) => {
        if (pageDims.width > 0 && pageDims.height > 0) {
            setSelection({
                x: newMargins.left,
                y: newMargins.top,
                width: pageDims.width - newMargins.left - newMargins.right,
                height: pageDims.height - newMargins.top - newMargins.bottom
            });
        }
    };

    // Actions
    const confirmCrop = () => {
        if (mode === 'keep' && Object.values(margins).every(v => v === 0)) {
            toast('Full page selected (No Change)', { icon: 'ℹ️' });
        }
        setPendingCrops(prev => ({
            ...prev,
            [pageIndex - 1]: { ...margins, mode }
        }));
        toast.success(`Page ${pageIndex} confirmed!`);
    };

    const undoCrop = () => {
        const { [pageIndex - 1]: _removed, ...rest } = pendingCrops;
        setPendingCrops(rest);
        // Reset visual to full page
        setMargins({ top: 0, bottom: 0, left: 0, right: 0 });
        setSelection({ x: 0, y: 0, width: pageDims.width, height: pageDims.height });
        setMode('keep');
        toast('Page reset');
    };

    const _applyToAll = () => {
        if (!pageDims.width) return;
        // Apply current margins/mode to ALL pages (naive, assumes same size)
        // In a real app we'd need per-page dimensions logic for accurate relative crops
        // For now, we'll just replicate the config entry
        // NOTE: This is a UI simulation of "Apply to All", actual backend handles non-specified pages differently
        // But to visualize "Confirmed" on all:

        // This is complex without knowing total pages count here easily... 
        // We'll rely on the user manually checking or trust the "Global" fallback in backend if we don't send per-page.
        // Actually, backend basic.ts logic B: "Global Margins".
        // So we can just NOT send perPageCrops and send global margins?
        // But we have a mix. 
        // Let's simplified: "Copy current settings to generic global state"
        toast.promise(new Promise(r => setTimeout(r, 500)), {
            loading: 'Applying to all pages...',
            success: 'Settings copied! (Visual verification required)',
            error: 'Error'
        });
        // Logic: We will set a flag or just populate pendingCrops for currently visited pages?
        // Simplest: The "Process" button sends pendingCrops. If we want global, we need a "Global Override".
        // Let's stick to per-page precision for now, maybe just confirm current page is enough.
        confirmCrop();
    };

    const isCurrentPageCropped = !!pendingCrops[pageIndex - 1];

    const handleCropPDF = async () => {
        if (!file) return;

        const cropsToSubmit = { ...pendingCrops };

        // If no specific crops, but user has a selection, imply "Apply this to current page"
        if (Object.keys(cropsToSubmit).length === 0) {
            if (Object.values(margins).some(v => v > 0) || mode === 'remove') {
                cropsToSubmit[pageIndex - 1] = { ...margins, mode };
            }
        }

        if (Object.keys(cropsToSubmit).length === 0) {
            toast.error('No pages selected. Please confirm changes for at least one page.');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            // If we have just ONE crop config and it matches the current page, 
            // and the user hit "Apply to All" (hypothetically), we could pass global margins.
            // But per-page is safer.

            const newPdfBytes = await cropPDF(file, { top: 0, bottom: 0, left: 0, right: 0 }, {
                perPageCrops: cropsToSubmit,
                anonymize
            });

            clearInterval(progressInterval);
            setProgress(100);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([newPdfBytes as any], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);

            setResult({ blob, fileName: `${baseName}_${anonymize ? 'secure' : 'cropped'}.pdf` });

            toast.success('PDF processed successfully!');
            setFile(null);
            setPendingCrops({});
            setProgress(0);
        } catch (error) {
            console.error('Error processing PDF:', error);
            toast.error('Failed to process PDF');
        } finally {
            setProcessing(false);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const MarginInput = ({ label, value, field, icon: Icon }: any) => (
        <div className="flex flex-col">
            <label className="text-white text-xs font-semibold mb-2 flex items-center gap-2">
                <Icon className="w-3 h-3 text-slate-400" /> {label}
            </label>
            <input
                type="number"
                min="0"
                value={value}
                onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    const newMargins = { ...margins, [field]: val };
                    setMargins(newMargins);
                    updateSelectionFromMargins(newMargins);
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700 text-white text-sm focus:border-orange-500 outline-none"
            />
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-7xl">
            <ToolHeader
                toolId="cropPdf"
                title="Surgical Content Reframer"
                description="Crop, whiten, and anonymize PDF content with precision geometry."
                icon={Lucide.Crop}
                color="from-orange-500 to-rose-500"
            />

            <div className="mb-8 max-w-4xl mx-auto">
                <FileUpload
                    onFilesSelected={handleFileSelected}
                    files={file ? [file] : []}
                    onRemoveFile={() => setFile(null)}
                    multiple={false}
                    maxSize={limits.maxFileSize}
                    isPro={isPro}
                />
            </div>

            {result && (
                <GlassCard className="p-10 mb-8 text-center animate-in zoom-in-95 duration-500 max-w-xl mx-auto border-orange-500/30">
                    <div className="mx-auto w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                        <Lucide.Scissors className="w-10 h-10 text-orange-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Geometric Transformation Complete</h3>
                    <p className="text-slate-400 mb-8">{anonymize ? 'Privacy Mode Active: Boundary boxes unified.' : 'Content successfully reframed.'}</p>

                    <div className="flex justify-center">
                        <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
                            <input
                                type="text"
                                value={downloadFileName}
                                onChange={(e) => setDownloadFileName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-orange-500 w-full flex-grow text-center sm:text-left font-bold"
                                placeholder="Filename"
                            />
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                icon={<Lucide.Download className="w-5 h-5" />}
                                className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-500/20"
                            >
                                Download
                            </Button>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => setResult(null)} className="mt-6 text-slate-500 hover:text-white">
                        Crop Another Document
                    </Button>
                </GlassCard>
            )}

            {file && !processing && !result && (
                <div className="grid lg:grid-cols-12 gap-8 mb-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* LEFT: CONTROLS */}
                    <div className="lg:col-span-3 space-y-6 order-2 lg:order-1">
                        {/* Status Card */}
                        <div className="bg-slate-800/40 rounded-2xl p-4 border border-white/5">
                            <div className="flex items-center gap-2 font-semibold text-white mb-4">
                                <span className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                                    isCurrentPageCropped ? "bg-emerald-500" : "bg-slate-700"
                                )}>
                                    {pageIndex}
                                </span>
                                <div>
                                    <p className="text-sm">Page {pageIndex}</p>
                                    <p className={cn("text-xs", isCurrentPageCropped ? "text-emerald-400" : "text-slate-500")}>
                                        {isCurrentPageCropped ? "Confirmed" : "Pending"}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setPageIndex(Math.max(1, pageIndex - 1))}
                                    className="text-xs"
                                >Prev</Button>
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setPageIndex(pageIndex + 1)}
                                    className="text-xs"
                                >Next</Button>
                            </div>
                        </div>

                        {/* Mode Card */}
                        <GlassCard className="p-5">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Action Mode</h4>
                            <div className="grid grid-cols-2 gap-2 mb-6">
                                <button
                                    onClick={() => {
                                        setMode('keep');
                                        setSelection({ x: 0, y: 0, width: pageDims.width, height: pageDims.height });
                                        setMargins({ top: 0, bottom: 0, left: 0, right: 0 });
                                    }}
                                    disabled={isCurrentPageCropped}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium transition-all border",
                                        mode === 'keep'
                                            ? "bg-orange-500 border-orange-400 text-white shadow-lg"
                                            : "bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-800"
                                    )}
                                >
                                    <Lucide.Crop className="w-5 h-5" /> Keep
                                </button>
                                <button
                                    onClick={() => {
                                        setMode('remove');
                                        const w = pageDims.width * 0.5;
                                        const h = pageDims.height * 0.2;
                                        const cx = (pageDims.width - w) / 2;
                                        const cy = (pageDims.height - h) / 2;
                                        setSelection({ x: cx, y: cy, width: w, height: h });
                                        // Update margins logic (needed for backend)
                                        if (pageDims.width) {
                                            setMargins({
                                                top: Math.round(cy),
                                                left: Math.round(cx),
                                                right: Math.round(pageDims.width - cx - w),
                                                bottom: Math.round(pageDims.height - cy - h)
                                            });
                                        }
                                    }}
                                    disabled={isCurrentPageCropped}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 py-3 rounded-xl text-xs font-medium transition-all border",
                                        mode === 'remove'
                                            ? "bg-rose-500 border-rose-400 text-white shadow-lg"
                                            : "bg-slate-800/50 border-transparent text-slate-400 hover:bg-slate-800"
                                    )}
                                >
                                    <Lucide.Eraser className="w-5 h-5" /> Erase
                                </button>
                            </div>

                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Aspect Ratio</h4>
                            <div className="grid grid-cols-4 gap-1 mb-6">
                                {(['free', '1:1', 'a4', '16:9'] as const).map(ratio => (
                                    <button
                                        key={ratio}
                                        onClick={() => setAspectRatio(ratio)}
                                        className={cn(
                                            "text-[10px] py-2 rounded-lg font-bold border transition-all",
                                            aspectRatio === ratio
                                                ? "bg-white text-slate-900 border-white"
                                                : "bg-transparent text-slate-500 border-slate-700 hover:border-slate-500"
                                        )}
                                    >
                                        {ratio.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant={isCurrentPageCropped ? "outline" : "secondary"}
                                    onClick={confirmCrop}
                                    className={cn("w-full", isCurrentPageCropped ? "border-emerald-500 text-emerald-400" : "")}
                                    icon={<Lucide.Check className="w-4 h-4" />}
                                >
                                    {isCurrentPageCropped ? "Updated" : "Confirm"}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={undoCrop}
                                    disabled={!isCurrentPageCropped}
                                    className="w-full text-rose-400 hover:text-rose-300 border-rose-900/50 hover:border-rose-500/50"
                                >
                                    Reset
                                </Button>
                            </div>
                        </GlassCard>

                        <div className="p-4 bg-slate-800/30 rounded-xl border border-white/5 space-y-4">
                            <label className="flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-2">
                                    <Lucide.ShieldAlert className={cn("w-4 h-4", anonymize ? "text-orange-400" : "text-slate-600")} />
                                    <div className="text-sm text-slate-300 group-hover:text-white transition-colors">
                                        <p className="font-bold">Hard-Crop</p>
                                        <p className="text-[10px] text-slate-500">Sync all boxes (Privacy)</p>
                                    </div>
                                </div>
                                <div className={cn("w-10 h-5 rounded-full relative transition-colors", anonymize ? "bg-orange-500" : "bg-slate-700")}>
                                    <input type="checkbox" className="sr-only" checked={anonymize} onChange={e => setAnonymize(e.target.checked)} />
                                    <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", anonymize ? "left-6" : "left-1")} />
                                </div>
                            </label>
                        </div>

                        <Button
                            variant="primary"
                            onClick={handleCropPDF}
                            loading={processing}
                            icon={<Lucide.Download className="w-5 h-5" />}
                            className="w-full py-6 text-lg bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-500 hover:to-rose-500"
                        >
                            Process PDF
                        </Button>
                        <p className="text-center text-xs text-slate-500">{Object.keys(pendingCrops).length} page(s) pending.</p>


                    </div>

                    {/* CENTER: VISUAL WORKSPACE */}
                    <div className="lg:col-span-9 order-1 lg:order-2">
                        <div className={cn(
                            "relative bg-slate-900/50 rounded-2xl overflow-hidden shadow-2xl border min-h-[600px] flex items-center justify-center transition-all",
                            isCurrentPageCropped
                                ? "border-emerald-500/30 ring-1 ring-emerald-500/20"
                                : "border-slate-800"
                        )}>
                            <PDFPageViewer
                                file={file}
                                pageNumber={pageIndex}
                                scale={1.0}
                                onPageLoad={handlePageLoad}
                            />
                            {pageDims.width > 0 && (
                                <div
                                    className="absolute"
                                    style={{ width: pageDims.width, height: pageDims.height }}
                                >
                                    <InteractiveOverlay
                                        width={pageDims.width}
                                        height={pageDims.height}
                                        selection={selection}
                                        onSelectionChange={handleSelectionChange}
                                        label={isCurrentPageCropped
                                            ? "CONFIRMED"
                                            : (mode === 'remove' ? "AREA TO ERASE" : "AREA TO KEEP")
                                        }
                                        color={isCurrentPageCropped
                                            ? "#10b981"
                                            : (mode === 'remove' ? "#f43f5e" : "#f97316")
                                        }
                                    />
                                </div>
                            )}
                        </div>

                        {/* Precision Inputs */}
                        <div className="mt-6 grid grid-cols-4 gap-4 max-w-2xl mx-auto">
                            <MarginInput
                                label="Top"
                                value={margins.top}
                                field="top"
                                icon={Lucide.MoveVertical}
                            />
                            <MarginInput
                                label="Bottom"
                                value={margins.bottom}
                                field="bottom"
                                icon={Lucide.MoveVertical}
                            />
                            <MarginInput
                                label="Left"
                                value={margins.left}
                                field="left"
                                icon={Lucide.MoveHorizontal}
                            />
                            <MarginInput
                                label="Right"
                                value={margins.right}
                                field="right"
                                icon={Lucide.MoveHorizontal}
                            />
                        </div>
                    </div>

                </div>
            )}
            <QuickGuide steps={toolGuides['/crop-pdf']} />
            <ToolContent toolName="/crop-pdf" />
            <RelatedTools currentToolHref="/crop-pdf" />
        </div>
    );
}

