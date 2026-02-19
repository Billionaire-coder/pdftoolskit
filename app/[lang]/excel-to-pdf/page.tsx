'use client';

import React, { useState, useEffect } from 'react';
import { FileCode2, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { excelToPdf } from '@/lib/excel-utils';
import { downloadFile } from '@/lib/utils'; // Generic util, no specific PDF validation for Excel files
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function ExcelToPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);
    const [downloadFileName, setDownloadFileName] = useState('');

    useEffect(() => {
        if (result?.fileName) {
            setDownloadFileName(result.fileName);
        }
    }, [result]);

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            const f = files[0];
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'application/vnd.ms-excel', // .xls
            ];

            // Allow if generic or specific type matches, or extension check as fallback
            if (validTypes.includes(f.type) || f.name.endsWith('.xlsx') || f.name.endsWith('.xls')) {
                setFile(f);
                toast.success('Excel file uploaded');
            } else {
                toast.error('Invalid file type. Please upload an Excel file (.xlsx or .xls)');
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        toast.success('File removed');
    };

    const handleConvertToPDF = async () => {
        if (!file) {
            toast.error('Please upload an Excel file');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 5, 90));
            }, 300);

            const pdfBytes = await excelToPdf(file);
            clearInterval(progressInterval);
            setProgress(100);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
            const filename = file.name.replace(/\.[^/.]+$/, "") + '.pdf';

            setResult({ blob, fileName: filename });

            toast.success('Excel converted to PDF successfully!');
            setFile(null);
            setProgress(0);
        } catch (error) {
            console.error('Error converting Excel to PDF:', error);
            toast.error('Failed to convert Excel. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="excelToPdf"
                title="Excel to PDF Converter"
                description="Convert Excel spreadsheets (XLSX, XLS) to professional PDF documents."
                icon={FileCode2}
                color="from-green-600 to-teal-500"
            />

            {/* File Upload */}
            <div className="mb-8">
                <FileUpload
                    onFilesSelected={handleFileSelected}
                    files={file ? [file] : []}
                    onRemoveFile={handleRemoveFile}
                    multiple={false}
                    maxSize={limits.maxFileSize}
                    isPro={isPro}
                    accept={{
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                        'application/vnd.ms-excel': ['.xls']
                    }}
                />
            </div>

            {/* Processing Progress */}
            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label="Converting Excel to PDF..." />
                </div>
            )}

            {/* Result Card */}
            {result && (
                <GlassCard className="p-6 mb-8 text-center animate-in zoom-in-95 duration-500 max-w-md mx-auto">
                    <div className="mx-auto w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mb-4">
                        <FileCode2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Excel Converted!</h3>

                    <div className="flex justify-center mt-6">
                        <div className="flex flex-col sm:flex-row gap-3 items-center w-full">
                            <input
                                type="text"
                                value={downloadFileName}
                                onChange={(e) => setDownloadFileName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-600 w-full flex-grow text-center sm:text-left"
                                placeholder="Filename"
                            />
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => downloadFile(result.blob, downloadFileName || result.fileName)}
                                icon={<Download className="w-5 h-5" />}
                                className="w-full sm:w-auto"
                            >
                                Download PDF
                            </Button>
                        </div>
                    </div>
                    <Button variant="ghost" onClick={() => setResult(null)} className="mt-4 text-sm">
                        Convert Another
                    </Button>
                </GlassCard>
            )}

            {/* Actions */}
            {file && !result && (
                <GlassCard className="p-6 mb-8">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-white font-semibold mb-1">
                                Ready to convert to PDF
                            </p>
                            <p className="text-sm text-slate-400">
                                Your spreadsheet will be formatted as a PDF table
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setFile(null)}
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleConvertToPDF}
                                loading={processing}
                                icon={<Download className="w-5 h-5" />}
                            >
                                Convert to PDF
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            )}
            <QuickGuide steps={toolGuides['/excel-to-pdf']} />
            <ToolContent toolName="/excel-to-pdf" />
            <RelatedTools currentToolHref="/excel-to-pdf" />
        </div >
    );
}
