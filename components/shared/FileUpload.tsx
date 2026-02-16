'use client';

import React, { useCallback, ChangeEvent } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File as FileIcon, X, MousePointer2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatFileSize } from '@/lib/utils';
import { GlassCard } from '@/components/ui/GlassCard';
import { PrivacyBadge } from './PrivacyBadge';
import Link from 'next/link';
import Script from 'next/script';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';

interface FileUploadProps {
    onFilesSelected: (files: File[]) => void;
    accept?: Record<string, string[]>;
    multiple?: boolean;
    maxSize: number;
    isPro?: boolean;
    files?: File[];
    onRemoveFile?: (index: number) => void;
}

export function FileUpload({
    onFilesSelected,
    accept = { 'application/pdf': ['.pdf'] },
    multiple = true,
    maxSize,
    isPro = false,
    files = [],
    onRemoveFile,
}: FileUploadProps) {
    const [sdkReady, setSdkReady] = useState(false);
    const [gDriveReady, setGDriveReady] = useState(false);

    // Dropbox SDK Loading
    useEffect(() => {
        const appKey = process.env.NEXT_PUBLIC_DROPBOX_APP_KEY;
        if (!appKey || appKey === 'your-dropbox-app-key') return;

        if ((window as any).Dropbox) {
            setSdkReady(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://www.dropbox.com/static/api/2/dropins.js';
        script.id = 'dropboxjs';
        script.dataset.appKey = appKey;
        script.onload = () => setSdkReady(true);
        script.onerror = () => toast.error('Could not load Dropbox.');
        document.head.appendChild(script);
    }, []);

    // Google Drive SDK Loading
    useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

        if (!clientId || !apiKey || clientId === 'your-google-client-id') {
            console.warn('Google Drive API keys are missing or default.');
            return;
        }

        const loadPicker = () => {
            if ((window as any).gapi) {
                (window as any).gapi.load('picker', () => {
                    console.log('Google Picker API loaded');
                    setGDriveReady(true);
                });
            }
        };

        const loadGoogleScripts = () => {
            // Check if scripts are already present
            const existingApiScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
            const existingGsiScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

            if (existingApiScript) {
                // If script exists, just try to load picker
                loadPicker();
            } else {
                const apiScript = document.createElement('script');
                apiScript.src = 'https://apis.google.com/js/api.js';
                apiScript.async = true;
                apiScript.defer = true;
                apiScript.onload = loadPicker;
                document.head.appendChild(apiScript);
            }

            if (!existingGsiScript) {
                const gsiScript = document.createElement('script');
                gsiScript.src = 'https://accounts.google.com/gsi/client';
                gsiScript.async = true;
                gsiScript.defer = true;
                document.head.appendChild(gsiScript);
            }
        };

        // Try immediate load if window.gapi exists
        if ((window as any).gapi) {
            loadPicker();
        } else {
            loadGoogleScripts();
        }
    }, []);


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
        noClick: true,
        noKeyboard: true,
    });

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
        }
    };

    const handleDropboxClick = () => {
        if (!sdkReady) {
            toast.error('Dropbox is still loading...');
            return;
        }

        (window as any).Dropbox.choose({
            success: async (files: any[]) => {
                const dropboxFile = files[0];
                try {
                    const response = await fetch(dropboxFile.link);
                    if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

                    const blob = await response.blob();
                    if (blob.size === 0) throw new Error('Blob is empty');

                    const file = new File([blob], dropboxFile.name, { type: 'application/pdf' });
                    onFilesSelected([file]);
                    toast.success('File imported from Dropbox!');
                } catch (error: any) {
                    console.error('Dropbox Import Error:', error);
                    toast.error(`Failed to import from Dropbox: ${error.message}`);
                }
            },
            linkType: 'direct',
            multiselect: false,
            extensions: ['.pdf'],
        });
    };

    const handleGoogleDriveClick = () => {
        if (!gDriveReady) {
            // Force check if it's actually ready now
            if ((window as any).gapi && (window as any).google) {
                setGDriveReady(true);
            } else {
                toast.error('Google Drive is loading... Please try again in a moment.');
                return;
            }
        }

        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

        if (!clientId || !apiKey) {
            toast.error('Google Drive Configuration Missing');
            return;
        }

        try {
            const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: clientId,
                scope: 'https://www.googleapis.com/auth/drive.readonly',
                callback: async (response: any) => {
                    if (response.error !== undefined) {
                        console.error('Auth Error:', response);
                        throw response;
                    }

                    const picker = new (window as any).google.picker.PickerBuilder()
                        .addView((window as any).google.picker.ViewId.PDFS)
                        .setOAuthToken(response.access_token)
                        .setDeveloperKey(apiKey)
                        .setCallback(async (data: any) => {
                            if (data.action === (window as any).google.picker.Action.PICKED) {
                                const file = data.docs[0];
                                const url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
                                try {
                                    const fileRes = await fetch(url, {
                                        headers: { Authorization: `Bearer ${response.access_token}` }
                                    });
                                    if (!fileRes.ok) throw new Error(`Fetch failed: ${fileRes.statusText}`);

                                    const blob = await fileRes.blob();
                                    if (blob.size === 0) throw new Error('Blob is empty');

                                    const pdfFile = new File([blob], file.name, { type: 'application/pdf' });
                                    onFilesSelected([pdfFile]);
                                    toast.success('File imported from Google Drive!');
                                } catch (error: any) {
                                    console.error('Google Drive Import Error:', error);
                                    toast.error(`Failed to download from Google Drive: ${error.message}`);
                                }
                            }
                        })
                        .build();
                    picker.setVisible(true);
                },
            });

            tokenClient.requestAccessToken();
        } catch (error) {
            console.error('Google Drive Initialization Error:', error);
            toast.error('Failed to initialize Google Drive. Please refresh and try again.');
        }
    };


    const acceptString = Object.keys(accept).join(',');

    return (
        <div className="space-y-4">
            <div
                className={`glass p-8 text-center transition-all duration-300 rounded-2xl shadow-glass ${isDragActive
                    ? 'border-2 border-primary bg-primary/10 scale-[1.02]'
                    : 'border border-white/10'
                    }`}
            >
                <div className="flex flex-col items-center gap-4">
                    <div
                        {...getRootProps()}
                        className={`w-full py-6 px-4 rounded-xl border-2 border-dashed transition-all ${isDragActive ? 'border-primary bg-primary/5' : 'border-white/20'}`}
                    >
                        <div className="flex flex-col items-center gap-2">
                            <Upload className={`w-10 h-10 transition-colors duration-300 ${isDragActive ? 'text-primary' : 'text-accent'}`} />
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {isDragActive ? 'Drop files here' : 'Drag and drop files here'}
                            </p>
                        </div>
                    </div>

                    <div className="text-slate-400">or</div>

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

                    {/* Cloud Storage Options */}
                    <div className="flex flex-col items-center gap-4 py-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Or Import From</p>
                        <div className="flex items-center gap-6">
                            <button
                                onClick={handleGoogleDriveClick}
                                className="group/cloud flex flex-col items-center gap-1.5 transition-all duration-300 hover:scale-110"
                                title="Import from Google Drive"
                            >
                                <div className="p-2 transition-transform duration-300 group-hover/cloud:scale-110">
                                    <img
                                        src="/google-drive-logo-vector.png"
                                        alt="Google Drive"
                                        className="w-6 h-6 object-contain"
                                    />
                                </div>
                                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover/cloud:opacity-100 transition-opacity">Drive</span>
                            </button>
                            <button
                                onClick={handleDropboxClick}
                                className="group/cloud flex flex-col items-center gap-1.5 transition-all duration-300 hover:scale-110"
                                title="Import from Dropbox"
                            >
                                <div className="p-2 transition-transform duration-300 group-hover/cloud:scale-110">
                                    <svg viewBox="0 0 24 24" className="w-6 h-6">
                                        <path fill="#0061FF" d="M6 2L0 6L6 10L12 6L6 2ZM18 2L12 6L18 10L24 6L18 2ZM0 14L6 10L12 14L6 18L0 14ZM24 14L18 10L12 14L18 18L24 14ZM6 19L12 23L18 19L12 15L6 19Z" />
                                    </svg>
                                </div>
                                <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover/cloud:opacity-100 transition-opacity">Dropbox</span>
                            </button>
                        </div>
                    </div>

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
                                            <FileIcon className="w-5 h-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
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
