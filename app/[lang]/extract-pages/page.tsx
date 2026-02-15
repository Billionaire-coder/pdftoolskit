'use client';

import React, { useState } from 'react';
import { Files, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { organizePDF } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function ExtractPagesPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [pageRange, setPageRange] = useState('');

    const handleFileSelected = (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success('PDF uploaded successfully');
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const parsePageRange = (input: string): number[] => {
        const pages = new Set<number>();
        const parts = input.split(',');

        parts.forEach(part => {
            const range = part.trim().split('-');
            if (range.length === 1) {
                const p = parseInt(range[0]);
                if (!isNaN(p) && p > 0) pages.add(p - 1);
            } else if (range.length === 2) {
                const start = parseInt(range[0]);
                const end = parseInt(range[1]);
                if (!isNaN(start) && !isNaN(end) && start > 0 && end >= start) {
                    for (let i = start; i <= end; i++) pages.add(i - 1);
                }
            }
        });

        return Array.from(pages).sort((a, b) => a - b);
    };

    const handleExtractPages = async () => {
        if (!file || !pageRange.trim()) {
            toast.error('Please specify pages to extract');
            return;
        }

        const indices = parsePageRange(pageRange);
        if (indices.length === 0) {
            toast.error('Invalid page range');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            // Reusing organizePDF since it does exactly what we want: creates a new PDF with specific pages
            const newPdfBytes = await organizePDF(file, indices);

            clearInterval(progressInterval);
            setProgress(100);

            const blob = new Blob([newPdfBytes as any], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);
            downloadFile(blob, `${baseName}_extracted.pdf`);

            toast.success('Pages extracted successfully!');
            setFile(null);
            setPageRange('');
            setProgress(0);
        } catch (error) {
            console.error('Error extracting pages:', error);
            toast.error('Failed to extract pages');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="extractPages"
                title="Extract Pages"
                description="Create a new PDF containing only the pages you want"
                icon={Files}
                color="from-purple-500 to-pink-500"
            />

            <div className="mb-8">
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
                <GlassCard className="p-6 mb-8">
                    <label className="block text-white font-semibold mb-3">
                        Pages to Extract (e.g., 1,3-5,8):
                    </label>
                    <input
                        type="text"
                        value={pageRange}
                        onChange={(e) => setPageRange(e.target.value)}
                        placeholder="1, 3-5, 8"
                        className="w-full px-4 py-3 rounded-xl glass text-white placeholder-slate-500 focus-ring"
                    />
                    <p className="text-sm text-slate-400 mt-2">
                        Enter page numbers and/or ranges separated by commas
                    </p>
                </GlassCard>
            )}

            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label="Extracting pages..." />
                </div>
            )}

            {file && (
                <GlassCard className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-white font-semibold">Ready to extract selected pages</p>
                        <Button
                            variant="primary"
                            onClick={handleExtractPages}
                            loading={processing}
                            icon={<Download className="w-5 h-5" />}
                        >
                            Extract Pages
                        </Button>
                    </div>
                </GlassCard>
            )}


            <QuickGuide steps={toolGuides['/extract-pages']} />
            <ToolContent toolName="/extract-pages" />
            <RelatedTools currentToolHref="/extract-pages" />
        </div>
    );
}
