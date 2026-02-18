'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lucide } from '@/lib/lucide-registry';
import { GlassCard } from '@/components/ui/GlassCard';
import { FileUpload } from '@/components/shared/FileUpload';
import { Button } from '@/components/ui/Button';
import { convertImagesToPrintPdf, PrintSize } from '@/lib/services/pdf/print/imageToPrintPdf';
import { downloadFile, formatFileSize } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ProcessingOverlay } from '@/components/shared/ProcessingOverlay';
import { saveToHistory } from '@/lib/history-store';
import { ToolContent } from '@/components/shared/ToolContent';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { toolGuides } from '@/data/guides';
import { useSubscription } from '@/components/providers/SubscriptionProvider';

export default function PrintReadyPdfPage() {
    const { limits, isPro } = useSubscription();
    const { t } = useTranslation('common');
    const [files, setFiles] = useState<File[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dpi, setDpi] = useState(300);
    const [pageSize, setPageSize] = useState<PrintSize>('original');
    const [bleed, setBleed] = useState(false);
    const [cropMarks, setCropMarks] = useState(false);
    const [colorBars, setColorBars] = useState(false);

    const handleFilesSelected = (newFiles: File[]) => {
        const validFiles = newFiles.filter(f => f.type.startsWith('image/'));
        if (validFiles.length > 0) {
            setFiles(prev => [...prev, ...validFiles]);
            toast.success(`Added ${validFiles.length} images`);
        }
    };

    const handleConvert = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        try {
            const fileBuffers = await Promise.all(
                files.map(async (file) => ({
                    buffer: await file.arrayBuffer(),
                    type: file.type,
                }))
            );

            const pdfBuffer = await convertImagesToPrintPdf(fileBuffers, {
                dpi,
                pageSize,
                bleed,
                cropMarks,
                colorBars
            });
            const blob = new Blob([pdfBuffer as unknown as BlobPart], { type: 'application/pdf' });

            const id = crypto.randomUUID();
            await saveToHistory({
                id,
                fileName: `Print_300DPI_${files.length}x_images.pdf`,
                size: blob.size,
                tool: 'Print Ready PDF',
                blob: blob
            });

            downloadFile(blob, `Print_300DPI_${files.length}x_images.pdf`);
            toast.success('Print Ready PDF Created!');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create PDF');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="container mx-auto py-12 px-4 max-w-4xl">
            <ToolHeader
                toolId="printReadyPdf"
                title="Print Ready PDF"
                description="Create high-resolution (300 DPI) PDFs for professional printing."
                icon={Lucide.Printer}
                color="from-pink-500 to-rose-500"
            />

            <GlassCard className="p-8">
                {files.length === 0 ? (
                    <FileUpload
                        onFilesSelected={handleFilesSelected}
                        accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
                        maxSize={50 * 1024 * 1024}
                        multiple={true}
                    />
                ) : (
                    <div className="space-y-8">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center text-white">
                                <h3 className="font-semibold">{files.length} Images Selected</h3>
                                <button onClick={() => setFiles([])} className="text-sm text-red-400 hover:text-red-300">Clear All</button>
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {files.map((f, i) => (
                                    <div key={i} className="flex-shrink-0 w-20 h-20 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center relative overflow-hidden group">
                                        {/* Simple preview or icon */}
                                        <Lucide.Image className="w-8 h-8 text-slate-500" />
                                        <div className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center">
                                            <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} className="text-white"><Lucide.X className="w-6 h-6" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-300">Target DPI</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[72, 150, 300].map((val) => (
                                        <button
                                            key={val}
                                            onClick={() => setDpi(val)}
                                            className={`py-2 px-4 rounded-lg border transition-all ${dpi === val
                                                ? 'bg-pink-500 border-pink-500 text-white shadow-lg'
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                                }`}
                                        >
                                            {val} DPI
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-slate-500">300 DPI is standard for high-quality printing.</p>
                            </div>

                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-slate-300">Layout Mode</label>
                                <select
                                    value={pageSize}
                                    onChange={(e) => setPageSize(e.target.value as PrintSize)}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-3 focus:ring-2 focus:ring-pink-500 outline-none"
                                >
                                    <option value="original">Keep Original Physical Size</option>
                                    <option value="a4">Fit to A4 Page</option>
                                    <option value="letter">Fit to Letter Page</option>
                                </select>
                                <p className="text-xs text-slate-500">
                                    {pageSize === 'original'
                                        ? 'Page dimensions will exactly match the image size at the selected DPI.'
                                        : 'Images will be scaled to fit within the selected page size.'}
                                </p>
                            </div>

                            {/* New Pro Options */}
                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700/50">
                                <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={bleed}
                                        onChange={(e) => setBleed(e.target.checked)}
                                        className="w-5 h-5 rounded border-slate-500 text-pink-500 focus:ring-pink-500 bg-slate-900"
                                    />
                                    <div>
                                        <div className="font-medium text-white text-sm">Add 3mm Bleed</div>
                                        <div className="text-xs text-slate-400">Extends margin for trimming</div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={cropMarks}
                                        onChange={(e) => setCropMarks(e.target.checked)}
                                        className="w-5 h-5 rounded border-slate-500 text-pink-500 focus:ring-pink-500 bg-slate-900"
                                    />
                                    <div>
                                        <div className="font-medium text-white text-sm">Crop Marks</div>
                                        <div className="text-xs text-slate-400">Corner trim guidelines</div>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-700/50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={colorBars}
                                        onChange={(e) => setColorBars(e.target.checked)}
                                        className="w-5 h-5 rounded border-slate-500 text-pink-500 focus:ring-pink-500 bg-slate-900"
                                    />
                                    <div>
                                        <div className="font-medium text-white text-sm">Color Bars</div>
                                        <div className="text-xs text-slate-400">CMYK density check</div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-center pt-4">
                            <Button
                                size="lg"
                                onClick={handleConvert}
                                disabled={isProcessing}
                                className="w-full max-w-sm bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                                icon={<Lucide.Printer className="w-5 h-5" />}
                            >
                                Generate Print PDF
                            </Button>
                        </div>
                    </div>
                )
                }
            </GlassCard >

            <GlassCard className="mt-12 p-6 bg-yellow-500/5 border-yellow-500/20">
                <div className="flex gap-4">
                    <div className="p-3 bg-yellow-500/10 rounded-lg h-fit">
                        <Lucide.Info className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white mb-2">Why 300 DPI?</h3>
                        <p className="text-slate-300 text-sm leading-relaxed">
                            Most screens display at 72-96 DPI (Dots Per Inch). If you print a screen-resolution image,
                            it often looks pixelated or blurry because printers need much more data (300 dots per inch)
                            to create a sharp image. This tool recalculates the PDF dimensions so that your image
                            prints at the exact physical size you intend, with maximum sharpness.
                        </p>
                    </div>
                </div>
            </GlassCard>

            {isProcessing && <ProcessingOverlay status="Optimizing for Print..." progress={50} />}

            <QuickGuide steps={toolGuides['/print-ready-pdf']} />
            <ToolContent toolName="/print-ready-pdf" />
            <RelatedTools currentToolHref="/print-ready-pdf" />
        </div >
    );
}
