'use client';

import React, { useState } from 'react';
import { GripVertical, Download, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { organizePDF } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile } from '@/lib/utils';
import { PDFGrid } from '@/components/pdf/PDFGrid';
import { PDFThumbnail } from '@/components/pdf/PDFThumbnail';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Component
function SortablePage({ id, index, file, originalPageIndex }: { id: number, index: number, file: File, originalPageIndex: number }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="relative group cursor-grab active:cursor-grabbing touch-none">
            <PDFThumbnail
                file={file}
                pageNumber={originalPageIndex + 1}
                overlayIcon={
                    <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md z-10">
                        {index + 1}
                    </div>
                }
                overlayColor="bg-transparent"
                className="hover:scale-102 transition-transform duration-200"
            />
        </div>
    );
}

export default function OrganizePDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    // Core state: Array of original page indices in their NEW order
    const [pageOrder, setPageOrder] = useState<number[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);

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
                const { PDFDocument } = await import('pdf-lib');
                const doc = await PDFDocument.load(arrayBuffer);
                const count = doc.getPageCount();
                setPageCount(count);
                // Initialize order as 0..N-1
                setPageOrder(Array.from({ length: count }, (_, i) => i));
            } catch (e) {
                console.error("Failed to load PDF", e);
            }
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            setPageOrder((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
        setActiveId(null);
    };

    const handleOrganizePDF = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const organizedPdfBytes = await organizePDF(file, pageOrder);
            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([organizedPdfBytes], { type: 'application/pdf' });
            downloadFile(blob, 'organized.pdf');

            toast.success('PDF pages reorganized!');
            setFile(null);
            setPageOrder([]);
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
            <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 mb-6 shadow-glow">
                    <GripVertical className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold gradient-text mb-4">
                    Organize PDF
                </h1>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                    Drag and drop pages to reorder them instantly.
                </p>
            </div>

            <div className="mb-8 max-w-4xl mx-auto">
                <FileUpload
                    onFilesSelected={handleFileSelected}
                    files={file ? [file] : []}
                    onRemoveFile={() => setFile(null)}
                    multiple={false}
                />
            </div>

            {file && !processing && (
                <div className="space-y-8 select-none">
                    <GlassCard className="p-4 sticky top-24 z-30 flex items-center justify-between backdrop-blur-xl border-blue-500/30">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-500/20 p-2 rounded-lg">
                                <GripVertical className="w-5 h-5 text-blue-400" />
                            </div>
                            <div className="text-white font-semibold">
                                Visual Sorter
                                <span className="text-xs font-normal text-slate-400 ml-2 block sm:inline">({pageOrder.length} Pages)</span>
                            </div>
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleOrganizePDF}
                            loading={processing}
                            icon={<Download className="w-5 h-5" />}
                        >
                            Save Order
                        </Button>
                    </GlassCard>

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={pageOrder} strategy={rectSortingStrategy}>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {pageOrder.map((originalPageIndex, index) => (
                                    <SortablePage
                                        key={originalPageIndex}
                                        id={originalPageIndex}
                                        index={index}
                                        originalPageIndex={originalPageIndex}
                                        file={file}
                                    />
                                ))}
                            </div>
                        </SortableContext>

                        {/* Overlay for smooth dragging visual */}
                        <DragOverlay>
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
