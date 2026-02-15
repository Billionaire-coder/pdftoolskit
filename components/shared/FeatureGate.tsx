'use client';

import React, { useState } from 'react';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { Paywall } from './Paywall';
import { ProBadge } from './ProBadge';
import { cn } from '@/lib/utils';

interface FeatureGateProps {
    children: React.ReactNode;
    featureName: string;
    showBadge?: boolean;
    blurEffect?: boolean;
    className?: string;
}

export function FeatureGate({
    children,
    featureName,
    showBadge = true,
    blurEffect = false,
    className
}: FeatureGateProps) {
    const { isPro } = useSubscription();
    const [showPaywall, setShowPaywall] = useState(false);

    if (isPro) {
        return <>{children}</>;
    }

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowPaywall(true);
    };

    return (
        <div className={cn("relative group", className)} onClick={handleClick}>
            <div className={cn(
                "transition-all",
                blurEffect ? "blur-sm pointer-events-none opacity-50" : "grayscale opacity-80"
            )}>
                {children}
            </div>

            {/* Overlay to block interaction and show intent */}
            {!blurEffect && (
                <div className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center bg-transparent z-10">
                    {showBadge && <ProBadge variant="large" className="shadow-2xl" />}
                </div>
            )}

            {blurEffect && showBadge && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <ProBadge variant="large" className="scale-125" />
                </div>
            )}

            <Paywall
                isOpen={showPaywall}
                onClose={() => setShowPaywall(false)}
                featureName={featureName}
            />
        </div>
    );
}

export default FeatureGate;
