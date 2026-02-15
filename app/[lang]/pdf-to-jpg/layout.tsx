import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'PDF to JPG - Convert PDF Pages to Images',
    description: 'Convert PDF pages to high-quality JPG images. Extract images from your PDF documents.'
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
