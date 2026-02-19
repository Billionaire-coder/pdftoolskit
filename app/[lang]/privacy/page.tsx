import React from 'react';
import { Locale } from '@/i18n-config';

export async function generateMetadata({ params: { lang } }: { params: { lang: Locale } }) {
    return {
        title: 'Privacy Policy | PDFToolskit',
        description: 'Privacy Policy for PDFToolskit - We respect your privacy and do not store your files.',
        alternates: {
            canonical: `https://pdftoolskit.vercel.app/${lang}/privacy`,
        },
    };
}

export default async function PrivacyPolicy({ params: { lang: _lang } }: { params: { lang: Locale } }) {
    // In a real app, you'd fetch this from your dictionary
    // For now, I'm hardcoding a standard, clean policy that is Google-compliant

    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8 text-slate-900 dark:text-white">Privacy Policy</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-8">Last updated: February 17, 2026</p>

            <div className="prose prose-slate dark:prose-invert max-w-none">
                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-200">1. Overview</h2>
                    <p>
                        PDFToolskit (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we handle your information when you use our website and services.
                        <strong> We do not store, copy, or share your files. All file processing happens locally in your browser or temporarily on secure servers before being immediately deleted.</strong>
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-200">2. Data Processing</h2>
                    <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                        <li><strong>Files:</strong> When you upload a file for processing, it is transmitted securely via HTTPS. Files are processed automatically and are not accessed by our team.</li>
                        <li><strong>Deletion:</strong> Files are automatically deleted from our servers immediately after processing is complete. We do not retain copies.</li>
                        <li><strong>Local Processing:</strong> Many of our tools run entirely in your browser (client-side), meaning your files never leave your device.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-200">3. Google Drive Integration</h2>
                    <p>
                        Our application integrates with Google Drive to allow you to import files directly.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                        <li><strong>Scopes:</strong> We only request access to the specific files you select (`drive.file` scope). We do not have access to your entire Google Drive.</li>
                        <li><strong>Use of Data:</strong> Data accessed via Google Drive (the file you select) is used solely for the purpose of performing the requested operation (e.g., merging, editing). It is treated with the same strict privacy as directly uploaded files.</li>
                        <li><strong>Sharing:</strong> We do not share your Google User Data with any third parties.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-200">4. Cookies and Analytics</h2>
                    <p>
                        We use minimal cookies necessary for the website to function (e.g., remembering your theme or language preference). We may use anonymous analytics to understand site usage patterns, but this data is aggregated and does not identify individual users.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-semibold mb-4 text-slate-800 dark:text-slate-200">5. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at support@pdftoolskit.vercel.app.
                    </p>
                </section>
            </div>
        </div>
    );
}
