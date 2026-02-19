'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FileImage, Download, GripVertical, X, Layout, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { downloadFile, getBaseFileName } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { imageToPdf, ImageToPdfOptions } from '@/lib/services/pdf/converters/imageToPdf';

interface SortableFile {
    id: string;
    file: File;
    preview: string;
}

function SortableImageItem({ id, item, onRemove }: { id: string, item: SortableFile, onRemove: (id: string) => void }) {
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
        <div
            ref={setNodeRef}
            style={style}
            className="relative group bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700/50 aspect-[3/4] flex flex-col"
        >
            <div
                className="absolute top-2 left-2 z-10 p-1.5 bg-slate-950/80 rounded-md cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                {...attributes}
                {...listeners}
            >
                <GripVertical className="w-4 h-4 text-slate-400" />
            </div>

            <button
                onClick={() => onRemove(id)}
                className="absolute top-2 right-2 z-10 p-1.5 bg-red-500/80 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            >
                <X className="w-4 h-4 text-white" />
            </button>

            <div className="flex-grow flex items-center justify-center p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={item.preview}
                    alt={item.file.name}
                    className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                />
            </div>

            <div className="bg-slate-950/50 p-2 text-[10px] text-slate-400 truncate border-t border-slate-700/30">
                {item.file.name}
            </div>
        </div>
    );
}

