'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
// import { AdSense } from '@/components/shared/AdSense';
import { useTranslation } from 'react-i18next';
import { MergeTool } from '@/components/tools/MergeTool';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function MergePDFPage() {
    const { t } = useTranslation('common');

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="mergePdf"
                title={t('toolPages.merge.title')}
                description={t('toolPages.merge.description')}
                icon={FileText}
                color="from-purple-500 to-pink-500"
            />

            <MergeTool />


            {/* <div className="my-12">
                <AdSense slot="merge-pdf-bottom" />
            </div> */}

            <QuickGuide steps={toolGuides['/merge-pdf']} />
            <ToolContent toolName="/merge-pdf" />
            <RelatedTools currentToolHref="/merge-pdf" />
        </div >
    );
}
