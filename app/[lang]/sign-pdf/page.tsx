'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Download, Eraser, Move, Type, Image as ImageIcon, Check, Layers, Undo } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { addImageToPage } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName, cn } from '@/lib/utils';
import { PDFPageViewer } from '@/components/pdf/PDFPageViewer';
import { InteractiveOverlay, SelectionRect } from '@/components/pdf/InteractiveOverlay';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

// Helper to load cursive font
const SIGNATURE_FONTS = ['Dancing Script', 'Great Vibes', 'Sacramento', 'cursive'];

type SignatureMode = 'draw' | 'type' | 'upload';
type InkColor = 'black' | 'blue' | 'red';

type Placement = {
    pageIndex: number;
    x: number;
    y: number;
    width: number;
    height: number;
    pageWidth: number;
    pageHeight: number;
};

export default function SignPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    // Signature State
    const [mode, setMode] = useState<SignatureMode>('draw');
    const [drawingTool, setDrawingTool] = useState<'pen' | 'eraser'>('pen');
    const [color, setColor] = useState<InkColor>('black');
    const [typedName, setTypedName] = useState('');
    const [selectedFont, setSelectedFont] = useState('Great Vibes'); // New Font State
    const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);

    // Canvas Refs
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    // Position State (Current Active Interaction)
    const [pageIndex, setPageIndex] = useState(1);
    const [pageDims, setPageDims] = useState({ width: 0, height: 0 });
    const [selection, setSelection] = useState<SelectionRect>({ x: 50, y: 100, width: 200, height: 100 });

    // Multi-Page Placements
    const [placements, setPlacements] = useState<Placement[]>([]);
    const [applyToAll, setApplyToAll] = useState(false);

    // Load Google Font
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Sacramento&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }, []);

    // DRAW MODE HANDLERS
    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (mode !== 'draw') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (drawingTool === 'eraser') {
            ctx.lineWidth = 20;
            ctx.globalCompositeOperation = 'destination-out';
        } else {
            ctx.lineWidth = 2;
            ctx.strokeStyle = color;
            ctx.globalCompositeOperation = 'source-over';
        }

        setIsDrawing(true);
        const { x, y } = getCoordinates(e, canvas);
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || mode !== 'draw') return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoordinates(e, canvas);
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
        setHasSignature(false);
        setTypedName('');
        setUploadedImage(null);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const img = new Image();
            img.onload = () => {
                setUploadedImage(img);
                setHasSignature(true);
            };
            img.src = URL.createObjectURL(file);
        }
    };

    const getSignatureBlob = async (): Promise<Blob | null> => {
        if (mode === 'draw') {
            const canvas = canvasRef.current;
            if (!canvas) return null;
            return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        } else if (mode === 'type') {
            const canvas = document.createElement('canvas');
            canvas.width = 600;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;

            ctx.fillStyle = color;
            ctx.font = `100px "${selectedFont}", cursive`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

            return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        } else if (mode === 'upload') {
            if (!uploadedImage) return null;
            const canvas = document.createElement('canvas');
            canvas.width = uploadedImage.width;
            canvas.height = uploadedImage.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return null;
            ctx.drawImage(uploadedImage, 0, 0);
            return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        }
        return null;
    };

    const confirmPlacement = () => {
        if (!hasSignature) {
            toast.error('Please create a signature first!');
            return;
        }

        if (pageDims.width === 0 || pageDims.height === 0) {
            toast.error('Page dimensions not loaded yet');
            return;
        }

        const newPlacement: Placement = {
            pageIndex: pageIndex - 1, // 0-based
            x: selection.x,
            y: selection.y,
            width: selection.width,
            height: selection.height,
            pageWidth: pageDims.width,
            pageHeight: pageDims.height
        };

        setPlacements([...placements, newPlacement]);
        toast.success(`Signature placed on Page ${pageIndex}`);
    };

    const applyToAllPages = () => {
        if (!hasSignature) {
            toast.error('Please create a signature first!');
            return;
        }
        if (!file || pageDims.width === 0) return;

        // We assume all pages have similar dimensions for this convenience feature
        // Or we could try to just use the current placement's relative %? 
        // For simplicity, we'll replicate the exact coordinates and hope pages are same size.
        // Most PDFs (contracts) have uniform page sizes.

        // We need total page count. `file` doesn't strictly say, but `PDFPageViewer` knows.
        // `pdf-lib` knows.
        // We can't easily know total pages here without loading the doc.
        // BUT `PDFPageViewer` uses `onPageLoad`.
        // Let's use a "hack": we don't know total pages easily client-side without parsing.
        // Actually `validatePDFFile` doesn't return page count.
        // We can use a different approach: Pass a flag to `handleSignPDF`?
        // OR: parse the PDF once on load to get page count.

        // Let's skip "Apply to All" in the UI *State* for now if we don't have page count.
        // Wait, `pdfjs-dist` is used in `PDFPageViewer`.
        // I can trigger a specific tool to get page count.

        // Alternative: "Repeat on all pages" checkmark in common actions?
        // Let's stick to explicit placements for robustness, BUT allow user to navigate and click "Paste" (Confirm).
        // I will add a "Clone to Next Page" button?

        // Update: I will just use the Confirm button changes above. 
    };

    const undoPlacement = () => {
        // Remove last placement for CURRENT page, or generally last action?
        // Generally Last Action is better.
        if (placements.length > 0) {
            setPlacements(placements.slice(0, -1));
            toast('Undo: Removed last placement');
        }
    };

    // Check if current page has placements
    const currentPagePlacements = placements.filter(p => p.pageIndex === (pageIndex - 1));

    const handleSignPDF = async () => {
        if (!file) return;

        // If no confirmed placements, check if user has a valid selection active?
        // "Auto-confirm" current selection if queue is empty?
        const finalPlacements = [...placements];
        if (finalPlacements.length === 0) {
            if (hasSignature) {
                // Add current visual selection
                finalPlacements.push({
                    pageIndex: pageIndex - 1,
                    x: selection.x,
                    y: selection.y,
                    width: selection.width,
                    height: selection.height,
                    pageWidth: pageDims.width,
                    pageHeight: pageDims.height
                });
            } else {
                toast.error('Please sign and place the signature first.');
                return;
            }
        }

        setProcessing(true);
        setProgress(0);

        try {
            const blob = await getSignatureBlob();
            if (!blob) throw new Error('Failed to generate signature');

            const arrayBuffer = await blob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);

            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            // Prepare placements for pdf-utils
            // We map the UI "Placement" type (which includes page dimensions) 
            // to the simpler structure needed by addImageToPage, plus we handle coordinate flip.
            const utilsPlacements = finalPlacements.map(p => ({
                pageIndex: p.pageIndex,
                x: p.x,
                // Flip Y coordinate using the stored pageHeight
                y: p.pageHeight - (p.y + p.height),
                width: p.width,
                height: p.height
            }));

            const newPdfBytes = await addImageToPage(
                file,
                uint8Array,
                utilsPlacements,
                { applyToAll }
            );

            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const resultBlob = new Blob([newPdfBytes], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);
            downloadFile(resultBlob, `${baseName}_signed.pdf`);

            toast.success('Signed PDF created successfully!');
            setFile(null);
            clearSignature();
            setPageIndex(1);
            setPlacements([]);
            setProgress(0);
        } catch (error) {
            console.error('Error signing PDF:', error);
            toast.error('Failed to sign PDF');
        } finally {
            setProcessing(false);
            setProgress(0);
        }
    };

    const handleFileSelected = (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success('PDF uploaded successfully');
            setPlacements([]);
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const handlePageLoad = (w: number, h: number) => {
        setPageDims({ width: w, height: h });
    };

    const handleSelectionChange = (rect: SelectionRect) => {
        setSelection(rect);
    };

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => {
                setMode(id);
                setHasSignature(id === 'draw' ? false : (id === 'type' ? !!typedName : !!uploadedImage));
            }}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors border-b-2",
                mode === id
                    ? "bg-slate-700/50 border-blue-500 text-blue-400"
                    : "hover:bg-slate-800/50 border-transparent text-slate-400"
            )}
        >
            <Icon className="w-4 h-4" /> {label}
        </button>
    );

    const ColorButton = ({ id, bg }: any) => (
        <button
            onClick={() => setColor(id)}
            className={cn(
                "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                color === id ? "border-white shadow-glow" : "border-transparent opacity-70"
            )}
            style={{ backgroundColor: bg }}
            title={id}
        />
    );

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            <ToolHeader
                toolId="signPdf"
                title="Visual Signer"
                description="Sign multiple pages at once. Create your signature, place it, and confirm."
                icon={PenTool}
                color="from-indigo-500 to-blue-600"
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

                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* 1. Signature Creator */}
                        <GlassCard className="p-0 overflow-hidden">
                            <div className="flex items-center gap-1 border-b border-slate-700 bg-slate-900/50 px-4 pt-2">
                                <TabButton id="draw" label="Draw" icon={PenTool} />
                                <TabButton id="type" label="Type" icon={Type} />
                                <TabButton id="upload" label="Upload" icon={ImageIcon} />
                            </div>

                            <div className="p-6">
                                {/* TOOLBAR */}
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-2">
                                        {mode !== 'upload' && (
                                            <>
                                                {/* Tool Toggles */}
                                                <div className="flex bg-slate-100 rounded-lg p-1 gap-1 mr-2">
                                                    <button
                                                        onClick={() => setDrawingTool('pen')}
                                                        className={cn(
                                                            "p-1.5 rounded transition-all",
                                                            drawingTool === 'pen' ? "bg-white shadow text-blue-600" : "text-slate-400 hover:text-slate-600"
                                                        )}
                                                        title="Pen Tool"
                                                    >
                                                        <PenTool className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDrawingTool('eraser')}
                                                        className={cn(
                                                            "p-1.5 rounded transition-all",
                                                            drawingTool === 'eraser' ? "bg-white shadow text-blue-600" : "text-slate-400 hover:text-slate-600"
                                                        )}
                                                        title="Eraser Tool"
                                                    >
                                                        <Eraser className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Colors (Only visible/active if Pen) */}
                                                <div className={cn("flex items-center gap-2 transition-opacity", drawingTool === 'eraser' ? "opacity-30 pointer-events-none" : "opacity-100")}>
                                                    <ColorButton id="black" bg="#000000" />
                                                    <ColorButton id="blue" bg="#0000FF" />
                                                    <ColorButton id="red" bg="#FF0000" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <button onClick={clearSignature} className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300">
                                        <Eraser className="w-3 h-3" /> Clear All
                                    </button>
                                </div>

                                {/* CONTENT */}
                                <div className="bg-white rounded-xl overflow-hidden min-h-[200px] flex items-center justify-center relative touch-none">
                                    {mode === 'draw' && (
                                        <canvas
                                            ref={canvasRef}
                                            width={800} height={400}
                                            className="w-full h-auto block"
                                            style={{
                                                cursor: drawingTool === 'eraser'
                                                    ? 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'black\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><circle cx=\'12\' cy=\'12\' r=\'10\' fill=\'white\' opacity=\'0.8\'/></svg>") 12 12, auto'
                                                    : 'crosshair'
                                            }}
                                            onMouseDown={startDrawing}
                                            onMouseMove={draw}
                                            onMouseUp={stopDrawing}
                                            onMouseLeave={stopDrawing}
                                            onTouchStart={startDrawing}
                                            onTouchMove={draw}
                                            onTouchEnd={stopDrawing}
                                        />
                                    )}

                                    {mode === 'type' && (
                                        <div className="w-full h-full p-4 flex flex-col items-center justify-center">
                                            <input
                                                type="text"
                                                placeholder="Type your name..."
                                                value={typedName}
                                                onChange={(e) => {
                                                    setTypedName(e.target.value);
                                                    setHasSignature(!!e.target.value);
                                                }}
                                                className="text-4xl md:text-6xl text-center w-full bg-transparent border-b-2 border-slate-200 focus:border-blue-500 outline-none p-2 mb-4"
                                                style={{ fontFamily: `"${selectedFont}", cursive`, color: color }}
                                            />

                                            {/* Font Selector */}
                                            <div className="flex gap-2 mt-2">
                                                {['Great Vibes', 'Dancing Script', 'Sacramento'].map(font => (
                                                    <button
                                                        key={font}
                                                        onClick={() => setSelectedFont(font)}
                                                        className={cn(
                                                            "px-3 py-1 rounded-full text-sm border transition-all",
                                                            selectedFont === font
                                                                ? "bg-slate-800 text-white border-blue-500"
                                                                : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                                                        )}
                                                        style={{ fontFamily: font }}
                                                    >
                                                        Abc
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {mode === 'upload' && (
                                        <div className="w-full h-full p-4 flex flex-col items-center justify-center">
                                            {uploadedImage ? (
                                                <img
                                                    src={uploadedImage.src}
                                                    alt="Signature Upload"
                                                    className="max-h-[180px] w-auto object-contain"
                                                />
                                            ) : (
                                                <div className="text-center">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="hidden"
                                                        id="sig-upload"
                                                    />
                                                    <label htmlFor="sig-upload" className="cursor-pointer">
                                                        <div className="flex flex-col items-center gap-2 text-slate-400 hover:text-blue-500 transition-colors">
                                                            <ImageIcon className="w-12 h-12" />
                                                            <span>Click to Upload Signature Image</span>
                                                        </div>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </GlassCard>

                        {/* 2. PDF Visualizer */}
                        <div>
                            <div className="flex items-center justify-between text-white bg-slate-800/50 p-2 rounded-lg px-4 mb-2">
                                <label className="text-white font-semibold flex items-center gap-2">
                                    <span className="bg-blue-500 text-xs w-6 h-6 rounded-full flex items-center justify-center">
                                        {currentPagePlacements.length}
                                    </span>
                                    Confirmed on Page {pageIndex}
                                </label>
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

                            <div className="relative bg-slate-800 rounded-xl overflow-hidden shadow-2xl border border-slate-700 min-h-[500px] flex items-center justify-center">
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
                                        {/* Render Confirmed Placements for this page */}
                                        {currentPagePlacements.map((p, i) => (
                                            <div
                                                key={i}
                                                className="absolute border-2 border-green-500 bg-green-500/20 flex items-center justify-center"
                                                style={{ left: p.x, top: p.y, width: p.width, height: p.height }}
                                            >
                                                <Check className="w-6 h-6 text-green-500" />
                                            </div>
                                        ))}

                                        <InteractiveOverlay
                                            width={pageDims.width}
                                            height={pageDims.height}
                                            selection={selection}
                                            onSelectionChange={handleSelectionChange}
                                            label="PLACE HERE"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: CONTROLS */}
                    <div className="lg:col-span-1">
                        <GlassCard className="p-6 sticky top-24">
                            <h3 className="text-white font-semibold mb-4">Actions</h3>

                            <div className="flex flex-col gap-3 mb-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <Button
                                        variant="secondary"
                                        onClick={confirmPlacement}
                                        disabled={!hasSignature}
                                        icon={<Check className="w-4 h-4" />}
                                    >
                                        Place
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={undoPlacement}
                                        className="text-red-400 border-red-900/50"
                                        icon={<Undo className="w-4 h-4" />}
                                    >
                                        Undo
                                    </Button>
                                </div>
                                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer bg-slate-900/40 p-2 rounded hover:bg-slate-900/60 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={applyToAll}
                                        onChange={(e) => setApplyToAll(e.target.checked)}
                                        className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
                                    />
                                    <span>Apply to ALL pages</span>
                                </label>
                            </div>

                            <div className="p-4 bg-slate-800/50 rounded-lg mb-6">
                                <h4 className="text-blue-400 text-xs font-bold mb-2 flex items-center gap-2">
                                    <Layers className="w-3 h-3" /> Queue
                                </h4>
                                <div className="text-xs text-slate-300 max-h-32 overflow-y-auto">
                                    {placements.length === 0 ? "No signatures placed." : (
                                        <ul className="space-y-2">
                                            {placements.map((p, i) => (
                                                <li key={i} className="flex justify-between items-center bg-slate-900/30 p-2 rounded border border-slate-700/50">
                                                    <span className="font-mono text-blue-300">Page {p.pageIndex + 1}</span>
                                                    <span className="text-slate-500 text-[10px]">
                                                        Details: {Math.round(p.x)},{Math.round(p.y)} <br />
                                                        ({Math.round(p.width)}x{Math.round(p.height)})
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleSignPDF}
                                loading={processing}
                                disabled={placements.length === 0 && !hasSignature}
                                className="w-full"
                                icon={<Download className="w-5 h-5" />}
                            >
                                Sign All ({placements.length || 1})
                            </Button>
                        </GlassCard>
                    </div>
                </div>
            )}
            <QuickGuide steps={toolGuides['/sign-pdf']} />
            <ToolContent toolName="/sign-pdf" />
            <RelatedTools currentToolHref="/sign-pdf" />
        </div>
    );
}
