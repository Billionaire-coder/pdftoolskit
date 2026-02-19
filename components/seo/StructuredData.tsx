import React from 'react';

interface StructuredDataProps {
    type: 'WebApplication' | 'BreadcrumbList' | 'SoftwareApplication';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
