import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="container mx-auto max-w-4xl py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
            <div className="prose dark:prose-invert">
                <p>Last updated: February 14, 2026</p>

                <h3>1. Data Processing</h3>
                <p><strong>PDF Files:</strong> Most PDF operations are performed locally in your browser using WebAssembly. Your files are not uploaded to our servers unless specifically required (e.g., for AI/OCR features), in which case they are processed in memory and immediately discarded.</p>

                <h3>2. AI & Local Storage</h3>
                <p><strong>AI Models:</strong> We use local caching (CacheStorage) to store AI model weights on your device to improve performance. These are not used to track you.</p>
                <p><strong>Local Storage:</strong> We use local storage to save your preferences (e.g., theme, cookie consent).</p>

                <h3>3. Third-Party Services</h3>
                <p>We use third-party tools (such as Google Analytics) to help us understand how our website is being used. These tools collect non-personal information anonymized data to improve user experience.</p>

                <h3>4. Your Rights</h3>
                <p>You can clear your data at any time by clearing your browser cache and local storage.</p>
            </div>
        </div>
    );
}
