'use client';

import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { motion } from 'framer-motion';

export function PrivacyBadge() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium cursor-help group relative"
        >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Files never leave your device</span>

            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 rounded-xl bg-slate-900 border border-white/10 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="flex gap-2 text-white mb-1 font-semibold">
                    <Info className="w-4 h-4 text-emerald-400" />
                    <span>Zero-Server Privacy</span>
                </div>
                <p className="text-slate-400 font-normal leading-relaxed">
                    This tool uses <b>WebAssembly (WASM)</b> to process your PDFs directly in your browser. No files are uploaded to our servers, keeping your data 100% private and secure.
                </p>
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 border-r border-b border-white/10 rotate-45"></div>
            </div>
        </motion.div>
    );
}
