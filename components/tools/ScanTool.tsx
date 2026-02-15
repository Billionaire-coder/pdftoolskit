'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Camera, Download, FileText, Trash2, CheckCircle, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { downloadFile } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export function ScanTool() {
    const { t } = useTranslation('common');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [cameraActive, setCameraActive] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setCameraActive(true);
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast.error("Could not access camera. Please check permissions.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setCameraActive(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = canvas.toDataURL('image/jpeg', 0.8);
                setCapturedImages(prev => [...prev, imageData]);
                toast.success("Page captured!");
            }
        }
    };

    const removeImage = (index: number) => {
        setCapturedImages(prev => prev.filter((_, i) => i !== index));
    };

    const generatePDF = async () => {
        if (capturedImages.length === 0) return;
        setProcessing(true);
        setProgress(10);

        try {
            const { PDFDocument } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.create();

            for (let i = 0; i < capturedImages.length; i++) {
                const imgData = capturedImages[i];
                const imgBytes = await fetch(imgData).then(res => res.arrayBuffer());
                const img = await pdfDoc.embedJpg(imgBytes);
                const page = pdfDoc.addPage([img.width, img.height]);
                page.drawImage(img, {
                    x: 0,
                    y: 0,
                    width: img.width,
                    height: img.height,
                });
                setProgress(10 + Math.floor((i + 1) / capturedImages.length * 80));
            }

            const pdfBytes = await pdfDoc.save();
            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            downloadFile(blob, 'scanned_document.pdf');

            setProgress(100);
            toast.success("PDF generated successfully!");
            setCapturedImages([]);
        } catch (err) {
            console.error("Error generating PDF:", err);
            toast.error("Failed to generate PDF");
        } finally {
            setProcessing(false);
            setProgress(0);
        }
    };

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    return (
        <div className="w-full">
            {!cameraActive && capturedImages.length === 0 && (
                <div className="text-center py-10">
                    <Button variant="primary" size="lg" onClick={startCamera} icon={<Camera className="w-6 h-6" />}>
                        Start Scanner
                    </Button>
                    <p className="mt-4 text-xs text-slate-400">Uses your device camera to scan documents locally.</p>
                </div>
            )}

            {cameraActive && (
                <div className="space-y-4 animate-in fade-in duration-500">
                    <div className="relative aspect-[3/4] bg-black rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl mx-auto max-w-sm">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-6 left-0 w-full flex justify-center gap-4 px-4">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={stopCamera}
                                className="bg-slate-900/80 backdrop-blur-md rounded-full w-12 h-12 p-0"
                                icon={<Trash2 className="w-5 h-5 text-red-400" />}
                            />
                            <button
                                onClick={capturePhoto}
                                className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-white/20 backdrop-blur-sm active:scale-90 transition-transform"
                                aria-label="Capture Photo"
                            >
                                <div className="w-12 h-12 rounded-full bg-white shadow-lg" />
                            </button>
                            <div className="w-12 h-12" /> {/* Spacer */}
                        </div>
                    </div>
                </div>
            )}

            {capturedImages.length > 0 && (
                <div className="mt-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-400" />
                            Scanned Pages ({capturedImages.length})
                        </h3>
                        {!cameraActive && (
                            <Button variant="outline" size="sm" onClick={startCamera} icon={<Camera className="w-4 h-4" />}>
                                Add More
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {capturedImages.map((img, idx) => (
                            <div key={idx} className="relative group aspect-[3/4] rounded-lg overflow-hidden border border-white/10 shadow-lg">
                                <Image
                                    src={img}
                                    alt={`Page ${idx + 1}`}
                                    width={800}
                                    height={600}
                                    className="w-full h-full object-cover rounded-lg shadow-2xl"
                                />
                                <button
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent">
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Page {idx + 1}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Button
                        variant="primary"
                        size="lg"
                        onClick={generatePDF}
                        className="w-full py-6 text-xl shadow-emerald-500/20 shadow-xl"
                        loading={processing}
                        icon={<CheckCircle className="w-6 h-6" />}
                    >
                        Create PDF Document
                    </Button>
                </div>
            )}

            {processing && (
                <div className="py-6">
                    <ProgressBar progress={progress} label="Assembling PDF..." />
                </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
