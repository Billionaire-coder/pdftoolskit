import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Rotate PDF - Rotate PDF Pages Online',
    description: 'Rotate PDF pages permanently. Select specific pages or rotate the entire document 90, 180, or 270 degrees.'
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
