declare module 'lucide-react' {
    import { FC, SVGProps } from 'react';
    export interface IconProps extends SVGProps<SVGSVGElement> {
        size?: string | number;
        color?: string;
        strokeWidth?: string | number;
    }
    export type LucideIcon = FC<IconProps>;
    export * from 'lucide-react/dist/lucide-react';
}
