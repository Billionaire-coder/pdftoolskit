import React from 'react';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <ToolHeader
                title="Privacy Policy"
                description="How we protect and manage your data. 100% private, 100% secure."
                iconName="ShieldCheck"
                color="from-blue-500 to-emerald-600"
            />
            <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

                <section className="mb-8">
                    <p className="lead text-lg mb-6">
                        At PDFToolskit (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we are committed to protecting your privacy. This Privacy Policy explains specifically how we collect, use, disclose, and safeguard your information when you visit our website <strong>pdftoolskit.com</strong>. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">1. Data Collection and Usage</h2>

                    <h3 className="text-xl font-semibold mb-3 mt-6 text-slate-700 dark:text-slate-200">Files and Documents</h3>
                    <p>
                        We understand that your documents are important and private. <strong>We do not read, store, or share your files.</strong>
                        When you use our PDF tools:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>Files are processed temporarily on our secure servers purely for the purpose of the requested operation (e.g., merging, compressing).</li>
                        <li><strong>Automatic Deletion:</strong> All files are automatically and permanently deleted from our servers immediately after processing is complete.</li>
                        <li>We do not create backups of your uploaded content.</li>
                        <li>We do not claim any ownership over your content.</li>
                    </ul>

                    <h3 className="text-xl font-semibold mb-3 mt-6 text-slate-700 dark:text-slate-200">Personal Information</h3>
                    <p>
                        We do not collect personal identification information (PII) like names, phone numbers, or addresses unless you voluntarily provide it to us (for example, by subscribing to our newsletter or contacting support).
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li><strong>Newsletter:</strong> If you sign up for our newsletter, we collect your email address to send you updates, tips, and news about our tools. You can unsubscribe at any time.</li>
                        <li><strong>Contact:</strong> If you contact us via email, we will use your email address solely to respond to your inquiry.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">2. Cookies and Tracking Technologies</h2>
                    <p>
                        We use minimal cookies and similar tracking technologies to track the activity on our Service and hold certain information.
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li><strong>Essential Cookies:</strong> Cookies that are necessary for the website to function properly.</li>
                        <li><strong>Analytics Cookies:</strong> We may use third-party analytics tools (such as Google Analytics) to help us understand how our website is being used. These tools collect non-personal information such as your browser type, time spent on pages, and pages visited. This data is anonymized and used to improve user experience.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">3. Information Security</h2>
                    <p>
                        We implement appropriate technical and organizational security measures to protect your data. All file transfers to and from our website are encrypted using <strong>SSL/TLS (Secure Sockets Layer) technology</strong>. This ensures that your files cannot be intercepted during transfer.
                    </p>
                    <p className="mt-4">
                        However, please be aware that no method of transmission over the internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee its absolute security.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">4. Third-Party Services</h2>
                    <p>
                        Our Service may contain links to other sites that are not operated by us. If you click on a third-party link, you will be directed to that third party&apos;s site. We strongly advise you to review the Privacy Policy of every site you visit.
                    </p>
                    <p className="mt-2">
                        We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.
                    </p>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg mt-4 border border-slate-200 dark:border-white/10">
                        <h4 className="font-semibold mb-2">Key Third-Party Partners:</h4>
                        <ul className="list-disc pl-6 text-sm">
                            <li><strong>Google Analytics:</strong> For website traffic analysis.</li>
                            <li><strong>Vercel:</strong> Our hosting provider.</li>
                        </ul>
                    </div>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">5. Children&apos;s Privacy</h2>
                    <p>
                        Our Services are not intended for use by children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you become aware that a child has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">6. Your Data Rights (GDPR & CCPA)</h2>
                    <p>
                        Depending on your location, you may have certain rights regarding your personal data, including:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 mb-4">
                        <li>The right to access the personal information we hold about you.</li>
                        <li>The right to request correction of inaccurate personal information.</li>
                        <li>The right to request deletion of your personal information (&quot;Right to be Forgotten&quot;).</li>
                        <li>The right to object to processing of your personal information.</li>
                        <li>The right to data portability.</li>
                    </ul>
                    <p>
                        To exercise any of these rights, please contact us at the email provided below.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">7. Changes to This Privacy Policy</h2>
                    <p>
                        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date at the top of this policy. You are advised to review this Privacy Policy periodically for any changes.
                    </p>
                </section>

                <section className="mt-12 pt-8 border-t border-slate-200 dark:border-white/10">
                    <h2 className="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">Contact Us</h2>
                    <p>
                        If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at:
                    </p>
                    <p className="mt-4 font-semibold text-lg text-primary">
                        <a href="mailto:saifnaimuddinqadri@gmail.com" className="hover:underline">saifnaimuddinqadri@gmail.com</a>
                    </p>
                </section>
            </div>
        </div>
    );
}
