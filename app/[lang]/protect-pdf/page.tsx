'use client';

import React, { useState, useEffect } from 'react';
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

    // Advanced Security State
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [ownerPassword, setOwnerPassword] = useState('');
    const [showOwnerPassword, setShowOwnerPassword] = useState(false);
    const [permissions, setPermissions] = useState({
        printing: false,
        copying: false,
        modifying: false
    });
    const [encryptMetadata, setEncryptMetadata] = useState(true);

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

            const protectedPdfBytes = await protectPDF(file, {
                userPassword: password,
                ownerPassword: ownerPassword || undefined,
                permissions: {
                    printing: permissions.printing ? 'highResolution' : 'none',
                    copying: permissions.copying,
                    modifying: permissions.modifying,
                    annotating: permissions.modifying,
                    fillingForms: permissions.modifying,
                    contentAccessibility: permissions.copying,
                    documentAssembly: permissions.modifying
                },
                encryptMetadata
            });

            clearInterval(progressInterval);
            setProgress(100);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([protectedPdfBytes as any], { type: 'application/pdf' });
            const filename = file.name.replace('.pdf', '_protected.pdf');

            setResult({ blob, fileName: filename });

            toast.success('PDF password protected successfully!');
            setFile(null);
            setPassword('');
            setConfirmPassword('');
            setProgress(0);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            // eslint-disable-next-line no-console
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
            {file && !processing && !result && (
                <GlassCard className="p-6 mb-8">
                    <div className="space-y-6">
                        {/* Basic Security (User Password) */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Open Password (Required)
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
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white mb-2">
                                    Confirm Open Password
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
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Formatting Divider */}
                        <div className="border-t border-white/10 pt-4">
                            <div
                                className="flex items-center justify-between cursor-pointer group"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                            >
                                <div className="flex items-center gap-2 text-white font-medium">
                                    <Shield className="w-4 h-4 text-orange-400" />
                                    <span>Advanced Security Options</span>
                                </div>
                                <div className={`text-slate-400 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}>
                                    ▼
                                </div>
                            </div>

                            {showAdvanced && (
                                <div className="mt-4 space-y-4 animate-in slide-in-from-top-2 fade-in duration-300">
                                    {/* Owner Password */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-400 mb-1">
                                            Owner Password (Optional) - Grants full permissions
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showOwnerPassword ? "text" : "password"}
                                                value={ownerPassword}
                                                onChange={(e) => setOwnerPassword(e.target.value)}
                                                placeholder="Different from Open Password"
                                                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 text-sm pr-10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                            >
                                                {showOwnerPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Permissions Grid */}
                                    <div className="bg-slate-900/30 rounded-lg p-4 border border-white/5 space-y-3">
                                        <p className="text-xs text-orange-400 font-bold uppercase tracking-widest mb-2">Allowed Actions</p>

                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={permissions.printing}
                                                onChange={(e) => setPermissions({ ...permissions, printing: e.target.checked })}
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-orange-500 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-slate-300">High Quality Printing</span>
                                        </label>

                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={permissions.copying}
                                                onChange={(e) => setPermissions({ ...permissions, copying: e.target.checked })}
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-orange-500 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-slate-300">Copying Text & Images</span>
                                        </label>

                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={permissions.modifying}
                                                onChange={(e) => setPermissions({ ...permissions, modifying: e.target.checked })}
                                                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-orange-500 focus:ring-orange-500"
                                            />
                                            <span className="text-sm text-slate-300">Modifying Document (Forms, Annotations)</span>
                                        </label>
                                    </div>

                                    <label className="flex items-center gap-3 cursor-pointer pl-1">
                                        <input
                                            type="checkbox"
                                            checked={encryptMetadata}
                                            onChange={(e) => setEncryptMetadata(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-orange-500 focus:ring-orange-500"
                                        />
                                        <span className="text-xs text-slate-400">Encrypt Metadata (Title, Author)</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Footer Note */}
                        <div className="flex items-start space-x-2 text-xs text-slate-500 pt-2">
                            <Lock className="w-3 h-3 mt-0.5 flex-shrink-0 text-slate-400" />
                            <p>
                                Credentials are processed entirely in your browser using AES-256 (Banking Grade) encryption.
                            </p>
                        </div>
                    </div>
                </GlassCard>
            )}

            {/* Processing Progress */}
            {processing && (
                <div className="mb-8">
                    <ProgressBar progress={progress} label="Applying Security Bunker..." />
                </div>
            )}

            {/* Result Card */}
            {result && (
                <GlassCard className="p-6 mb-8 text-center animate-in zoom-in-95 duration-500">
                    <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                        <Shield className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">PDF Protected!</h3>

                    <div className="flex justify-center mt-6">
                        <div className="flex flex-col sm:flex-row gap-3 items-center w-full max-w-md">
                            <input
                                type="text"
                                value={downloadFileName}
                                onChange={(e) => setDownloadFileName(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-red-500 w-full sm:w-auto flex-grow text-center sm:text-left"
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
                        Protect Another
                    </Button>
                </GlassCard>
            )}

            {/* Actions */}
            {file && !result && (
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
