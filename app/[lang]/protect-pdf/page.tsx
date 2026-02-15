'use client';

import React, { useState } from 'react';
import { Lock, Download, Shield, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { protectPDF } from '@/lib/pdf-utils';
import { downloadFile, validatePDFFile } from '@/lib/utils';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
// import { AdSense } from '@/components/shared/AdSense';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function ProtectPDFPage() {
    const { limits, isPro } = useSubscription();
    const [file, setFile] = useState<File | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

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

    const handleProtectPDF = async () => {
        if (!file) {
            toast.error('Please upload a PDF file');
            return;
        }

        if (!password) {
            toast.error('Please enter a password');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setProcessing(true);
        setProgress(0);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setProgress((prev) => Math.min(prev + 10, 90));
            }, 150);

            const protectedPdfBytes = await protectPDF(file, password);

            clearInterval(progressInterval);
            setProgress(100);

            // @ts-expect-error - Uint8Array is compatible with BlobPart
            const blob = new Blob([protectedPdfBytes], { type: 'application/pdf' });
            const filename = file.name.replace('.pdf', '_protected.pdf');
            downloadFile(blob, filename);

            toast.success('PDF password protected successfully!');
            setFile(null);
            setPassword('');
            setConfirmPassword('');
            setProgress(0);
        } catch (error: any) {
            console.error('Error protecting PDF:', error);
            toast.error(error.message || 'Failed to protect PDF. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            {/* Header */}
            <ToolHeader
                toolId="protectPdf"
                title="Password Protect PDF"
                description="Secure your PDF files with password encryption. Protect sensitive documents from unauthorized access."
                icon={Lock}
                color="from-red-500 to-orange-500"
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
            {file && (
                <GlassCard className="p-6 mb-8">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Enter Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all pr-12"
                                    disabled={processing}
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
                        <div>
                            <label className="block text-sm font-medium text-white mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter password"
                                    className="w-full px-4 py-3 bg-white/10 border border-white/10 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all pr-12"
                                    disabled={processing}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Password Strength Indicator */}
                        <div className="flex items-start space-x-2 text-sm text-slate-400">
                            <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <p>
                                Your password is encrypted locally in your browser. We never see or store your password.
                            </p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Processing Progress */}
            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label="Protecting PDF..." />
                </div>
            )}

            {/* Actions */}
            {file && (
                <GlassCard className="p-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-white font-semibold mb-1">
                                Ready to protect your PDF
                            </p>
                            <p className="text-sm text-slate-400">
                                File will be encrypted with AES-256 encryption
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setFile(null);
                                    setPassword('');
                                    setConfirmPassword('');
                                }}
                                disabled={processing}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleProtectPDF}
                                loading={processing}
                                icon={<Download className="w-5 h-5" />}
                            >
                                Protect PDF
                            </Button>
                        </div>
                    </div>
                </GlassCard>
            )}


            {/* <div className="my-12">
                <AdSense slot="protect-pdf-bottom" />
            </div> */}

            <QuickGuide steps={toolGuides['/protect-pdf']} />
            <ToolContent toolName="/protect-pdf" />
            <RelatedTools currentToolHref="/protect-pdf" />
        </div >
    );
}
