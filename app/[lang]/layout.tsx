import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
// import { AdSense } from '@/components/shared/AdSense';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { I18nProvider } from '@/components/providers/I18nProvider';
import '../globals.css';
import { OfflineDetection } from '@/components/shared/OfflineDetection';
import { HistorySidebar } from '@/components/shared/HistorySidebar';
import { SubscriptionProvider } from '@/components/providers/SubscriptionProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { LiveAnnouncerProvider } from '@/components/shared/LiveAnnouncer';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import QueryProvider from '@/components/providers/QueryProvider';
import { i18n, isRtlLang } from '@/i18n-config';
import { StructuredData } from '@/components/seo/StructuredData';
import { CookieConsent } from '@/components/privacy/CookieConsent';
import { AccessibilityOverlay } from '@/components/shared/AccessibilityOverlay';
import { PostHogProvider } from '@/components/providers/PostHogProvider';
import { GoogleAnalytics } from '@/components/shared/GoogleAnalytics';

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

const baseMetadata: Metadata = {
    metadataBase: new URL('https://pdftoolskit.com'),
    title: 'PDFToolskit - Privacy-First PDF Tools',
    description: 'The ultimate privacy-first PDF toolkit that works entirely in your browser. Merge, split, compress, and edit PDFs without uploading them to any server.',
    keywords: ['pdf tools', 'merge pdf', 'split pdf', 'compress pdf', 'pdf to jpg', 'free pdf editor', 'privacy-first pdf', 'browser pdf tools'],
    authors: [{ name: 'PDFToolskit' }],
    creator: 'PDFToolskit',
    publisher: 'PDFToolskit',
    robots: 'index, follow',
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://pdftoolskit.com',
        siteName: 'PDFToolskit',
        title: 'PDFToolskit - Privacy-First PDF Tools',
        description: 'The ultimate privacy-first PDF toolkit that works entirely in your browser. Merge, split, compress, and edit PDFs without uploading them to any server.',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'PDFToolskit OG Image',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'PDFToolskit - Browser-Based PDF Tools',
        description: 'Privacy-first PDF editing and management tools.',
        images: ['/og-image.png'],
        creator: '@billionairesaif',
    },
    icons: {
        icon: '/favicon.png',
        apple: '/favicon.png',
    },
    manifest: '/manifest.json',
};

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
    const headersList = headers();
    const purePath = headersList.get('x-pure-path') || '';
    const baseUrl = 'https://pdftoolskit.com';

    // Generate alternates (hreflang)
    const languages: Record<string, string> = {};
    i18n.locales.forEach(locale => {
        // e.g. https://pdftoolskit.com/es/merge-pdf
        languages[locale] = `${baseUrl}/${locale}${purePath}`;
    });

    return {
        ...baseMetadata,
        alternates: {
            canonical: `${baseUrl}/${params.lang}${purePath}`,
            languages,
        },
    };
}

export async function generateStaticParams() {
    return i18n.locales.map((locale) => ({ lang: locale }));
}

// ... imports

export default function RootLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: { lang: string };
}) {
    const dir = isRtlLang(params.lang) ? 'rtl' : 'ltr';

    return (
        <html lang={params.lang} dir={dir} className={`${inter.variable} ${jakarta.variable}`}>
            <head>
                {/* Structured Data */}
                <StructuredData
                    type="WebApplication"
                    data={{
                        name: 'PDFToolskit',
                        description: 'Free online PDF tools for merging, splitting, compressing, and converting PDFs',
                        url: 'https://pdftoolskit.com',
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
                            'Metadata Auditor',
                            'Master Organizer',
                            'Chat with PDF',
                            'Edit PDF',
                            'Extract Pages',
                            'Crop PDF',
                            'Redact PDF',
                            'PDF/A Converter',
                            'Print-Ready PDF',
                            'Create Workflow'
                        ],
                    }}
                />
                <GoogleAnalytics ga_id={process.env.NEXT_PUBLIC_GA_ID || ''} />
            </head>
            <body className="animated-gradient min-h-screen font-sans antialiased">
                <ThemeProvider>
                    <PostHogProvider>
                        <AuthProvider>
                            <SubscriptionProvider>
                                <QueryProvider>
                                    <I18nProvider>
                                        <LiveAnnouncerProvider>
                                            <div className="relative min-h-screen flex flex-col">
                                                <Header />
                                                <HistorySidebar />
                                                <main className="flex-1">
                                                    <ErrorBoundary>
                                                        {children}
                                                    </ErrorBoundary>
                                                </main>
                                                {/* <div className="container mx-auto px-4">
                                                    <AdSense slot="global-footer-top" className="max-w-4xl mx-auto mb-8" />
                                                </div> */}
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
                                            <CookieConsent />
                                            <AccessibilityOverlay />
                                        </LiveAnnouncerProvider>
                                    </I18nProvider>
                                </QueryProvider>
                            </SubscriptionProvider>
                        </AuthProvider>
                    </PostHogProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
