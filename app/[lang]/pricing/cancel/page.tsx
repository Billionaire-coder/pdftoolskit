'use client';

import React from 'react';
import { XCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function CancelPage() {
    const router = useRouter();

    return (
        <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[70vh]">
            <GlassCard className="p-12 max-w-xl w-full text-center border-slate-700 bg-slate-900/50">
                <div className="mb-8 flex justify-center text-slate-500">
                    <XCircle className="w-16 h-16" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">
                    Payment Cancelled
                </h1>

                <p className="text-lg text-slate-400 mb-8">
                    Don&apos;t worry, your account was not charged. If you had trouble with the checkout process, please let us know.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                        variant="secondary"
                        onClick={() => router.push('/pricing')}
                        icon={<ArrowLeft className="w-4 h-4" />}
                    >
                        Try Again
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/')}
                        icon={<HelpCircle className="w-4 h-4" />}
                    >
                        Contact Support
                    </Button>
                </div>
            </GlassCard>
        </div>
    );
}
