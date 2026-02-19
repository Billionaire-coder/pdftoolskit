'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, Copy, Cpu, Sparkles, Hash, Languages, Brain, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFDocument } from 'pdf-lib';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { ocrPdfGenerator, OcrOptions } from '@/lib/services/pdf/converters/ocrPdf';
import { downloadFile, getBaseFileName } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { FeatureGate } from '@/components/shared/FeatureGate';

export default function OCRPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [extractedText, setExtractedText] = useState('');
    const [searchablePdfBytes, setSearchablePdfBytes] = useState<Uint8Array | null>(null);
    const [status, setStatus] = useState('Ready');
    const [downloadFileName, setDownloadFileName] = useState('');

    // Settings
    const [languages, setLanguages] = useState<string[]>(['eng']);
    const [adaptiveThreshold, setAdaptiveThreshold] = useState(true);
    const [workerCount, setWorkerCount] = useState(0);

    useEffect(() => {
        if (file) {
            setDownloadFileName(getBaseFileName(file.name));
        }
    }, [file]);

    useEffect(() => {
        // Auto-calculate workers based on hardware
        if (typeof navigator !== 'undefined') {
            setWorkerCount(Math.min(4, navigator.hardwareConcurrency || 2));
        }
    }, []);

    const handleFileSelected = (files: File[]) => {
        const selectedFile = files[0];
        if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
            setFile(selectedFile);
            setExtractedText('');
            setSearchablePdfBytes(null);
            setStatus('Ready');
            toast.success('File uploaded successfully');
        } else {
            toast.error('Please upload a PDF or Image file');
        }
    };

    const handleOCR = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);
        setExtractedText('');
        setSearchablePdfBytes(null);

        try {
            setStatus('Initializing Worker Pool...');

            const options: OcrOptions = {
                languages,
                adaptiveThreshold,
                onProgress: ({ page, total }) => {
                    setProgress(Math.round((page / total) * 100));
                    setStatus(`Processing Page ${page} of ${total}...`);
                }
            };

            const generator = ocrPdfGenerator(file, options);
            const mergedPdf = await PDFDocument.create();
            // let fullText = '';

            for await (const result of generator) {
                // fullText += `--- Page ${result.page} ---\n\n${result.text}\n\n`;
                setExtractedText(prev => prev + `--- Page ${result.page} ---\n\n${result.text}\n\n`);

                if (result.pdfPage) {
                    const pagePdf = await PDFDocument.load(result.pdfPage);
                    const [copiedPage] = await mergedPdf.copyPages(pagePdf, [0]);
                    mergedPdf.addPage(copiedPage);
                }
            }

            const finalPdfBytes = await mergedPdf.save();
            setSearchablePdfBytes(finalPdfBytes);

            setProgress(100);
            setStatus('OCR Complete!');
            toast.success('Text extracted successfully!');
        } catch (error) {
            console.error('OCR Error:', error);
            toast.error('Failed to extract text. Parallel engine failure.');
            setStatus('Error occurred');
        } finally {
            setProcessing(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(extractedText);
        toast.success('Copied to clipboard');
    };

    return (
        <FeatureGate featureName="OCR Text Extraction" blurEffect={true} className="py-12 lg:py-20">
            <div className="container mx-auto px-4 max-w-6xl">
                <ToolHeader
                    toolId="ocrPdf"
                    title="Hyper-Vision OCR Engine"
                    description="Industrial-grade text extraction with parallel neural processing."
                    icon={Brain}
                    color="from-teal-500 to-emerald-600"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {!file && !extractedText && !processing && (
                            <FileUpload
                                onFilesSelected={handleFileSelected}
                                files={[]}
                                onRemoveFile={() => { }}
                                accept={{
                                    'application/pdf': ['.pdf'],
                                    'image/*': ['.png', '.jpg', '.jpeg', '.bmp']
                                }}
                                multiple={false}
                                maxSize={limits.maxFileSize}
                                isPro={isPro}
                            />
                        )}

                        {file && !processing && !extractedText && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <GlassCard className="p-8 text-center border-dashed border-slate-700/50">
                                    <div className="w-20 h-20 bg-teal-500/10 rounded-3xl flex items-center justify-center text-teal-500 mx-auto mb-6">
                                        <Cpu className="w-10 h-10 animate-pulse" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">{file.name}</h3>
                                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                                        Ready for multi-threaded extraction. Parallel workers initialized and idling.
                                    </p>
                                    <div className="flex justify-center gap-4">
                                        <Button variant="secondary" onClick={() => setFile(null)}>Change Document</Button>
                                        <Button
                                            variant="primary"
                                            onClick={handleOCR}
                                            className="bg-teal-600 hover:bg-teal-500 shadow-xl shadow-teal-500/20"
                                            icon={<Sparkles className="w-5 h-5" />}
                                        >
                                            Engage Hyper-Vision
                                        </Button>
                                    </div>
                                </GlassCard>
                            </div>
                        )}

                        {processing && (
                            <div className="p-16 bg-slate-800/20 rounded-[2.5rem] border border-slate-700/50 text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent animate-scan" style={{ top: `${progress}%` }} />
                                <ProgressBar progress={progress} label={status} />
                                <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {Array.from({ length: workerCount }).map((_, i) => (
                                        <div key={i} className="flex flex-col items-center gap-2 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                                            <Cpu className="w-5 h-5 text-teal-500 animate-spin-slow" />
                                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Worker {i + 1}</span>
                                            <span className="text-[9px] text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full">ACTIVE</span>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-600 mt-8 uppercase tracking-[0.2em]">Executing Memory-Safe Stream Pipeline</p>
                            </div>
                        )}

                        {extractedText && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-700">
                                <GlassCard className="p-8">
                                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
                                        <div>
                                            <h3 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                                                <CheckCircle2 className="w-6 h-6 text-teal-500" />
                                                Extraction Data
                                            </h3>
                                            <p className="text-slate-500 text-sm">Processed with {workerCount} neural threads</p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                            <input
                                                type="text"
                                                value={downloadFileName}
                                                onChange={(e) => setDownloadFileName(e.target.value)}
                                                className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-teal-500 text-sm"
                                                placeholder="Filename prefix"
                                            />
                                            <div className="flex gap-2">
                                                <Button variant="secondary" onClick={copyToClipboard} icon={<Copy className="w-4 h-4" />}>Copy</Button>
                                                <Button
                                                    variant="primary"
                                                    onClick={() => downloadFile(new Blob([extractedText], { type: 'text/plain' }), `${downloadFileName}_extracted.txt`)}
                                                    icon={<Download className="w-4 h-4" />}
                                                    className="bg-teal-600 hover:bg-teal-500"
                                                >
                                                    Save .txt
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-950/80 rounded-2xl p-6 h-[600px] overflow-y-auto font-mono text-sm leading-relaxed text-teal-50/70 whitespace-pre-wrap border border-slate-800 shadow-inner">
                                        {extractedText}
                                    </div>

                                    {searchablePdfBytes && (
                                        <div className="mt-8 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                                                    <FileText className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold">Searchable Layer Injected</p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest">Re-composed via PDF-Lib WASM</p>
                                                </div>
                                            </div>
                                            <Button
                                                variant="primary"
                                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                                onClick={() => downloadFile(new Blob([searchablePdfBytes as any], { type: 'application/pdf' }), `${downloadFileName}_searchable.pdf`)}
                                                className="bg-emerald-600 hover:bg-emerald-500 py-6 px-8 text-lg"
                                                icon={<Download className="w-5 h-5" />}
                                            >
                                                Download Searchable PDF
                                            </Button>
                                        </div>
                                    )}
                                </GlassCard>
                                <Button variant="ghost" onClick={() => { setExtractedText(''); setFile(null); }} className="w-full text-slate-500">
                                    Discard Results & Start New
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <GlassCard className="p-6 sticky top-24">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-teal-500" />
                                Vision Settings
                            </h3>

                            <div className="space-y-8">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <Languages className="w-3 h-3" />
                                        Primary Language
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'eng', label: 'English' },
                                            { id: 'spa', label: 'Spanish' },
                                            { id: 'fra', label: 'French' },
                                            { id: 'deu', label: 'German' }
                                        ].map((lang) => (
                                            <button
                                                key={lang.id}
                                                onClick={() => setLanguages(prev =>
                                                    prev.includes(lang.id) ? prev.filter(l => l !== lang.id) : [...prev, lang.id]
                                                )}
                                                className={`px-3 py-3 rounded-xl border text-xs font-medium transition-all ${languages.includes(lang.id)
                                                    ? 'bg-teal-500/10 border-teal-500/50 text-white'
                                                    : 'border-slate-800 text-slate-500 hover:border-slate-600'
                                                    }`}
                                            >
                                                {lang.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-slate-600 mt-3 text-center italic">Select multiples for mixed documents</p>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-slate-800">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-teal-500/10 rounded-lg">
                                                <Hash className="w-4 h-4 text-teal-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white">Adaptive Scan</p>
                                                <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Otsu&apos;s Mean Threshold</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setAdaptiveThreshold(!adaptiveThreshold)}
                                            className={`w-10 h-5 rounded-full transition-colors relative ${adaptiveThreshold ? 'bg-teal-600' : 'bg-slate-700'}`}
                                        >
                                            <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${adaptiveThreshold ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-teal-500/10 rounded-lg">
                                                <Cpu className="w-4 h-4 text-teal-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white">Neural Pooling</p>
                                                <p className="text-[9px] text-slate-500 uppercase tracking-tighter">{workerCount} Parallel Jobs</p>
                                            </div>
                                        </div>
                                        <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(20,184,166,0.8)]" />
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    className="w-full py-6 text-lg bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 shadow-lg shadow-teal-500/10"
                                    onClick={handleOCR}
                                    disabled={!file || processing}
                                    loading={processing}
                                    icon={<Sparkles className="w-5 h-5" />}
                                >
                                    Engage Engine
                                </Button>
                            </div>
                        </GlassCard>

                        <RelatedTools currentToolHref="/ocr-pdf" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                    <QuickGuide steps={toolGuides['/ocr-pdf']} />
                    <ToolContent toolName="/ocr-pdf" />
                </div>
            </div>
        </FeatureGate>
    );
}
