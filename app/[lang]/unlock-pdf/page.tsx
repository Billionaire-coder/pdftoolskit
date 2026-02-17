'use client';

import React, { useState, useEffect } from 'react';
import { Unlock, Download, Key, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { unlockPDF } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';




export default function UnlockPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            const validation = validatePDFFile(files[0]);
            if (validation.valid) {
                setFile(files[0]);
                toast.success('PDF file uploaded');
            } else {
                toast.error(validation.error || 'Invalid PDF file');
            }
        }
    };

    const handleRemoveFile = () => {
        setFile(null);
        toast.success('File removed');
    };

    const handleUnlockPDF = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }

        if (!password) {
            // Allow empty password for permission-only removal
            // toast.error('Please enter the password');
            // return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 150);

            const unlockedPdfBytes = await unlockPDF(file, password);
            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([unlockedPdfBytes], { type: 'application/pdf' });
            const filename = file.name.replace('.pdf', '_unlocked.pdf');

            setResult({ blob, fileName: filename });

            toast.success('PDF unlocked successfully!');
            setFile(null);
            setPassword('');
            setProgress(0);
        } catch (error) {
            console.error('Error unlocking PDF:', error);
            toast.error('Failed to unlock PDF. Please check your password and try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            {/* Header */}
            <ToolHeader
                toolId="unlockPdf"
                title="Unlock PDF"
                description="Remove password protection from your PDF files. Enter the password to unlock and download."
                icon={Unlock}
                color="from-green-500 to-emerald-500"
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
                />
            </div>

            {/* Password Input */}
            {file && !processing && !result && (
                <GlassCard className="p-6 mb-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Enter PDF Password (Optional)
                            </label>
                            <p className="text-xs text-slate-400 mb-2">
                                Leave blank if the file opens without a password but has printing/editing restrictions.
                            </p>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password (if required to open)"
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all pr-12"
                                    disabled={processing}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleUnlockPDF();
                                        }
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="flex items-start space-x-2 text-sm text-slate-400">
                            <Key className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p>
                                Your password is processed locally in your browser. We never see or store your password.
                            </p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Processing Progress */}
            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label="Unlocking PDF..." />
                </div>
            )}

            {/* Result Card */}
            {result && (
                <GlassCard className="p-6 mb-8 text-center animate-in zoom-in-95 duration-500">
                    <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
                        <Unlock className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">PDF Unlocked!</h3>

                    <div className="flex justify-center mt-6">
                        <div className="flex flex-col sm:flex-row gap-3 items-center w-full max-w-md">
                            <input
                                type="text"
                                value={downloadFileName}
                                onChange={(e) => setDownloadFileName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-emerald-500 w-full sm:w-auto flex-grow text-center sm:text-left"
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
                        Unlock Another PDF
                    </Button>
                </GlassCard>
            )}

            {/* Actions */}
            {file && !result && (
                <GlassCard className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-white font-semibold mb-1">
                                Ready to unlock your PDF
                            </p>
                            <p className="text-sm text-slate-400">
                                Password-protected PDF will be decrypted
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setFile(null);
                                    setPassword('');
                                }}
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleUnlockPDF}
                                loading={processing}
                                icon={<Download className="w-5 h-5" />}
                            >
                                Unlock PDF
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            )}


            <QuickGuide steps={toolGuides['/unlock-pdf']} />
            <ToolContent toolName="/unlock-pdf" />
            <RelatedTools currentToolHref="/unlock-pdf" />
        </div >
    );
}
