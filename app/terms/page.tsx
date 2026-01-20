import React from 'react';

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            <div className="prose prose-slate dark:prose-invert max-w-none">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <p>
                    Please read these Terms of Service carefully before using our website.
                </p>
                <h2>1. Acceptance of Terms</h2>
                <p>
                    By accessing or using PDFToolkit, you agree to be bound by these Terms of Service.
                </p>
                <h2>2. Use of Service</h2>
                <p>
                    You agree to use our services only for lawful purposes and in accordance with these Terms. You must not abuse or attempt to exploit our services.
                </p>
                <h2>3. Limitation of Liability</h2>
                <p>
                    PDFToolkit is provided "as is" without any warranties. We shall not be liable for any damages arising from your use of our services.
                </p>
            </div>
        </div>
    );
}
