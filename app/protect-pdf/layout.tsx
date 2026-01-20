import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Protect PDF - Encrypt and Password Protect PDF',
    description: 'Secure your PDF files with a password. Encrypt PDF documents to prevent unauthorized access.'
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return children;
}
