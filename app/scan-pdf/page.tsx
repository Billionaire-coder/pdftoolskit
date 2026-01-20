'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Download, Trash2, Plus, Image as ImageIcon, X, Repeat } from 'lucide-react';
import Image from 'next/image';
import Webcam from 'react-webcam';
import toast from 'react-hot-toast';
import { PDFDocument } from 'pdf-lib';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { downloadFile } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';

type ScanFilter = 'original' | 'grayscale' | 'b&w' | 'contrast';

export default function ScanPDFPage() {
    const webcamRef = useRef<Webcam>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedImages, setCapturedImages] = useState<{ src: string, filter: ScanFilter }[]>([]);
    const [activeFilter, setActiveFilter] = useState<ScanFilter>('original');
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: "environment"
    };

    const applyFilterToImage = (imageSrc: string, filter: ScanFilter): Promise<string> => {
        return new Promise((resolve) => {
            if (filter === 'original') return resolve(imageSrc);

            const img = new window.Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return resolve(imageSrc);

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i];
                    const g = data[i + 1];
                    const b = data[i + 2];

                    if (filter === 'grayscale' || filter === 'b&w') {
                        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                        if (filter === 'b&w') {
                            const threshold = 128; // Binary threshold
                            const v = gray > threshold ? 255 : 0;
                            data[i] = data[i + 1] = data[i + 2] = v;
                        } else {
                            data[i] = data[i + 1] = data[i + 2] = gray;
                        }
                    } else if (filter === 'contrast') {
                        // Simple contrast enhancement
                        const factor = 1.5;
                        data[i] = Math.min(255, factor * (r - 128) + 128);
                        data[i + 1] = Math.min(255, factor * (g - 128) + 128);
                        data[i + 2] = Math.min(255, factor * (b - 128) + 128);
                    }
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = imageSrc;
        });
    };

    const capture = useCallback(async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            const filteredSrc = await applyFilterToImage(imageSrc, activeFilter);
            setCapturedImages(prev => [...prev, { src: filteredSrc, filter: activeFilter }]);
            toast.success('Page captured!');
        }
    }, [webcamRef, activeFilter]);

    const removeImage = (index: number) => {
        setCapturedImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreatePDF = async () => {
        if (capturedImages.length === 0) {
            toast.error('Capture at least one page');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const pdfDoc = await PDFDocument.create();

            for (const item of capturedImages) {
                // imageSrc is data:image/jpeg;base64,.....
                const base64Data = item.src.split(',')[1];
                const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

                const image = await pdfDoc.embedJpg(imageBytes);
                const page = pdfDoc.addPage([image.width, image.height]);
                page.drawImage(image, {
                    x: 0,
                    y: 0,
                    width: image.width,
                    height: image.height,
                });
            }

            const pdfBytes = await pdfDoc.save();

            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            downloadFile(blob, 'scanned_document.pdf');

            toast.success('PDF created successfully!');
            setCapturedImages([]);
            setIsCameraOpen(false);
            setProgress(0);

        } catch (error) {
            console.error('Error creating PDF:', error);
            toast.error('Failed to create PDF');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-6 shadow-glow">
                    <Camera className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold gradient-text mb-4">
                    Scan to PDF
                </h1>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                    Use your camera to capture documents and save them as PDF
                </p>
            </div>

            {/* Main Action Area */}
            <div className="mb-12">
                {!isCameraOpen && capturedImages.length === 0 && (
                    <div className="flex justify-center">
                        <Button
                            size="lg"
                            variant="primary"
                            onClick={() => setIsCameraOpen(true)}
                            icon={<Camera className="w-6 h-6" />}
                            className="text-lg px-8 py-6"
                        >
                            Start Camera
                        </Button>
                    </div>
                )}

                {/* Camera View */}
                {isCameraOpen && (
                    <GlassCard className="p-4 relative overflow-hidden">
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                            <Webcam
                                audio={false}
                                height={720}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                width={1280}
                                videoConstraints={videoConstraints}
                                className="w-full h-full object-cover"
                            />

                            {/* Filter Selection Overlay */}
                            <div className="absolute top-4 left-4 flex gap-2">
                                {(['original', 'grayscale', 'b&w', 'contrast'] as ScanFilter[]).map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setActiveFilter(f)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md transition-all border ${activeFilter === f
                                                ? 'bg-indigo-500 text-white border-indigo-400'
                                                : 'bg-black/40 text-slate-300 border-white/10 hover:bg-black/60'
                                            }`}
                                    >
                                        {f.toUpperCase()}
                                    </button>
                                ))}
                            </div>

                            {/* Camera Overlay Controls */}
                            <div className="absolute bottom-6 left-0 right-0 flex justify-center items-center gap-6">
                                <button
                                    onClick={() => setIsCameraOpen(false)}
                                    className="p-3 rounded-full bg-red-500/80 hover:bg-red-600 text-white backdrop-blur-sm transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>

                                <button
                                    onClick={capture}
                                    className="p-5 rounded-full bg-white border-4 border-indigo-500 hover:scale-105 transition-all shadow-lg"
                                >
                                    <div className="w-full h-full rounded-full bg-indigo-500" />
                                </button>

                                {capturedImages.length > 0 && (
                                    <button
                                        onClick={() => setIsCameraOpen(false)}
                                        className="p-3 rounded-full bg-green-500/80 hover:bg-green-600 text-white backdrop-blur-sm transition-all"
                                    >
                                        <Download className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <p className="text-center text-slate-400 mt-4 text-sm">
                            Make sure the document is well-lit and visible
                        </p>
                    </GlassCard>
                )}

                {/* Preview Grid */}
                {!isCameraOpen && capturedImages.length > 0 && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Captured Pages ({capturedImages.length})</h3>
                            <Button
                                variant="secondary"
                                onClick={() => setIsCameraOpen(true)}
                                icon={<Plus className="w-4 h-4" />}
                                size="sm"
                            >
                                Add Page
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            <AnimatePresence>
                                {capturedImages.map((img, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.5 }}
                                        className="relative group aspect-[3/4]"
                                    >
                                        <GlassCard className="p-2 h-full flex flex-col">
                                            <div className="relative flex-1 rounded-lg overflow-hidden bg-slate-800">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <Image
                                                    src={img.src}
                                                    alt={`Page ${index + 1}`}
                                                    fill
                                                    className="object-contain"
                                                />
                                                <button
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/50 text-white text-xs backdrop-blur-sm">
                                                    Page {index + 1}
                                                </div>
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {processing && (
                            <ProgressBar progress={progress} label="Generating PDF..." />
                        )}

                        <div className="flex justify-center pt-8">
                            <Button
                                size="lg"
                                variant="primary"
                                onClick={handleCreatePDF}
                                loading={processing}
                                icon={<Download className="w-5 h-5" />}
                                className="w-full md:w-auto md:min-w-[200px]"
                            >
                                Create PDF
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            <QuickGuide steps={toolGuides['/scan-pdf']} />
            <ToolContent toolName="/scan-pdf" />
            <RelatedTools currentToolHref="/scan-pdf" />
        </div>
    );
}
