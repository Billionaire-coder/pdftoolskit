import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Split PDF - Separate PDF Pages',
    description: 'Split specific page ranges or extract every page into a separate PDF document.'
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
