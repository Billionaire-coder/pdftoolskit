'use client';

import React from 'react';
import { FileDown, FileText } from 'lucide-react';
import { toolGuides } from '@/data/guides';
import { QuickGuide } from '@/components/shared/QuickGuide';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { GlassCard } from '@/components/ui/GlassCard';
import { useTranslation } from 'react-i18next';
import { PDFToWordTool } from '@/components/tools/PDFToWordTool';
import { ToolHeader } from '@/components/shared/ToolHeader';

export default function PDFToWordPage() {
    const { t } = useTranslation('common');

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                toolId="pdfToWord"
                title="PDF to Word Converter"
                description="Convert PDF documents to editable Word files (DOCX). Supports multiple files and automatic OCR."
                icon={FileDown}
                color="from-blue-500 to-indigo-500"
            />

            <PDFToWordTool />

            {/* Feature Notice */}
            <GlassCard className="p-6 mb-8 mt-12">
                <div className="flex items-start space-x-3">
                    <FileText className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                        <h3 className="text-white font-semibold mb-2">Smart Extraction & OCR</h3>
                        <p className="text-sm text-slate-300 mb-3">
                            Automatically detects text using advanced layout analysis.
                            If the document is a scan/image, we automatically apply OCR to extract the content.
                        </p>
                    </div>
                </div>
            </GlassCard>

            <QuickGuide steps={toolGuides['/pdf-to-word']} />
            <ToolContent toolName="/pdf-to-word" />
            <RelatedTools currentToolHref="/pdf-to-word" />
        </div >
    );
}
