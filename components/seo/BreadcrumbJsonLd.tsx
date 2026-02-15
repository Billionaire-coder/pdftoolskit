import React from 'react';
import { StructuredData } from './StructuredData';

interface BreadcrumbItem {
    name: string;
    item: string;
}

interface BreadcrumbJsonLdProps {
    items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
    const itemListElement = items.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.item,
    }));

    return (
        <StructuredData
            type="BreadcrumbList"
            data={{
                itemListElement,
            }}
        />
    );
}
