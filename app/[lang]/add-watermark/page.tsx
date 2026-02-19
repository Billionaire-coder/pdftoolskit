'use client';

import React, { useState, useEffect } from 'react';
import { Type, Download, Droplet, MoveVertical, Palette, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { addWatermark } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName, cn } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { PDFPageViewer } from '@/components/pdf/PDFPageViewer';
import { ToolHeader } from '@/components/shared/ToolHeader';

// We reuse InteractiveOverlay but we might need a simpler "DraggableText" component
// Or just use the overlay to define the bounding box?
// Let's create a custom draggable/resizable element here or inside the viewer.
// For simplicity, we can use InteractiveOverlay to define the "Area", and render text inside it.

import { InteractiveOverlay, SelectionRect } from '@/components/pdf/InteractiveOverlay';

export default function AddWatermarkPage() {
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

    // Page State
    const [pageIndex, setPageIndex] = useState(1);
    const [pageDims, setPageDims] = useState({ width: 0, height: 0 });

    // Watermark State
    const [text, setText] = useState('CONFIDENTIAL');
    const [opacity, setOpacity] = useState(0.5);
    const [size, setSize] = useState(48);
    const [color, setColor] = useState('#808080');
    // Rotation is harder to visualize with current Overlay, let's keep it simple (45deg fixed or slider?)
    // pdf-utils default was 45. Let's make it configurable?
    const [rotation, setRotation] = useState(45);
    const [layoutMode, setLayoutMode] = useState<'single' | 'mosaic'>('single');

    // Position (Percent or Pixels? logic below uses pixels relative to current view)
    // We treat the "Selection" as the watermark bounds?
    // Or just a point (x,y)? Text needs width/height.
    // Let's use SelectionRect as the "Containing Box" for the text.
    const [selection, setSelection] = useState<SelectionRect>({ x: 100, y: 300, width: 400, height: 100 });

    const handleFileSelected = (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success('PDF uploaded successfully');
            setPageIndex(1);
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const handlePageLoad = (w: number, h: number) => {
        setPageDims({ width: w, height: h });
        // Center default selection
        if (w > 0 && h > 0) {
            setSelection({
                x: Math.round(w * 0.2), // 20%
                y: Math.round(h * 0.4), // 40%
                width: Math.round(w * 0.6), // 60% width
                height: 100
            });
        }
    };

    const handleAddWatermark = async () => {
        if (!file || !text.trim()) {
            toast.error('Please enter watermark text');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            // Calculate relative position based on Page 1 dims
            // selection coordinates are relative to the viewer image
            const refW = pageDims.width || 100;
            const refH = pageDims.height || 100;

            const uiCenterX = selection.x + (selection.width / 2);
            const uiCenterY = selection.y + (selection.height / 2);

            const relX = uiCenterX / refW;
            const relY = uiCenterY / refH;

            // Extract RGB
            const r = parseInt(color.slice(1, 3), 16) / 255;
            const g = parseInt(color.slice(3, 5), 16) / 255;
            const b = parseInt(color.slice(5, 7), 16) / 255;

            const newPdfBytes = await addWatermark(file, text, {
                opacity,
                size,
                color: { r, g, b },
                rotation,
                layout: layoutMode, // 'single' | 'mosaic'
                x: relX,
                y: relY
            });

            clearInterval(progressInterval);
            setProgress(100);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([newPdfBytes as any], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);

            setResult({ blob, fileName: `${baseName}_watermarked.pdf` });

            toast.success('Watermark added successfully!');
            setFile(null);
            setProgress(0);
        } catch (error) {
            console.error('Error adding watermark:', error);
            toast.error('Failed to add watermark');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            <ToolHeader
                toolId="addWatermark"
                title="Visual Watermark"
                description="Drag to place, resize, and style your watermark."
                icon={Droplet}
                color="from-indigo-500 to-violet-500"
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

            {/* Result Card */}
            {result && (
                <GlassCard className="p-6 mb-8 text-center animate-in zoom-in-95 duration-500 max-w-md mx-auto">
                    <div className="mx-auto w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mb-4">
                        <Droplet className="w-8 h-8 text-violet-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Watermark Added!</h3>

                    <div className="flex justify-center mt-6">
                        <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
                            <input
                                type="text"
                                value={downloadFileName}
                                onChange={(e) => setDownloadFileName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-violet-500 w-full flex-grow text-center sm:text-left"
                                placeholder="Filename"
                            />
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                icon={<Download className="w-5 h-5" />}
                                className="w-full sm:w-auto"
                            >
                                Download
                            </Button>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => setResult(null)} className="mt-4 text-sm">
                        Watermark Another
                    </Button>
                </GlassCard>
            )}

            {file && !processing && !result && (
                <div className="grid lg:grid-cols-3 gap-8 items-start">

                    {/* LEFT: VISUAL EDITOR */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center justify-between text-white bg-slate-800/50 p-2 rounded-lg px-4 mb-2">
                            <div className="text-sm font-semibold">Previewing Page {pageIndex}</div>
                            {/* Nav controls if we want to preview other page sizes, but mainly we place on one */}
                        </div>

                        <div className="relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-slate-700 min-h-[500px] flex items-center justify-center">
                            <PDFPageViewer
                                file={file}
                                pageNumber={pageIndex}
                                scale={1.0}
                                onPageLoad={handlePageLoad}
                            />
                            {pageDims.width > 0 && (
                                <div
                                    className="absolute inset-0 pointer-events-none"
                                    style={{ width: pageDims.width, height: pageDims.height }}
                                >
                                    {layoutMode === 'single' ? (
                                        <div className="pointer-events-auto w-full h-full">
                                            <InteractiveOverlay
                                                width={pageDims.width}
                                                height={pageDims.height}
                                                selection={selection}
                                                onSelectionChange={setSelection}
                                                label=""
                                                color={color}
                                            >
                                                <div className="w-full h-full flex items-center justify-center overflow-hidden"
                                                    style={{
                                                        transform: `rotate(${rotation}deg)`,
                                                        opacity: opacity
                                                    }}>
                                                    <span
                                                        style={{
                                                            fontSize: `${size}px`,
                                                            color: color,
                                                            fontWeight: 'bold',
                                                            whiteSpace: 'nowrap',
                                                            fontFamily: 'Helvetica, sans-serif'
                                                        }}
                                                    >
                                                        {text}
                                                    </span>
                                                </div>
                                            </InteractiveOverlay>
                                        </div>
                                    ) : (
                                        <div className="w-full h-full p-4 overflow-hidden relative">
                                            {/* Simplified CSS Mosaic Preview */}
                                            {Array.from({ length: 12 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="absolute flex items-center justify-center"
                                                    style={{
                                                        left: `${(i % 3) * 33}%`,
                                                        top: `${Math.floor(i / 3) * 25}%`,
                                                        width: '33%',
                                                        height: '25%',
                                                        transform: `rotate(${rotation}deg)`,
                                                        opacity: opacity
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: `${size}px`,
                                                            color: color,
                                                            fontWeight: 'bold',
                                                            whiteSpace: 'nowrap',
                                                            fontFamily: 'Helvetica, sans-serif'
                                                        }}
                                                    >
                                                        {text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-center text-xs text-slate-500 mt-2">
                            Watermark will be applied to all pages relative to this position.
                        </p>
                    </div>

                    {/* RIGHT: CONTROLS */}
                    <div className="lg:col-span-1">
                        <GlassCard className="p-6 sticky top-24 space-y-6">
                            <div>
                                <label className="block text-white text-sm font-semibold mb-2 flex items-center gap-2">
                                    <Type className="w-4 h-4" /> Text
                                </label>
                                <input
                                    type="text"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg glass text-white focus-ring"
                                />
                            </div>

                            {/* Layout Mode Switcher */}
                            <div className="bg-slate-700/50 p-1 rounded-lg flex">
                                <button
                                    onClick={() => setLayoutMode('single')}
                                    className={cn(
                                        "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                                        layoutMode === 'single' ? "bg-violet-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    Single
                                </button>
                                <button
                                    onClick={() => setLayoutMode('mosaic')}
                                    className={cn(
                                        "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",
                                        layoutMode === 'mosaic' ? "bg-violet-500 text-white shadow-sm" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    Mosaic (Tile)
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white text-xs font-semibold mb-2 flex items-center gap-2">
                                        <MoveVertical className="w-3 h-3" /> Size: {size}px
                                    </label>
                                    <input
                                        type="range"
                                        min="12" max="200"
                                        value={size}
                                        onChange={(e) => setSize(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white text-xs font-semibold mb-2 flex items-center gap-2">
                                        <Droplet className="w-3 h-3" /> Opacity: {Math.round(opacity * 100)}%
                                    </label>
                                    <input
                                        type="range"
                                        min="0.1" max="1" step="0.1"
                                        value={opacity}
                                        onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-white text-xs font-semibold mb-2 flex items-center gap-2">
                                        <RotateCw className="w-3 h-3" /> Rotate: {rotation}°
                                    </label>
                                    <input
                                        type="range"
                                        min="-180" max="180" step="15"
                                        value={rotation}
                                        onChange={(e) => setRotation(parseInt(e.target.value))}
                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white text-xs font-semibold mb-2 flex items-center gap-2">
                                        <Palette className="w-3 h-3" /> Color
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            className="w-full h-8 rounded cursor-pointer bg-transparent border-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleAddWatermark}
                                loading={processing}
                                icon={<Download className="w-5 h-5" />}
                                className="w-full mt-4"
                            >
                                Apply Watermark
                            </Button>
                        </GlassCard>
                    </div>
                </div>
            )}

            {processing && (
                <div className="mb-8 max-w-xl mx-auto">
                    <ProgressBar progress={progress} label="Applying watermark..." />
                </div>
            )}


            <QuickGuide steps={toolGuides['/add-watermark']} />
            <ToolContent toolName="/add-watermark" />
            <RelatedTools currentToolHref="/add-watermark" />
        </div>
    );
}
