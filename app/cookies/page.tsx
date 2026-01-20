import React from 'react';

export default function CookiesPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Cookie Policy</h1>
            <div className="prose prose-slate dark:prose-invert max-w-none">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <p>
                    This Cookie Policy explains how PDFToolkit uses cookies and similar technologies.
                </p>
                <h2>1. What are Cookies?</h2>
                <p>
                    Cookies are small text files that are stored on your device when you visit a website. They help us remember your preferences and improve your experience.
                </p>
                <h2>2. How We Use Cookies</h2>
                <p>
                    We use cookies to analyze site traffic, personalize content, and ensure our website functions correctly.
                </p>
                <h2>3. Managing Cookies</h2>
                <p>
                    You can control and manage cookies through your browser settings. Please note that disabling cookies may affect some features of our website.
                </p>
            </div>
        </div>
    );
}
