'use client';

import React, { useState } from 'react';
import { RotateCw, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { rotatePDF } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName } from '@/lib/utils';
import { PDFGrid } from '@/components/pdf/PDFGrid';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';




export default function RotatePDFPage() {
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    // Store rotation per page (index -> degrees)
    // 0 = 0, 1 = 90, 2 = 180, 3 = 270
    const [rotations, setRotations] = useState<Record<number, number>>({});

    const handleFileSelected = async (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            setRotations({});
            toast.success('PDF uploaded successfully');

            try {
                const arrayBuffer = await files[0].arrayBuffer();
                const { PDFDocument } = await import('pdf-lib');
                const doc = await PDFDocument.load(arrayBuffer);
                setPageCount(doc.getPageCount());

                // Initialize rotations based on existing file? 
                // For now start fresh at 0 visual offset relative to current view
            } catch (e) {
                console.error("Failed to load PDF", e);
            }
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const rotatePage = (pageIndex: number) => {
        setRotations(prev => ({
            ...prev,
            [pageIndex]: ((prev[pageIndex] || 0) + 90) % 360
        }));
    };

    const rotateAll = () => {
        setRotations(prev => {
            const next = { ...prev };
            for (let i = 0; i < pageCount; i++) {
                next[i] = ((next[i] || 0) + 90) % 360;
            }
            return next;
        });
    };

    const resetRotation = () => {
        setRotations({});
    };

    const handleRotatePDF = async () => {
        if (!file) return;

        // Check if any actual rotation happened
        const hasChanges = Object.values(rotations).some(r => r !== 0);
        if (!hasChanges) {
            toast('No rotation changes to apply', { icon: 'ℹ️' });
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            // We need a custom rotate function that handles per-page rotation
            // The existing `rotatePDF` helper in `pdf-utils.ts` only does ALL pages.
            // We should use `pdf-lib` directly here or modify the helper.
            // Let's implement it inline for max control since we have mix of rotations.

            const arrayBuffer = await file.arrayBuffer();
            const { PDFDocument, degrees } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.load(arrayBuffer);
            const pages = pdfDoc.getPages();

            pages.forEach((page, index) => {
                const rot = rotations[index] || 0;
                if (rot > 0) {
                    const current = page.getRotation().angle;
                    page.setRotation(degrees((current + rot) % 360));
                }
            });

            const rotatedPdfBytes = await pdfDoc.save();

            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([rotatedPdfBytes], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);
            downloadFile(blob, `${baseName}_rotated.pdf`);

            toast.success(`PDF saved successfully!`);
            setFile(null);
            setRotations({});
            setProgress(0);
        } catch (error) {
            console.error('Error rotating PDF:', error);
            toast.error('Failed to rotate PDF');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 mb-6 shadow-glow">
                    <RotateCw className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold gradient-text mb-4">
                    Rotate PDF
                </h1>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                    Rotate individual pages or the entire document.
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
                <div className="space-y-8">
                    {/* Sticky Toolbar */}
                    <GlassCard className="p-4 sticky top-24 z-30 flex items-center justify-between">
                        <div className="text-white font-semibold flex items-center gap-4">
                            <span className="hidden sm:inline">Rotation Actions</span>
                            <div className="h-6 w-px bg-white/10 hidden sm:block"></div>
                            <Button variant="ghost" size="sm" onClick={rotateAll} icon={<RefreshCw className="w-4 h-4" />}>
                                Rotate All
                            </Button>
                            <Button variant="ghost" size="sm" onClick={resetRotation} className="text-slate-400 hover:text-white">
                                Reset
                            </Button>
                        </div>

                        <Button
                            variant="primary"
                            onClick={handleRotatePDF}
                            loading={processing}
                            icon={<Download className="w-5 h-5" />}
                        >
                            Save Rotated PDF
                        </Button>
                    </GlassCard>

                    <PDFGrid
                        file={file}
                        pageCount={pageCount}
                        rotations={rotations}
                        onPageClick={(idx) => rotatePage(idx)} // Click to rotate
                        onPageRotate={(idx) => rotatePage(idx)} // Or click explicit button
                        customOverlay={(idx) => rotations[idx] ? <div className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">{rotations[idx]}°</div> : null}
                        customOverlayColor={(idx) => rotations[idx] ? "items-start justify-end p-2" : ""}
                    />
                </div>
            )}

            {processing && (
                <div className="mb-8 max-w-xl mx-auto">
                    <ProgressBar progress={progress} label="Rotating PDF..." />
                </div>
            )}


            <QuickGuide steps={toolGuides['/rotate-pdf']} />
            <ToolContent toolName="/rotate-pdf" />
            <RelatedTools currentToolHref="/rotate-pdf" />
        </div>
    );
}
