import React from 'react';

interface StructuredDataProps {
    type: 'WebApplication' | 'BreadcrumbList' | 'SoftwareApplication';
    data: Record<string, any>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': type,
        ...data,
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
