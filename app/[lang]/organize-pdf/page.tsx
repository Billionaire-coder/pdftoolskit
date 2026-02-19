'use client';

import React, { useState, useEffect } from 'react';
import { GripVertical, Download, CheckCircle, X, LayoutDashboard, Info, RotateCw, RotateCcw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { organizePDF } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName, cn } from '@/lib/utils';
// import { PDFGrid } from '@/components/pdf/PDFGrid';
import { PDFThumbnail } from '@/components/pdf/PDFThumbnail';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { useLiveAnnouncer } from '@/components/shared/LiveAnnouncer';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Grid } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

// Sortable Item Component
function SortablePage({ id, index, file, originalPageIndex, selected, onSelect, rotation }: {
    id: number,
    index: number,
    file: File,
    originalPageIndex: number,
    selected: boolean,
    onSelect: (e: React.MouseEvent) => void,
    rotation?: number
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resizeObserverConfig: {} as any
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            onClick={onSelect}
            className={cn(
                "relative group cursor-grab active:cursor-grabbing touch-none transition-all duration-200",
                selected && "scale-95"
            )}
        >
            <PDFThumbnail
                file={file}
                pageNumber={originalPageIndex + 1}
                selected={selected}
                rotation={rotation}
                overlayIcon={
                    <div className={cn(
                        "absolute top-2 left-2 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md z-10 transition-colors",
                        selected ? "bg-cyan-500 text-white" : "bg-slate-800 text-slate-300"
                    )}>
                        {index + 1}
                    </div>
                }
                overlayColor={selected ? "bg-cyan-500/10" : "bg-transparent"}
                className={cn(
                    "hover:scale-102 transition-transform duration-200",
                    selected && "ring-2 ring-cyan-500"
                )}
            />
        </div>
    );
}



// Virtualized Grid Cell Component
function PDFCell({ columnIndex, rowIndex, style, items, onRenderItem, columnCount, metadata }: {
    columnIndex: number,
    rowIndex: number,
    style: React.CSSProperties,
    items: number[],
    onRenderItem: (id: number, index: number, metadata?: { hasLinks: boolean; hasBookmarks: boolean }) => React.ReactNode,
    columnCount: number,
    metadata: Record<number, { hasLinks: boolean; hasBookmarks: boolean }>
}) {
    // eslint-disable-next-line security/detect-object-injection
    const index = rowIndex * columnCount + columnIndex;
    if (index >= items.length) return null;
    // eslint-disable-next-line security/detect-object-injection
    const id = items[index];

    return (
        <div style={{
            ...style,
            padding: '8px',
            display: 'flex',
            justifyContent: 'center'
        }}>
            {/* eslint-disable-next-line security/detect-object-injection */}
            {onRenderItem(id, index, metadata[id])}
        </div>
    );
}

// Virtualized Grid Component
function VirtualizedGrid({ items, onRenderItem, metadata }: {
    items: number[],
    onRenderItem: (id: number, index: number, metadata?: { hasLinks: boolean; hasBookmarks: boolean }) => React.ReactNode,
    metadata: Record<number, { hasLinks: boolean; hasBookmarks: boolean }>
}) {
    return (
        <div style={{ height: '600px', width: '100%' }}>
            <AutoSizer
                renderProp={({ height, width }) => {
                    const h = height || 600;
                    const w = width || 800;
                    const columnCount = Math.floor(w / 200) || 1;
                    const actualColumnWidth = w / columnCount;
                    const rowCount = Math.ceil(items.length / columnCount);

                    return (
                        <Grid
                            columnCount={columnCount}
                            columnWidth={actualColumnWidth}
                            rowCount={rowCount}
                            rowHeight={280}
                            style={{ height: h, width: w }}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            cellComponent={PDFCell as any}
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            cellProps={{ items, onRenderItem, columnCount, metadata } as any}
                        />
                    );
                }}
            />
        </div>
    );
}

