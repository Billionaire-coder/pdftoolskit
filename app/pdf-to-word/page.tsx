'use client';

import React, { useState } from 'react';
import { FileDown, Download, FileText, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { pdfToWord } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { saveToHistory } from '@/lib/history-store';

export default function PDFToWordPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);

    // Batch Processing State
    type FileStatus = 'pending' | 'processing' | 'completed' | 'error';
    interface Job {
        id: string;
        file: File;
        status: FileStatus;
        result?: Uint8Array; // Word bytes
        error?: string;
    }
    const [jobs, setJobs] = useState<Job[]>([]);

    const handleFileSelected = (newFiles: File[]) => {
        // Append new files
        const validFiles = newFiles.filter(f => validatePDFFile(f).valid);
        setFiles(prev => [...prev, ...validFiles]);

        // Create jobs
        const newJobs = validFiles.map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            status: 'pending' as FileStatus
        }));
        setJobs(prev => [...prev, ...newJobs]);

        if (validFiles.length > 0) {
            toast.success(`Added ${validFiles.length} file(s)`);
        }
    };

    const handleRemoveFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setJobs(prev => prev.filter((_, i) => i !== index));
    };

    const handleConvertToWord = async () => {
        if (jobs.length === 0) return;

        setProcessing(true);

        // Process sequentially to be safe
        for (let i = 0; i < jobs.length; i++) {
            const job = jobs[i];
            if (job.status === 'completed') continue; // Skip already done

            // Update status to processing
            setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'processing' } : j));

            try {
                const { data: wordBytes, isScanned } = await pdfToWord(job.file);

                // Save to History
                await saveToHistory({
                    id: job.id,
                    fileName: job.file.name.replace('.pdf', '.docx'),
                    tool: 'PDF to Word',
                    size: wordBytes.length,
                    // @ts-expect-error - Uint8Array is compatible with BlobPart
                    blob: new Blob([wordBytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
                });

                // Update status to completed
                setJobs(prev => prev.map(j => j.id === job.id ? {
                    ...j,
                    status: 'completed',
                    result: wordBytes
                } : j));

            } catch (error) {
                console.error(`Error processing ${job.file.name}:`, error);
                setJobs(prev => prev.map(j => j.id === job.id ? {
                    ...j,
                    status: 'error',
                    error: 'Conversion failed'
                } : j));
            }
        }

        setProcessing(false);
        toast.success('Batch processing finished!');
    };

    const downloadJob = (job: Job) => {
        if (job.result) {
            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([job.result], {
                type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            });
            const filename = job.file.name.replace('.pdf', '.docx');
            downloadFile(blob, filename);
        }
    };

    const downloadAllZip = async () => {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();

        let count = 0;
        jobs.forEach(job => {
            if (job.result) {
                const filename = job.file.name.replace('.pdf', '.docx');
                zip.file(filename, job.result);
                count++;
            }
        });

        if (count === 0) return;

        const content = await zip.generateAsync({ type: 'blob' });
        downloadFile(content, 'converted_files.zip');
        toast.success('Downloaded ZIP archive');
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            {/* Header */}
            <div className="text-center mb-12">
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 mb-6 shadow-glow">
                    <FileDown className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-3xl md:text-5xl font-heading font-bold gradient-text mb-4">
                    PDF to Word Converter
                </h1>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                    Convert PDF documents to editable Word files (DOCX). Supports multiple files and automatic OCR.
                </p>
            </div>

            {/* File Upload */}
            <div className="mb-8">
                <FileUpload
                    onFilesSelected={handleFileSelected}
                    files={files}
                    onRemoveFile={handleRemoveFile}
                    multiple={true}
                />
            </div>

            {/* Batch List & Actions */}
            {jobs.length > 0 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <GlassCard className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white font-semibold">Conversion Queue ({jobs.length})</h3>
                            <div className="flex gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => { setFiles([]); setJobs([]); }}
                                    disabled={processing}
                                    size="sm"
                                >
                                    Clear All
                                </Button>
                                {jobs.some(j => j.status === 'completed') && (
                                    <Button
                                        variant="outline"
                                        onClick={downloadAllZip}
                                        size="sm"
                                        className="text-yellow-400 border-yellow-400/20 hover:bg-yellow-400/10"
                                    >
                                        Download All (ZIP)
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 mb-6 max-h-[400px] overflow-y-auto pr-2">
                            {jobs.map((job) => (
                                <div key={job.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-blue-400" />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-white truncate max-w-[200px]">{job.file.name}</span>
                                            <span className="text-xs text-slate-400">
                                                {job.status === 'pending' && 'Waiting...'}
                                                {job.status === 'processing' && 'Converting...'}
                                                {job.status === 'completed' && <span className="text-green-400">Ready</span>}
                                                {job.status === 'error' && <span className="text-red-400">Failed</span>}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        {job.status === 'processing' && <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />}
                                        {job.status === 'completed' && (
                                            <button
                                                onClick={() => downloadJob(job)}
                                                className="p-2 hover:bg-green-500/20 rounded-full text-green-400 transition-colors"
                                                title="Download DOCX"
                                            >
                                                <Download className="w-5 h-5" />
                                            </button>
                                        )}
                                        {job.status === 'pending' && <div className="w-5 h-5" />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Button
                            variant="primary"
                            onClick={handleConvertToWord}
                            loading={processing}
                            disabled={jobs.every(j => j.status === 'completed')}
                            className="w-full"
                            icon={<Download className="w-5 h-5" />}
                        >
                            {processing ? 'Processing Batch...' : 'Convert Batch to Word'}
                        </Button>
                    </GlassCard>
                </div>
            )}

            {/* Feature Notice */}
            <GlassCard className="p-6 mb-8">
                <div className="flex items-start space-x-3">
                    <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="text-white font-semibold mb-2">Smart Extraction & OCR</h3>
                        <p className="text-sm text-slate-300 mb-3">
                            Automatically detects text using advanced layout analysis.
                            If the document is a scan/image, we automatically apply OCR to extract the content.
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-slate-400">
                            <span>✓ Layout preservation</span>
                            <span>•</span>
                            <span>✓ Automatic OCR</span>
                            <span>•</span>
                            <span>✓ Smart formatting</span>
                        </div>
                    </div>
                </div>
            </GlassCard>

            {/* Premium Upgrade CTA */}
            <GlassCard className="p-6 mb-8 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                <div className="flex items-start space-x-3">
                    <Sparkles className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                        <h3 className="text-white font-semibold mb-2">Need Advanced Features?</h3>
                        <p className="text-sm text-slate-300 mb-4">
                            For PDFs with complex formatting, images, tables, and graphics, consider our premium partners
                            who offer advanced conversion with perfect formatting preservation.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
                            <div className="flex items-center space-x-2">
                                <span className="text-purple-400">★</span>
                                <span>100% formatting preservation</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-purple-400">★</span>
                                <span>Image and table extraction</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-purple-400">★</span>
                                <span>Complex layout support</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-purple-400">★</span>
                                <span>Batch conversion</span>
                            </div>
                        </div>
                    </div>
                </div>
            </GlassCard>




            <QuickGuide steps={toolGuides['/pdf-to-word']} />
            <ToolContent toolName="/pdf-to-word" />
            <RelatedTools currentToolHref="/pdf-to-word" />
        </div >
    );
}
