
'use client';

import React from 'react';
// import { AdSense } from '@/components/shared/AdSense';
import { RelatedTools } from '@/components/shared/RelatedTools';
import { ToolContent } from '@/components/shared/ToolContent';
import { ChatTool } from '@/components/tools/ChatTool';
import { FeatureGate } from '@/components/shared/FeatureGate';
import { MessageSquare } from 'lucide-react';
import { ToolHeader } from '@/components/shared/ToolHeader';
// import { useTranslation } from 'react-i18next';

export default function ChatPDFPage() {
    return (
        <FeatureGate featureName="AI Chat PDF" blurEffect={true} className="py-8">
            <div className="container mx-auto px-4 max-w-[1600px]">
                <ToolHeader
                    toolId="chatPdf"
                    title="Chat with PDF"
                    description="Ask questions and get instant answers from your document"
                    icon={MessageSquare}
                    color="from-violet-500 to-purple-600"
                />

                <ChatTool />

                {/* <div className="mt-8">
                    <AdSense slot="chat-pdf-bottom" />
                </div> */}

                <div className="mt-12">
                    <ToolContent toolName="/chat-pdf" />
                    <RelatedTools currentToolHref="/chat-pdf" />
                </div>
            </div>
        </FeatureGate>
    );
}
