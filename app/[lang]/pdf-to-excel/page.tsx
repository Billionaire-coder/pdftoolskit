'use client';

import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Table, Layers, Hash, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { pdfToExcel, PdfToExcelOptions } from '@/lib/services/pdf/converters/pdfToExcel';
import { downloadFile, getBaseFileName } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function PDFToExcelPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    // Settings
    const [mergePages, setMergePages] = useState(true);
    const [detectNumbers, setDetectNumbers] = useState(true);

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            toast.success('PDF document uploaded');
        }
    };

    const handleConvertToExcel = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 5, 95));
            }, 600);

            const options: PdfToExcelOptions = {
                mergePages,
                detectNumbers
            };

            const excelBytes = await pdfToExcel(file, options);
            clearInterval(progressInterval);
            setProgress(100);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([excelBytes as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const filename = getBaseFileName(file.name) + '.xlsx';

            setResult({ blob, fileName: filename });
            toast.success('Data extracted to Excel!');
            setFile(null);
            setProgress(0);
        } catch (error) {
            console.error('Error extracting data:', error);
            toast.error('Failed to extract tables from PDF');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-5xl">
            <ToolHeader
                toolId="pdfToExcel"
                title="PDF to Excel Intelligent Extract"
                description="Recover structured tables and financial data from PDFs with geometric precision."
                icon={FileSpreadsheet}
                color="from-teal-500 to-green-600"
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {!file && !result && (
                        <FileUpload
                            onFilesSelected={handleFileSelected}
                            files={[]}
                            onRemoveFile={() => { }}
                            multiple={false}
                            maxSize={limits.maxFileSize}
                            isPro={isPro}
                            accept={{ 'application/pdf': ['.pdf'] }}
                        />
                    )}

                    {file && !processing && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <GlassCard className="p-8 border-dashed border-slate-700/50 flex flex-col items-center text-center">
                                <div className="w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-500 mb-4">
                                    <FileSpreadsheet className="w-8 h-8" />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-1">{file.name}</h3>
                                <p className="text-slate-500 text-sm mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready for geometric extraction</p>
                                <div className="flex gap-3">
                                    <Button variant="secondary" onClick={() => setFile(null)}>Change File</Button>
                                    <Button variant="primary" onClick={handleConvertToExcel} className="bg-teal-600 hover:bg-teal-500">Extract Data</Button>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {processing && (
                        <div className="p-12 bg-slate-800/30 rounded-3xl border border-slate-700/50 text-center">
                            <ProgressBar progress={progress} label="Detecting Tables & Aligning Columns..." />
                            <div className="flex justify-center gap-4 mt-8">
                                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">
                                    <Sparkles className="w-3 h-3 text-teal-500" />
                                    Geo-Spatial Analysis
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-widest animate-pulse delay-75">
                                    <Hash className="w-3 h-3 text-teal-500" />
                                    Data Casting
                                </span>
                            </div>
                        </div>
                    )}

                    {result && (
                        <GlassCard className="p-10 text-center animate-in zoom-in-95 duration-500 border-teal-500/30 shadow-teal-500/10">
                            <div className="mx-auto w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mb-6">
                                <Table className="w-10 h-10 text-teal-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Extraction Complete!</h3>
                            <p className="text-slate-400 mb-8 max-w-sm mx-auto">Your spreadsheet has been optimized for financial analysis and calculations.</p>

                            <div className="flex flex-col gap-4 max-w-md mx-auto">
                                <input
                                    type="text"
                                    value={downloadFileName}
                                    onChange={(e) => setDownloadFileName(e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-4 text-white text-center focus:outline-none focus:border-teal-500"
                                    placeholder="Enter filename"
                                />
                                <Button
                                    variant="primary"
                                    size="lg"
                                    onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                    icon={<Download className="w-5 h-5" />}
                                    className="py-6 text-xl shadow-xl shadow-teal-500/20 bg-teal-600 hover:bg-teal-500"
                                >
                                    Download XLSX
                                </Button>
                                <Button variant="ghost" onClick={() => setResult(null)} className="text-slate-500">
                                    Extract More Data
                                </Button>
                            </div>
                        </GlassCard>
                    )}
                </div>

                <div className="space-y-6">
                    <GlassCard className="p-6 sticky top-24">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-teal-500" />
                            Extraction Logic
                        </h3>

                        <div className="space-y-6">
                            <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-700/30">
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Structure Mode</label>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setMergePages(true)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${mergePages ? 'border-teal-500/50 bg-teal-500/10 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        <span className="text-sm">Consolidate All Pages</span>
                                        {mergePages && <div className="w-2 h-2 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.8)]" />}
                                    </button>
                                    <button
                                        onClick={() => setMergePages(false)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${!mergePages ? 'border-teal-500/50 bg-teal-500/10 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                    >
                                        <span className="text-sm">One Sheet per Page</span>
                                        {!mergePages && <div className="w-2 h-2 bg-teal-500 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.8)]" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-700/30">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-teal-500/10 rounded-lg">
                                        <Hash className="w-4 h-4 text-teal-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-white">Detect Numbers</p>
                                        <p className="text-[10px] text-slate-500">Enable calculations</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setDetectNumbers(!detectNumbers)}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${detectNumbers ? 'bg-teal-600' : 'bg-slate-700'}`}
                                >
                                    <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${detectNumbers ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                            </div>

                            <div className="bg-teal-500/5 p-4 rounded-xl border border-teal-500/20">
                                <p className="text-[10px] text-teal-400 leading-relaxed uppercase tracking-tight">
                                    <Sparkles className="w-3 h-3 inline mr-1" />
                                    Using X-Coordinate Clustering for consistent column alignment.
                                </p>
                            </div>
                        </div>
                    </GlassCard>

                    <RelatedTools currentToolHref="/pdf-to-excel" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                <QuickGuide steps={toolGuides['/pdf-to-excel']} />
                <ToolContent toolName="/pdf-to-excel" />
            </div>
        </div>
    );
}
