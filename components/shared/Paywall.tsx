'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Crown, Check, Shield, Zap, X } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { useRouter } from 'next/navigation';

interface PaywallProps {
    isOpen: boolean;
    onClose: () => void;
    featureName?: string;
    reason?: string;
}

export function Paywall({ isOpen, onClose, featureName, reason }: PaywallProps) {
    const router = useRouter();

    const handleUpgrade = () => {
        onClose();
        // Assuming localized routing
        const lang = window.location.pathname.split('/')[1] || 'en';
        router.push(`/${lang}/pricing`);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="">
            <div className="p-2">
                <div className="text-center mb-8 pt-4">
                    <div className="inline-flex items-center justify-center p-3 bg-amber-500/20 rounded-2xl mb-4 border border-amber-500/30">
                        <Crown className="w-10 h-10 text-amber-500 animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Upgrade to Pro</h2>
                    <p className="text-slate-400">
                        {featureName ? `Unlock ${featureName} and take your PDF productivity to the next level.` :
                            reason || "Get unlimited access to all premium tools and features."}
                    </p>
                </div>

                <div className="space-y-4 mb-8">
                    {[
                        { icon: <Shield className="w-5 h-5 text-blue-400" />, text: "Unlimited File Sizes (up to 1GB)" },
                        { icon: <Zap className="w-5 h-5 text-purple-400" />, text: "Priority Local AI Reasoning" },
                        { icon: <Check className="w-5 h-5 text-emerald-400" />, text: "Batch Processing across all tools" },
                        { icon: <X className="w-5 h-5 text-red-400" />, text: "Zero Advertisements", crossout: true }
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                            {item.icon}
                            <span className="text-sm text-slate-200">{item.text}</span>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                        onClick={handleUpgrade}
                    >
                        See Pricing & Plans
                    </Button>
                    <Button variant="ghost" onClick={onClose} className="w-full text-slate-400">
                        Maybe Later
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

export default Paywall;
