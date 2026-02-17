'use client';

import React, { useState, useEffect } from 'react';
import { EyeOff, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { addRedaction } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName } from '@/lib/utils';
import { PDFPageViewer } from '@/components/pdf/PDFPageViewer';
import { InteractiveOverlay, SelectionRect } from '@/components/pdf/InteractiveOverlay';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function RedactPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    // Redaction Position
    const [pageIndex, setPageIndex] = useState(1); // Default to Page 1
    const [x, setX] = useState(50);
    const [y, setY] = useState(100); // Visual Y (from top)
    const [width, setWidth] = useState(200);
    const [height, setHeight] = useState(50);

    // Page Dimensions for Coordinate conversion
    const [pageDims, setPageDims] = useState({ width: 0, height: 0 });

    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleFileSelected = (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success('PDF uploaded successfully');
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const handleSelectionChange = (rect: SelectionRect) => {
        setX(rect.x);
        setY(rect.y);
        setWidth(rect.width);
        setHeight(rect.height);
    };

    const handlePageLoad = (w: number, h: number) => {
        setPageDims({ width: w, height: h });
    };

    const handleRedactPDF = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            // Conversion: Visual Top-Left (x, y) -> PDF Bottom-Left (pdfX, pdfY)
            // PDF Y is from bottom.
            // Box start visual Y is `y`. Box ends at `y + height`.
            // In PDF (bottom-up), the "y" (bottom-left) of the rect corresponds to `PageHeight - (y + height)`.
            // BUT wait, pdf-lib drawRectangle {x,y} is bottom-left corner of the rect? Yes.

            const pdfY = pageDims.height > 0
                ? pageDims.height - (y + height)
                : y; // Fallback if no dims (manual entry without view?) logic might be weird, assume user viewed it.

            // If user manually entered coords without viewing, they probably used Top-Left coords expecting standard image editing
            // Or they used PDF coords?
            // "Visual Editor" implies we standardize on Visual Coords for the inputs.

            const newPdfBytes = await addRedaction(file, {
                pageIndex: Math.max(0, pageIndex - 1),
                x: x,
                y: pdfY,
                width: width,
                height: height
            });

            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);

            setResult({ blob, fileName: `${baseName}_redacted.pdf` });

            toast.success('PDF redacted successfully!');
            setFile(null);
            setProgress(0);
        } catch (error) {
            console.error('Error redacting PDF:', error);
            const msg = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Failed to redact PDF: ${msg}`);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            <ToolHeader
                toolId="redactPdf"
                title="Visual Redactor"
                description="Select the area to redact directly on the document"
                icon={EyeOff}
                color="from-gray-800 to-black"
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

            {result && (
                <GlassCard className="p-6 mb-8 text-center animate-in zoom-in-95 duration-500 max-w-md mx-auto">
                    <div className="mx-auto w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4 border border-gray-600">
                        <EyeOff className="w-8 h-8 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Redaction Complete!</h3>

                    <div className="flex justify-center mt-6">
                        <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
                            <input
                                type="text"
                                value={downloadFileName}
                                onChange={(e) => setDownloadFileName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gray-500 w-full flex-grow text-center sm:text-left"
                                placeholder="Filename"
                            />
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                icon={<Download className="w-5 h-5" />}
                                className="w-full sm:w-auto"
                            >
                                Download PDF
                            </Button>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => setResult(null)} className="mt-4 text-sm">
                        Redact Another
                    </Button>
                </GlassCard>
            )}

            {file && !processing && !result && (
                <div className="grid lg:grid-cols-3 gap-8 mb-8 items-start">
                    {/* VISUAL EDITOR - Takes 2/3 space */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between text-white bg-slate-800/50 p-2 rounded-lg px-4">
                            <span>Viewing Page {pageIndex}</span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setPageIndex(Math.max(1, pageIndex - 1))}
                                >Prev</Button>
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
                                scale={1.0} // 1 CSS px = 1 PDF pt
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
                                        selection={{ x, y, width, height }}
                                        onSelectionChange={handleSelectionChange}
                                        label="REDACTION"
                                    />
                                </div>
                            )}
                        </div>
                        <p className="text-center text-sm text-slate-400">
                            Draw a box on the page to set the redaction area.
                        </p>
                    </div>

                    {/* CONTROLS SIDEBAR - Takes 1/3 space */}
                    <div className="lg:col-span-1">
                        <GlassCard className="p-6 sticky top-24">
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-500" /> Redaction Settings
                            </h3>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">Page Number</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={pageIndex}
                                        onChange={(e) => setPageIndex(parseInt(e.target.value) || 1)}
                                        className="w-full px-3 py-2 rounded-lg glass text-white text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">X (px)</label>
                                        <input
                                            type="number"
                                            value={Math.round(x)}
                                            readOnly // Make read-only to encourage visual use? Or allow edit? Allow edit.
                                            onChange={(e) => setX(Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-lg glass text-white text-sm bg-slate-800/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Y (px)</label>
                                        <input
                                            type="number"
                                            value={Math.round(y)}
                                            onChange={(e) => setY(Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-lg glass text-white text-sm bg-slate-800/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Width</label>
                                        <input
                                            type="number"
                                            value={Math.round(width)}
                                            onChange={(e) => setWidth(Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-lg glass text-white text-sm bg-slate-800/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Height</label>
                                        <input
                                            type="number"
                                            value={Math.round(height)}
                                            onChange={(e) => setHeight(Number(e.target.value))}
                                            className="w-full px-3 py-2 rounded-lg glass text-white text-sm bg-slate-800/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleRedactPDF}
                                loading={processing}
                                className="w-full"
                                icon={<Download className="w-5 h-5" />}
                            >
                                Apply Redaction
                            </Button>
                        </GlassCard>
                    </div>
                </div>
            )}
            <QuickGuide steps={toolGuides['/redact-pdf']} />
            <ToolContent toolName="/redact-pdf" />
            <RelatedTools currentToolHref="/redact-pdf" />
        </div>
    );
}
