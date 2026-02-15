'use client';

import React, { useState } from 'react';
import { Globe, Download, Code } from 'lucide-react';
import toast from 'react-hot-toast';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
// import { htmlToPdf } from '@/lib/html-utils';
import { downloadFile } from '@/lib/utils';
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
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleConvert = async () => {
        if (!url) {
            toast.error('Please enter a website URL');
            return;
        }

        let targetUrl = url;
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl;
        }

        if (!targetUrl.includes('.')) {
            toast.error('Please enter a valid URL');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            // Indeterminate progress for server-side generation
            const progressInterval = setInterval(() => {
                setProgress((prev) => {
                    // Slow down as we get closer to 90%, never reach 100% until done
                    if (prev >= 90) return 90;
                    return prev + 2;
                });
            }, 500);

            // Call Server API for High-Fidelity PDF
            const response = await fetch('/api/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: targetUrl,
                    format,
                    orientation
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to generate PDF');
            }

            // Get the blob directly
            const blob = await response.blob();

            clearInterval(progressInterval);
            setProgress(100);

            // Extract domain name for filename (fallback if header missing)
            const domain = new URL(targetUrl).hostname;
            const filename = `${domain}_capture.pdf`;
            downloadFile(blob, filename);

            toast.success('Website captured to PDF!');
            setUrl('');
            setProgress(0);
        } catch (error: any) {
            console.error('Error generating PDF:', error);
            toast.error(error.message || 'Failed to convert.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="htmlToPdf"
                title="Website to PDF"
                description="Convert any website into a PDF document. Enter the URL to capture the full page layout."
                icon={Globe}
                color="from-blue-400 to-indigo-500"
            />

            {/* URL Input Section */}
            <GlassCard className="p-8 mb-8">
                <div className="flex flex-col gap-6">
                    <div>
                        <label className="block text-white font-medium mb-3 ml-1">
                            Enter Website URL
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="flex-1 px-5 py-4 bg-white border border-white/10 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-lg"
                                disabled={processing}
                                onKeyDown={(e) => e.key === 'Enter' && handleConvert()}
                            />
                            <Button
                                variant="primary"
                                onClick={handleConvert}
                                loading={processing}
                                size="lg"
                                className="min-w-[180px]"
                                icon={<Download className="w-5 h-5" />}
                            >
                                Convert to PDF
                            </Button>
                        </div>
                    </div>

                    {/* PDF Options */}
                    <div className="flex flex-wrap gap-6 pt-4 border-t border-white/10">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm text-slate-300 mb-2 ml-1">Page Format</label>
                            <div className="grid grid-cols-2 gap-2 bg-background-light p-1 rounded-lg border border-white/5">
                                <button
                                    onClick={() => setFormat('a4')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${format === 'a4'
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    A4 (ISO)
                                </button>
                                <button
                                    onClick={() => setFormat('letter')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${format === 'letter'
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    Letter (US)
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-sm text-slate-300 mb-2 ml-1">Orientation</label>
                            <div className="grid grid-cols-2 gap-2 bg-background-light p-1 rounded-lg border border-white/5">
                                <button
                                    onClick={() => setOrientation('portrait')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${orientation === 'portrait'
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    Portrait
                                </button>
                                <button
                                    onClick={() => setOrientation('landscape')}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${orientation === 'landscape'
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    Landscape
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500 ml-1">
                        Note: Some websites may block access due to security policies (CORS).
                    </p>
                </div>
            </GlassCard>

            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label="Fetching and Rendering Website..." />
                </div>
            )}

            <GlassCard className="p-6 mb-8">
                <div className="flex items-start space-x-3">
                    <Code className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="text-white font-semibold mb-2">How it works</h3>
                        <p className="text-sm text-slate-300 mb-3">
                            We fetch the HTML content of the website and render it locally in your browser
                            to create a high-quality PDF capture. You can customize the page size and orientation.
                        </p>
                    </div>
                </div>
            </GlassCard>
            <QuickGuide steps={toolGuides['/html-to-pdf']} />
            <ToolContent toolName="/html-to-pdf" />
            <RelatedTools currentToolHref="/html-to-pdf" />
        </div >
    );
}
