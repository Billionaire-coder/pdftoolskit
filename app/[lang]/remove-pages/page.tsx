'use client';

import React, { useState } from 'react';
import { Trash2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { removePagesFromPDF } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName, cn } from '@/lib/utils';
import { PDFGrid } from '@/components/pdf/PDFGrid';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';




export default function RemovePagesPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    // Storing indices of pages to REMOVE
    const [pagesToRemove, setPagesToRemove] = useState<number[]>([]);

    const handleFileSelected = async (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            setPagesToRemove([]);
            toast.success('PDF uploaded successfully');

            // Get Page Count
            try {
                const arrayBuffer = await files[0].arrayBuffer();
                const { PDFDocument } = await import('pdf-lib');
                const doc = await PDFDocument.load(arrayBuffer);
                setPageCount(doc.getPageCount());
            } catch (e) {
                console.error("Failed to load PDF for count", e);
                toast.error("Could not read PDF page count");
            }
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const togglePageRemoval = (pageIndex: number) => {
        setPagesToRemove(prev =>
            prev.includes(pageIndex)
                ? prev.filter(p => p !== pageIndex)
                : [...prev, pageIndex]
        );
    };

    const handleRemovePages = async () => {
        if (!file || pagesToRemove.length === 0) {
            toast.error('Please select at least one page to remove');
            return;
        }

        if (pagesToRemove.length === pageCount) {
            toast.error('You cannot remove all pages!');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const modifiedPdfBytes = await removePagesFromPDF(file, pagesToRemove);
            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([modifiedPdfBytes], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);
            downloadFile(blob, `${baseName}_modified.pdf`);

            toast.success(`Removed ${pagesToRemove.length} page(s)!`);
            setFile(null);
            setPagesToRemove([]);
            setProgress(0);
        } catch (error) {
            console.error('Error removing pages:', error);
            toast.error('Failed to remove pages');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            <ToolHeader
                toolId="removePages"
                title="Remove Pages"
                description="Click pages to mark them for deletion"
                icon={Trash2}
                color="from-yellow-500 to-orange-500"
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
                <div className="space-y-8">
                    {/* Sticky Toolbar */}
                    <GlassCard className="p-4 sticky top-24 z-30 flex items-center justify-between">
                        <div className="text-white font-semibold">
                            {pagesToRemove.length > 0 ? (
                                <span className="text-red-400">{pagesToRemove.length} page(s) marked for deletion</span>
                            ) : (
                                "Select pages to remove"
                            )}
                        </div>
                        <div className="flex gap-2">
                            {pagesToRemove.length > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setPagesToRemove([])}
                                >
                                    Reset Selection
                                </Button>
                            )}
                            <Button
                                variant="primary"
                                onClick={handleRemovePages}
                                loading={processing}
                                disabled={pagesToRemove.length === 0}
                                icon={<Trash2 className="w-4 h-4" />}
                                className="bg-red-500 hover:bg-red-600 border-none"
                            >
                                Remove Selected
                            </Button>
                        </div>
                    </GlassCard>

                    <PDFGrid
                        file={file}
                        pageCount={pageCount}
                        selectedPages={[]} // We don't use 'selected' style, we use 'overlay' style for deletion
                        onPageClick={togglePageRemoval}
                        customOverlay={(pageIndex) => pagesToRemove.includes(pageIndex) ? <Trash2 className="w-12 h-12 text-red-500" /> : null}
                        customOverlayColor={(pageIndex) => pagesToRemove.includes(pageIndex) ? "bg-red-900/40 backdrop-grayscale" : ""}
                    />
                </div>
            )}

            {processing && (
                <div className="mb-8 max-w-xl mx-auto">
                    <ProgressBar progress={progress} label="Removing pages..." />
                </div>
            )}


            <QuickGuide steps={toolGuides['/remove-pages']} />
            <ToolContent toolName="/remove-pages" />
            <RelatedTools currentToolHref="/remove-pages" />
        </div>
    );
}
