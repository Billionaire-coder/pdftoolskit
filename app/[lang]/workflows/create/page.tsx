'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Lucide from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { FileUpload } from '@/components/shared/FileUpload';
import { StepCard } from '@/components/workflow/StepCard';
import { StepControls } from '@/components/workflow/StepControls';
import { jobQueue } from '@/lib/services/job-queue';
import { useJobStore } from '@/lib/stores/job-store';
import { WorkflowActionType, WorkflowStep } from '@/lib/workflow-engine';
import { v4 as uuidv4 } from 'uuid';

import { WorkspaceSettings } from '@/components/shared/WorkspaceSettings';

export default function CreateWorkflowPage() {
    const { limits, isPro } = useSubscription();
    const { jobs, updateJob } = useJobStore();

    // State
    const [files, setFiles] = useState<File[]>([]);
    const [steps, setSteps] = useState<WorkflowStep[]>([]);
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [resultFiles, setResultFiles] = useState<File[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const activeJob = currentJobId ? jobs[currentJobId] : null;

    // Handlers
    const handleFilesSelected = (newFiles: File[]) => {
        setFiles(newFiles);
        setResultFiles(null);
        setError(null);
        setCurrentJobId(null);
    };

    const addStep = (type: WorkflowActionType) => {
        const newStep: WorkflowStep = {
            id: uuidv4(),
            type,
            settings: {}
        };
        setSteps([...steps, newStep]);
    };

    const updateStep = (id: string, updates: Partial<WorkflowStep>) => {
        setSteps(steps.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const removeStep = (id: string) => {
        setSteps(steps.filter(s => s.id !== id));
    };

    const runWorkflow = async () => {
        if (files.length === 0) {
            setError("Please upload at least one file.");
            return;
        }
        if (steps.length === 0) {
            setError("Please add at least one step to the workflow.");
            return;
        }

        setError(null);
        setResultFiles(null);

        try {
            const jobId = await jobQueue.enqueue(files, steps, 'Workflow Builder', {
                onComplete: (results) => {
                    setResultFiles(results);
                },
                onError: (err) => {
                    setError(err.message);
                }
            });
            setCurrentJobId(jobId);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "An unexpected error occurred.");
        }
    };

    const downloadResults = () => {
        if (!resultFiles) return;

        resultFiles.forEach(file => {
            const url = URL.createObjectURL(file);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    };

    return (
        <div className="container mx-auto px-4 py-20 lg:py-32">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-12">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 mb-4"
                    >
                        <div className="p-3 rounded-xl bg-blue-600/20 text-blue-400">
                            <Lucide.Workflow className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white">Workflow Builder</h1>
                            <p className="text-slate-400">Design your custom PDF automation pipeline.</p>
                        </div>
                    </motion.div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left Column: Input & Controls */}
                    <div className="space-y-6 lg:col-span-1">
                        <WorkspaceSettings />

                        {/* 1. Files */}
                        <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-xs text-white">1</span>
                                Input Files
                            </h2>
                            <FileUpload
                                onFilesSelected={handleFilesSelected}
                                accept={{ 'application/pdf': ['.pdf'] }}
                                multiple={true}
                                files={files}
                                onRemoveFile={(index) => {
                                    const newFiles = [...files];
                                    newFiles.splice(index, 1);
                                    setFiles(newFiles);
                                }}
                                maxSize={limits.maxFileSize}
                                isPro={isPro}
                            />
                        </div>

                        {/* 2. Controls */}
                        <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5 sticky top-24">
                            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-xs text-white">2</span>
                                Add Steps
                            </h2>
                            <StepControls onAddStep={addStep} />
                        </div>
                    </div>

                    {/* Right Column: Builder & Preview */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* 3. Workflow Steps */}
                        <div className="min-h-[400px] bg-slate-900/50 rounded-2xl p-6 border border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-xs text-white">3</span>
                                    Pipeline
                                </h2>
                                <span className="text-sm text-slate-500">{steps.length} steps</span>
                            </div>

                            {steps.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-xl text-slate-500">
                                    <Lucide.Workflow className="w-12 h-12 mb-4 opacity-50" />
                                    <p>No steps added yet.</p>
                                    <p className="text-sm">Use the controls on the left to add actions.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {steps.map((step, index) => (
                                            <motion.div
                                                key={step.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -10 }}
                                            >
                                                <StepCard
                                                    step={step}
                                                    index={index}
                                                    onUpdate={updateStep}
                                                    onRemove={removeStep}
                                                />
                                                {index < steps.length - 1 && (
                                                    <div className="flex justify-center py-2 text-slate-600">
                                                        <Lucide.ArrowRight className="w-5 h-5 rotate-90" />
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        {/* 4. Action Area */}
                        <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/5">
                            <div className="flex items-center justify-between">
                                <div>
                                    {error && (
                                        <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                                            <Lucide.CircleAlert className="w-4 h-4" />
                                            {error}
                                        </div>
                                    )}
                                    <p className="text-slate-400 text-sm">
                                        {resultFiles ? "Workflow completed successfully!" : "Ready to process?"}
                                    </p>
                                </div>

                                {resultFiles ? (
                                    <button
                                        onClick={downloadResults}
                                        className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-white font-semibold transition-all shadow-lg shadow-green-500/25 flex items-center gap-2"
                                    >
                                        <Lucide.Download className="w-5 h-5" />
                                        Download Results ({resultFiles.length})
                                    </button>
                                ) : (
                                    <button
                                        onClick={runWorkflow}
                                        disabled={activeJob?.status === 'processing' || files.length === 0 || steps.length === 0}
                                        className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeJob?.status === 'processing' || files.length === 0 || steps.length === 0
                                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                                            }`}
                                    >
                                        {activeJob?.status === 'processing' ? (
                                            <>
                                                <Lucide.Loader2 className="w-5 h-5 animate-spin" />
                                                Processing Workflow...
                                            </>
                                        ) : (
                                            <>
                                                <Lucide.Play className="w-5 h-5" />
                                                Run Workflow
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            {/* Progress Bar */}
                            {activeJob?.status === 'processing' && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                                        <span>{activeJob.error || 'Running steps...'}</span>
                                        <span>{activeJob.progress}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-blue-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${activeJob.progress}%` }}
                                            transition={{ duration: 0.5 }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
