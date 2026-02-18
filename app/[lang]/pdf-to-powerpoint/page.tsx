'use client';

import React, { useState, useEffect } from 'react';
import { Presentation, Download, LayoutTemplate, Layers, Zap, MousePointer2, Shield, Sparkles, Files, Gauge, Cpu, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { PptxService, PptxOptions } from '@/lib/services/pdf/converters/pdfToPptx';
import { downloadFile, validatePDFFile, cn, formatFileSize } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function PDFToPowerPointPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("Initializing Engine...");

    const [mode, setMode] = useState<'editable' | 'raster'>('editable');

    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            const validation = validatePDFFile(files[0]);
            if (validation.valid) {
                setFile(files[0]);
                setResult(null);
                toast.success('Document analyzed');
            } else {
                toast.error(validation.error || 'Invalid PDF file');
            }
        }
    };

    const handleConvert = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(10);
        setStatusMessage("Analyzing vector layers...");

        try {
            const interval = setInterval(() => {
                setProgress(prev => {
                    const next = prev + (Math.random() * 5);
                    if (next > 30 && next < 60) setStatusMessage("Extracting text blocks...");
                    if (next > 60 && next < 90) setStatusMessage("Assembling OOXML slides...");
                    return next > 95 ? 95 : next;
                });
            }, 500);

            const pptxBytes = await PptxService.convert(file, { mode });

            clearInterval(interval);
            setProgress(100);

            const blob = new Blob([pptxBytes as any], {
                type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            });
            const filename = file.name.replace('.pdf', `.pptx`);

            setResult({ blob, fileName: filename });
            toast.success('Conversion Successful');
        } catch (error) {
            console.error('PPTX Conversion Error:', error);
            toast.error('Synthesis failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            <ToolHeader
                toolId="pdfToPowerpoint"
                title="PDF to PowerPoint"
                description="Advanced Presentation Reconstruction: Transform static PDFs into editable PowerPoint decks."
                icon={Presentation}
                color="from-orange-500 to-amber-600"
            />

            {!file && !result && (
                <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-700">
                    <FileUpload
                        onFilesSelected={handleFileSelected}
                        files={[]}
                        multiple={false}
                        maxSize={limits.maxFileSize}
                        isPro={isPro}
                    />
                </div>
            )}

            {file && !result && !processing && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-up duration-500">
                    <div className="lg:col-span-2 space-y-6">
                        <GlassCard className="p-8 border-orange-500/10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                                        <Files className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold">{file.name}</h3>
                                        <p className="text-xs text-slate-500 uppercase tracking-widest">{formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="text-slate-500">Change</Button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setMode('editable')}
                                    className={cn(
                                        "p-6 rounded-2xl border transition-all text-left relative overflow-hidden group",
                                        mode === 'editable' ? "bg-orange-600 border-orange-500 shadow-lg shadow-orange-600/20" : "bg-slate-900/50 border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <Zap className={cn("w-6 h-6 mb-3", mode === 'editable' ? "text-white" : "text-orange-500")} />
                                    <p className={cn("font-bold text-sm mb-1", mode === 'editable' ? "text-white" : "text-slate-200")}>Editability Focus</p>
                                    <p className={cn("text-[10px] leading-relaxed", mode === 'editable' ? "text-orange-100" : "text-slate-500")}>Reconstructs text as editable boxes and matches aspect ratio.</p>
                                    {mode === 'editable' && <div className="absolute top-2 right-2"><CheckCircle className="w-4 h-4 text-white" /></div>}
                                </button>

                                <button
                                    onClick={() => setMode('raster')}
                                    className={cn(
                                        "p-6 rounded-2xl border transition-all text-left relative overflow-hidden group",
                                        mode === 'raster' ? "bg-slate-700 border-slate-600 shadow-lg shadow-slate-600/20" : "bg-slate-900/50 border-white/5 hover:border-white/10"
                                    )}
                                >
                                    <LayoutTemplate className={cn("w-6 h-6 mb-3", mode === 'raster' ? "text-white" : "text-slate-400")} />
                                    <p className={cn("font-bold text-sm mb-1", mode === 'raster' ? "text-white" : "text-slate-200")}>Visual Fidelity</p>
                                    <p className={cn("text-[10px] leading-relaxed", mode === 'raster' ? "text-slate-100" : "text-slate-500")}>Renders slides as high-res images to preserve perfect branding.</p>
                                    {mode === 'raster' && <div className="absolute top-2 right-2"><CheckCircle className="w-4 h-4 text-white" /></div>}
                                </button>
                            </div>
                        </GlassCard>

                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { icon: Cpu, label: "Vector Logic", val: "Active" },
                                { icon: Gauge, label: "Quality", val: "Lossless" },
                                { icon: Sparkles, label: "AI Layout", val: "Standard" }
                            ].map((stat, i) => (
                                <GlassCard key={i} className="p-4 flex flex-col items-center text-center">
                                    <stat.icon className="w-4 h-4 text-orange-500 mb-2" />
                                    <p className="text-[10px] text-slate-500 uppercase font-black">{stat.label}</p>
                                    <p className="text-xs text-white font-bold">{stat.val}</p>
                                </GlassCard>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <GlassCard className="p-8 border-orange-500/20 bg-orange-500/5 items-center flex flex-col">
                            <Presentation className="w-12 h-12 text-orange-500 mb-6 animate-pulse" />
                            <h4 className="text-xl font-bold text-white mb-2 text-center">Synthesize Presentation</h4>
                            <p className="text-xs text-slate-400 text-center mb-8">Generating structured OOXML data for Microsoft PowerPoint compatibility.</p>
                            <Button
                                variant="primary"
                                onClick={handleConvert}
                                size="lg"
                                className="w-full py-6 bg-orange-600 hover:bg-orange-500 shadow-xl shadow-orange-600/20"
                                icon={<Download className="w-5 h-5" />}
                            >
                                Initiate Conversion
                            </Button>
                        </GlassCard>
                    </div>
                </div>
            )}

            {processing && (
                <div className="max-w-2xl mx-auto py-20 text-center animate-in zoom-in-95 duration-500">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 border-4 border-orange-500/10 rounded-full" />
                        <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <Presentation className="absolute inset-0 m-auto w-8 h-8 text-orange-500 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Reconstructing Decks...</h3>
                    <ProgressBar progress={progress} label={statusMessage} />
                </div>
            )}

            {result && (
                <div className="max-w-2xl mx-auto animate-in scale-in duration-500">
                    <GlassCard className="p-12 text-center border-emerald-500/20">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-emerald-500/20">
                            <Presentation className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-2">PowerPoint Synthesized!</h3>
                        <p className="text-slate-400 mb-10">Your PDF has been successfully reconstructed as an editable presentation.</p>

                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 mb-8 text-left">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Generated Asset</p>
                            <p className="text-white font-mono text-sm truncate">{result.fileName}</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => downloadFile(result.blob, result.fileName)}
                                icon={<Download className="w-6 h-6" />}
                                className="py-8 text-2xl bg-emerald-600 hover:bg-emerald-500 shadow-2xl shadow-emerald-500/20"
                            >
                                Download Presentation
                            </Button>
                            <Button variant="ghost" onClick={() => { setFile(null); setResult(null); }} className="text-slate-500 mt-4 underline underline-offset-4 font-bold uppercase tracking-wider text-[10px]">
                                Convert Another File
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            )}

            <div className="mt-20">
                <QuickGuide steps={toolGuides['/pdf-to-powerpoint']} />
                <ToolContent toolName="/pdf-to-powerpoint" />
                <RelatedTools currentToolHref="/pdf-to-powerpoint" />
            </div>
        </div>
    );
}
