'use client';

import React, { useState } from 'react';
import { LayoutGrid, RotateCw, Trash2, Check, Plus, X, ListFilter, Wand2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { downloadFile, validatePDFFile, cn } from '@/lib/utils';
import { PDFThumbnail } from '@/components/pdf/PDFThumbnail';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, DragOverlay, DragStartEvent, DragEndEvent, KeyboardSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PDFDocument, degrees } from 'pdf-lib';
import { Grid } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useTranslation } from 'react-i18next';

import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { useLiveAnnouncer } from '@/components/shared/LiveAnnouncer';
import { Modal } from '@/components/ui/Modal';
import { ToolHeader } from '@/components/shared/ToolHeader';

interface PageItem {
    id: string;
    originalIndex: number;
    rotation: number;
    isDeleted: boolean;
    fileId: string;
    originalFileName: string;
    file: File;
}

function SortablePage({
    item,
    index,
    onToggleDelete,
    onRotate,
    selected,
    onSelect
}: {
    item: PageItem,
    index: number,
    onToggleDelete: (id: string) => void,
    onRotate: (id: string, delta: number) => void,
    selected: boolean,
    onSelect: (e: React.MouseEvent) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: item.id,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resizeObserverConfig: {} as any
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : (item.isDeleted ? 0.4 : 1),
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "relative group touch-none transition-all duration-200",
                selected && "scale-95"
            )}
        >
            <div
                onClick={onSelect}
                className={cn(
                    "bg-slate-800/80 backdrop-blur-sm rounded-xl p-2 border overflow-hidden shadow-lg transition-all group-hover:border-blue-500/50",
                    selected ? "border-blue-500 ring-2 ring-blue-500/50" : "border-white/5",
                    item.isDeleted && "grayscale opacity-60"
                )}
            >
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing relative">
                    <PDFThumbnail
                        file={item.file}
                        pageNumber={item.originalIndex + 1}
                        rotation={item.rotation}
                        className="rounded-lg overflow-hidden"
                    />

                    {/* Multi-Doc Source Badge */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        <div className={cn(
                            "rounded-full px-2 py-0.5 text-[8px] font-bold shadow-md z-10 transition-colors bg-slate-900/90 text-slate-300 border border-white/10 max-w-[100px] truncate",
                            selected && "bg-blue-600 text-white"
                        )}>
                            {item.originalFileName}
                        </div>
                        <div className={cn(
                            "w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-bold bg-slate-900/90 text-white border border-white/10",
                            selected && "bg-blue-600 border-blue-400"
                        )}>
                            {index + 1}
                        </div>
                    </div>

                    {item.isDeleted && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center z-10 rounded-lg">
                            <Trash2 className="w-8 h-8 text-red-500 drop-shadow-lg" />
                        </div>
                    )}
                </div>

                <div className="mt-2 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-slate-500 font-mono ml-1">SRC: #{item.originalIndex + 1}</span>
                    <div className="flex gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); onRotate(item.id, 90); }}
                            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleDelete(item.id); }}
                            className={cn(
                                "p-1.5 rounded-md transition-colors",
                                item.isDeleted ? "bg-red-500/20 text-red-400" : "hover:bg-slate-700 text-slate-300"
                            )}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PDFCell({ columnIndex, rowIndex, style, items, onRenderItem, columnCount }: {
    columnIndex: number,
    rowIndex: number,
    style: React.CSSProperties,
    items: PageItem[],
    onRenderItem: (id: string, index: number) => React.ReactNode,
    columnCount: number
}) {
    // eslint-disable-next-line security/detect-object-injection
    const index = rowIndex * columnCount + columnIndex;
    if (index >= items.length) return null;
    // eslint-disable-next-line security/detect-object-injection
    const item = items[index];

    return (
        <div style={{
            ...style,
            padding: '8px',
            display: 'flex',
            justifyContent: 'center'
        }}>
            {onRenderItem(item.id, index)}
        </div>
    );
}

function VirtualizedGrid({ items, onRenderItem }: {
    items: PageItem[],
    onRenderItem: (id: string, index: number) => React.ReactNode
}) {
    return (
        <div style={{ height: '600px', width: '100%' }}>
            <AutoSizer
                renderProp={({ height, width }: { height: number | undefined; width: number | undefined }) => {
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
                            cellProps={{ items, onRenderItem, columnCount } as any}
                        />
                    );
                }}
            />
        </div>
    );
}

