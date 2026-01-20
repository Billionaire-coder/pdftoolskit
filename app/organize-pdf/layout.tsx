import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Organize PDF - Sorting and Reordering PDF Pages',
    description: 'Organize PDF pages online. Rearrange, move, and sort pages in your PDF document easily.'
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
