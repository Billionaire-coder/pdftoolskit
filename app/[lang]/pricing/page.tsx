'use client';

import React from 'react';
import { Check, Zap, Shield, Globe } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import toast from 'react-hot-toast';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function PricingPage() {
    const { tier, setTier } = useSubscription();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

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
                cta: mounted && tier === 'free' ? 'Current Plan' : (mounted ? 'Get Started' : '...'),
                action: () => { },
                variant: 'ghost' as const,
                active: mounted && tier === 'free'
            },
            {
                name: 'Pro',
                price: '$5',
                period: '/month',
                description: 'For power users and professionals',
                features: [
                    'Unlimited File Size (up to 1GB)',
                    'Priority Local AI reasoning (Uncapped)',
                    'Ad-Free Experience',
                    'Batch Processing for all tools',
                    'Premium "B&W High Contrast" Filters',
                    'Priority Support'
                ],
                cta: mounted && tier === 'pro' ? 'Active' : (mounted ? 'Get Started' : '...'),
                action: () => {
                    if (tier === 'pro') return;

                    const promise = new Promise((resolve) => {
                        setTimeout(() => {
                            setTier('pro');
                            resolve(true);
                        }, 2000);
                    });

                    toast.promise(promise, {
                        loading: 'Preparing secure checkout...',
                        success: 'Successfully upgraded to PRO! Enjoy unlimited access.',
                        error: 'Failed to start checkout. Please try again.',
                    });
                },
                variant: 'primary' as const,
                active: mounted && tier === 'pro',
                highlight: true
            }
        ];

    return (
        <div className="container mx-auto px-4 py-20 max-w-6xl">
            <ToolHeader
                title="Choose Your Plan"
                description="Simple, transparent pricing. Everything is processed locally on your device for maximum privacy."
                color="from-purple-500 to-indigo-600"
            />

            <div className="text-center mb-16">
                <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl inline-block">
                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-300">
                        Our Free Tier offers what others sell as &apos;Pro&apos;.
                    </p>
                    <p className="text-sm font-semibold text-purple-600 dark:text-purple-300 mt-1">
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
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                            <div className="flex items-end gap-1 mb-4">
                                <span className="text-4xl font-bold text-slate-900 dark:text-white">{plan.price}</span>
                                {plan.period && <span className="text-slate-500 dark:text-slate-400 mb-1">{plan.period}</span>}
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-sm">{plan.description}</p>
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feature) => (
                                <li key={feature} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300">
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
                    { icon: <Shield className="w-6 h-6 text-blue-400" />, title: 'SSL Encrypted', desc: 'Secure 256-bit checkout' },
                    { icon: <Check className="w-6 h-6 text-purple-400" />, title: 'Money Back', desc: '30-day satisfaction guarantee' },
                    { icon: <Globe className="w-6 h-6 text-emerald-400" />, title: 'Offline First', desc: 'Works without internet' },
                    { icon: <Zap className="w-6 h-6 text-pink-400" />, title: 'Instant Access', desc: 'No waiting for servers' },
                ].map((item, i) => (
                    <div key={i} className="text-center group p-4 rounded-2xl hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors duration-300">
                        <div className="flex justify-center mb-4 transform group-hover:scale-110 transition-transform">{item.icon}</div>
                        <h4 className="text-slate-900 dark:text-white font-bold mb-1">{item.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* Satisfaction Banner */}
            <div className="mt-16 text-center">
                <GlassCard className="inline-flex items-center gap-4 px-6 py-3 border-emerald-500/20 bg-emerald-500/5">
                    <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">
                        Secured by Industry Standard SSL. No credit card information is stored on our servers.
                    </span>
                </GlassCard>
            </div>
        </div>
    );
}