export default function OrganizePDFPage() {
    const { limits, isPro } = useSubscription();
    const { announce } = useLiveAnnouncer();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    // Core state: Array of original page indices in their NEW order
    const [pageOrder, setPageOrder] = useState<number[]>([]);
    const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
    const [pageMetadata, setPageMetadata] = useState<Record<number, { hasLinks: boolean; hasBookmarks: boolean }>>({});
    const [selectedPages, setSelectedPages] = useState<number[]>([]); // Array of original page indices
    const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
    const [activeId, setActiveId] = useState<number | null>(null);

    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Require movement before drag starts (prevents accidental clicks)
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleFileSelected = async (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success('PDF uploaded successfully');

            try {
                const arrayBuffer = await files[0].arrayBuffer();
                const { PDFDocument, PDFName } = await import('pdf-lib');
                const doc = await PDFDocument.load(arrayBuffer);
                const count = doc.getPageCount();

                // Structural Scanning
                const metadata: Record<number, { hasLinks: boolean; hasBookmarks: boolean }> = {};
                const hasGlobalOutlines = !!doc.catalog.get(PDFName.of('Outlines'));

                const pages = doc.getPages();
                pages.forEach((page, i) => {
                    const annots = page.node.Annots();
                    const hasLinks = annots ? annots.size() > 0 : false;
                    // eslint-disable-next-line security/detect-object-injection
                    metadata[i] = {
                        hasLinks,
                        hasBookmarks: hasGlobalOutlines // Simplify: if outlines exist, pages are considered part of the structure
                    };
                });

                setPageMetadata(metadata);
                setPageOrder(Array.from({ length: count }, (_, i) => i));
                setPageRotations({});
                setSelectedPages([]);
                setLastClickedIndex(null);
            } catch (e) {
                console.error("Failed to load PDF", e);
            }
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const handlePageClick = (e: React.MouseEvent, pageIdx: number) => {
        const orderIdx = pageOrder.indexOf(pageIdx);

        if (e.shiftKey && lastClickedIndex !== null) {
            const start = Math.min(lastClickedIndex, orderIdx);
            const end = Math.max(lastClickedIndex, orderIdx);
            const range = pageOrder.slice(start, end + 1);
            setSelectedPages(prev => Array.from(new Set([...prev, ...range])));
        } else if (e.ctrlKey || e.metaKey) {
            setSelectedPages(prev =>
                prev.includes(pageIdx) ? prev.filter(p => p !== pageIdx) : [...prev, pageIdx]
            );
        } else {
            setSelectedPages([pageIdx]);
        }
        setLastClickedIndex(orderIdx);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setPageOrder((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);

                // If active item is part of selection, move the whole selection
                if (selectedPages.includes(active.id as number)) {
                    const otherItems = items.filter(item => !selectedPages.includes(item));
                    const selectedItemsInOrder = items.filter(item => selectedPages.includes(item));

                    // Calculate where to insert the selection block
                    const actualNewIndex = newIndex > oldIndex
                        ? items.slice(0, newIndex + 1).filter(item => !selectedPages.includes(item)).length
                        : items.slice(0, newIndex).filter(item => !selectedPages.includes(item)).length;

                    const result = [...otherItems];
                    // eslint-disable-next-line security/detect-object-injection
                    result.splice(actualNewIndex, 0, ...selectedItemsInOrder);
                    announce(`Moved ${selectedPages.length} pages to position ${newIndex + 1}.`);
                    return result;
                }

                // eslint-disable-next-line security/detect-object-injection
                announce(`Moved page ${items[oldIndex] + 1} to position ${newIndex + 1}.`);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    const handleRotate = (direction: 'left' | 'right') => {
        const pagesToRotate = selectedPages.length > 0 ? selectedPages : pageOrder; // If nothing selected, rotate all? No, logical fallback is usually nothing or current page. Let's say selected or nothing.
        if (pagesToRotate.length === 0) return;

        setPageRotations(prev => {
            const next = { ...prev };
            pagesToRotate.forEach(pageIndex => {
                // eslint-disable-next-line security/detect-object-injection
                const current = next[pageIndex] || 0;
                // eslint-disable-next-line security/detect-object-injection
                next[pageIndex] = (current + (direction === 'right' ? 90 : -90)) % 360;
            });
            return next;
        });
        toast.success(`Rotated ${pagesToRotate.length} pages`);
    };

    const handleDelete = () => {
        if (selectedPages.length === 0) return;

        const newOrder = pageOrder.filter(p => !selectedPages.includes(p));
        setPageOrder(newOrder);
        setSelectedPages([]);
        toast.success(`Removed ${selectedPages.length} pages`);
    };

    const handleOrganizePDF = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const config = pageOrder.map(index => ({
                index,
                // eslint-disable-next-line security/detect-object-injection
                rotation: pageRotations[index] || 0
            }));

            const organizedPdfBytes = await organizePDF(file, config);
            clearInterval(progressInterval);
            setProgress(100);

            // eslint-disable-next-line security/detect-object-injection
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([organizedPdfBytes as any], { type: 'application/pdf' });
            // downloadFile(blob, 'organized.pdf');

            const baseName = getBaseFileName(file.name);
            setResult({ blob, fileName: `${baseName}_organized.pdf` });

            toast.success('PDF pages reorganized!');
            setFile(null);
            setPageOrder([]);
            setPageRotations({});
            setProgress(0);
        } catch (error) {
            console.error('Error organizing PDF:', error);
            toast.error('Failed to organize PDF');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            <ToolHeader
                toolId="organizePdf"
                title="Organize PDF"
                description="Drag and drop pages to reorder them instantly."
                icon={GripVertical}
                color="from-cyan-500 to-blue-500"
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

            {file && !processing && !result && (
                <div className="space-y-8 select-none">
                    <div className="flex flex-col gap-4">
                        <GlassCard className="p-4 sticky top-24 z-30 flex items-center justify-between backdrop-blur-xl border-cyan-500/30 shadow-lg shadow-cyan-500/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-cyan-500/20 p-2 rounded-lg">
                                    <LayoutDashboard className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div className="text-white font-semibold flex flex-col">
                                    <span className="text-sm">Document Architect</span>
                                    <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">{pageOrder.length} Pages Loaded</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {selectedPages.length > 0 && (
                                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-cyan-950/50 border border-cyan-500/30 rounded-full animate-in fade-in slide-in-from-right-4">
                                        <span className="text-xs font-bold text-cyan-400">{selectedPages.length} Selected</span>
                                        <div className="w-px h-3 bg-slate-700 mx-1" />
                                        <button
                                            onClick={() => setSelectedPages([])}
                                            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                                        >
                                            <X className="w-3 h-3" /> Clear
                                        </button>
                                    </div>
                                )}

                                <Button
                                    variant="primary"
                                    onClick={handleOrganizePDF}
                                    loading={processing}
                                    icon={<Download className="w-5 h-5" />}
                                    className="bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/20"
                                >
                                    Build Document
                                </Button>
                            </div>
                        </GlassCard>

                        {/* Batch Controls */}
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedPages([...pageOrder])}
                                    className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-white"
                                >
                                    Select All
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const even = pageOrder.filter((_, i) => (i + 1) % 2 === 0);
                                        setSelectedPages(even);
                                    }}
                                    className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-white border-l border-slate-800 rounded-none pl-3"
                                >
                                    Select Evens
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const odd = pageOrder.filter((_, i) => (i + 1) % 2 !== 0);
                                        setSelectedPages(odd);
                                    }}
                                    className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-white border-l border-slate-800 rounded-none pl-3"
                                >
                                    Select Odds
                                </Button>
                            </div>

                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                <span>Shift+Click to range select. Drag selection to reorder.</span>
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Info className="w-3 h-3" />
                                <span>Shift+Click to range select. Drag selection to reorder.</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Toolbar */}
                    <div className="flex justify-center -mt-4 mb-4">
                        <div className="bg-slate-800 p-1 rounded-lg flex gap-1 shadow-lg border border-slate-700">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRotate('left')}
                                disabled={selectedPages.length === 0}
                                title="Rotate Left"
                            >
                                <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRotate('right')}
                                disabled={selectedPages.length === 0}
                                title="Rotate Right"
                            >
                                <RotateCw className="w-4 h-4" />
                            </Button>
                            <div className="w-px bg-slate-700 mx-1" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDelete}
                                disabled={selectedPages.length === 0}
                                className="text-red-400 hover:bg-red-500/10 hover:text-red-400"
                                title="Delete Selected"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={pageOrder} strategy={rectSortingStrategy}>
                            <VirtualizedGrid
                                items={pageOrder}
                                metadata={pageMetadata}
                                onRenderItem={(id: number, index: number, _metadata) => (
                                    <SortablePage
                                        key={id}
                                        id={id}
                                        index={index}
                                        originalPageIndex={id}
                                        file={file}
                                        selected={selectedPages.includes(id)}
                                        onSelect={(e) => handlePageClick(e, id)}
                                        // eslint-disable-next-line security/detect-object-injection
                                        rotation={pageRotations[id] || 0}
                                    />
                                )}
                            />
                        </SortableContext>

                        {/* Overlay for smooth dragging visual */}
                        <DragOverlay
                            className="pointer-events-none"
                            style={{ transition: 'none' }}
                            transition="none"
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            adjustScale={true as any}
                        >
                            {activeId !== null && file ? (
                                <div className="opacity-90 scale-105 cursor-grabbing">
                                    <PDFThumbnail
                                        file={file}
                                        pageNumber={activeId + 1}
                                        className="shadow-2xl border-2 border-blue-500 rounded-lg"
                                        overlayIcon={
                                            <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md z-10">
                                                ?
                                            </div>
                                        }
                                        overlayColor="bg-transparent"
                                    />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            )}

            {result && (
                <div className="mt-8 flex justify-center animate-in zoom-in-95 duration-500">
                    <GlassCard className="p-8 text-center max-w-lg w-full">
                        <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-8 h-8 text-blue-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">PDF Organized!</h3>
                        <div className="flex flex-col gap-4 mt-8">
                            <div className="relative">
                                <label className="absolute -top-2 left-3 bg-slate-900 px-1 text-xs text-blue-400">Filename</label>
                                <input
                                    type="text"
                                    value={downloadFileName}
                                    onChange={(e) => setDownloadFileName(e.target.value)}
                                    className="bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-4 text-white text-base focus:outline-none focus:border-blue-500 w-full text-center"
                                    placeholder="Enter filename"
                                />
                            </div>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                icon={<Download className="w-5 h-5" />}
                                className="w-full py-4 text-lg"
                            >
                                Download Ordered PDF
                            </Button>
                            <Button variant="ghost" onClick={() => setResult(null)} className="text-sm text-slate-400">
                                Organize Another
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {processing && (
                <div className="mb-8 max-w-xl mx-auto">
                    <ProgressBar progress={progress} label="Organizing PDF..." />
                </div>
            )}


            <QuickGuide steps={toolGuides['/organize-pdf']} />
            <ToolContent toolName="/organize-pdf" />
            <RelatedTools currentToolHref="/organize-pdf" />
        </div>
    );
}
