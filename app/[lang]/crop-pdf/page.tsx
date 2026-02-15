'use client';

import React, { useState, useEffect, useMemo } from 'react';

import * as Lucide from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
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

export default function CropPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    // Current Interaction State
    const [margins, setMargins] = useState<Margins>({ top: 0, bottom: 0, left: 0, right: 0 });
    const [mode, setMode] = useState<CropMode>('keep');

    // Page Dimensions & State
    const [pageIndex, setPageIndex] = useState(1);
    const [pageDims, setPageDims] = useState({ width: 0, height: 0 });

    // Selection state
    const [selection, setSelection] = useState<SelectionRect>({ x: 0, y: 0, width: 0, height: 0 });

    // === MULTI-PAGE CROP STATE ===
    const [pendingCrops, setPendingCrops] = useState<Record<number, PageConfig>>({});

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
            // Reset to default (Full page selection for Keep, maybe smaller for remove?)
            // Let's stick to full page default for consistency, usually implies "Select All"
            setMargins({ top: 0, bottom: 0, left: 0, right: 0 });
            setSelection({ x: 0, y: 0, width: w, height: h });
            setMode('keep');
        }
    };

    const handleSelectionChange = (rect: SelectionRect) => {
        setSelection(rect);
        if (pageDims.width > 0 && pageDims.height > 0) {
            setMargins({
                top: Math.round(rect.y),
                left: Math.round(rect.x),
                right: Math.round(pageDims.width - (rect.x + rect.width)),
                bottom: Math.round(pageDims.height - (rect.y + rect.height))
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
        // Validation?
        if (mode === 'keep' && Object.values(margins).every(v => v === 0)) {
            toast('Full page selected (No Change)', { icon: 'ℹ️' });
        }
        setPendingCrops(prev => ({
            ...prev,
            [pageIndex - 1]: { ...margins, mode }
        }));
        toast.success(`Page ${pageIndex} ${mode === 'keep' ? 'crop' : 'removal'} confirmed!`);
    };

    const undoCrop = () => {
        const { [pageIndex - 1]: removed, ...rest } = pendingCrops;
        setPendingCrops(rest);
        // Reset visual to full page
        setMargins({ top: 0, bottom: 0, left: 0, right: 0 });
        setSelection({ x: 0, y: 0, width: pageDims.width, height: pageDims.height });
        setMode('keep');
        toast('Page reset');
    };

    const isCurrentPageCropped = !!pendingCrops[pageIndex - 1];

    const handleCropPDF = async () => {
        if (!file) return;

        const cropsToSubmit = { ...pendingCrops };

        // Auto-add current page if not confirmed but active interaction exists?
        // Let's rely on explicit confirmation or at least explicit list.
        if (Object.keys(cropsToSubmit).length === 0) {
            // If completely empty, maybe they want to apply current visual to current page?
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

            const newPdfBytes = await cropPDF(file, { top: 0, bottom: 0, left: 0, right: 0 }, {
                perPageCrops: cropsToSubmit
            });

            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);
            downloadFile(blob, `${baseName}_processed.pdf`);

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

    const MarginInput = ({ label, value, field, icon: Icon }: any) => (
        <div className="flex flex-col">
            <label className="text-white text-xs font-semibold mb-2 flex items-center gap-2">
                <Icon className="w-3 h-3" /> {label}
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
                className="w-full px-3 py-2 rounded-lg glass text-white text-sm"
            />
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            <ToolHeader
                toolId="cropPdf"
                title="Visual Cropper & Cleaner"
                description="Select areas to keep (crop) or remove (whiten out). Apply page by page."
                icon={Lucide.Crop}
                color="from-orange-500 to-red-500"
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

            {file && !processing && (
                <div className="grid lg:grid-cols-3 gap-8 mb-8 items-start">

                    {/* LEFT: VISUAL CROPPER */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between text-white bg-slate-800/50 p-2 rounded-lg px-4">
                            <span className="flex items-center gap-2 font-semibold">
                                <span className={cn(
                                    "flex items-center justify-center w-6 h-6 rounded-full text-xs text-white",
                                    isCurrentPageCropped ? "bg-green-500" : (mode === 'remove' ? "bg-red-500" : "bg-orange-500")
                                )}>
                                    {isCurrentPageCropped ? <Lucide.Check className="w-3 h-3" /> : (pageIndex)}
                                </span>
                                {isCurrentPageCropped
                                    ? (pendingCrops[pageIndex - 1]?.mode === 'remove' ? "Removal Confirmed" : "Crop Confirmed")
                                    : (mode === 'remove' ? "Select Area to Remove" : "Select Area to Keep")}
                            </span>

                            {/* PAGE NAV */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setPageIndex(Math.max(1, pageIndex - 1))}
                                >Prev</Button>
                                <span className="text-sm">Page {pageIndex}</span>
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setPageIndex(pageIndex + 1)}
                                >Next</Button>
                            </div>
                        </div>

                        <div className={cn(
                            "relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl border min-h-[500px] flex items-center justify-center transition-colors",
                            isCurrentPageCropped
                                ? (pendingCrops[pageIndex - 1]?.mode === 'remove' ? "border-red-500/50 shadow-red-900/20" : "border-green-500/50 shadow-green-900/20")
                                : "border-slate-700"
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
                                            : (mode === 'remove' ? "REMOVE AREA" : "KEEP AREA")
                                        }
                                        color={isCurrentPageCropped
                                            ? "#22c55e"
                                            : (mode === 'remove' ? "#ef4444" : undefined)
                                        }
                                    />
                                </div>
                            )}
                        </div>
                        <p className="text-center text-sm text-slate-400">
                            {Object.keys(pendingCrops).length} page(s) pending.
                        </p>
                    </div>

                    {/* RIGHT: CONTROLS */}
                    <div className="lg:col-span-1">
                        <GlassCard className="p-6 sticky top-24">
                            <h3 className="text-white font-semibold mb-6">Page {pageIndex} Mode</h3>

                            {/* Mode Toggle */}
                            <div className="grid grid-cols-2 gap-2 bg-slate-800/50 p-1 rounded-lg mb-6">
                                <button
                                    onClick={() => {
                                        setMode('keep');
                                        // If switching to keep, maybe reset selection to full? 
                                        // Or keep current rect. Let's keep rect.
                                        setSelection({ x: 0, y: 0, width: pageDims.width, height: pageDims.height });
                                        setMargins({ top: 0, bottom: 0, left: 0, right: 0 });
                                    }}
                                    disabled={isCurrentPageCropped}
                                    className={cn(
                                        "flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                                        mode === 'keep'
                                            ? "bg-orange-500 text-white shadow-lg"
                                            : "text-slate-400 hover:text-slate-200"
                                    )}
                                >
                                    <Lucide.Crop className="w-4 h-4" /> Keep Area
                                </button>
                                <button
                                    onClick={() => {
                                        setMode('remove');
                                        // When switching to remove, usually want a small box, not full page
                                        const w = 100, h = 100;
                                        const cx = (pageDims.width - w) / 2;
                                        const cy = (pageDims.height - h) / 2;
                                        setSelection({ x: cx, y: cy, width: w, height: h });
                                        // Update margins logic (reverse)
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
                                        "flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all",
                                        mode === 'remove'
                                            ? "bg-red-500 text-white shadow-lg"
                                            : "text-slate-400 hover:text-slate-200"
                                    )}
                                >
                                    <Lucide.Eraser className="w-4 h-4" /> Remove Area
                                </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <Button
                                    variant={isCurrentPageCropped ? "outline" : "secondary"}
                                    onClick={confirmCrop}
                                    className={cn(isCurrentPageCropped ? "border-green-500 text-green-400" : "")}
                                    icon={<Lucide.Check className="w-4 h-4" />}
                                >
                                    {isCurrentPageCropped ? "Update" : "Confirm"}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={undoCrop}
                                    disabled={!isCurrentPageCropped}
                                    className="text-red-400 hover:text-red-300 border-red-900/50 hover:border-red-500/50"
                                    icon={<Lucide.Undo className="w-4 h-4" />}
                                >
                                    Undo
                                </Button>
                            </div>

                            <hr className="border-slate-700 mb-6" />

                            {/* Manual Coordinates */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
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

                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg mb-6">
                                <h4 className="text-blue-400 text-xs font-bold mb-2 flex items-center gap-2">
                                    <Lucide.Layers className="w-3 h-3" /> Queue
                                </h4>
                                <div className="text-xs text-slate-300">
                                    {Object.keys(pendingCrops).length === 0 ? (
                                        "No pages confirmed yet."
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {Object.keys(pendingCrops).map(p => (
                                                <span key={p} className={cn(
                                                    "px-2 py-1 rounded",
                                                    pendingCrops[parseInt(p)]?.mode === 'remove' ? "bg-red-900/50 text-red-200" : "bg-green-900/50 text-green-200"
                                                )}>
                                                    P{parseInt(p) + 1} ({pendingCrops[parseInt(p)]?.mode === 'remove' ? 'Rem' : 'Keep'})
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleCropPDF}
                                loading={processing}
                                icon={<Lucide.Download className="w-5 h-5" />}
                                className="w-full"
                            >
                                Process PDF
                            </Button>
                        </GlassCard>
                    </div>
                </div>
            )}
            <QuickGuide steps={toolGuides['/crop-pdf']} />
            <ToolContent toolName="/crop-pdf" />
            <RelatedTools currentToolHref="/crop-pdf" />
        </div>
    );
}