export default function MasterOrganizerPage() {
    const { limits, isPro } = useSubscription();
    const { t } = useTranslation('common');
    const { announce } = useLiveAnnouncer();
    const [files, setFiles] = useState<File[]>([]);
    const [pages, setPages] = useState<PageItem[]>([]);
    const [selectedPages, setSelectedPages] = useState<string[]>([]); // Array of page IDs
    const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleFileSelected = async (newFiles: File[]) => {
        const validFiles = newFiles.filter(f => validatePDFFile(f).valid);

        if (validFiles.length === 0) {
            toast.error('No valid PDF files selected');
            return;
        }

        setFiles(prev => [...prev, ...validFiles]);

        for (const fileItem of validFiles) {
            try {
                const arrayBuffer = await fileItem.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const count = pdf.getPageCount();
                const fileId = Math.random().toString(36).substring(7);

                const newPages: PageItem[] = Array.from({ length: count }, (_, i) => ({
                    id: `${fileId}-${i}-${Math.random().toString(36).substring(7)}`,
                    originalIndex: i,
                    rotation: 0,
                    isDeleted: false,
                    fileId,
                    originalFileName: fileItem.name,
                    file: fileItem
                }));

                setPages(prev => [...prev, ...newPages]);
                toast.success(`Loaded ${fileItem.name} (${count} pages)`);
            } catch (e) {
                console.error(e);
                toast.error(`Failed to load ${fileItem.name}`);
            }
        }
    };

    const handlePageClick = (e: React.MouseEvent, pageId: string) => {
        const orderIdx = pages.findIndex(p => p.id === pageId);

        if (e.shiftKey && lastClickedIndex !== null) {
            const start = Math.min(lastClickedIndex, orderIdx);
            const end = Math.max(lastClickedIndex, orderIdx);
            const range = pages.slice(start, end + 1).map(p => p.id);
            setSelectedPages(prev => Array.from(new Set([...prev, ...range])));
        } else if (e.ctrlKey || e.metaKey) {
            setSelectedPages(prev =>
                prev.includes(pageId) ? prev.filter(id => id !== pageId) : [...prev, pageId]
            );
        } else {
            setSelectedPages([pageId]);
        }
        setLastClickedIndex(orderIdx);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const id = String(event.active.id);
        setActiveId(id);
        if (!selectedPages.includes(id)) {
            setSelectedPages([id]);
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setPages((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);

                // Block move logic
                if (selectedPages.includes(active.id as string)) {
                    const otherItems = items.filter(item => !selectedPages.includes(item.id));
                    const selectedItemsInOrder = items.filter(item => selectedPages.includes(item.id));

                    const actualNewIndex = newIndex > oldIndex
                        ? items.slice(0, newIndex + 1).filter(item => !selectedPages.includes(item.id)).length
                        : items.slice(0, newIndex).filter(item => !selectedPages.includes(item.id)).length;

                    const result = [...otherItems];
                    result.splice(actualNewIndex, 0, ...selectedItemsInOrder);
                    announce(`Moved ${selectedPages.length} pages to position ${newIndex + 1}.`);
                    return result;
                }

                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    const toggleDelete = (id: string) => {
        const targetIds = selectedPages.includes(id) ? selectedPages : [id];
        setPages(prev => prev.map(p => targetIds.includes(p.id) ? { ...p, isDeleted: !p.isDeleted } : p));
        if (!selectedPages.includes(id)) setSelectedPages([id]);
    };

    const rotatePage = (id: string, delta: number = 90) => {
        const targetIds = selectedPages.includes(id) ? selectedPages : [id];
        setPages(prev => prev.map(p => targetIds.includes(p.id) ? { ...p, rotation: (p.rotation + delta) % 360 } : p));
        if (!selectedPages.includes(id)) setSelectedPages([id]);
    };

    const handleSave = async () => {
        if (pages.length === 0) return;
        const finalPages = pages.filter(p => !p.isDeleted);
        if (finalPages.length === 0) {
            toast.error('Cannot save an empty PDF');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            const newPdf = await PDFDocument.create();

            // Cache loaded source docs to avoid reloading for every page
            const sourceDocCache: Record<string, PDFDocument> = {};

            let processedCount = 0;
            for (const item of finalPages) {
                if (!sourceDocCache[item.fileId]) {
                    const arrayBuffer = await item.file.arrayBuffer();
                    sourceDocCache[item.fileId] = await PDFDocument.load(arrayBuffer);
                }

                const sourcePdf = sourceDocCache[item.fileId];
                const [copiedPage] = await newPdf.copyPages(sourcePdf, [item.originalIndex]);

                if (item.rotation !== 0) {
                    const currentRotation = copiedPage.getRotation().angle;
                    copiedPage.setRotation(degrees((currentRotation + item.rotation) % 360));
                }

                newPdf.addPage(copiedPage);
                processedCount++;
                setProgress(Math.round((processedCount / finalPages.length) * 100));
            }

            const pdfBytes = await newPdf.save();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });

            const fileName = files.length === 1
                ? `organized_${files[0].name}`
                : `combined_document_${new Date().getTime()}.pdf`;

            downloadFile(blob, fileName);

            toast.success('PDF processed and saved!');
            setFiles([]);
            setPages([]);
            setSelectedPages([]);
        } catch (error) {
            console.error(error);
            toast.error('Failed to process document');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-7xl">
            <ToolHeader
                toolId="masterOrganizer"
                title={t('tools.masterOrganizer')}
                description={t('tools.masterOrganizerDesc')}
                icon={LayoutGrid}
                color="from-blue-500 to-indigo-600"
            />

            {pages.length === 0 ? (
                <div className="max-w-2xl mx-auto">
                    <FileUpload
                        onFilesSelected={handleFileSelected}
                        files={[]}
                        multiple={true}
                        maxSize={limits.maxFileSize}
                        isPro={isPro}
                    />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Master Document Studio HUD */}
                    <div className="flex flex-col gap-4">
                        <GlassCard className="p-4 sticky top-24 z-30 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl border-blue-500/30 shadow-lg shadow-blue-500/10">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-500/20 p-2 rounded-lg">
                                    <ListFilter className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="text-white font-semibold flex flex-col">
                                    <span className="text-sm">Document Studio</span>
                                    <span className="text-[10px] font-normal text-slate-400 uppercase tracking-wider">
                                        {pages.filter(p => !p.isDeleted).length} Pages | {files.length} Docs
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {selectedPages.length > 0 && (
                                    <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-950/50 border border-blue-500/30 rounded-full animate-in fade-in slide-in-from-right-4">
                                        <span className="text-xs font-bold text-blue-400">{selectedPages.length} Selected</span>
                                        <div className="w-px h-3 bg-slate-700 mx-1" />
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => rotatePage(selectedPages[0], 90)}
                                                className="p-1 hover:text-white text-slate-400 transition-colors"
                                                title="Rotate Selection"
                                            >
                                                <RotateCw className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => toggleDelete(selectedPages[0])}
                                                className="p-1 hover:text-white text-slate-400 transition-colors"
                                                title="Delete Selection"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <div className="w-px h-3 bg-slate-700 mx-1" />
                                        <button
                                            onClick={() => setSelectedPages([])}
                                            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="hidden sm:flex border-white/5"
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.multiple = true;
                                            input.accept = 'application/pdf';
                                            input.onchange = (e) => {
                                                const target = e.target as HTMLInputElement;
                                                if (target.files) handleFileSelected(Array.from(target.files));
                                            };
                                            input.click();
                                        }}
                                        icon={<Plus className="w-4 h-4" />}
                                    >
                                        Add Docs
                                    </Button>
                                    <Button
                                        variant="primary"
                                        onClick={handleSave}
                                        loading={processing}
                                        icon={<Check className="w-5 h-5" />}
                                        className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                    >
                                        Export Studio
                                    </Button>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Batch Controls */}
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedPages(pages.map(p => p.id))}
                                    className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-white"
                                >
                                    Select All
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        const even = pages.filter((_, i) => (i + 1) % 2 === 0).map(p => p.id);
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
                                        const odd = pages.filter((_, i) => (i + 1) % 2 !== 0).map(p => p.id);
                                        setSelectedPages(odd);
                                    }}
                                    className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-white border-l border-slate-800 rounded-none pl-3"
                                >
                                    Select Odds
                                </Button>

                                <div className="w-px h-4 bg-slate-800 mx-2" />

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toast.success('Scanning for blank pages... (AI Prototype)')}
                                    icon={<Wand2 className="w-3.5 h-3.5 text-blue-400" />}
                                    className="text-[10px] uppercase tracking-widest text-blue-400 hover:text-blue-300"
                                >
                                    Scan for Blanks
                                </Button>
                            </div>

                            <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-500">
                                <Info className="w-3 h-3 text-blue-500" />
                                <span>Shift+Click to range select. Drag selection to reorder documents.</span>
                            </div>
                        </div>
                    </div>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                            <VirtualizedGrid
                                items={pages}
                                onRenderItem={(id, index) => {
                                    const item = pages.find(p => p.id === id)!;
                                    return (
                                        <SortablePage
                                            key={id}
                                            item={item}
                                            index={index}
                                            selected={selectedPages.includes(id)}
                                            onToggleDelete={toggleDelete}
                                            onRotate={rotatePage}
                                            onSelect={(e) => handlePageClick(e, id)}
                                        />
                                    );
                                }}
                            />
                        </SortableContext>

                        <DragOverlay
                            className="pointer-events-none"
                            style={{ transition: 'none' }}
                            transition="none"
                            adjustScale={true}
                        >
                            {activeId ? (
                                <div className="opacity-80 scale-105 shadow-2xl">
                                    <PDFThumbnail
                                        file={pages.find(p => p.id === activeId)!.file}
                                        pageNumber={pages.find(p => p.id === activeId)!.originalIndex + 1}
                                        rotation={pages.find(p => p.id === activeId)!.rotation}
                                        className="rounded-lg ring-2 ring-blue-500"
                                    />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>
            )}

            <Modal
                isOpen={processing}
                onClose={() => { }} // Block closing during processing
                title="Processing Global Workspace"
                description="Collating multiple documents and applying transformations..."
                className="max-w-md"
            >
                <div className="py-4">
                    <ProgressBar progress={progress} label="Applying Batch Actions..." />
                </div>
            </Modal>

            <div className="mt-12">
                <ToolContent toolName="/master-organizer" />
                <RelatedTools currentToolHref="/master-organizer" />
            </div>
        </div>
    );
}
