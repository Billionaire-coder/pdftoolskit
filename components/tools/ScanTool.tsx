'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Camera, Download, FileText, Trash2, CheckCircle, Zap, Sun, Eye, Image as ImageIcon, Wand2, Sparkles, Layout } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { downloadFile } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { applyScanFilter, ScanFilter } from '@/lib/services/pdf/scan/scan-utils';
import { imagesToPdf } from '@/lib/services/pdf/converters/scanToPdf';

export function ScanTool() {
    const { t } = useTranslation('common');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImages, setCapturedImages] = useState<string[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [cameraActive, setCameraActive] = useState(false);
    const [torchActive, setTorchActive] = useState(false);
    const [activeFilter, setActiveFilter] = useState<ScanFilter>('original');

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setCameraActive(true);
            toast.success("Ready for scanning");
        } catch (err) {
            console.error("Error accessing camera:", err);
            toast.error("Camera access denied. Check permissions.");
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setCameraActive(false);
        setTorchActive(false);
    }, [stream]);

    const toggleTorch = async () => {
        if (!stream) return;
        const track = stream.getVideoTracks()[0];
        try {
            await track.applyConstraints({
                // @ts-expect-error - advanced constraints
                advanced: [{ torch: !torchActive }]
            });
            setTorchActive(!torchActive);
        } catch (err) {
            toast.error("Flash not supported on this device");
        }
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

                // Apply the selected filter
                if (activeFilter !== 'original') {
                    applyScanFilter(ctx, canvas.width, canvas.height, activeFilter);
                }

                const imageData = canvas.toDataURL('image/jpeg', 0.85);
                setCapturedImages(prev => [...prev, imageData]);
                toast.success(`Page ${capturedImages.length + 1} Captured`);
            }
        }
    };

    const removeImage = (index: number) => {
        setCapturedImages(prev => prev.filter((_, i) => i !== index));
    };

    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleGeneratePDF = async () => {
        if (capturedImages.length === 0) return;
        setProcessing(true);
        setProgress(10);

        try {
            const pdfBytes = await imagesToPdf(capturedImages, { addBranding: true });
            setProgress(90);

            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            setResult({ blob, fileName: `scan_${Date.now()}.pdf` });
            setProgress(100);
            toast.success("Industrial PDF Generated");
            setCapturedImages([]);
            stopCamera();
        } catch (err) {
            console.error("PDF generation failed:", err);
            toast.error("Encryption or memory error");
        } finally {
            setProcessing(false);
        }
    };

    useEffect(() => {
        return () => stopCamera();
    }, [stopCamera]);

    return (
        <div className="w-full">
            {!cameraActive && capturedImages.length === 0 && !result && (
                <div className="text-center py-20 animate-in fade-in zoom-in-95 duration-700">
                    <div className="w-24 h-24 bg-indigo-500/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-indigo-500/20 shadow-2xl">
                        <Camera className="w-12 h-12 text-indigo-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Neural Scanner Activated</h2>
                    <p className="text-slate-400 mb-10 max-w-sm mx-auto">High-resolution capture with real-time perspective correction and document filters.</p>
                    <Button variant="primary" size="lg" onClick={startCamera} className="px-12 py-7 text-xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/30">
                        Initialize Lens
                    </Button>
                </div>
            )}

            {cameraActive && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 animate-in slide-up duration-500">
                    <div className="lg:col-span-2">
                        <div className="relative aspect-[3/4] bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-3xl">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />

                            {/* Scanning HUD Overlay */}
                            <div className="absolute inset-0 pointer-events-none border-[30px] border-black/20">
                                <div className="w-full h-full border border-indigo-500/30 relative">
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-indigo-500" />
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-indigo-500" />
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-indigo-500" />
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-indigo-500" />

                                    {/* Scanning Line Animation */}
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-scan" />
                                </div>
                            </div>

                            {/* Camera Controls */}
                            <div className="absolute bottom-10 left-0 w-full flex justify-center items-center gap-8 px-6">
                                <Button
                                    variant="secondary"
                                    onClick={toggleTorch}
                                    className="rounded-full w-14 h-14 bg-black/40 backdrop-blur-xl border-white/10 group"
                                >
                                    {torchActive ? <Sun className="w-6 h-6 text-yellow-400" /> : <Sun className="w-6 h-6 text-slate-400 opacity-50" />}
                                </Button>

                                <button
                                    onClick={capturePhoto}
                                    className="w-24 h-24 rounded-full border-4 border-white flex items-center justify-center p-1 group active:scale-90 transition-all"
                                >
                                    <div className="w-full h-full rounded-full bg-white group-hover:bg-indigo-50 flex items-center justify-center shadow-2xl">
                                        <Zap className="w-8 h-8 text-indigo-600 fill-indigo-600" />
                                    </div>
                                </button>

                                <Button
                                    variant="secondary"
                                    onClick={stopCamera}
                                    className="rounded-full w-14 h-14 bg-red-500/20 backdrop-blur-xl border-red-500/30"
                                >
                                    <Trash2 className="w-6 h-6 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <GlassCard className="p-6">
                            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
                                <Wand2 className="w-5 h-5 text-indigo-500" />
                                Lens Filters
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'original', icon: ImageIcon, label: 'Raw' },
                                    { id: 'bw', icon: FileText, label: 'Document' },
                                    { id: 'grayscale', icon: Eye, label: 'Archive' },
                                    { id: 'high-contrast', icon: Sparkles, label: 'Scan Pro' }
                                ].map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setActiveFilter(filter.id as ScanFilter)}
                                        className={`p-4 rounded-2xl flex flex-col items-center gap-2 transition-all border ${activeFilter === filter.id
                                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-500'
                                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
                                            }`}
                                    >
                                        <filter.icon className="w-5 h-5" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{filter.label}</span>
                                    </button>
                                ))}
                            </div>
                        </GlassCard>

                        {capturedImages.length > 0 && (
                            <GlassCard className="p-6 border-indigo-500/20">
                                <h3 className="text-white font-bold mb-4 flex items-center justify-between">
                                    Session
                                    <span className="bg-indigo-500 text-white text-[10px] py-1 px-2 rounded-lg">{capturedImages.length} Pages</span>
                                </h3>
                                <div className="grid grid-cols-3 gap-2 mb-6">
                                    {capturedImages.slice(-3).map((img, idx) => (
                                        <div key={idx} className="aspect-[3/4] rounded-lg overflow-hidden border border-white/10 opacity-70">
                                            <Image src={img} alt="Thumb" width={100} height={130} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <Button variant="primary" onClick={handleGeneratePDF} className="w-full py-4 text-sm bg-emerald-600 hover:bg-emerald-500">
                                    Finalize PDF
                                </Button>
                            </GlassCard>
                        )}
                    </div>
                </div>
            )}

            {capturedImages.length > 0 && !cameraActive && !result && (
                <div className="animate-in slide-up duration-500 space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {capturedImages.map((img, idx) => (
                            <div key={idx} className="relative group aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                                <Image src={img} alt={`Page ${idx + 1}`} width={400} height={533} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button onClick={() => removeImage(idx)} className="p-3 bg-red-500 rounded-xl text-white hover:scale-110 transition-transform">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                                <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg">
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Page {idx + 1}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-center gap-4">
                        <Button variant="secondary" onClick={startCamera} icon={<Camera className="w-5 h-5" />} className="px-8">Continue Scanning</Button>
                        <Button variant="primary" onClick={handleGeneratePDF} loading={processing} icon={<CheckCircle className="w-5 h-5" />} className="px-12 bg-emerald-600 hover:bg-emerald-500">Compile {capturedImages.length} Pages</Button>
                    </div>
                </div>
            )}

            {processing && (
                <div className="max-w-md mx-auto py-12 text-center">
                    <ProgressBar progress={progress} label="Neural Page Assembly..." />
                    <div className="flex justify-center gap-4 mt-6">
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">
                            <Layout className="w-3 h-3 text-indigo-500" />
                            Alignment
                        </span>
                        <span className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest animate-pulse delay-150">
                            <Zap className="w-3 h-3 text-indigo-500" />
                            Compression
                        </span>
                    </div>
                </div>
            )}

            {result && (
                <GlassCard className="max-w-xl mx-auto p-12 text-center animate-in zoom-in-95 duration-500">
                    <div className="mx-auto w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 border border-emerald-500/30">
                        <CheckCircle className="w-12 h-12 text-emerald-500" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-4">Document Ready</h3>
                    <p className="text-slate-400 mb-10">Your multi-page scan is processed and optimized for distribution.</p>

                    <div className="flex flex-col gap-4">
                        <input
                            type="text"
                            value={downloadFileName}
                            onChange={(e) => setDownloadFileName(e.target.value)}
                            className="bg-slate-900 border border-slate-700 rounded-2xl px-6 py-5 text-white text-center text-lg focus:outline-none focus:border-indigo-500"
                        />
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                            icon={<Download className="w-6 h-6" />}
                            className="py-8 text-2xl bg-indigo-600 hover:bg-indigo-500 shadow-2xl shadow-indigo-500/20"
                        >
                            Download PDF
                        </Button>
                        <Button variant="ghost" onClick={() => { setResult(null); setCapturedImages([]); }} className="text-slate-500 mt-4">
                            Clear and Restart
                        </Button>
                    </div>
                </GlassCard>
            )}

            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
}
