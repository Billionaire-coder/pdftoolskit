'use client';

import React, { useState } from 'react';
import { FileImage, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { downloadFile } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
// import { AdSense } from '@/components/shared/AdSense';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';




export default function JPGtoPDFPage() {
    const { limits, isPro } = useSubscription();
    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleFilesSelected = (newFiles: File[]) => {
        const imageFiles = newFiles.filter(f => f.type.startsWith('image/'));
        if (imageFiles.length > 0) {
            setFiles((prev) => [...prev, ...imageFiles]);
            toast.success(`Added ${imageFiles.length} image(s)`);
        } else {
            toast.error('Please upload image files');
        }
    };

    const handleConvertToPDF = async () => {
        if (files.length === 0) {
            toast.error('Please upload at least one image');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const { PDFDocument } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.create();

            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                let image;

                if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                    image = await pdfDoc.embedJpg(arrayBuffer);
                } else if (file.type === 'image/png') {
                    image = await pdfDoc.embedPng(arrayBuffer);
                } else {
                    continue;
                }

                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
            }

            const pdfBytes = await pdfDoc.save();
            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            downloadFile(blob, 'images.pdf');

            toast.success('Images converted to PDF!');
            setFiles([]);
            setProgress(0);
        } catch (error) {
            console.error('Error converting images:', error);
            toast.error('Failed to convert images to PDF');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="jpgToPdf"
                title="JPG to PDF"
                description="Create a PDF document from multiple images"
                icon={FileImage}
                color="from-indigo-500 to-purple-500"
            />

            <div className="mb-8">
                <FileUpload
                    onFilesSelected={handleFilesSelected}
                    files={files}
                    onRemoveFile={(i) => setFiles(files.filter((_, idx) => idx !== i))}
                    accept={{ 'image/*': ['.jpg', '.jpeg', '.png'] }}
                    multiple={true}
                    maxSize={limits.maxFileSize}
                    isPro={isPro}
                />
            </div>

            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label="Creating PDF..." />
                </div>
            )}

            {files.length > 0 && (
                <GlassCard className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-white font-semibold">{files.length} image(s) ready to convert</p>
                        <Button
                            variant="primary"
                            onClick={handleConvertToPDF}
                            loading={processing}
                            icon={<Download className="w-5 h-5" />}
                        >
                            Create PDF
                        </Button>
                    </div>
                </GlassCard>
            )}



            {/* <div className="my-12">
                <AdSense slot="jpg-to-pdf-bottom" />
            </div> */}

            <QuickGuide steps={toolGuides['/jpg-to-pdf']} />
            <ToolContent toolName="/jpg-to-pdf" />
            <RelatedTools currentToolHref="/jpg-to-pdf" />
        </div>
    );
}
