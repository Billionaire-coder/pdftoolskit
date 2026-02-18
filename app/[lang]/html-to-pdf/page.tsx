'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Download, Code, Smartphone, Tablet, Monitor, ShieldCheck, Zap, Sparkles, AlertCircle, CheckCircle, Search, Gauge, Cpu, Trash2, Wind } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { downloadFile, cn, formatFileSize } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { useSubscription } from '@/components/providers/SubscriptionProvider';

export default function HTMLToPDFPage() {
    const { limits, isPro } = useSubscription();
    const [url, setUrl] = useState('');
    const [format, setFormat] = useState<'a4' | 'letter'>('a4');
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
    const [viewport, setViewport] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
    const [cleanShot, setCleanShot] = useState(true);

    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState("Initializing Engine...");

    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);

    const handleConvert = async () => {
        if (!url) {
            toast.error('Please enter a website URL');
            return;
        }

        let targetUrl = url;
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }

        try {
            new URL(targetUrl);
        } catch {
            toast.error('Invalid URL format');
            return;
        }

        setProcessing(true);
        setProgress(5);
        setResult(null);
        setStatusMessage("Spinning up headless instance...");

        try {
            const interval = setInterval(() => {
                setProgress(prev => {
                    const next = prev + (Math.random() * 2);
                    if (next > 20 && next < 40) setStatusMessage("Stealth navigation in progress...");
                    if (next > 40 && next < 60) setStatusMessage("Sanitizing popups and ads...");
                    if (next > 60 && next < 80) setStatusMessage("Rendering pixel-perfect layout...");
                    if (next > 80 && next < 95) setStatusMessage("Finalizing vector archival...");
                    return next > 95 ? 95 : next;
                });
            }, 500);

            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: targetUrl,
                    format,
                    orientation,
                    viewport,
                    cleanShot
                }),
            });

            clearInterval(interval);

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Archival failed');
            }

            const blob = await response.blob();
            setProgress(100);

            const domain = new URL(targetUrl).hostname;
            const filename = `${domain}_archived_${new Date().toISOString().split('T')[0]}.pdf`;

            setResult({ blob, fileName: filename });
            toast.success('Website captured successfully');
        } catch (error: any) {
            console.error('PDF Generation Error:', error);
            toast.error(error.message || 'Capture failed');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            <ToolHeader
                toolId="htmlToPdf"
                title="Website to PDF"
                description="Professional Web Archival: Convert any live website into a clean, ad-free PDF with responsive viewport control."
                icon={Globe}
                color="from-sky-400 to-indigo-600"
            />

            {result && (
                <div className="max-w-2xl mx-auto animate-in scale-in duration-500 mb-20">
                    <GlassCard className="p-12 text-center border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
                        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-indigo-500/20">
                            <ShieldCheck className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-2">Web Archival Complete</h3>
                        <p className="text-slate-400 mb-10">The website has been sanitized and converted into a professional document.</p>

                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 mb-8 text-left">
                            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Archived Asset</p>
                            <p className="text-white font-mono text-sm truncate">{result.fileName}</p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => downloadFile(result.blob, result.fileName)}
                                icon={<Download className="w-6 h-6" />}
                                className="py-8 text-2xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-500/20"
                            >
                                Download Archive
                            </Button>
                            <Button variant="ghost" onClick={() => setResult(null)} className="text-slate-500 mt-4 text-[10px] uppercase font-black tracking-widest">
                                Capture Another Site
                            </Button>
                        </div>
                    </GlassCard>
                </div>
            )}

            {!result && !processing && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-up duration-500">
                    <div className="lg:col-span-2 space-y-6">
                        <GlassCard className="p-8">
                            <div className="relative mb-10">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="url"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://vogue.com"
                                    className="w-full pl-12 pr-4 py-5 bg-slate-900/50 border border-white/5 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-all text-xl"
                                    onKeyDown={(e) => e.key === 'Enter' && handleConvert()}
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                                        <Globe className="w-3 h-3 text-indigo-400" />
                                        <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Live Capture</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <button
                                    onClick={() => setViewport('desktop')}
                                    className={cn(
                                        "p-6 rounded-2xl border transition-all flex flex-col items-center",
                                        viewport === 'desktop' ? "bg-indigo-600 border-indigo-500 shadow-lg" : "bg-slate-900/50 border-white/5 hover:bg-white/5"
                                    )}
                                >
                                    <Monitor className={cn("w-6 h-6 mb-3", viewport === 'desktop' ? "text-white" : "text-slate-400")} />
                                    <span className="font-bold text-sm">Desktop</span>
                                </button>
                                <button
                                    onClick={() => setViewport('tablet')}
                                    className={cn(
                                        "p-6 rounded-2xl border transition-all flex flex-col items-center",
                                        viewport === 'tablet' ? "bg-indigo-600 border-indigo-500 shadow-lg" : "bg-slate-900/50 border-white/5 hover:bg-white/5"
                                    )}
                                >
                                    <Tablet className={cn("w-6 h-6 mb-3", viewport === 'tablet' ? "text-white" : "text-slate-400")} />
                                    <span className="font-bold text-sm">Tablet</span>
                                </button>
                                <button
                                    onClick={() => setViewport('mobile')}
                                    className={cn(
                                        "p-6 rounded-2xl border transition-all flex flex-col items-center",
                                        viewport === 'mobile' ? "bg-indigo-600 border-indigo-500 shadow-lg" : "bg-slate-900/50 border-white/5 hover:bg-white/5"
                                    )}
                                >
                                    <Smartphone className={cn("w-6 h-6 mb-3", viewport === 'mobile' ? "text-white" : "text-slate-400")} />
                                    <span className="font-bold text-sm">Mobile</span>
                                </button>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-6 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/10 rounded-xl">
                                        <Wind className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold leading-none mb-1">Clean-Shot Archival</p>
                                        <p className="text-xs text-slate-500">Automatically strip popups and cookie banners</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setCleanShot(!cleanShot)}
                                        className={cn(
                                            "relative w-12 h-6 rounded-full transition-colors",
                                            cleanShot ? "bg-indigo-500" : "bg-slate-700"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                                            cleanShot ? "left-7" : "left-1"
                                        )} />
                                    </button>
                                </div>
                            </div>
                        </GlassCard>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { icon: Cpu, label: "Engine", val: "Headless" },
                                { icon: Gauge, label: "Render", val: "Vivid" },
                                { icon: ShieldCheck, label: "Stealth", val: "Active" },
                                { icon: Zap, label: "Archive", val: "Instant" }
                            ].map((stat, i) => (
                                <GlassCard key={i} className="p-4 flex flex-col items-center justify-center text-center">
                                    <stat.icon className="w-4 h-4 text-indigo-400 mb-2" />
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{stat.label}</p>
                                    <p className="text-xs text-white font-bold leading-none">{stat.val}</p>
                                </GlassCard>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <GlassCard className="p-8 border-indigo-500/20 bg-indigo-500/5 items-center flex flex-col justify-center h-full">
                            <Sparkles className="w-12 h-12 text-indigo-400 mb-6 animate-pulse" />
                            <h4 className="text-xl font-bold text-white mb-2 text-center">Ready to Capture?</h4>
                            <p className="text-sm text-slate-400 text-center mb-8">We utilize a distributed browser cluster to ensure high-fidelity snapshots.</p>

                            <div className="w-full space-y-3 mb-8">
                                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black">
                                    <span>Format</span>
                                    <span className="text-indigo-400">{format}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black">
                                    <span>Orientation</span>
                                    <span className="text-indigo-400">{orientation}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500 uppercase font-black">
                                    <span>Viewport</span>
                                    <span className="text-indigo-400">{viewport}</span>
                                </div>
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleConvert}
                                size="lg"
                                className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 rounded-2xl"
                                icon={<Download className="w-5 h-5" />}
                            >
                                Initiate Archival
                            </Button>
                        </GlassCard>
                    </div>
                </div>
            )}

            {processing && (
                <div className="max-w-2xl mx-auto py-20 text-center animate-in zoom-in-95 duration-500">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full" />
                        <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <Globe className="absolute inset-0 m-auto w-8 h-8 text-indigo-400 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Synthesizing Web Content...</h3>
                    <ProgressBar progress={progress} label={statusMessage} />
                </div>
            )}

            <div className="mt-20">
                <QuickGuide steps={toolGuides['/html-to-pdf']} />
                <ToolContent toolName="/html-to-pdf" />
                <RelatedTools currentToolHref="/html-to-pdf" />
            </div>
        </div>
    );
}
