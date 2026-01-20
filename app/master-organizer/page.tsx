'use client';

import React, { useState } from 'react';
import { LayoutGrid, Download, RotateCw, Trash2, GripVertical, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { downloadFile, validatePDFFile } from '@/lib/utils';
import { PDFThumbnail } from '@/components/pdf/PDFThumbnail';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PDFDocument } from 'pdf-lib';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useTranslation } from 'react-i18next';

interface PageItem {
    id: string;
    originalIndex: number;
    rotation: number;
    isDeleted: boolean;
}

function SortablePage({
    item,
    index,
    file,
    onToggleDelete,
    onRotate
}: {
    item: PageItem,
    index: number,
    file: File,
    onToggleDelete: (id: string) => void,
    onRotate: (id: string) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : (item.isDeleted ? 0.3 : 1),
    };

    return (
        <div ref={setNodeRef} style={style} className="relative group touch-none">
            <div className="bg-slate-800 rounded-xl p-2 border border-white/5 overflow-hidden shadow-lg transition-all group-hover:border-blue-500/50">
                <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                    <PDFThumbnail
                        file={file}
                        pageNumber={item.originalIndex + 1}
                        rotation={item.rotation}
                        className="rounded-lg overflow-hidden"
                    />
                </div>

                <div className="mt-2 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-slate-400 font-mono ml-1">#{index + 1} ({item.originalIndex + 1})</span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => onRotate(item.id)}
                            className="p-1.5 rounded-md hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Rotate 90°"
                        >
                            <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => onToggleDelete(item.id)}
                            className={`p-1.5 rounded-md transition-colors ${item.isDeleted ? 'bg-red-500/20 text-red-400' : 'hover:bg-slate-700 text-slate-300'}`}
                            title={item.isDeleted ? "Undo Delete" : "Remove Page"}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MasterOrganizerPage() {
    const { t } = useTranslation('common');
    const [file, setFile] = useState<File | null>(null);
    const [pages, setPages] = useState<PageItem[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
    );

    const handleFileSelected = async (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            try {
                const arrayBuffer = await files[0].arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const count = pdf.getPageCount();
                const initialPages: PageItem[] = Array.from({ length: count }, (_, i) => ({
                    id: `page-${i}`,
                    originalIndex: i,
                    rotation: 0,
                    isDeleted: false
                }));
                setPages(initialPages);
                toast.success('Document loaded for organization');
            } catch (e) {
                toast.error('Failed to load PDF structure');
            }
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const handleDragStart = (event: any) => setActiveId(event.active.id);

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setPages((items) => {
                const oldIndex = items.findIndex(i => i.id === active.id);
                const newIndex = items.findIndex(i => i.id === over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    const toggleDelete = (id: string) => {
        setPages(prev => prev.map(p => p.id === id ? { ...p, isDeleted: !p.isDeleted } : p));
    };

    const rotatePage = (id: string) => {
        setPages(prev => prev.map(p => p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
    };

    const handleSave = async () => {
        if (!file) return;
        const finalPages = pages.filter(p => !p.isDeleted);
        if (finalPages.length === 0) {
            toast.error('Cannot save an empty PDF');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const sourcePdf = await PDFDocument.load(arrayBuffer);
            const newPdf = await PDFDocument.create();

            for (const item of finalPages) {
                const [copiedPage] = await newPdf.copyPages(sourcePdf, [item.originalIndex]);
                if (item.rotation !== 0) {
                    const currentRotation = copiedPage.getRotation().angle;
                    copiedPage.setRotation({ type: 'degrees', angle: (currentRotation + item.rotation) % 360 } as any);
                }
                newPdf.addPage(copiedPage);
            }

            const pdfBytes = await newPdf.save();
            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            downloadFile(blob, `organized_document.pdf`);

            toast.success('PDF updated and saved!');
            setFile(null);
            setPages([]);
        } catch (error) {
            console.error(error);
            toast.error('Failed to process document');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-7xl">
            <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-6 shadow-glow">
                    <LayoutGrid className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold gradient-text mb-4">
                    {t('tools.masterOrganizer')}
                </h1>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                    {t('tools.masterOrganizerDesc')}
                </p>
            </div>

            {!file ? (
                <div className="max-w-2xl mx-auto">
                    <FileUpload onFilesSelected={handleFileSelected} files={[]} multiple={false} />
                </div>
            ) : (
                <div className="space-y-6">
                    <GlassCard className="p-4 sticky top-24 z-30 flex flex-wrap items-center justify-between gap-4 backdrop-blur-xl border-blue-500/20">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-white font-semibold">
                                <GripVertical className="w-5 h-5 text-blue-400" />
                                <span>{pages.filter(p => !p.isDeleted).length} Pages Remaining</span>
                            </div>
                            {pages.some(p => p.isDeleted) && (
                                <span className="text-xs text-rose-400 px-2 py-1 bg-rose-500/10 rounded-full border border-rose-500/20">
                                    {pages.filter(p => p.isDeleted).length} marked for deletion
                                </span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => setFile(null)}>Cancel</Button>
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                loading={processing}
                                icon={<Check className="w-5 h-5" />}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </GlassCard>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {pages.map((item, index) => (
                                    <SortablePage
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        file={file}
                                        onToggleDelete={toggleDelete}
                                        onRotate={rotatePage}
                                    />
                                ))}
                            </div>
                        </SortableContext>

                        <DragOverlay>
                            {activeId && file ? (
                                <div className="opacity-80 scale-105 shadow-2xl">
                                    <PDFThumbnail
                                        file={file}
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

            {processing && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <GlassCard className="w-full max-w-md p-8">
                        <ProgressBar progress={progress} label="Applying changes locally..." />
                    </GlassCard>
                </div>
            )}

            <div className="mt-12">
                <ToolContent toolName="/master-organizer" />
                <RelatedTools currentToolHref="/master-organizer" />
            </div>
        </div>
    );
}
