import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdSense } from '@/components/shared/AdSense';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { I18nProvider } from '@/components/providers/I18nProvider';
import './globals.css';
import { OfflineDetection } from '@/components/shared/OfflineDetection';
import { HistorySidebar } from '@/components/shared/HistorySidebar';
import { SubscriptionProvider } from '@/components/providers/SubscriptionProvider';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-jakarta',
    display: 'swap',
});

export const metadata: Metadata = {
    metadataBase: new URL('https://pdftoolkit.com'),
    title: 'PDFToolkit - Free Online PDF Tools',
    description: 'Free, fast, and secure PDF tools. Merge, split, compress, and convert PDFs directly in your browser. No uploads, no tracking, 100% private.',
    keywords: ['pdf tools', 'merge pdf', 'split pdf', 'compress pdf', 'pdf to jpg', 'free pdf editor'],
    authors: [{ name: 'PDFToolkit' }],
    creator: 'PDFToolkit',
    publisher: 'PDFToolkit',
    robots: 'index, follow',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://pdftoolkit.com',
        siteName: 'PDFToolkit',
        title: 'PDFToolkit - Free Online PDF Tools',
        description: 'Free, fast, and secure PDF tools. Process PDFs directly in your browser.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'PDFToolkit',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'PDFToolkit - Free Online PDF Tools',
        description: 'Free, fast, and secure PDF tools. Process PDFs directly in your browser.',
        images: ['/og-image.png'],
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/apple-touch-icon.png',
    },
    manifest: '/manifest.json',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
            <head>
                {/* Structured Data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            '@context': 'https://schema.org',
                            '@type': 'WebApplication',
                            name: 'PDFToolkit',
                            description: 'Free online PDF tools for merging, splitting, compressing, and converting PDFs',
                            url: 'https://pdftoolkit.com',
                            applicationCategory: 'UtilityApplication',
                            offers: {
                                '@type': 'Offer',
                                price: '0',
                                priceCurrency: 'USD',
                            },
                            featureList: [
                                'Merge PDF',
                                'Split PDF',
                                'Compress PDF',
                                'PDF to JPG',
                                'JPG to PDF',
                                'Rotate PDF',
                                'Remove Pages',
                                'Organize PDF',
                                'PDF to Word',
                                'Word to PDF',
                                'PDF to Excel',
                                'Excel to PDF',
                                'PDF to PowerPoint',
                                'PowerPoint to PDF',
                                'HTML to PDF',
                                'Unlock PDF',
                                'Protect PDF',
                                'Sign PDF',
                                'Watermark PDF',
                                'Page Numbers',
                                'Scan to PDF',
                                'OCR PDF',
                                'Flatten PDF',
                                'Repair PDF',
                                'Edit Metadata',
                            ],
                        }),
                    }}
                />
            </head>
            <body className="animated-gradient min-h-screen font-sans antialiased">
                <ThemeProvider>
                    <SubscriptionProvider>
                        <I18nProvider>
                            <div className="relative min-h-screen flex flex-col">
                                <Header />
                                <HistorySidebar />
                                <main className="flex-1">
                                    {children}
                                </main>
                                <div className="container mx-auto px-4">
                                    <AdSense slot="global-footer-top" className="max-w-4xl mx-auto mb-8" />
                                </div>
                                <Footer />
                            </div>
                            <OfflineDetection />
                            <script
                                dangerouslySetInnerHTML={{
                                    __html: `
                            if ('serviceWorker' in navigator) {
                                window.addEventListener('load', function () {
                                    navigator.serviceWorker.register('/sw.js');
                                });
                            }
                            `,
                                }}
                            />
                            <Toaster
                                position="bottom-right"
                                toastOptions={{
                                    className: 'glass text-white',
                                    style: {
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        backdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                    },
                                }}
                            />
                        </I18nProvider>
                    </SubscriptionProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
