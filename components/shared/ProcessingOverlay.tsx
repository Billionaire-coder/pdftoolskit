'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface ProcessingOverlayProps {
    status: string;
    progress?: number;
}

export function ProcessingOverlay({ status, progress }: ProcessingOverlayProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center">
                <div className="mb-4 flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                        <Loader2 className="w-12 h-12 text-blue-400 animate-spin relative z-10" />
                    </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{status}</h3>
                {progress !== undefined && (
                    <div className="mt-4">
                        <ProgressBar progress={progress} />
                    </div>
                )}
            </div>
        </div>
    );
}
