'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Download, Save, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFDocument } from 'pdf-lib';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { updateMetadata } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile, getBaseFileName } from '@/lib/utils';
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
        producer: ''
    });

    const handleFileSelected = async (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success('PDF uploaded successfully');
            await loadMetadata(files[0]);
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const loadMetadata = async (file: File) => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            setMetadata({
                title: pdfDoc.getTitle() || '',
                author: pdfDoc.getAuthor() || '',
                subject: pdfDoc.getSubject() || '',
                keywords: pdfDoc.getKeywords() || '',
                creator: pdfDoc.getCreator() || '',
                producer: pdfDoc.getProducer() || ''
            });

        } catch (error) {
            console.error('Error loading metadata:', error);
            toast.error('Could not read existing metadata');
        }
    };

    const handleSaveMetadata = async () => {
        if (!file) return;

        setProcessing(true);
        setProgress(0);

        try {
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 200);

            const newPdfBytes = await updateMetadata(file, {
                ...metadata,
                keywords: metadata.keywords.split(',').map(k => k.trim()).filter(k => k)
            });

            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([newPdfBytes], { type: 'application/pdf' });
            const baseName = getBaseFileName(file.name);
            downloadFile(blob, `${baseName}_metadata.pdf`);

            toast.success('Metadata updated successfully!');
            // Optional: reset or keep file
            setProgress(0);

        } catch (error) {
            console.error('Error updating metadata:', error);
            toast.error('Failed to update metadata');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="editMetadata"
                title="Edit Metadata"
                description="View and modify hidden PDF properties like Title, Author, and Keywords"
                icon={Tag}
                color="from-blue-400 to-indigo-500"
            />

            <div className="mb-8">
                <FileUpload
                    onFilesSelected={handleFileSelected}
                    files={file ? [file] : []}
                    onRemoveFile={() => {
                        setFile(null);
                        setMetadata({ title: '', author: '', subject: '', keywords: '', creator: '', producer: '' });
                    }}
                    multiple={false}
                    maxSize={limits.maxFileSize}
                    isPro={isPro}
                />
            </div>

            {file && (
                <GlassCard className="p-6 mb-8">
                    <div className="flex items-center gap-2 mb-6 text-white font-semibold">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <span>Document Properties</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Title</label>
                                <input
                                    type="text"
                                    value={metadata.title}
                                    onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg glass text-white text-sm focus:bg-white/10 transition-colors"
                                    placeholder="Document Title"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Author</label>
                                <input
                                    type="text"
                                    value={metadata.author}
                                    onChange={(e) => setMetadata({ ...metadata, author: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg glass text-white text-sm focus:bg-white/10 transition-colors"
                                    placeholder="Author Name"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Subject</label>
                                <input
                                    type="text"
                                    value={metadata.subject}
                                    onChange={(e) => setMetadata({ ...metadata, subject: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg glass text-white text-sm focus:bg-white/10 transition-colors"
                                    placeholder="Subject"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Keywords (comma separated)</label>
                                <input
                                    type="text"
                                    value={metadata.keywords}
                                    onChange={(e) => setMetadata({ ...metadata, keywords: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg glass text-white text-sm focus:bg-white/10 transition-colors"
                                    placeholder="pdf, report, draft"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Creator (Application)</label>
                                <input
                                    type="text"
                                    value={metadata.creator}
                                    onChange={(e) => setMetadata({ ...metadata, creator: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg glass text-white text-sm focus:bg-white/10 transition-colors"
                                    placeholder="e.g. Microsoft Word"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400 mb-1 block">Producer (PDF Tool)</label>
                                <input
                                    type="text"
                                    value={metadata.producer}
                                    onChange={(e) => setMetadata({ ...metadata, producer: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg glass text-white text-sm focus:bg-white/10 transition-colors"
                                    placeholder="e.g. PDFToolskit"
                                />
                            </div>
                        </div>
                    </div>
                </GlassCard>
            )}

            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label="Saving metadata..." />
                </div>
            )}

            {file && (
                <GlassCard className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-white font-semibold">Ready to update file</p>
                        <Button
                            variant="primary"
                            onClick={handleSaveMetadata}
                            loading={processing}
                            icon={<Save className="w-5 h-5" />}
                        >
                            Save PDF
                        </Button>
                    </div>
                </GlassCard>
            )}


            <QuickGuide steps={toolGuides['/edit-metadata']} />
            <ToolContent toolName="/edit-metadata" />
            <RelatedTools currentToolHref="/edit-metadata" />
        </div>
    );
}
