'use client';

import React, { useEffect } from 'react';
import { CheckCircle, Rocket, ArrowRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

export default function SuccessPage() {
    const { setTier } = useSubscription();
    const router = useRouter();

    useEffect(() => {
        // Upgrade user to Pro locally
        setTier('pro');

        // Celebrate!
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, [setTier]);

    return (
        <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[70vh]">
            <GlassCard className="p-12 max-w-2xl w-full text-center border-emerald-500/30 shadow-glow-emerald">
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <CheckCircle className="w-20 h-20 text-emerald-400 animate-in zoom-in duration-500" />
                        <div className="absolute inset-0 bg-emerald-400/20 blur-2xl rounded-full -z-10 animate-pulse" />
                    </div>
                </div>

                <h1 className="text-4xl font-bold text-white mb-4">
                    Welcome to PDFToolskit Pro!
                </h1>

                <p className="text-xl text-slate-300 mb-8">
                    Your account has been successfully upgraded. You now have unlimited access to all premium features.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <Rocket className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-white uppercase tracking-tighter">Unlimited Size</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <CheckCircle className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-white uppercase tracking-tighter">Priority AI</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <ArrowRight className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                        <p className="text-xs font-bold text-white uppercase tracking-tighter">Batch Mode</p>
                    </div>
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => router.push('/')}
                    className="px-12 py-6 text-xl"
                >
                    Start Using Pro Tools
                </Button>
            </GlassCard>
        </div>
    );
}
