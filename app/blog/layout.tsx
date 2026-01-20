import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'PDF Tools Blog - Tips, Guides & Tutorials | PDFToolkit',
    description: 'Learn how to work with PDFs efficiently. Expert guides on PDF conversion, security, compression, and more. Free tutorials and tips for all PDF tools.',
    keywords: ['pdf blog', 'pdf tutorials', 'pdf guides', 'how to use pdf tools', 'pdf tips'],
};

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
