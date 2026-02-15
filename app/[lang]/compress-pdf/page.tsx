'use client';

import React from 'react';
import { Minimize2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ToolContent } from '@/components/shared/ToolContent';
import { RelatedTools } from '@/components/shared/RelatedTools';
// import { AdSense } from '@/components/shared/AdSense';
import { CompressTool } from '@/components/tools/CompressTool';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function CompressPDFPage() {
    const { t } = useTranslation('common');

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-5xl">
            <ToolHeader
                toolId="compressPdf"
                title={t('toolPages.compress.title')}
                description={t('toolPages.compress.description')}
                icon={Minimize2}
                color="from-emerald-500 to-green-600"
            />

            <CompressTool />

            {/* AdSense */}
            {/* <div className="my-12">
                <AdSense slot="compress-pdf-bottom" />
            </div> */}

            {/* Quick Guide */}
            <QuickGuide steps={[
                { title: 'Upload PDF', description: 'Drag & drop your file or click to browse.' },
                { title: 'Choose Mode', description: 'Select "Recommended" for most files, or "Custom" for specific size limits.' },
                { title: 'Download', description: 'Get your perfectly optimized PDF file instantly.' },
            ]} />

            <ToolContent toolName="/compress-pdf" />

            {/* Related Tools */}
            <RelatedTools currentToolHref="/compress-pdf" />
        </div>
    );
}
