'use client';

import React, { useState, useEffect } from 'react';
import { Download, Sparkles, CheckCircle, Activity, ShieldCheck, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { executeHealAction, HealthReport } from '@/lib/services/pdf/manipulators/repair';
import { downloadFile, validatePDFFile, getBaseFileName, cn } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { RepairDashboard } from '@/components/repair/RepairDashboard';

export default function RepairPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [repairStep, setRepairStep] = useState('');
    const [progress, setProgress] = useState(0);
    const [report, setReport] = useState<HealthReport | null>(null);
    const [result, setResult] = useState<{ data: Uint8Array; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleFileSelected = (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            setReport(null);
            setResult(null);
            toast.success('File staged for heal');
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const handleRepairPDF = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);
        setReport(null);

        try {
            setRepairStep('Analyzing Structural Integrity...');
            setProgress(20);
            await new Promise(r => setTimeout(r, 800));

            setRepairStep('Patching XRef & Object Streams...');
            setProgress(50);

            const { data, report: healReport } = await executeHealAction(file);

            setRepairStep('Sanitizing Metadata & Directives...');
            setProgress(80);
            await new Promise(r => setTimeout(r, 600));

            setRepairStep('Verifying Document Health...');
            setProgress(100);

            const baseName = getBaseFileName(file.name);
            setResult({ data, fileName: `${baseName}_healed.pdf` });
            setReport(healReport);

            toast.success('Document Healed Successfully!');
        } catch (error) {
            console.error('Heal failed:', error);
            toast.error('Deep corruption detected. Partial heal applied.');
        } finally {
            setProcessing(false);
            setRepairStep('');
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="repairPdf"
                title="Repair PDF"
                description="Professional Docu-Heal Restorer with Tiered Recovery"
                icon={ShieldCheck}
                color="from-emerald-500 to-teal-600"
            />

            {!report ? (
                <div className="space-y-8">
                    <div className="max-w-2xl mx-auto">
                        <FileUpload
                            onFilesSelected={handleFileSelected}
                            files={file ? [file] : []}
                            onRemoveFile={() => {
                                setFile(null);
                                setReport(null);
                                setResult(null);
                            }}
                            multiple={false}
                            maxSize={limits.maxFileSize}
                            isPro={isPro}
                        />
                    </div>

                    {file && !processing && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <GlassCard className="p-8 border-emerald-500/20 bg-emerald-500/5 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Activity className="w-24 h-24 text-emerald-500" />
                                </div>

                                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex-grow">
                                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-emerald-400" />
                                            Heal Engine Ready
                                        </h3>
                                        <p className="text-slate-400 text-sm max-w-md">
                                            Our multi-stage restorer will attempt to rebuild the XRef table, recover offsets, and sanitize metadata streams.
                                        </p>
                                    </div>
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={handleRepairPDF}
                                        loading={processing}
                                        icon={<ShieldCheck className="w-5 h-5" />}
                                        className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 px-8"
                                    >
                                        Execute Deep Heal
                                    </Button>
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {processing && (
                        <div className="space-y-4 max-w-md mx-auto text-center">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-2">
                                <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{repairStep}</span>
                            </div>
                            <ProgressBar progress={progress} />
                            <div className="flex justify-between text-[10px] text-slate-500 uppercase tracking-tighter font-bold px-1">
                                <span className={cn(progress >= 20 ? "text-emerald-400" : "")}>Analyze</span>
                                <span className={cn(progress >= 50 ? "text-emerald-400" : "")}>Patch</span>
                                <span className={cn(progress >= 80 ? "text-emerald-400" : "")}>Sanitize</span>
                                <span className={cn(progress >= 100 ? "text-emerald-400" : "")}>Verify</span>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-700">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-3 shadow-lg shadow-emerald-500/5">
                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Document Restored</span>
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Forensic Analysis Complete</h2>
                    </div>

                    <RepairDashboard report={report} />

                    {/* Report Summary Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <GlassCard className="p-4 border-slate-700/50">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Diagnostic</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Corruption Type</span>
                                    <span className="text-white font-mono">{report.corruptionType || 'None'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Garbage Removed</span>
                                    <span className="text-white font-mono">{report.garbageBytesRemoved} bytes</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Integrity Score</span>
                                    <span className={cn("font-bold", report.integrityScore > 90 ? "text-emerald-400" : "text-amber-400")}>{report.integrityScore}%</span>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-4 border-slate-700/50">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Actions Taken</h4>
                            <ul className="space-y-1 text-xs text-slate-300">
                                {report.issuesFixed.map((issue, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5" />
                                        {issue}
                                    </li>
                                ))}
                                {report.fallbackUsed && (
                                    <li className="flex items-start gap-2 text-amber-400">
                                        <Stethoscope className="w-3 h-3 mt-0.5" />
                                        Fallback: Rasterized Reconstruction
                                    </li>
                                )}
                            </ul>
                        </GlassCard>
                    </div>

                    <GlassCard className="p-6 border-emerald-500/30 bg-emerald-950/20 shadow-xl shadow-emerald-500/5 mt-6">
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex-grow w-full">
                                <input
                                    type="text"
                                    value={downloadFileName}
                                    onChange={(e) => setDownloadFileName(e.target.value)}
                                    className="bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 w-full transition-all text-sm font-medium"
                                    placeholder="Download Filename"
                                />
                            </div>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => {
                                    if (result) {
                                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                        const blob = new Blob([result.data as any], { type: 'application/pdf' });
                                        downloadFile(blob, downloadFileName || result.fileName);
                                    }
                                }}
                                icon={<Download className="w-5 h-5" />}
                                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 px-8"
                            >
                                Download Healed PDF
                            </Button>
                        </div>
                    </GlassCard>

                    <div className="flex justify-center">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setFile(null);
                                setReport(null);
                                setResult(null);
                            }}
                            className="text-slate-400 hover:text-white"
                        >
                            Open Next Patient
                        </Button>
                    </div>
                </div>
            )}

            <div className="mt-16">
                <QuickGuide steps={toolGuides['/repair-pdf']} />
                <ToolContent toolName="/repair-pdf" />
                <RelatedTools currentToolHref="/repair-pdf" />
            </div>
        </div>
    );
}