export default function JPGtoPDFPage() {
    const { limits, isPro } = useSubscription();
    const [items, setItems] = useState<SortableFile[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    // Settings
    const [layout, setLayout] = useState<'original' | 'a4'>('original');
    const [autoRotate, setAutoRotate] = useState(true);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleFilesSelected = (newFiles: File[]) => {
        const validFiles = newFiles.filter(f =>
            f.type.startsWith('image/') || f.name.toLowerCase().endsWith('.webp')
        );

        if (validFiles.length > 0) {
            const newItems = validFiles.map(file => ({
                id: `${file.name}-${Date.now()}-${Math.random()}`,
                file,
                preview: URL.createObjectURL(file)
            }));
            setItems((prev) => [...prev, ...newItems]);
            toast.success(`Added ${validFiles.length} image(s)`);
        } else {
            toast.error('Please upload image files (JPG, PNG, WebP)');
        }
    };

    const handleRemove = (id: string) => {
        setItems(prev => {
            const item = prev.find(i => i.id === id);
            if (item) URL.revokeObjectURL(item.preview);
            return prev.filter(i => i.id !== id);
        });
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setItems((prev) => {
                const oldIndex = prev.findIndex((i) => i.id === active.id);
                const newIndex = prev.findIndex((i) => i.id === over.id);
                return arrayMove(prev, oldIndex, newIndex);
            });
        }
    };

    const handleConvertToPDF = async () => {
        if (items.length === 0) return;

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 5, 95));
            }, 400);

            const options: ImageToPdfOptions = {
                layout,
                autoRotate,
                margin: layout === 'a4' ? 40 : 0
            };

            const pdfBytes = await imageToPdf(items.map(i => i.file), options);

            clearInterval(progressInterval);
            setProgress(100);

            const baseName = items.length === 1 ? getBaseFileName(items[0].file.name) : 'converted_images';
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });

            setResult({ blob, fileName: `${baseName}.pdf` });
            toast.success('Images converted to PDF!');

            // Cleanup previews
            items.forEach(i => URL.revokeObjectURL(i.preview));
            setItems([]);
            setProgress(0);
        } catch (error) {
            console.error('Error converting images:', error);
            toast.error('Failed to convert images to PDF');
        } finally {
            setProcessing(false);
        }
    };

    const itemIds = useMemo(() => items.map(i => i.id), [items]);

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-5xl">
            <ToolHeader
                toolId="jpgToPdf"
                title="JPG to PDF"
                description="Easily convert multiple images into a professional PDF document."
                icon={FileImage}
                color="from-indigo-500 to-purple-500"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <FileUpload
                        onFilesSelected={handleFilesSelected}
                        files={items.map(i => i.file)}
                        onRemoveFile={() => { }} // Handled by our own grid
                        accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
                        multiple={true}
                        maxSize={limits.maxFileSize}
                        isPro={isPro}
                    />

                    {items.length > 0 && !processing && !result && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <GripVertical className="w-4 h-4 text-slate-500" />
                                    Arrange Images ({items.length})
                                </h3>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Drag to reorder</p>
                            </div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={itemIds}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                        {items.map((item) => (
                                            <SortableImageItem key={item.id} id={item.id} item={item} onRemove={handleRemove} />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}

                    {processing && (
                        <div className="p-8 bg-slate-800/30 rounded-2xl border border-slate-700/50 text-center">
                            <ProgressBar progress={progress} label="Building your PDF..." />
                            <p className="text-xs text-slate-500 mt-4 animate-pulse">Processing assets and optimizing layout...</p>
                        </div>
                    )}

                    {result && (
                        <GlassCard className="p-8 text-center animate-in zoom-in-95 duration-500 border-indigo-500/30 shadow-indigo-500/10">
                            <div className="mx-auto w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6">
                                <FileImage className="w-10 h-10 text-indigo-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">High-Fidelity PDF Ready!</h3>

                            <div className="flex flex-col gap-4 mt-8 max-w-md mx-auto">
                                <input
                                    type="text"
                                    value={downloadFileName}
                                    onChange={(e) => setDownloadFileName(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white text-center focus:outline-none focus:border-indigo-500"
                                    placeholder="Enter filename"
                                />
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                    icon={<Download className="w-5 h-5" />}
                                    className="py-6 text-xl shadow-xl shadow-indigo-500/20"
                                >
                                    Download PDF
                                </Button>
                                <Button variant="ghost" onClick={() => setResult(null)} className="text-slate-400">
                                    Start Fresh
                                </Button>
                            </div>
                        </GlassCard>
                    )}
                </div>

                <div className="space-y-6">
                    <GlassCard className="p-6 sticky top-24">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Layout className="w-5 h-5 text-indigo-500" />
                            Document Settings
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-3">Page Size</label>
                                <div className="grid grid-cols-2 gap-2 bg-slate-900/80 p-1 rounded-xl border border-slate-700/50">
                                    <button
                                        onClick={() => setLayout('original')}
                                        className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${layout === 'original' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                    >
                                        Original Size
                                    </button>
                                    <button
                                        onClick={() => setLayout('a4')}
                                        className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${layout === 'a4' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
                                            }`}
                                    >
                                        Standard A4
                                    </button>
                                </div>
                            </div>

                            {layout === 'a4' && (
                                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-slate-800 rounded-lg">
                                            <RefreshCw className={`w-4 h-4 text-indigo-400 ${autoRotate ? 'animate-spin-slow' : ''}`} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-white">Auto-Rotate</p>
                                            <p className="text-[10px] text-slate-500">Fit landscape photos</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setAutoRotate(!autoRotate)}
                                        className={`w-10 h-5 rounded-full transition-colors relative ${autoRotate ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${autoRotate ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            )}

                            <div className="pt-6 border-t border-slate-700/50">
                                <Button
                                    variant="primary"
                                    className="w-full py-6 text-lg"
                                    onClick={handleConvertToPDF}
                                    disabled={items.length === 0 || processing}
                                    loading={processing}
                                    icon={<Download className="w-5 h-5" />}
                                >
                                    Convert to PDF
                                </Button>
                                <p className="text-[10px] text-slate-500 text-center mt-3 uppercase tracking-tighter">
                                    High-fidelity rendering enabled
                                </p>
                            </div>
                        </div>
                    </GlassCard>

                    <RelatedTools currentToolHref="/jpg-to-pdf" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                <QuickGuide steps={toolGuides['/jpg-to-pdf']} />
                <ToolContent toolName="/jpg-to-pdf" />
            </div>
        </div>
    );
}

