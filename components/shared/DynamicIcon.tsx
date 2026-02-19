'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
    name: string;
    size?: number | string;
}

export function DynamicIcon({ name, size = 24, className, ...props }: DynamicIconProps) {
    // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-explicit-any
    const Icon = (LucideIcons as any)[name];

    if (!Icon) {
        console.warn(`Icon "${name}" not found in lucide-react`);
        return null;
    }

    return <Icon size={size} className={className} {...props} />;
}
