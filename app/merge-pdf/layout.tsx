import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Merge PDF - Combine Multiple PDF Files',
    description: 'Merge multiple PDF files into one document. Combine PDF pages instantly for free.'
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
