import React from 'react';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { FileText } from 'lucide-react';

export default function TermsPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <ToolHeader
                title="Terms of Service"
                description="The rules and guidelines for using our platform."
                iconName="FileText"
                color="from-slate-500 to-slate-700"
            />
            <div className="prose prose-slate dark:prose-invert max-w-none">
                <p>Last updated: {new Date().toLocaleDateString()}</p>
                <p>
                    By accessing or using PDFToolskit, you agree to be bound by these Terms of Service.
                </p>
                <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto px-4">
                    Welcome to PDFToolskit. By using our website and services, you agree to comply with and be bound by the following terms.
                </p>
                <h2>2. Use of Service</h2>
                <p>
                    You agree to use our services only for lawful purposes and in accordance with these Terms. You must not abuse or attempt to exploit our services.
                </p>
                <h2>3. Limitation of Liability</h2>
                <p>
                    PDFToolskit is provided &quot;as is&quot; without any warranties. We shall not be liable for any damages arising from your use of our services.
                </p>
            </div>
        </div>
    );
}
