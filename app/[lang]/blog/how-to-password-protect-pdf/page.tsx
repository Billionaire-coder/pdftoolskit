import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Clock, Shield, Lock, ArrowRight, BookOpen } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { ToolHeader } from '@/components/shared/ToolHeader';

export const metadata: Metadata = {
    title: 'How to Password Protect a PDF in 2024 - Complete Guide | PDFToolskit',
    description: 'Learn how to password protect your PDF files for free. Step-by-step guide with best practices for PDF security and encryption. Protect sensitive documents now.',
    keywords: ['password protect pdf', 'pdf security', 'encrypt pdf', 'secure pdf files', 'pdf password protection'],
    alternates: {
        canonical: 'https://pdftoolskit.vercel.app/blog/how-to-password-protect-pdf',
    },
};

export default function PasswordProtectPDFGuide() {
    return (
        <article className="container mx-auto px-4 py-12 lg:py-20 max-w-4xl">
            <ToolHeader
                title="How to Password Protect a PDF in 2024"
                description="December 17, 2024 • 5 min read • A complete guide to PDF security"
                iconName="BookOpen"
                color="from-purple-500 to-pink-500"
            />

            {/* Article Content */}
            <div className="prose prose-invert prose-lg max-w-none">
                <GlassCard className="p-8 mb-8">
                    <h2 className="text-2xl font-heading font-bold text-white mb-4">
                        Why Password Protect PDFs?
                    </h2>
                    <p className="text-slate-300 mb-4">
                        Password protecting your PDF files adds an essential layer of security that prevents unauthorized access
                        to sensitive information. Here&apos;s why it&apos;s crucial:
                    </p>
                    <ul className="space-y-2 text-slate-300">
                        <li className="flex items-start gap-2">
                            <Shield className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                            <span><strong>Confidentiality:</strong> Keep financial records, contracts, and personal documents private</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Shield className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                            <span><strong>Compliance:</strong> Meet GDPR, HIPAA, and other regulatory requirements</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Shield className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                            <span><strong>Control:</strong> Restrict who can view, edit, or print your documents</span>
                        </li>
                    </ul>
                </GlassCard>

                <GlassCard className="p-8 mb-8">
                    <h2 className="text-2xl font-heading font-bold text-white mb-6">
                        How to Password Protect a PDF (Free Method)
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white font-bold text-sm">
                                    1
                                </span>
                                Upload Your PDF File
                            </h3>
                            <p className="text-slate-300 ml-10">
                                Visit our <Link href="/protect-pdf" className="text-primary hover:underline">Password Protect PDF tool</Link>.
                                Click the upload area or drag and drop your PDF file. All processing happens in your browser -
                                your file never leaves your device.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white font-bold text-sm">
                                    2
                                </span>
                                Create a Strong Password
                            </h3>
                            <p className="text-slate-300 ml-10 mb-3">
                                Enter a secure password (minimum 6 characters). For maximum security, use:
                            </p>
                            <ul className="text-slate-300 ml-10 space-y-1">
                                <li>• At least 12 characters</li>
                                <li>• Mix of uppercase and lowercase letters</li>
                                <li>• Numbers and special characters</li>
                                <li>• Avoid dictionary words or personal information</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gradient-primary text-white font-bold text-sm">
                                    3
                                </span>
                                Download Protected PDF
                            </h3>
                            <p className="text-slate-300 ml-10">
                                Click &quot;Protect PDF&quot; and wait a few seconds. Your password-encrypted PDF will download automatically.
                                Anyone trying to open it will need the password you set.
                            </p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-8 mb-8">
                    <h2 className="text-2xl font-heading font-bold text-white mb-4">
                        Best Practices for PDF Password Protection
                    </h2>
                    <div className="space-y-4 text-slate-300">
                        <div>
                            <h4 className="text-white font-semibold mb-2">✓ Use Different Passwords</h4>
                            <p>Don&apos;t reuse passwords across multiple PDF files. Each sensitive document deserves its own unique password.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-2">✓ Store Passwords Securely</h4>
                            <p>Use a password manager like 1Password, LastPass, or Bitwarden to securely store and manage your PDF passwords.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-2">✓ Share Passwords Safely</h4>
                            <p>Never send passwords via email. Use encrypted channels like Signal or share verbally if possible.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-2">✓ Update Passwords Regularly</h4>
                            <p>For highly sensitive documents, change passwords every 3-6 months.</p>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-8 mb-8 bg-gradient-to-br from-primary/10 to-pink-500/10 border-primary/20">
                    <div className="flex items-start gap-4">
                        <Lock className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="text-xl font-semibold text-white mb-3">
                                100% Secure & Private
                            </h3>
                            <p className="text-slate-300">
                                Our PDF encryption tool processes everything in your browser using AES-256 encryption.
                                Your files and passwords never touch our servers. It&apos;s completely free, with no registration required.
                            </p>
                            <Link
                                href="/protect-pdf"
                                className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-gradient-primary text-white rounded-lg font-semibold hover:shadow-glow transition-all"
                            >
                                Try Password Protect Tool
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-8">
                    <h2 className="text-2xl font-heading font-bold text-white mb-4">
                        Related Tools
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link href="/unlock-pdf" className="flex items-start gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <div>
                                <h4 className="text-white font-semibold mb-1">Unlock PDF</h4>
                                <p className="text-sm text-slate-400">Remove password protection from PDFs</p>
                            </div>
                        </Link>
                        <Link href="/merge-pdf" className="flex items-start gap-3 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                            <div>
                                <h4 className="text-white font-semibold mb-1">Merge PDF</h4>
                                <p className="text-sm text-slate-400">Combine multiple PDFs into one</p>
                            </div>
                        </Link>
                    </div>
                </GlassCard>
            </div>
        </article>
    );
}
