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
import { AdSense } from '@/components/shared/AdSense';




export default function JPGtoPDFPage() {
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
            <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 mb-6 shadow-glow">
                    <FileImage className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold gradient-text mb-4">
                    JPG to PDF
                </h1>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                    Create a PDF document from multiple images
                </p>
            </div>

            <div className="mb-8">
                <FileUpload
                    onFilesSelected={handleFilesSelected}
                    files={files}
                    onRemoveFile={(i) => setFiles(files.filter((_, idx) => idx !== i))}
                    accept={{ 'image/*': ['.jpg', '.jpeg', '.png'] }}
                    multiple={true}
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



            <div className="my-12">
                <AdSense slot="jpg-to-pdf-bottom" />
            </div>

            <QuickGuide steps={toolGuides['/jpg-to-pdf']} />
            <ToolContent toolName="/jpg-to-pdf" />
            <RelatedTools currentToolHref="/jpg-to-pdf" />
        </div>
    );
}
