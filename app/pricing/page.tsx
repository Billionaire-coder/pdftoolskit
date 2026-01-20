'use client';

import React from 'react';
import { Check, Zap, Crown, Shield, Rocket, Clock, Globe } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import toast from 'react-hot-toast';

export default function PricingPage() {
    const { tier, setTier } = useSubscription();

    const plans: {
        name: string;
        price: string;
        period?: string;
        description: string;
        features: string[];
        cta: string;
        action: () => void;
        variant: "ghost" | "primary" | "secondary" | "outline";
        active: boolean;
        highlight?: boolean;
    }[] = [
            {
                name: 'Free',
                price: '$0',
                description: 'Perfect for occasional use',
                features: [
                    'Currently Everything is FREE on this Website',
                    'Unlimited PDF Merging (up to 50MB)',
                    '100% Privacy - Files never leave device',
                    'Advanced Metadata Stripping',
                    'Basic AI Summarization (5/day)',
                    'Standard PWA Offline Access',
                    'No Sign-up Required',
                    'No Watermarks'
                ],
                cta: 'Current Plan',
                action: () => { },
                variant: 'ghost' as const,
                active: tier === 'free'
            },
            // {
            //     name: 'Pro',
            //     price: '$5',
            //     period: '/month',
            //     description: 'For power users and professionals',
            //     features: [
            //         'Unlimited File Size (up to 1GB)',
            //         'Priority Local AI reasoning (Uncapped)',
            //         'Ad-Free Experience',
            //         'Batch Processing for all tools',
            //         'Premium "B&W High Contrast" Filters',
            //         'Priority Support'
            //     ],
            //     cta: tier === 'pro' ? 'Active' : 'Get Started',
            //     action: () => {
            //         setTier('pro');
            //         toast.success('Welcome to PDFToolkit Pro! (Mock)', { icon: '🚀' });
            //     },
            //     variant: 'primary' as const,
            //     active: tier === 'pro',
            //     highlight: true
            // }
        ];

    return (
        <div className="container mx-auto px-4 py-20 max-w-6xl">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-6xl font-heading font-bold gradient-text mb-6">
                    Choose Your Plan
                </h1>
                <p className="text-xl text-slate-400 max-w-2xl mx-auto">
                    Simple, transparent pricing. Everything is processed locally on your device for maximum privacy.
                </p>
                <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl inline-block">
                    <p className="text-sm font-semibold text-purple-300">
                        Our Free Tier offers what others sell as &apos;Pro&apos;.
                    </p>
                    <p className="text-sm font-semibold text-purple-300 mt-1">
                        Just imagine the possibilities of our future Pro Plan!
                    </p>
                </div>
            </div>

            <div className="flex justify-center max-w-4xl mx-auto">
                {plans.map((plan) => (
                    <GlassCard
                        key={plan.name}
                        className={`p-8 flex flex-col relative w-full max-w-md ${plan.highlight ? 'border-purple-500/50 shadow-glow' : ''}`}
                    >
                        {plan.highlight && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold tracking-widest uppercase">
                                Recommended
                            </div>
                        )}
                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                            <div className="flex items-end gap-1 mb-4">
                                <span className="text-4xl font-bold text-white">{plan.price}</span>
                                {plan.period && <span className="text-slate-400 mb-1">{plan.period}</span>}
                            </div>
                            <p className="text-slate-400 text-sm">{plan.description}</p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                                    <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>

                        <Button
                            variant={plan.variant}
                            className="w-full"
                            onClick={plan.action}
                            disabled={plan.active}
                        >
                            {plan.cta}
                        </Button>
                    </GlassCard>
                ))}
            </div>

            {/* Comparison Table / Trust Badges */}
            <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                    { icon: <Shield className="w-6 h-6 text-blue-400" />, title: '100% Private', desc: 'No servers involved' },
                    { icon: <Clock className="w-6 h-6 text-purple-400" />, title: 'Lifetime Access', desc: 'One-time upgrade options' },
                    { icon: <Globe className="w-6 h-6 text-emerald-400" />, title: 'Offline First', desc: 'Works without internet' },
                    { icon: <Rocket className="w-6 h-6 text-pink-400" />, title: 'Blazing Fast', desc: 'Instant local processing' },
                ].map((item, i) => (
                    <div key={i} className="text-center">
                        <div className="flex justify-center mb-4">{item.icon}</div>
                        <h4 className="text-white font-bold mb-1">{item.title}</h4>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
