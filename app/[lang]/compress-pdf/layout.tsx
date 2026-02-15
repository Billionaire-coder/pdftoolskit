import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Compress PDF - Reduce PDF File Size',
    description: 'Compress PDF files to reduce file size while maintaining quality. Optimize PDFs for web and email.'
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
