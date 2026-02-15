'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
    name: string;
    size?: number | string;
}

export function DynamicIcon({ name, size = 24, className, ...props }: DynamicIconProps) {
    // @ts-ignore
    const Icon = LucideIcons[name];

    if (!Icon) {
        console.warn(`Icon "${name}" not found in lucide-react`);
        return null;
    }

    return <Icon size={size} className={className} {...props} />;
}
