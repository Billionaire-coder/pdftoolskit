'use client';

import React from 'react';
import { Scissors } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ToolContent } from '@/components/shared/ToolContent';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { SplitTool } from '@/components/tools/SplitTool';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { toolGuides } from '@/data/guides';

export default function SplitPDFPage() {
    const { t: _t } = useTranslation('common');

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            <ToolHeader
                toolId="splitPdf"
                title="Split PDF"
                description="Advanced segmentation: split every N pages, extract custom ranges, or select pages visually."
                icon={Scissors}
                color="from-cyan-400 to-blue-600"
            />

            <SplitTool />

            <div className="mt-20">
                <QuickGuide steps={toolGuides['/split-pdf']} />
                <ToolContent toolName="/split-pdf" />
                <RelatedTools currentToolHref="/split-pdf" />
            </div>
        </div>
    );
}
