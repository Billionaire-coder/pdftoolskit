'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, HelpCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ContactPage() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("https://formsubmit.co/ajax/saifnaimuddinqadri@gmail.com", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast.success('Message sent successfully!');
                setFormData({ name: '', email: '', subject: '', message: '' });
            } else {
                toast.error('Something went wrong. Please try again.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to send message.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    const isFormValid = formData.name.trim() !== '' && isEmailValid && formData.subject.trim() !== '' && formData.message.trim() !== '';

    return (
        <div className="container mx-auto px-4 py-12 md:py-20 max-w-6xl">
            {/* Hero Section */}
            <ToolHeader
                title="Get in Touch"
                description="Have questions about our PDF tools? Need help with a specific feature? We're here to help you optimize your document workflow."
                icon={Mail}
                color="from-blue-500 to-indigo-600"
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                {/* Contact Information */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-5 space-y-8"
                >
                    <div className="space-y-6">
                        <GlassCard className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-xl">
                                    <Mail className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Email Support</h3>
                                    <p className="text-slate-400 text-sm mb-3">
                                        For general inquiries and technical support.
                                    </p>
                                    <a href="mailto:saifnaimuddinqadri@gmail.com" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                                        saifnaimuddinqadri@gmail.com
                                    </a>
                                </div>
                            </div>
                        </GlassCard>

                        <GlassCard className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-purple-500/10 rounded-xl">
                                    <HelpCircle className="w-6 h-6 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-2">Help Center</h3>
                                    <p className="text-slate-400 text-sm mb-3">
                                        Check our frequently asked questions for quick answers.
                                    </p>
                                    <Link href="/faq">
                                        <Button variant="ghost" size="sm" className="pl-0 gap-1 text-purple-400 hover:bg-purple-500/10">
                                            Visit FAQ <ArrowRight className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </GlassCard>
                    </div>
                </motion.div>

                {/* Contact Form */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-7"
                >
                    <GlassCard className="p-8">
                        <form
                            action="https://formsubmit.co/saifnaimuddinqadri@gmail.com"
                            method="POST"
                            onSubmit={handleSubmit} // Keep simulated UX for now, but allow native submission if JS fails? 
                            // Actually, let's use a pure fetch approach to avoid redirecting the user off-site
                            className="space-y-6"
                        >
                            {/* FormSubmit Configuration */}
                            <input type="hidden" name="_captcha" value="false" />
                            <input type="hidden" name="_subject" value="New Submission from PDFToolskit Contact Form" />
                            <input type="hidden" name="_template" value="table" />
                            {/* Redirect to same page just in case, but we try to intercept with AJAX */}
                            <input type="hidden" name="_next" value="http://localhost:3000/contact" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium text-slate-300">Your Name</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className="text-sm font-medium text-slate-300">Email Address</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="subject" className="text-sm font-medium text-slate-300">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject" // FormSubmit usually grabs all named inputs
                                    value={formData.subject}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="message" className="text-sm font-medium text-slate-300">Message</label>
                                <textarea
                                    id="message"
                                    name="message"
                                    value={formData.message}
                                    onChange={handleChange}
                                    required
                                    rows={5}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                                    placeholder="Tell us how we can help..."
                                />
                            </div>

                            <Button
                                type="submit"
                                className={`w-full ${!isFormValid ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                                size="lg"
                                loading={loading}
                                disabled={!isFormValid || loading}
                                icon={<Send className="w-5 h-5" />}
                            >
                                Send Message
                            </Button>
                        </form>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
}
