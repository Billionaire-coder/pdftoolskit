'use client';

import React, { useState, useEffect } from 'react';
import { WifiOff, ShieldCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineDetection() {
    const [isOffline, setIsOffline] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => {
            setIsOffline(true);
            setDismissed(false);
        };

        setIsOffline(!navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline || dismissed) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] max-w-md"
            >
                <div className="glass p-4 rounded-2xl border border-emerald-500/30 shadow-glow-emerald bg-slate-900/90 backdrop-blur-xl">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                            <WifiOff className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-white font-bold text-sm">Offline Mode Active</h3>
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                    <ShieldCheck className="w-3 h-3" />
                                    Secure
                                </div>
                            </div>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                You are offline, but PDFToolskit still works! All your files are processed locally on your device for maximum privacy.
                            </p>
                        </div>
                        <button
                            onClick={() => setDismissed(true)}
                            className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
