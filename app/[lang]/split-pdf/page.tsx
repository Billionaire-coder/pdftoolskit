'use client';

import React, { useState } from 'react';
import { Scissors, Download, CheckCircle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { downloadFile, validatePDFFile, getBaseFileName } from '@/lib/utils';
import { PDFGrid } from '@/components/pdf/PDFGrid';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
// import { AdSense } from '@/components/shared/AdSense';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';





export default function SplitPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [pageCount, setPageCount] = useState(0);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    // Indices of pages to EXTRACT (1-based for UI matching Grid standard, or 0-based?)
    // PDFGrid uses 1-based page numbers for display, but indices are 0-based.
    // Let's store 1-based "selectedPages" for the Grid component compatibility.
    const [selectedPages, setSelectedPages] = useState<number[]>([]);

    const handleFileSelected = async (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            setSelectedPages([]);
            toast.success('PDF uploaded successfully');

            try {
                const arrayBuffer = await files[0].arrayBuffer();
                const { PDFDocument } = await import('pdf-lib');
                const doc = await PDFDocument.load(arrayBuffer);
                setPageCount(doc.getPageCount());
            } catch (e) {
                console.error("Failed to load PDF", e);
            }
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const togglePageSelection = (pageIndex: number) => {
        // pageIndex is 0-based from Grid click
        const pageNum = pageIndex + 1;
        setSelectedPages(prev =>
            prev.includes(pageNum)
                ? prev.filter(p => p !== pageNum)
                : [...prev, pageNum]
        );
    };

    const selectAll = () => {
        if (selectedPages.length === pageCount) {
            setSelectedPages([]);
        } else {
            setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1));
        }
    };

    const handleSplitPDF = async () => {
        if (!file) return;

        const pagesToProcess = selectedPages.length > 0 ? selectedPages : Array.from({ length: pageCount }, (_, i) => i + 1);

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const arrayBuffer = await file.arrayBuffer();
            const { PDFDocument } = await import('pdf-lib');
            const sourcePdf = await PDFDocument.load(arrayBuffer);

            // We want to save each selected page as a separate PDF
            // OR create a SINGLE PDF with selected pages?
            // "Split PDF" usually implies extracting pages. 
            // If extracting multiple pages into ONE file -> That's "Extract Pages".
            // If extracting multiple pages into MULTIPLE files -> That's "Split".
            // Current existing logic was "Split into individual pages".

            // Let's support "Extract Selected to Separate Files".
            // If they want to merge, they use "Extract Pages" or "Merge".

            const results: { name: string, data: Uint8Array }[] = [];
            const baseName = getBaseFileName(file.name);

            // Sort pages to keep order or process by user selection order? 
            // Usually ascending order.
            const sortedPages = [...pagesToProcess].sort((a, b) => a - b);

            for (const pageNum of sortedPages) {
                const newPdf = await PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageNum - 1]);
                newPdf.addPage(copiedPage);
                const pdfBytes = await newPdf.save();
                results.push({
                    name: `${baseName}_page_${pageNum}.pdf`,
                    data: pdfBytes
                });
            }

            clearInterval(progressInterval);
            setProgress(100);

            // Download files
            // If multiple, maybe ZIP? For now simple sequential download
            if (results.length > 5) {
                toast("Multiple files downloading...", { icon: '📦' });
            }

            results.forEach((res, i) => {
                // @ts-expect-error - Uint8Array is compatible with BlobPart
                const blob = new Blob([res.data], { type: 'application/pdf' });
                // Stagger downloads
                setTimeout(() => downloadFile(blob, res.name), i * 300);
            });

            toast.success(`Extracted ${results.length} pages!`);
            setFile(null);
            setSelectedPages([]);
            setProgress(0);
        } catch (error) {
            console.error('Error splitting PDF:', error);
            toast.error('Failed to split PDF');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            <ToolHeader
                toolId="splitPdf"
                title="Split PDF"
                description="Select specific pages to extract as separate PDF files."
                icon={Scissors}
                color="from-blue-500 to-cyan-500"
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
                    <GlassCard className="p-4 sticky top-24 z-30 flex items-center justify-between">
                        <div className="text-white font-semibold flex gap-2 items-center">
                            <span className={selectedPages.length > 0 ? "text-cyan-400" : "text-slate-400"}>
                                {selectedPages.length > 0 ? `${selectedPages.length} pages selected` : "Select pages"}
                            </span>
                            <div className="h-4 w-px bg-white/10 mx-2"></div>
                            <Button variant="ghost" size="sm" onClick={selectAll}>
                                {selectedPages.length === pageCount ? "Deselect All" : "Select All"}
                            </Button>
                        </div>
                        <Button
                            variant="primary"
                            onClick={handleSplitPDF}
                            loading={processing}
                            icon={<Download className="w-5 h-5" />}
                        >
                            {selectedPages.length > 0 ? "Extract Selected" : "Split All Pages"}
                        </Button>
                    </GlassCard>

                    <PDFGrid
                        file={file}
                        pageCount={pageCount}
                        selectedPages={selectedPages}
                        onPageClick={togglePageSelection}
                        customOverlay={(idx) => selectedPages.includes(idx + 1) ? <CheckCircle className="w-12 h-12 text-green-500 fill-white" /> : null}
                    />
                </div>
            )}

            {processing && (
                <div className="mb-8 max-w-xl mx-auto">
                    <ProgressBar progress={progress} label="Splitting PDF..." />
                </div>
            )}



            {/* <div className="my-12">
                <AdSense slot="split-pdf-bottom" />
            </div> */}

            <QuickGuide steps={toolGuides['/split-pdf']} />
            <ToolContent toolName="/split-pdf" />
            <RelatedTools currentToolHref="/split-pdf" />
        </div>
    );
}
