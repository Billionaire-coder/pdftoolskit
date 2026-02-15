'use client';

import React from 'react';
import { Camera } from 'lucide-react';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { ScanTool } from '@/components/tools/ScanTool';
import { ToolHeader } from '@/components/shared/ToolHeader';

type ScanFilter = 'original' | 'grayscale' | 'b&w' | 'contrast';

export default function ScanPDFPage() {
    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="scanPdf"
                title="Scan to PDF"
                description="Use your camera to capture documents and save them as PDF"
                icon={Camera}
                color="from-indigo-500 to-purple-600"
            />

            <ScanTool />

            <QuickGuide steps={toolGuides['/scan-pdf']} />
            <ToolContent toolName="/scan-pdf" />
            <RelatedTools currentToolHref="/scan-pdf" />
        </div>
    );
}
