import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Blog - PDFToolskit',
    description: 'Latest PDF tips, tutorials, and updates from the PDFToolskit team.',
    keywords: ['pdf blog', 'pdf tutorials', 'pdf guides', 'how to use pdf tools', 'pdf tips'],
};

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
