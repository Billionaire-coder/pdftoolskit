import React from 'react';
import { ToolHeader } from '@/components/shared/ToolHeader';
// import { HelpCircle } from 'lucide-react';

export default function FAQPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <ToolHeader
                title="Frequently Asked Questions"
                description="Common questions about privacy, security, and using our PDF tools."
                iconName="HelpCircle"
                color="from-blue-500 to-indigo-600"
            />
            <div className="prose prose-slate dark:prose-invert max-w-none">
                <p className="text-sm text-slate-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

                <div className="space-y-12">

                    {/* General Section */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-primary border-b border-primary/20 pb-2">General Questions</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Is PDFToolskit really free?</h3>
                                <p>Yes! PDFToolskit is 100% free with no hidden costs, accounts, or daily limits for basic usage.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Do I need to create an account?</h3>
                                <p>No, you do not need to register or create an account to use our tools. You can start converting, merging, or editing your PDFs instantly as a guest user.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Is there a limit on the number of files I can process?</h3>
                                <p>We try to keep limits as high as possible. Currently, there are generous limits on file size and the number of tasks you can perform per day to ensure fair usage for all users and server stability. For most standard users, you will likely never hit these limits.</p>
                            </div>
                        </div>
                    </section>

                    {/* Security & Privacy Section */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-primary border-b border-primary/20 pb-2">Security & Privacy</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Are my files safe?</h3>
                                <p>Absolutely. Security is our top priority. All file transfers are encrypted using SSL/TLS technology. We strictly do not read, view, or share your files.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">How long do you keep my files?</h3>
                                <p>Your files are only stored temporarily on our servers for processing. They are <strong>automatically deleted</strong> immediately after your download is ready. We do not retain any user data.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Do you claim ownership of my content?</h3>
                                <p>No. You retain full ownership and copyright of all files you upload and process with our service. We simply act as a processing utility.</p>
                            </div>
                        </div>
                    </section>

                    {/* Technical Section */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-primary border-b border-primary/20 pb-2">Using the Tools</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Can I use PDFToolskit on my phone or tablet?</h3>
                                <p>Yes! Our website is fully responsive and works on all modern devices, including smartphones (iOS, Android) and tablets. You can manage your PDF documents on the go directly from your mobile browser.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Which browsers are supported?</h3>
                                <p>We support all modern web browsers including Google Chrome, Mozilla Firefox, Safari, Microsoft Edge, and Opera. For the best experience, we recommend keeping your browser updated to the latest version.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Why did my conversion fail?</h3>
                                <p>Conversion failures can happen due to a few reasons: the file might be password-protected, encrypted, corrupted, or it might exceed our processing time limits if it is extremely large or complex. If you encounter an error, try compressing the file first or check if it&apos;s password-protected.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Can I convert Scanned PDFs?</h3>
                                <p>Yes, many of our tools support scanned PDFs. However, creating editable text from scanned images requires OCR (Optical Character Recognition) technology, which handles text extraction. Check our specific &quot;OCR PDF&quot; tool for this functionality.</p>
                            </div>
                        </div>
                    </section>

                    {/* Developer & Support Section */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-primary border-b border-primary/20 pb-2">Support & Feedback</h2>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">I have a feature request or found a bug.</h3>
                                <p>We love feedback! If you have an idea for a new tool or found something not working right, please email us at <a href="mailto:saifnaimuddinqadri@gmail.com" className="text-primary hover:underline">saifnaimuddinqadri@gmail.com</a>. We read every email.</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-slate-800 dark:text-slate-100">Do you offer an API for developers?</h3>
                                <p>Currently, we do not have a public API available. However, we are considering it for the future. If you are interested, please contact us to let us know!</p>
                            </div>
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
}
