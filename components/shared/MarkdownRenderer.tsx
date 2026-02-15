'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
    children: string;
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
    const unindented = children
        .split('\n')
        .map(line => line.trimEnd())
        .join('\n')
        .replace(/^\s+/gm, ''); // Simple unindent for pure markdown

    return <ReactMarkdown rehypePlugins={[rehypeRaw]}>{unindented}</ReactMarkdown>;
}
