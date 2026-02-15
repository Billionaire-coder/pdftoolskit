import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'JPG to PDF - Convert Images to PDF Online',
    description: 'Convert JPG, PNG, and other images to PDF. Drag and drop multiple images and merge them into a single PDF.'
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
