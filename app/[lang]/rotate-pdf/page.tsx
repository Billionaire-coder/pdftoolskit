'use client';

import React from 'react';
import { RotateCw } from 'lucide-react';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { RotateTool } from '@/components/tools/RotateTool';
import { ToolHeader } from '@/components/shared/ToolHeader';




export default function RotatePDFPage() {
    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            <ToolHeader
                toolId="rotatePdf"
                title="Rotate PDF"
                description="Rotate individual pages or the entire document."
                icon={RotateCw}
                color="from-pink-500 to-rose-500"
            />

            <RotateTool />

            <QuickGuide steps={toolGuides['/rotate-pdf']} />
            <ToolContent toolName="/rotate-pdf" />
            <RelatedTools currentToolHref="/rotate-pdf" />
        </div>
    );
}
