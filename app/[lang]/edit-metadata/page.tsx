'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Download, Save, FileText, Calendar, Zap, ShieldAlert, Sparkles, Trash2, ShieldCheck, Info, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { updateMetadata, getMetadata, stripMetadata } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName, cn } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function EditMetadataPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const [metadata, setMetadata] = useState({
        title: '',
        author: '',
        subject: '',
        keywords: '',
        creator: '',
        producer: '',
        creationDate: '',
        modificationDate: ''
    });

    const handleFileSelected = async (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.loading('Auditing file headers...', { id: 'audit-metadata' });
            await loadMetadata(files[0]);
            toast.success('Metadata Loaded', { id: 'audit-metadata' });
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const loadMetadata = async (file: File) => {
        try {
            const data = await getMetadata(file);

            setMetadata({
                title: data.title || '',
                author: data.author || '',
                subject: data.subject || '',
                keywords: data.keywords || '',
                creator: data.creator || '',
                producer: data.producer || '',
                creationDate: data.creationDate ? new Date(data.creationDate).toISOString().slice(0, 16) : '',
                modificationDate: data.modificationDate ? new Date(data.modificationDate).toISOString().slice(0, 16) : ''
            });

        } catch (error) {
            console.error('Error loading metadata:', error);
            toast.error('Could not read existing metadata');
        }
    };

    const handleAISuggest = async () => {
        if (!file) return;
        toast.loading('AI analyzing structure...', { id: 'ai-suggest' });
        try {
            const { extractTextFromPDF } = await import('@/lib/pdf-text-extractor');
            const items = await extractTextFromPDF(file);

            const p1 = items.filter(i => i.pageIndex === 0 && i.str.trim().length > 3);
            if (p1.length === 0) throw new Error('No content found');

            const sorted = [...p1].sort((a, b) => b.fontSize - a.fontSize);
            const suggestedTitle = sorted[0].str.trim();

            const allText = p1.map(i => i.str).join(' ');
            const words = allText.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter(w => w.length > 4);
            const freq: Record<string, number> = {};
            words.forEach(w => freq[w] = (freq[w] || 0) + 1);
            const suggestedKeywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]).join(', ');

            setMetadata(prev => ({
                ...prev,
                title: suggestedTitle,
                keywords: suggestedKeywords
            }));

            toast.success('AI Suggestions Applied!', { id: 'ai-suggest' });
        } catch (e) {
            toast.error('AI could not determine metadata', { id: 'ai-suggest' });
        }
    };

    const handleWipeMetadata = async () => {
        if (!file) return;
        if (!confirm('This will wipe all header information for privacy. Continue?')) return;

        setProcessing(true);
        try {
            const newPdfBytes = await stripMetadata(file);
            const blob = new Blob([newPdfBytes as any], { type: 'application/pdf' });
            downloadFile(blob, `${getBaseFileName(file.name)}_anonymized.pdf`);
            toast.success('Document Anonymized!');
        } catch (e) {
            toast.error('Wipe operation failed');
        } finally {
            setProcessing(false);
        }
    };

    const handleSaveMetadata = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const newPdfBytes = await updateMetadata(file, {
                ...metadata,
                keywords: metadata.keywords.split(',').map(k => k.trim()).filter(k => k),
                creationDate: metadata.creationDate ? new Date(metadata.creationDate) : undefined,
                modificationDate: metadata.modificationDate ? new Date(metadata.modificationDate) : undefined
            });

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            downloadFile(blob, `${getBaseFileName(file.name)}_synced.pdf`);

            toast.success('XMP & Info Dictionary Synced!');
            setProgress(0);

        } catch (error) {
            console.error('Error updating metadata:', error);
            toast.error('Failed to update metadata');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-7xl">
            <ToolHeader
                toolId="editMetadata"
                title="XMP Metadata Synchronizer"
                description="Professional-grade header management with dual Info-Dict and XMP-Stream synchronization."
                icon={Tag}
                color="from-blue-600 via-indigo-600 to-violet-600"
            />

            {!file ? (
                <div className="max-w-2xl mx-auto">
                    <FileUpload
                        onFilesSelected={handleFileSelected}
                        files={[]}
                        multiple={false}
                        maxSize={limits.maxFileSize}
                        isPro={isPro}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {/* MAIN EDITOR */}
                    <div className="lg:col-span-2 space-y-6">
                        <GlassCard className="p-8 border-blue-500/20 shadow-xl">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-500/20 p-2 rounded-xl">
                                        <FileText className="w-6 h-6 text-blue-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">Universal Properties</h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleAISuggest}
                                    icon={<Sparkles className="w-4 h-4 text-amber-400" />}
                                    className="text-amber-400 hover:text-amber-300 bg-amber-400/5"
                                >
                                    AI Suggest
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 block group-focus-within:text-blue-400 transition-colors">Document Title</label>
                                        <input
                                            type="text"
                                            value={metadata.title}
                                            onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/5 text-white text-sm focus:border-blue-500/50 focus:bg-slate-950 transition-all outline-none"
                                            placeholder="Enter descriptive title..."
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 block group-focus-within:text-blue-400 transition-colors">Primary Author</label>
                                        <input
                                            type="text"
                                            value={metadata.author}
                                            onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/5 text-white text-sm focus:border-blue-500/50 focus:bg-slate-950 transition-all outline-none"
                                            placeholder="Author or Organization name"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 block group-focus-within:text-blue-400 transition-colors">Subject / Description</label>
                                        <textarea
                                            value={metadata.subject}
                                            onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/5 text-white text-sm focus:border-blue-500/50 focus:bg-slate-950 transition-all outline-none resize-none h-24"
                                            placeholder="Brief abstract or summary..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 block group-focus-within:text-blue-400 transition-colors">Search Keywords</label>
                                        <input
                                            type="text"
                                            value={metadata.keywords}
                                            onChange={(e) => setMetadata({ ...metadata, keywords: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/5 text-white text-sm focus:border-blue-500/50 focus:bg-slate-950 transition-all outline-none"
                                            placeholder="e.g. analysis, quarterly, 2024"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 block group-focus-within:text-blue-400 transition-colors">Creator Application</label>
                                        <input
                                            type="text"
                                            value={metadata.creator}
                                            onChange={(e) => setMetadata({ ...metadata, creator: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/5 text-white text-sm focus:border-blue-500/50 focus:bg-slate-950 transition-all outline-none"
                                            placeholder="e.g. Microsoft Office 365"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2 block group-focus-within:text-blue-400 transition-colors">PDF Producer</label>
                                        <input
                                            type="text"
                                            value={metadata.producer}
                                            onChange={(e) => setMetadata({ ...metadata, producer: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-white/5 text-white text-sm focus:border-blue-500/50 focus:bg-slate-950 transition-all outline-none"
                                            placeholder="e.g. PDFToolskit Metadata Engine"
                                        />
                                    </div>
                                </div>
                            </div>
                        </GlassCard>

                        <div className="flex justify-end pt-4">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={handleSaveMetadata}
                                loading={processing}
                                icon={<Download className="w-5 h-5" />}
                                className="bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 px-12"
                            >
                                Sync & Download PDF
                            </Button>
                        </div>
                    </div>

                    {/* SIDECAR: FORENSIC & PRIVACY */}
                    <div className="space-y-6">
                        {/* Status Widget */}
                        <GlassCard className="p-6 border-emerald-500/10 bg-emerald-500/5">
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                <span className="text-sm font-bold text-white">XMP Compliance</span>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Info Dictionary</span>
                                    <span className="text-[10px] text-emerald-400 font-bold">READY</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">XMP Stream</span>
                                    <span className="text-[10px] text-emerald-400 font-bold">SYNC ENABLED</span>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Temporal Editor */}
                        <GlassCard className="p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Calendar className="w-5 h-5 text-indigo-400" />
                                <span className="text-sm font-bold text-white">Temporal Control</span>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2">Original Creation Date</label>
                                    <input
                                        type="datetime-local"
                                        value={metadata.creationDate}
                                        onChange={(e) => setMetadata({ ...metadata, creationDate: e.target.value })}
                                        className="w-full bg-slate-900/80 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2">Modification Date</label>
                                    <input
                                        type="datetime-local"
                                        value={metadata.modificationDate}
                                        onChange={(e) => setMetadata({ ...metadata, modificationDate: e.target.value })}
                                        className="w-full bg-slate-900/80 border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                        </GlassCard>

                        {/* Privacy Center */}
                        <GlassCard className="p-6 border-red-500/10 bg-red-500/5">
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldAlert className="w-5 h-5 text-red-400" />
                                <span className="text-sm font-bold text-white">Privacy Center</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed mb-6">
                                Strip all identifying markers (Creator, dates, keywords) to ensure zero-knowledge document sharing.
                            </p>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleWipeMetadata}
                                icon={<Trash2 className="w-4 h-4" />}
                                className="w-full justify-start text-red-400 hover:text-white hover:bg-red-500 transition-all border-red-500/20"
                            >
                                Anonymize Entire Document
                            </Button>
                        </GlassCard>

                        {/* File Switcher */}
                        <Button
                            variant="ghost"
                            className="w-full border-white/5 text-slate-500 text-xs"
                            onClick={() => { setFile(null); setMetadata({ title: '', author: '', subject: '', keywords: '', creator: '', producer: '', creationDate: '', modificationDate: '' }); }}
                        >
                            Upload Different File
                        </Button>
                    </div>
                </div>
            )}

            <div className="mt-20">
                <QuickGuide steps={toolGuides['/edit-metadata']} />
                <ToolContent toolName="/edit-metadata" />
                <RelatedTools currentToolHref="/edit-metadata" />
            </div>
        </div>
    );
}
