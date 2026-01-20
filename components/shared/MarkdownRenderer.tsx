'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
    children: string;
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
    return <ReactMarkdown>{children}</ReactMarkdown>;
}
