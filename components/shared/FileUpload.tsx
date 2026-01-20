'use client';

import React, { useCallback, ChangeEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, MousePointer2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatFileSize } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrivacyBadge } from './PrivacyBadge';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import Link from 'next/link';
import { Zap } from 'lucide-react';

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    accept?: Record<string, string[]>;
    multiple?: boolean;
    maxSize?: number;
    files?: File[];
    onRemoveFile?: (index: number) => void;
}

export function FileUpload({
    onFilesSelected,
    accept = { 'application/pdf': ['.pdf'] },
    multiple = true,
    maxSize: propMaxSize,
    files = [],
    onRemoveFile,
}: FileUploadProps) {
    const { limits, isPro } = useSubscription();
    // Use propMaxSize if provided, otherwise use subscription limit
    const maxSize = propMaxSize || limits.maxFileSize;
    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            onFilesSelected(acceptedFiles);
        },
        [onFilesSelected]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept,
        multiple,
        maxSize,
        noClick: true, // Important: disable click on dropzone
        noKeyboard: true,
    });

    // Handle manual file selection
    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
        }
    };

    // Convert accept object to string for input
    const acceptString = Object.keys(accept).join(',');

    return (
        <div className="space-y-4">
            {/* Drag and Drop Area - SEPARATE from button */}
            <div
                className={`glass p-8 text-center transition-all duration-300 rounded-2xl shadow-glass ${isDragActive
                    ? 'border-2 border-primary bg-primary/10 scale-[1.02]'
                    : 'border border-white/10'
                    }`}
            >
                <div className="flex flex-col items-center gap-4">
                    {/* Drag Drop Zone - NO getRootProps here */}
                    <div
                        {...getRootProps()}
                        className={`w-full py-6 px-4 rounded-xl border-2 border-dashed transition-all ${isDragActive ? 'border-primary bg-primary/5' : 'border-white/20'
                            }`}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Upload className={`w-10 h-10 transition-colors duration-300 ${isDragActive ? 'text-primary' : 'text-accent'}`} />
                            <p className="text-sm font-medium text-white">
                                {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
                            </p>
                        </div>
                    </div>

                    <div className="text-slate-400">or</div>

                    {/* File Input Button - OUTSIDE of getRootProps */}
                    <label className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold bg-gradient-primary text-white shadow-glass hover:shadow-glow transition-all duration-300 hover:scale-105 cursor-pointer">
                        <MousePointer2 className="w-5 h-5" />
                        <span>Click to Choose Files</span>
                        <input
                            type="file"
                            onChange={handleFileInputChange}
                            accept={acceptString}
                            multiple={multiple}
                            className="hidden"
                        />
                    </label>

                    <PrivacyBadge />

                    <div className="flex flex-col items-center gap-1">
                        <p className="text-sm text-slate-400">
                            {multiple ? 'Upload multiple files' : 'Upload a single file'} • Max {formatFileSize(maxSize)}
                        </p>
                        {!isPro && (
                            <Link href="/pricing" className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-bold uppercase tracking-tighter transition-colors">
                                <Zap className="w-2.5 h-2.5" />
                                Increase Limit to 1GB
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* File List */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        {files.map((file, index) => (
                            <motion.div
                                key={`${file.name}-${index}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <GlassCard className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="p-2 rounded-lg bg-primary/20">
                                            <File className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                {formatFileSize(file.size)}
                                            </p>
                                        </div>
                                    </div>
                                    {onRemoveFile && (
                                        <button
                                            onClick={() => onRemoveFile(index)}
                                            className="p-2 rounded-lg glass glass-hover hover:bg-red-500/20 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </GlassCard>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
