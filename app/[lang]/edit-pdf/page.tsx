'use client';

import React, { useState, useRef, useEffect } from 'react';
import { PenTool, Download, Type, Image as ImageIcon, Check, Layers, Undo, Redo, Trash2, Square, Circle, Minus, MousePointer2, Pencil, Highlighter, Stamp, Ban, RotateCw, Calendar, X, PenLine, ArrowUp, ArrowDown, Copy, CheckSquare, QrCode, Star, Heart, AlertTriangle, Info, ArrowRight, AlignCenter, AlignHorizontalJustifyCenter, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { editPDF, PDFModification, FontName } from '@/lib/pdf-utils-edit';
import { downloadFile, validatePDFFile, getBaseFileName, cn } from '@/lib/utils';
import { PDFPageViewer } from '@/components/pdf/PDFPageViewer';
import { InteractiveOverlay, SelectionRect } from '@/components/pdf/InteractiveOverlay';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import QRCode from 'qrcode';
import { extractTextFromPDF, TextItemWithCoords } from '@/lib/pdf-text-extractor';
import { Search, Replace, TextSelect } from 'lucide-react';
import { ToolHeader } from '@/components/shared/ToolHeader';


type EditMode = 'text' | 'image' | 'draw' | 'shape' | 'stamp' | 'sign' | 'form' | 'qr' | 'icon' | 'edit-text' | 'search';
type ShapeType = 'rectangle' | 'circle' | 'line';

type UIModification = PDFModification & {
    id: string; // Unique ID for UI management
};

const FONTS: FontName[] = ['Helvetica', 'Times Roman', 'Courier', 'Symbol'];
const STAMPS = ['APPROVED', 'DRAFT', 'CONFIDENTIAL', 'FINAL', 'VOID', 'PAID'];

const SVG_ICONS = {
    check: "M20 6L9 17l-5-5",
    cross: "M18 6L6 18M6 6l12 12",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    heart: "M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
    arrowRight: "M5 12h14M12 5l7 7-7 7",
    alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
    info: "M12 22a10 10 0 100-20 10 10 0 000 20zM12 16v-4M12 8h.01"
};

export default function EditPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);

    // Tools State
    const [mode, setMode] = useState<EditMode>('text');
    const [shapeType, setShapeType] = useState<ShapeType>('rectangle');

    // Properties
    const [color, setColor] = useState('#000000');
    const [fillColor, setFillColor] = useState<string>('');
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [opacity, setOpacity] = useState(1);
    const [rotation, setRotation] = useState(0); // Degrees

    // Text Prop
    const [textSize, setTextSize] = useState(18);
    const [textInput, setTextInput] = useState('');
    const [font, setFont] = useState<FontName>('Helvetica');

    // Stamp Prop
    const [selectedStamp, setSelectedStamp] = useState<string>(STAMPS[0]);

    // Sign Prop
    const [savedSignature, setSavedSignature] = useState<{ path: { x: number, y: number }[], width: number, height: number } | null>(null);
    const [isSigning, setIsSigning] = useState(false);

    // QR Prop
    const [qrText, setQrText] = useState('');

    // Icon Prop
    const [selectedIcon, setSelectedIcon] = useState<keyof typeof SVG_ICONS>('star');

    // Image State
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const [uploadedImageBytes, setUploadedImageBytes] = useState<Uint8Array | null>(null);

    // Active Page State
    const [pageIndex, setPageIndex] = useState(1);
    const [pageDims, setPageDims] = useState({ width: 0, height: 0 });
    const [selection, setSelection] = useState<SelectionRect>({ x: 50, y: 100, width: 200, height: 50 });
    const [pageTextItems, setPageTextItems] = useState<any[]>([]);

    // Drawing State
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
    const drawCanvasRef = useRef<HTMLCanvasElement>(null);
    const signCanvasRef = useRef<HTMLCanvasElement>(null);

    // Search State
    const [allPagesText, setAllPagesText] = useState<TextItemWithCoords[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [replaceText, setReplaceText] = useState('');
    const [searchResults, setSearchResults] = useState<TextItemWithCoords[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Load full text for search
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractionError, setExtractionError] = useState(false);

    // Load full text for search
    useEffect(() => {
        if (file) {
            setIsExtracting(true);
            setExtractionError(false);
            extractTextFromPDF(file)
                .then(text => {
                    setAllPagesText(text);
                    if (text.length === 0) setExtractionError(true);
                })
                .catch(err => {
                    console.error(err);
                    setExtractionError(true);
                })
                .finally(() => setIsExtracting(false));
        } else {
            setAllPagesText([]);
        }
    }, [file]);

    useEffect(() => {
        if (searchQuery && allPagesText.length > 0) {
            const results = allPagesText.filter(item =>
                item.str.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, allPagesText]);

    const performReplaceAll = () => {
        if (!searchResults.length) return;

        const newMods: UIModification[] = [];
        searchResults.forEach(item => {
            // 1. Redact (Whiteout)
            newMods.push({
                id: crypto.randomUUID(),
                type: 'shape',
                shapeType: 'rectangle',
                x: item.x - 2,
                y: item.y - 2,
                width: item.width + 4,
                height: item.height + 4,
                fillColor: '#FFFFFF',
                strokeColor: 'transparent',
                strokeWidth: 0,
                opacity: 1,
                pageIndex: item.pageIndex,
                scale: 1,
            });
            // 2. Add New Text
            newMods.push({
                id: crypto.randomUUID(),
                type: 'text',
                text: replaceText,
                x: item.x,
                y: item.y, // Centering might be needed or font adjustment
                textColor: color,
                textSize: item.fontSize || textSize, // Use detected font size if available
                font: font,
                pageIndex: item.pageIndex,
                scale: 1,
            });
        });

        pushToHistory([...modifications, ...newMods]);
        toast.success(`Replaced ${searchResults.length} instances`);
        setSearchQuery('');
        setSearchResults([]);
    };

    const performRedactAll = (customColor = '#000000') => {
        if (!searchResults.length) return;
        const newMods: UIModification[] = [];
        searchResults.forEach(item => {
            newMods.push({
                id: crypto.randomUUID(),
                type: 'shape',
                shapeType: 'rectangle',
                x: item.x - 2,
                y: item.y - 2,
                width: item.width + 4,
                height: item.height + 4,
                fillColor: customColor,
                strokeColor: 'transparent',
                strokeWidth: 0,
                opacity: 1,
                pageIndex: item.pageIndex,
                scale: 1,
            });
        });
        pushToHistory([...modifications, ...newMods]);
        toast.success(`Redacted ${searchResults.length} instances`);
        setSearchQuery('');
        setSearchResults([]);
    };

    // History Management
    const [history, setHistory] = useState<UIModification[][]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const modifications = history[historyIndex];

    const pushToHistory = (newMods: UIModification[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newMods);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const undo = () => {
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
            toast.success('Undo');
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
            toast.success('Redo');
        }
    };

    const handleFileSelected = (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success('PDF uploaded successfully');
            setHistory([[]]);
            setHistoryIndex(0);
            setPageIndex(1);
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const handlePageLoad = (w: number, h: number) => {
        setPageDims({ width: w, height: h });
        if (drawCanvasRef.current) {
            drawCanvasRef.current.width = w;
            drawCanvasRef.current.height = h;
        }
    };

    const handleTextLayerLoaded = (items: any[]) => {
        setPageTextItems(items);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const buf = await file.arrayBuffer();
            setUploadedImageBytes(new Uint8Array(buf));
            setUploadedImage(URL.createObjectURL(file));
        }
    };

    // Drawing Handlers
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        if (mode === 'edit-text') {
            // Handle Text Selection for Editing logic
            const pt = getEventPoint(e, drawCanvasRef.current);
            const clickedItem = pageTextItems.find(item =>
                pt.x >= item.x && pt.x <= item.x + item.width &&
                pt.y >= item.y && pt.y <= item.y + item.height
            );

            if (clickedItem) {
                // Create Redaction
                const redactionMod: UIModification = {
                    id: Math.random().toString(36),
                    type: 'shape',
                    shapeType: 'rectangle',
                    pageIndex: pageIndex - 1,
                    x: clickedItem.x - 2, // Slight padding
                    y: clickedItem.y - 2,
                    width: clickedItem.width + 4,
                    height: clickedItem.height + 4,
                    strokeColor: '#FFFFFF',
                    fillColor: '#FFFFFF',
                    strokeWidth: 0,
                    opacity: 1
                };

                // Create New Text
                const textMod: UIModification = {
                    id: Math.random().toString(36),
                    type: 'text',
                    pageIndex: pageIndex - 1,
                    x: clickedItem.x,
                    y: clickedItem.y - (clickedItem.height * 0.1), // Adjustment
                    text: clickedItem.str,
                    textSize: clickedItem.fontSize || 12,
                    textColor: '#000000',
                    font: 'Helvetica',
                    opacity: 1
                };

                pushToHistory([...modifications, redactionMod, textMod]);

                // Switch to Text mode and select the new text logic (conceptually)
                // Ideally we'd auto-focus the property panel input for this new text item
                setMode('text');
                setTextInput(clickedItem.str);
                setTextSize(clickedItem.fontSize || 12);
                // Need to select this new textMod position for overlay
                setSelection({ x: textMod.x, y: textMod.y, width: 200, height: 50 }); // Rough size

                toast.success("Text editable! Check 'Text' properties.");
            }
            return;
        }

        if (mode !== 'draw' && !isSigning) return;
        setIsDrawing(true);
        const pt = getEventPoint(e, isSigning ? signCanvasRef.current : drawCanvasRef.current);
        setCurrentPath([pt]);
    };
    const drawMove = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = isSigning ? signCanvasRef.current : drawCanvasRef.current;
        if (!isDrawing || !canvas) return;

        const pt = getEventPoint(e, canvas);
        setCurrentPath(prev => [...prev, pt]);

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineWidth = isSigning ? 3 : strokeWidth;
            ctx.strokeStyle = isSigning ? '#000000' : color;
            ctx.globalAlpha = isSigning ? 1 : opacity;
            ctx.lineCap = 'round';
            ctx.lineTo(pt.x, pt.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y);
        }
    };
    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        if (isSigning) {
            // Just keeping the path in temp state, wait for 'Save'
            return;
        }

        if (mode === 'draw' && currentPath.length > 1) {
            const newMod: UIModification = {
                id: Math.random().toString(36),
                type: 'drawing',
                pageIndex: pageIndex - 1,
                x: 0, y: 0,
                pathPoints: currentPath,
                strokeColor: color,
                strokeWidth: strokeWidth,
                opacity: opacity
            };
            pushToHistory([...modifications, newMod]);

            if (drawCanvasRef.current) {
                const ctx = drawCanvasRef.current.getContext('2d');
                ctx?.clearRect(0, 0, drawCanvasRef.current.width, drawCanvasRef.current.height);
            }
        }
        setCurrentPath([]);
        const ctx = drawCanvasRef.current?.getContext('2d');
        ctx?.beginPath();
    };

    const getEventPoint = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement | null) => {
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        if ('touches' in e) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        }
        return {
            x: (e as React.MouseEvent).clientX - rect.left,
            y: (e as React.MouseEvent).clientY - rect.top
        };
    };

    const saveSignature = () => {
        if (currentPath.length > 0) {
            setSavedSignature({
                path: [...currentPath],
                width: signCanvasRef.current?.width || 300,
                height: signCanvasRef.current?.height || 150
            });
            setCurrentPath([]);
            setIsSigning(false);
            toast.success("Signature Saved");
        }
    };
    const clearSignature = () => {
        const ctx = signCanvasRef.current?.getContext('2d');
        ctx?.clearRect(0, 0, signCanvasRef.current?.width || 0, signCanvasRef.current?.height || 0);
        setCurrentPath([]);
        ctx?.beginPath();
    };

    // QR Generation
    const addQRCode = async () => {
        if (!qrText) {
            toast.error("Enter text for QR Code");
            return;
        }
        try {
            const dataUrl = await QRCode.toDataURL(qrText, { width: 300, margin: 1 });
            // Convert dataUrl to Uint8Array
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            const arrayBuffer = await blob.arrayBuffer();

            const newMod: UIModification = {
                id: Math.random().toString(36),
                type: 'image',
                pageIndex: pageIndex - 1,
                x: selection.x, y: selection.y,
                width: selection.width < 100 ? 100 : selection.width, // Force min size
                height: selection.width < 100 ? 100 : selection.width,
                imageData: new Uint8Array(arrayBuffer),
                opacity: opacity,
                rotate: rotation
            };
            pushToHistory([...modifications, newMod]);
            toast.success("QR Code added");
            setQrText('');
        } catch (e) {
            console.error(e);
            toast.error("Failed to generate QR Code");
        }
    };

    const addModification = () => {
        if (pageDims.width === 0) {
            toast.error('Wait for page to load');
            return;
        }

        const newModsToAdd: UIModification[] = [];

        if (mode === 'text') {
            if (!textInput.trim()) return;
            newModsToAdd.push({
                id: Math.random().toString(36),
                type: 'text',
                pageIndex: pageIndex - 1,
                x: selection.x, y: selection.y,
                text: textInput,
                textSize: textSize,
                textColor: color,
                font: font,
                opacity: opacity,
                rotate: rotation
            });
            setTextInput('');
        } else if (mode === 'image') {
            if (!uploadedImageBytes) return;
            newModsToAdd.push({
                id: Math.random().toString(36),
                type: 'image',
                pageIndex: pageIndex - 1,
                x: selection.x, y: selection.y,
                width: selection.width, height: selection.height,
                imageData: uploadedImageBytes,
                opacity: opacity,
                rotate: rotation
            });
            setUploadedImage(null);
            setUploadedImageBytes(null);
        } else if (mode === 'shape') {
            newModsToAdd.push({
                id: Math.random().toString(36),
                type: 'shape',
                shapeType: shapeType,
                pageIndex: pageIndex - 1,
                x: selection.x, y: selection.y,
                width: selection.width, height: selection.height,
                strokeColor: color,
                fillColor: fillColor || undefined,
                strokeWidth: strokeWidth,
                opacity: opacity,
            });
        } else if (mode === 'stamp') {
            newModsToAdd.push({
                id: Math.random().toString(36),
                type: 'text',
                pageIndex: pageIndex - 1,
                x: selection.x, y: selection.y,
                text: selectedStamp,
                textSize: 24,
                textColor: '#FF0000',
                font: 'Helvetica',
                rotate: rotation
            });
        }
        else if (mode === 'form' || mode === 'icon') {
            const svgKey = mode === 'form' ? (shapeType === 'rectangle' ? 'check' : 'cross') : selectedIcon;

            newModsToAdd.push({
                id: Math.random().toString(36),
                type: 'drawing',
                pageIndex: pageIndex - 1,
                x: selection.x, y: selection.y,
                width: 24, height: 24,
                svgPath: SVG_ICONS[svgKey as keyof typeof SVG_ICONS],
                strokeColor: color,
                strokeWidth: 2,
                opacity: 1,
                scale: 1.5,
                rotate: rotation
            });
        }
        else if (mode === 'sign' && savedSignature) {
            const minX = Math.min(...savedSignature.path.map(p => p.x));
            const minY = Math.min(...savedSignature.path.map(p => p.y));
            const shiftedPoints = savedSignature.path.map(p => ({ x: p.x - minX + selection.x, y: p.y - minY + selection.y }));

            newModsToAdd.push({
                id: Math.random().toString(36),
                type: 'drawing',
                pageIndex: pageIndex - 1,
                x: selection.x, y: selection.y,
                pathPoints: shiftedPoints,
                strokeColor: '#000000',
                strokeWidth: 2,
                opacity: 1,
                rotate: rotation
            });
        }

        if (newModsToAdd.length > 0) {
            pushToHistory([...modifications, ...newModsToAdd]);
        }
    };

    const removeModification = (id: string) => {
        pushToHistory(modifications.filter(m => m.id !== id));
    };

    const moveLayer = (index: number, direction: 'up' | 'down') => {
        const newMods = [...modifications];
        if (direction === 'up' && index < newMods.length - 1) {
            [newMods[index], newMods[index + 1]] = [newMods[index + 1], newMods[index]];
        } else if (direction === 'down' && index > 0) {
            [newMods[index], newMods[index - 1]] = [newMods[index - 1], newMods[index]];
        }
        pushToHistory(newMods);
    };

    const duplicateLayer = (mod: UIModification) => {
        const newMod = { ...mod, id: Math.random().toString(36), x: mod.x + 10, y: mod.y + 10 };
        pushToHistory([...modifications, newMod]);
    };

    const alignSelection = (align: 'center-h' | 'center-v') => {
        if (align === 'center-h') {
            setSelection(prev => ({ ...prev, x: (pageDims.width - prev.width) / 2 }));
        }
        if (align === 'center-v') {
            setSelection(prev => ({ ...prev, y: (pageDims.height - prev.height) / 2 }));
        }
        toast.success("Selection aligned");
    };

    const handleDownload = async () => {
        if (!file || modifications.length === 0) return;
        setProcessing(true);
        try {
            const newPdfBytes = await editPDF(file, modifications);
            const blob = new Blob([newPdfBytes as BlobPart], { type: 'application/pdf' });
            downloadFile(blob, `${getBaseFileName(file.name)}_edited.pdf`);
            toast.success('PDF saved successfully');
        } catch (e) {
            console.error(e);
            toast.error('Failed to save PDF');
        } finally {
            setProcessing(false);
        }
    };

    // Tools Helpers
    const setHighlighter = () => {
        setMode('draw');
        setColor('#FFFF00');
        setOpacity(0.4);
        setStrokeWidth(12);
        toast.success('Highlighter Selected');
    };

    const setRedaction = () => {
        setMode('shape');
        setShapeType('rectangle');
        setColor('#FFFFFF'); // Stroke
        setFillColor('#FFFFFF'); // Fill
        setStrokeWidth(0);
        setOpacity(1);
        toast.success('Redaction Tool Selected');
    };

    const setFormTool = (type: 'check' | 'cross') => {
        setMode('form');
        setShapeType(type === 'check' ? 'rectangle' : 'circle');
        setColor(type === 'check' ? '#00AA00' : '#FF0000');
    };

    const insertDate = () => {
        setMode('text');
        setTextInput(new Date().toLocaleDateString());
    };

    const currentMods = modifications.filter(m => m.pageIndex === (pageIndex - 1));

    const ToolBtn = ({ id, icon: Icon, label, active, onClick }: any) => (
        <button
            onClick={onClick || (() => setMode(id))}
            className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl transition-all w-full",
                (active !== undefined ? active : mode === id)
                    ? "bg-blue-600 text-white shadow-lg scale-105"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
            )}
            title={label}
        >
            <Icon className="w-5 h-5 mb-1" />
            <span className="text-[10px] uppercase font-bold tracking-wider">{label}</span>
        </button>
    );

    return (
        <div className="container mx-auto px-4 py-8 max-w-[1400px]">
            <ToolHeader
                toolId="editPdf"
                title="Edit PDF"
                description="Professional PDF Editor"
                icon={PenTool}
                color="from-blue-600 to-indigo-600"
            />

            {file && (
                <div className="flex bg-slate-800 p-1 rounded-lg items-center gap-4 px-2">
                    <div className="flex gap-1 bg-slate-700/50 rounded p-1">
                        <button onClick={undo} disabled={historyIndex === 0} className="p-2 hover:bg-slate-600 rounded disabled:opacity-30 transition-colors" title="Undo">
                            <Undo className="w-4 h-4 text-white" />
                        </button>
                        <button onClick={redo} disabled={historyIndex === history.length - 1} className="p-2 hover:bg-slate-600 rounded disabled:opacity-30 transition-colors" title="Redo">
                            <Redo className="w-4 h-4 text-white" />
                        </button>
                    </div>

                    <div className="h-6 w-px bg-slate-700"></div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setPageIndex(Math.max(1, pageIndex - 1))} disabled={pageIndex <= 1}>
                            Prev
                        </Button>
                        <span className="text-slate-300 font-mono">Page {pageIndex}</span>
                        <Button variant="ghost" size="sm" onClick={() => setPageIndex(pageIndex + 1)}>
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {
                !file ? (
                    <div className="max-w-4xl mx-auto py-12">
                        <FileUpload
                            onFilesSelected={handleFileSelected}
                            files={[]}
                            onRemoveFile={() => { }}
                            multiple={false}
                            maxSize={limits.maxFileSize}
                            isPro={isPro}
                        />
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-12 gap-6 min-h-[calc(100vh-200px)]">

                            {/* LEFT SIDEBAR: TOOLS */}
                            <div className="col-span-1 lg:col-span-1 z-10">
                                <div className="flex flex-col gap-2 sticky top-24 max-h-[80vh] overflow-y-auto no-scrollbar pb-4 min-w-[70px]">
                                    <ToolBtn id="text" icon={Type} label="Text" />
                                    <ToolBtn id="edit-text" icon={FileText} label="Edit Text" />
                                    <ToolBtn id="search" icon={Search} label="Search" />
                                    <ToolBtn id="image" icon={ImageIcon} label="Image" />
                                    <ToolBtn id="shape" icon={Square} label="Shape" />
                                    <ToolBtn id="draw" icon={Pencil} label="Draw" />
                                    <ToolBtn id="stamp" icon={Stamp} label="Stamp" />
                                    <ToolBtn id="form" icon={CheckSquare} label="Forms" />
                                    <ToolBtn id="sign" icon={PenLine} label="Sign" onClick={() => { setMode('sign'); setIsSigning(true); }} />
                                    <ToolBtn id="qr" icon={QrCode} label="QRCode" />
                                    <ToolBtn id="icon" icon={Star} label="Icons" />

                                    <div className="h-px bg-slate-700 my-1"></div>
                                    <ToolBtn id="highlighter" icon={Highlighter} label="Hilite" active={mode === 'draw' && opacity < 1} onClick={setHighlighter} />
                                    <ToolBtn id="redact" icon={Ban} label="Redact" active={mode === 'shape' && fillColor === '#FFFFFF'} onClick={setRedaction} />
                                </div>
                            </div>

                            {/* CENTER: VIEWER */}
                            <div className="col-span-8 lg:col-span-8 bg-slate-900/50 rounded-2xl border border-slate-700 relative flex items-start justify-center p-8 min-h-[600px]">
                                <div className="relative shadow-2xl inline-block sticky top-24">
                                    <PDFPageViewer
                                        file={file}
                                        pageNumber={pageIndex}
                                        scale={1.0}
                                        onPageLoad={handlePageLoad}
                                        onTextLayerLoaded={handleTextLayerLoaded}
                                    />

                                    {/* Visual Layer */}
                                    <div className="absolute inset-0 pointer-events-none">
                                        {/* Debug / Visual Aid for Edit Text Mode */}
                                        {mode === 'edit-text' && pageTextItems.map((item, idx) => (
                                            <div
                                                key={`text-${idx}`}
                                                className="absolute border border-blue-400/20 hover:border-blue-500/80 hover:bg-blue-500/10 transition-colors pointer-events-auto cursor-text"
                                                style={{
                                                    left: item.x,
                                                    top: item.y,
                                                    width: item.width,
                                                    height: item.height,
                                                }}
                                                title={`Edit: ${item.str}`}
                                            />
                                        ))}

                                        {/* Search Results Highlight */}
                                        {mode === 'search' && searchResults.filter(r => r.pageIndex === pageIndex - 1).map((r, i) => (
                                            <div
                                                key={`search-${i}`}
                                                style={{ left: r.x, top: r.y, width: r.width, height: r.height }}
                                                className="absolute bg-yellow-400/30 border border-yellow-500 z-20"
                                                title="Match found"
                                            />
                                        ))}

                                        {currentMods.map((mod) => (
                                            mod.type === 'drawing' ? (
                                                <svg key={mod.id} className="absolute inset-0 w-full h-full">
                                                    {mod.svgPath ? (
                                                        <path
                                                            d={mod.svgPath}
                                                            fill="none"
                                                            stroke={mod.strokeColor}
                                                            strokeWidth={mod.strokeWidth}
                                                            strokeOpacity={mod.opacity}
                                                            transform={`translate(${mod.x}, ${mod.y}) scale(${mod.scale || 1.5}) rotate(${mod.rotate || 0})`}
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    ) : (
                                                        <path
                                                            d={`M ${mod.pathPoints?.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                                                            fill="none"
                                                            stroke={mod.strokeColor}
                                                            strokeWidth={mod.strokeWidth}
                                                            strokeOpacity={mod.opacity}
                                                            strokeLinecap="round"
                                                        />
                                                    )}
                                                </svg>
                                            ) : (
                                                <div
                                                    key={mod.id}
                                                    className="absolute border border-blue-400/30 bg-blue-400/10 flex items-center justify-center overflow-hidden"
                                                    style={{
                                                        left: mod.x, top: mod.y,
                                                        width: mod.width || (mod.text ? 'auto' : 50),
                                                        height: mod.height || (mod.text ? 'auto' : 50),
                                                        color: mod.textColor,
                                                        fontSize: mod.textSize,
                                                        fontFamily: mod.font,
                                                        whiteSpace: 'nowrap',
                                                        borderRadius: mod.shapeType === 'circle' ? '50%' : 0,
                                                        transform: `rotate(${mod.rotate || 0}deg)`,
                                                        backgroundColor: mod.fillColor,
                                                        borderColor: mod.strokeColor,
                                                        borderWidth: mod.strokeWidth && mod.type === 'shape' ? `${mod.strokeWidth}px` : undefined,
                                                        borderStyle: mod.shapeType ? 'solid' : 'none',
                                                        zIndex: 1
                                                    }}
                                                >
                                                    {mod.text && <span className="px-1">{mod.text}</span>}
                                                    {mod.type === 'image' && mod.imageData && (
                                                        <img src={URL.createObjectURL(new Blob([mod.imageData as any]))} className="w-full h-full object-contain" />
                                                    )}
                                                </div>
                                            )
                                        ))}
                                    </div>

                                    {/* Interaction */}
                                    {mode !== 'draw' && mode !== 'sign' && mode !== 'edit-text' && pageDims.width > 0 && (
                                        <div className="absolute inset-0">
                                            <InteractiveOverlay
                                                width={pageDims.width}
                                                height={pageDims.height}
                                                selection={selection}
                                                onSelectionChange={setSelection}
                                                label={mode.toUpperCase()}
                                            />
                                        </div>
                                    )}

                                    {/* Draw Canvas - Reused for click detection in edit-text mode */}
                                    {(mode === 'draw' || mode === 'edit-text') && (
                                        <canvas
                                            ref={drawCanvasRef}
                                            width={pageDims.width}
                                            height={pageDims.height}
                                            className={cn("absolute inset-0 z-50 touch-none", mode === 'edit-text' ? "cursor-text" : "cursor-crosshair")}
                                            onMouseDown={startDrawing}
                                            onMouseMove={drawMove}
                                            onMouseUp={stopDrawing}
                                            onMouseLeave={stopDrawing}
                                            onTouchStart={startDrawing}
                                            onTouchMove={drawMove}
                                            onTouchEnd={stopDrawing}
                                        />
                                    )}
                                </div>

                                {/* Signature Modal Overlay */}
                                {isSigning && (
                                    <div className="absolute inset-0 z-[100] bg-black/60 flex items-center justify-center">
                                        <div className="bg-slate-800 p-4 rounded-xl shadow-2xl border border-slate-700 w-96">
                                            <h3 className="text-white font-bold mb-2">Draw Signature</h3>
                                            <div className="bg-white rounded h-40 relative cursor-crosshair overflow-hidden">
                                                <canvas
                                                    ref={signCanvasRef}
                                                    width={350}
                                                    height={160}
                                                    className="absolute inset-0"
                                                    onMouseDown={startDrawing}
                                                    onMouseMove={drawMove}
                                                    onMouseUp={stopDrawing}
                                                    onMouseLeave={stopDrawing}
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2 mt-4">
                                                <Button variant="ghost" size="sm" onClick={() => setIsSigning(false)}>Cancel</Button>
                                                <Button variant="outline" size="sm" onClick={clearSignature}>Clear</Button>
                                                <Button variant="primary" size="sm" onClick={saveSignature}>Save Signature</Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT SIDEBAR: PROPERTIES */}
                            <div className="col-span-3 lg:col-span-3 z-10">
                                <div className="sticky top-24 max-h-[80vh] overflow-y-auto custom-scrollbar">
                                    <GlassCard className="flex flex-col p-5">
                                        <h3 className="text-white font-semibold mb-4 border-b border-slate-700 pb-2 flex justify-between">
                                            <span>Properties</span>
                                            <span className="text-xs font-normal text-slate-400 bg-slate-800 px-2 rounded py-0.5">{mode}</span>
                                        </h3>

                                        <div className="flex-1 space-y-6 overflow-y-auto">
                                            {mode === 'search' && (
                                                <div className="space-y-6">
                                                    {isExtracting ? (
                                                        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                                                            <RotateCw className="w-6 h-6 animate-spin mb-2" />
                                                            <p className="text-sm">Scanning document text...</p>
                                                        </div>
                                                    ) : extractionError || allPagesText.length === 0 ? (
                                                        <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded text-center">
                                                            <AlertTriangle className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                                                            <p className="text-sm text-orange-200 mb-2">No text found.</p>
                                                            <p className="text-xs text-orange-300/70">
                                                                This PDF might be scanned or image-based.
                                                                Try using the <a href="/ocr-pdf" className="underline text-orange-400">OCR Tool</a> first.
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="space-y-4">
                                                                <label className="text-xs text-slate-400 mb-1 block">Find</label>
                                                                <div className="flex gap-2">
                                                                    <div className="relative flex-1">
                                                                        <input
                                                                            type="text"
                                                                            value={searchQuery}
                                                                            onChange={e => setSearchQuery(e.target.value)}
                                                                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 pl-8 text-white text-sm"
                                                                            placeholder="Type to search..."
                                                                        />
                                                                        <Search className="w-4 h-4 text-slate-500 absolute left-2 top-2.5" />
                                                                    </div>
                                                                </div>

                                                                {searchResults.length > 0 ? (
                                                                    <div className="flex justify-between items-center bg-green-500/10 border border-green-500/30 p-2 rounded">
                                                                        <p className="text-xs text-green-400">{searchResults.length} matches found</p>
                                                                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setSearchQuery('')}>Clear</Button>
                                                                    </div>
                                                                ) : searchQuery ? (
                                                                    <p className="text-xs text-slate-500 italic">No matches found.</p>
                                                                ) : null}
                                                            </div>

                                                            <div className="border-t border-slate-700 pt-4 space-y-4">
                                                                <label className="text-xs text-slate-400 mb-1 block">Quick Actions</label>
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <Button variant="outline" size="sm" onClick={() => {
                                                                        // Email Regex
                                                                        const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
                                                                        const results = allPagesText.filter(item => item.str.match(regex));
                                                                        setSearchResults(results);
                                                                        setSearchQuery('');
                                                                        toast.success(`Found ${results.length} emails`);
                                                                    }} className="text-xs h-8">
                                                                        Find Emails
                                                                    </Button>
                                                                    <Button variant="outline" size="sm" onClick={() => {
                                                                        // Phone Regex (Simple)
                                                                        const regex = /(\+\d{1,3}[- ]?)?\d{10}/g;
                                                                        const results = allPagesText.filter(item => item.str.match(regex));
                                                                        setSearchResults(results);
                                                                        setSearchQuery('');
                                                                        toast.success(`Found ${results.length} phones`);
                                                                    }} className="text-xs h-8">
                                                                        Find Phones
                                                                    </Button>
                                                                </div>
                                                            </div>

                                                            <div className="border-t border-slate-700 pt-4 space-y-4">
                                                                <label className="text-xs text-slate-400 mb-1 block">Replace With</label>
                                                                <div className="relative">
                                                                    <input
                                                                        type="text"
                                                                        value={replaceText}
                                                                        onChange={e => setReplaceText(e.target.value)}
                                                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 pl-8 text-white text-sm"
                                                                        placeholder="New text..."
                                                                    />
                                                                    <Replace className="w-4 h-4 text-slate-500 absolute left-2 top-2.5" />
                                                                </div>
                                                                <Button
                                                                    variant="primary"
                                                                    size="sm"
                                                                    className="w-full"
                                                                    disabled={searchResults.length === 0 || !replaceText}
                                                                    onClick={performReplaceAll}
                                                                >
                                                                    Replace All Found
                                                                </Button>
                                                            </div>

                                                            <div className="border-t border-slate-700 pt-4 space-y-4">
                                                                <label className="text-xs text-slate-400 mb-1 block">Redaction</label>
                                                                <p className="text-xs text-slate-500 mb-2">Securely hide matches with a colored box.</p>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        className="flex-1 bg-black text-white hover:bg-slate-900"
                                                                        disabled={searchResults.length === 0}
                                                                        onClick={() => performRedactAll('#000000')}
                                                                    >
                                                                        Blackout
                                                                    </Button>
                                                                    <Button
                                                                        variant="secondary"
                                                                        size="sm"
                                                                        className="flex-1 bg-white text-black hover:bg-slate-200"
                                                                        disabled={searchResults.length === 0}
                                                                        onClick={() => performRedactAll('#FFFFFF')}
                                                                    >
                                                                        Whiteout
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                            {mode === 'edit-text' && (
                                                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                                    <p className="text-sm text-blue-200">
                                                        <strong>Edit Text Mode Active</strong>
                                                    </p>
                                                    <p className="text-xs text-slate-400 mt-2">
                                                        Click on any text in the document.
                                                        It will be whited-out and replaced with editable text.
                                                    </p>
                                                </div>
                                            )}

                                            {mode === 'text' && (
                                                <div className="space-y-4">
                                                    <textarea
                                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white placeholder-slate-500 focus:border-blue-500 outline-none min-h-[80px]"
                                                        placeholder="Enter text content..."
                                                        value={textInput}
                                                        onChange={e => setTextInput(e.target.value)}
                                                    />
                                                    {/* ... (Existing text controls) */}
                                                    <div className="space-y-2">
                                                        <div className="flex gap-2">
                                                            <div className="flex-1">
                                                                <label className="text-xs text-slate-400 mb-1 block">Font</label>
                                                                <select value={font} onChange={e => setFont(e.target.value as any)} className="w-full bg-slate-800 rounded p-2 text-white border border-slate-600 text-xs">
                                                                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="w-20">
                                                                <label className="text-xs text-slate-400 mb-1 block">Size</label>
                                                                <input type="number" value={textSize} onChange={e => setTextSize(Number(e.target.value))} className="w-full bg-slate-800 rounded p-2 text-white border border-slate-600 text-xs" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-slate-400 mb-1 block">Color</label>
                                                            <div className="flex gap-2 items-center">
                                                                {['#000000', '#FFFFFF', '#FF0000', '#0000FF'].map(c => (
                                                                    <button key={c} onClick={() => setColor(c)} className={cn("w-6 h-6 rounded border border-slate-600", color === c && "ring-1 ring-white")} style={{ backgroundColor: c }} />
                                                                ))}
                                                                <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent" />
                                                            </div>
                                                        </div>

                                                        <Button variant="outline" size="sm" onClick={insertDate} className="w-full gap-2 text-xs h-8">
                                                            <Calendar className="w-3 h-3" /> Insert Today&apos;s Date
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {mode === 'qr' && (
                                                <div className="space-y-4">
                                                    <label className="text-xs text-slate-400 mb-1 block">QR Content (URL or Text)</label>
                                                    <textarea
                                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white placeholder-slate-500 focus:border-blue-500 outline-none min-h-[80px]"
                                                        placeholder="https://example.com"
                                                        value={qrText}
                                                        onChange={e => setQrText(e.target.value)}
                                                    />
                                                    <Button variant="primary" onClick={addQRCode} className="w-full">
                                                        Generate & Add QR Code
                                                    </Button>
                                                </div>
                                            )}

                                            {mode === 'icon' && (
                                                <div className="space-y-4">
                                                    <label className="text-xs text-slate-400 mb-1 block">Select Icon</label>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {Object.keys(SVG_ICONS).map((iconKey) => (
                                                            <button
                                                                key={iconKey}
                                                                onClick={() => setSelectedIcon(iconKey as any)}
                                                                className={cn(
                                                                    "p-2 rounded border flex items-center justify-center hover:bg-slate-700",
                                                                    selectedIcon === iconKey ? "bg-blue-600 text-white border-blue-400" : "border-slate-600 text-slate-400"
                                                                )}
                                                            >
                                                                {/* Render preview of icon roughly */}
                                                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d={SVG_ICONS[iconKey as keyof typeof SVG_ICONS]} strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            </button>
                                                        ))}
                                                    </div>
                                                    <div className="pt-2">
                                                        <label className="text-xs text-slate-400 mb-1 block">Color</label>
                                                        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-full h-8 rounded cursor-pointer bg-transparent" />
                                                    </div>
                                                </div>
                                            )}

                                            {mode === 'stamp' && (
                                                <div className="space-y-4">
                                                    <label className="text-xs text-slate-400 mb-1 block">Select Stamp</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {STAMPS.map(s => (
                                                            <button
                                                                key={s}
                                                                onClick={() => setSelectedStamp(s)}
                                                                className={cn(
                                                                    "p-2 border rounded text-xs font-bold text-center",
                                                                    selectedStamp === s ? "border-red-500 bg-red-500/10 text-red-500" : "border-slate-600 text-slate-400 hover:border-slate-400"
                                                                )}
                                                            >
                                                                {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {mode === 'form' && (
                                                <div className="space-y-4">
                                                    <label className="text-xs text-slate-400 mb-1 block">Mark Type</label>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setFormTool('check')} className={cn("flex-1 p-3 rounded border flex flex-col items-center", shapeType === 'rectangle' ? "bg-green-500/10 border-green-500 text-green-500" : "border-slate-600 text-slate-400")}>
                                                            <Check className="w-6 h-6 mb-1" />
                                                            <span className="text-xs">Check</span>
                                                        </button>
                                                        <button onClick={() => setFormTool('cross')} className={cn("flex-1 p-3 rounded border flex flex-col items-center", shapeType === 'circle' ? "bg-red-500/10 border-red-500 text-red-500" : "border-slate-600 text-slate-400")}>
                                                            <X className="w-6 h-6 mb-1" />
                                                            <span className="text-xs">Cross</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {mode === 'sign' && (
                                                <div className="space-y-4 text-center">
                                                    <div className="bg-white rounded p-4 h-24 flex items-center justify-center border border-slate-600">
                                                        {savedSignature ? (
                                                            <p className="text-green-600 font-bold text-sm flex items-center gap-2"><Check className="w-4 h-4" /> Signature Ready</p>
                                                        ) : (
                                                            <p className="text-slate-400 text-xs">No signature saved</p>
                                                        )}
                                                    </div>
                                                    <Button variant="outline" size="sm" onClick={() => setIsSigning(true)} className="w-full">
                                                        {savedSignature ? 'Redraw Signature' : 'Draw Signature'}
                                                    </Button>
                                                </div>
                                            )}

                                            {mode === 'image' && (
                                                <div className="p-4 border-2 border-dashed border-slate-600 rounded-lg hover:border-slate-400 transition-colors text-center">
                                                    {uploadedImage ? (
                                                        <div className="relative">
                                                            <img src={uploadedImage} className="max-h-32 mx-auto rounded" />
                                                            <Button size="sm" variant="ghost" className="text-red-400 text-xs mt-2" onClick={() => { setUploadedImage(null); setUploadedImageBytes(null); }}>Remove</Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <input type="file" onChange={handleImageUpload} className="hidden" id="prop-img" accept="image/*" />
                                                            <label htmlFor="prop-img" className="cursor-pointer block text-sm text-slate-400">Click to Upload Image</label>
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {(mode === 'shape' || mode === 'draw') && (
                                                <div className="space-y-4">
                                                    {mode === 'shape' && (
                                                        <div className="flex gap-2 bg-slate-800 p-1 rounded-lg">
                                                            {(['rectangle', 'circle', 'line'] as const).map(s => (
                                                                <button
                                                                    key={s}
                                                                    onClick={() => setShapeType(s)}
                                                                    className={cn(
                                                                        "flex-1 py-1 text-xs rounded capitalize",
                                                                        shapeType === s ? "bg-slate-600 text-white" : "text-slate-400 hover:text-white"
                                                                    )}
                                                                >
                                                                    {s}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {/* ... (Existing color/size controls) */}
                                                    <div>
                                                        <label className="text-xs text-slate-400 mb-1 block">Stroke Color</label>
                                                        <div className="flex gap-2 flex-wrap">
                                                            {['#000000', '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF'].map(c => (
                                                                <button key={c} onClick={() => setColor(c)} className={cn("w-6 h-6 rounded-full border border-slate-600", color === c && "ring-2 ring-white")} style={{ backgroundColor: c }} />
                                                            ))}
                                                            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-6 h-6 p-0 bg-transparent border-none" />
                                                        </div>
                                                    </div>

                                                    {mode === 'shape' && (
                                                        <div>
                                                            <label className="text-xs text-slate-400 mb-1 block">Fill Color</label>
                                                            <div className="flex gap-2 items-center">
                                                                <button onClick={() => setFillColor('')} className={cn("px-2 py-1 text-xs rounded border border-slate-600", !fillColor && "bg-slate-700 text-white")}>
                                                                    None
                                                                </button>
                                                                <input type="color" value={fillColor || '#ffffff'} onChange={e => setFillColor(e.target.value)} className="w-6 h-6 bg-transparent" />
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-xs text-slate-400 mb-1 block">Thickness</label>
                                                            <input type="number" min="1" max="50" value={strokeWidth} onChange={e => setStrokeWidth(Number(e.target.value))} className="w-full bg-slate-800 rounded p-1 text-white border border-slate-600 text-sm" />
                                                        </div>
                                                        <div>
                                                            <label className="text-xs text-slate-400 mb-1 block">Opacity</label>
                                                            <input type="number" min="0.1" max="1" step="0.1" value={opacity} onChange={e => setOpacity(Number(e.target.value))} className="w-full bg-slate-800 rounded p-1 text-white border border-slate-600 text-sm" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Rotation & Alignment Slider (Global for all except draw) */}
                                            {(mode !== 'draw' && mode !== 'sign' && mode !== 'edit-text') && (
                                                <div className="pt-2 border-t border-slate-700 space-y-3">
                                                    <div>
                                                        <label className="text-xs text-slate-400 mb-1 flex items-center gap-2"><RotateCw className="w-3 h-3" /> Rotation: {rotation}°</label>
                                                        <input type="range" min="0" max="360" value={rotation} onChange={e => setRotation(Number(e.target.value))} className="w-full accent-blue-500" />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => alignSelection('center-h')} title="Center Horizontally">
                                                            <AlignHorizontalJustifyCenter className="w-4 h-4 mr-1" /> Center X
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="flex-1 text-xs" onClick={() => alignSelection('center-v')} title="Center Vertically">
                                                            <AlignCenter className="w-4 h-4 mr-1" /> Center Y
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {(mode !== 'draw' && (mode !== 'sign' || savedSignature) && mode !== 'qr' && mode !== 'edit-text') && (
                                                <Button
                                                    onClick={addModification}
                                                    variant="primary"
                                                    className="w-full mt-4"
                                                    icon={<Check className="w-4 h-4" />}
                                                >
                                                    Add Element
                                                </Button>
                                            )}
                                            {mode === 'draw' && (
                                                <div className="text-xs text-slate-400 text-center italic mt-4">
                                                    Use your cursor to draw on the pages.
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-slate-700">
                                            <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase flex justify-between">
                                                <span>Layers</span>
                                                <span className="text-slate-600">{modifications.length} items</span>
                                            </h4>
                                            <div className="space-y-1 max-h-32 overflow-y-auto mb-4 custom-scrollbar">
                                                {modifications.map((mod, i) => (
                                                    <div key={mod.id} className="bg-slate-800 p-2 rounded flex justify-between items-center text-xs group hover:bg-slate-700 transition-colors">
                                                        <div className="flex items-center gap-2 overflow-hidden flex-1">
                                                            <span className="text-blue-400 font-mono">P{mod.pageIndex + 1}</span>
                                                            <span className="truncate text-slate-300 capitalize">
                                                                {mod.text ? `"${mod.text}"` : (mod.svgPath ? 'Icon' : mod.type)}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => duplicateLayer(mod)} title="Duplicate" className="text-slate-400 hover:text-white p-1 hover:bg-slate-600 rounded">
                                                                <Copy className="w-3 h-3" />
                                                            </button>
                                                            <button onClick={() => moveLayer(i, 'up')} title="Move Up" className="text-slate-400 hover:text-white p-1 hover:bg-slate-600 rounded">
                                                                <ArrowUp className="w-3 h-3" />
                                                            </button>
                                                            <button onClick={() => moveLayer(i, 'down')} title="Move Down" className="text-slate-400 hover:text-white p-1 hover:bg-slate-600 rounded">
                                                                <ArrowDown className="w-3 h-3" />
                                                            </button>
                                                            <button onClick={() => removeModification(mod.id)} title="Delete" className="text-slate-400 hover:text-red-400 p-1 hover:bg-slate-600 rounded">
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                )).reverse()}
                                                {modifications.length === 0 && <div className="text-slate-600 text-xs text-center py-2">No edits yet</div>}
                                            </div>
                                        </div>
                                    </GlassCard>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-center mt-8 mb-4">
                            <Button
                                onClick={handleDownload}
                                disabled={modifications.length === 0}
                                variant="primary"
                                loading={processing}
                                className="px-8 py-4 text-lg shadow-xl shadow-blue-500/20 hover:scale-105 transition-transform"
                                icon={<Download className="w-6 h-6 mr-2" />}
                            >
                                Download PDF
                            </Button>
                        </div>
                    </>
                )
            }

            {/* Help / Guide Modal */}
            <div className="mt-12 bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4">How to Use Edit PDF</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-300">
                    <div>
                        <h4 className="font-semibold text-blue-400 mb-2">Editing Text</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Select the <strong>Edit Text</strong> tool (File Icon).</li>
                            <li>Wait for the page to load (blue boxes will appear around text).</li>
                            <li>Click on any text to edit it.</li>
                            <li>The original text is whited out and replaced with a new text box.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-400 mb-2">Adding Elements</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Use the toolbar to add Text, Images, Shapes, or Signatures.</li>
                            <li>Drag to move elements. Resize using the blue handles.</li>
                            <li>Use the <strong>Properties Panel</strong> on the right to customize colors, fonts, and rotation.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-400 mb-2">Forms & Signing</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Use the <strong>Forms</strong> tool to add Checkmarks or Crosses.</li>
                            <li>Use the <strong>Sign</strong> tool to draw and place your signature.</li>
                            <li>Use the <strong>Stamp</strong> tool to add business stamps like &apos;APPROVED&apos;.</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-blue-400 mb-2">Tips</h4>
                        <ul className="list-disc list-inside space-y-1">
                            <li>Use <strong>Rotation</strong> slider to align text angled text.</li>
                            <li>Use <strong>Layers</strong> panel to bring elements to front/back.</li>
                            <li>Undo/Redo (Ctrl+Z/Ctrl+Y) is supported!</li>
                        </ul>
                    </div>
                </div>
            </div>

            <ToolContent toolName="/edit-pdf" />
            <div className="mt-12 mb-8">
                <RelatedTools currentToolHref="/edit-pdf" />
            </div>
        </div >
    );
}
