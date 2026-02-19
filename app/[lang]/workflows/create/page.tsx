'use client';

import React, { useState } from 'react';
// import { motion } from 'framer-motion';
import { Plus, Trash2, GripVertical, Play, Download, Sparkles, FileText, Lock, Key, Droplet, Layers, FileType, CheckCircle } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { FileUpload } from '@/components/shared/FileUpload';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { ToolHeader } from '@/components/shared/ToolHeader';
import { useSubscription } from '@/components/providers/SubscriptionProvider';
import { downloadFile, validatePDFFile, getBaseFileName, formatFileSize } from '@/lib/utils';
import { WorkflowStep, workflowEngine, WorkflowAction } from '@/lib/workflow-engine';

// --- Types ---

interface StepConfig extends WorkflowStep {
    id: string; // override to be mandatory
}

const AVAILABLE_ACTIONS: { id: WorkflowAction; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'watermark', label: 'Add Watermark', icon: <Droplet className="w-4 h-4 text-cyan-400" />, description: 'Overlay text on pages' },
    { id: 'pageNumbers', label: 'Add Page Numbers', icon: <FileType className="w-4 h-4 text-emerald-400" />, description: 'Insert page numbers' },
    { id: 'protect', label: 'Protect PDF', icon: <Lock className="w-4 h-4 text-red-400" />, description: 'Encrypt with password' },
    { id: 'unlock', label: 'Unlock PDF', icon: <Key className="w-4 h-4 text-amber-400" />, description: 'Remove password' },
    { id: 'compress', label: 'Compress', icon: <Layers className="w-4 h-4 text-blue-400" />, description: 'Reduce file size' },
    { id: 'rotate', label: 'Rotate', icon: <GripVertical className="w-4 h-4 text-purple-400" />, description: 'Rotate pages' },
    { id: 'flatten', label: 'Flatten', icon: <FileText className="w-4 h-4 text-stone-400" />, description: 'Make fields/forms static' },
];

export default function CreateWorkflowPage() {
    const { limits, isPro } = useSubscription();

    // -- State --
    const [file, setFile] = useState<File | null>(null);
    const [steps, setSteps] = useState<StepConfig[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentStepInfo, setCurrentStepInfo] = useState<string>('');
    const [result, setResult] = useState<{ blob: Blob; fileName: string } | null>(null);

    // -- DnD Sensors --
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // -- Handlers --

    const handleFileSelected = (files: File[]) => {
        const validation = validatePDFFile(files[0]);
        if (validation.valid) {
            setFile(files[0]);
            toast.success('File loaded. Now define your workflow.');
        } else {
            toast.error(validation.error || 'Invalid file');
        }
    };

    const addStep = (actionId: WorkflowAction) => {
        const newStep: StepConfig = {
            id: `step-${Date.now()}`,
            action: actionId,
            params: getDefaultParams(actionId),
        };
        setSteps([...steps, newStep]);
    };

    const removeStep = (id: string) => {
        setSteps(steps.filter(s => s.id !== id));
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateStepParams = (id: string, newParams: any) => {
        setSteps(steps.map(s => s.id === id ? { ...s, params: { ...s.params, ...newParams } } : s));
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setSteps((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const runWorkflow = async () => {
        if (!file || steps.length === 0) return;

        setProcessing(true);
        setProgress(0);
        setResult(null);

        try {
            // Mock progress for better UX + Actual Engine execution
            // const _processedSteps = 0;
            // const total = steps.length;
            // const _stepWeight = 100 / total;

            // Hook into engine logs or just simulate? 
            // The engine runs synchronously (await step 1, await step 2).
            // We can't tap into it easily without a callback.
            // Let's modify the engine later to accept a progress callback, OR
            // Just wrap the engine call.

            // Actually, we can just run the loop here directly if we imported the functions?
            // No, use the engine. Engine is cleaner.
            // But Engine executes all at once.
            // Let's assume Engine is fast enough or we implement callbacks later.
            // For now, fake progress to 10% then jump.

            setProgress(10);
            setCurrentStepInfo('Starting workflow engine...');

            const outcome = await workflowEngine.execute(file, steps);

            // Success
            setProgress(100);
            setCurrentStepInfo('Workflow Complete!');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const blob = new Blob([outcome.pdfBytes as any], { type: 'application/pdf' });
            setResult({ blob, fileName: `workflow_result_${getBaseFileName(file.name)}.pdf` });
            toast.success('Workflow executed successfully!');

        } catch (error) {
            console.error(error);
            toast.error('Workflow failed. Check console for details.');
        } finally {
            setProcessing(false);
        }
    };


    // -- Helper: Default Params Factory --
    const getDefaultParams = (action: WorkflowAction) => {
        switch (action) {
            case 'watermark': return { text: 'CONFIDENTIAL', options: { opacity: 0.5, size: 50, color: { r: 0.5, g: 0.5, b: 0.5 }, rotation: 45, layout: 'single' } };
            case 'pageNumbers': return { location: 'bottom-center', startNumber: 1, textPattern: '{n}', margin: 20 };
            case 'protect': return { password: 'password123', settings: { printing: 'highResolution' } };
            case 'unlock': return { password: '' };
            case 'compress': return { quality: 0.5 };
            case 'rotate': return { rotation: 90 };
            case 'flatten': return { options: {} };
            default: return {};
        }
    };

    return (
        <div className="container mx-auto px-4 py-12 lg:py-20 max-w-6xl">
            <ToolHeader
                toolId="createWorkflow"
                title="Workflow Builder"
                description="Chain multiple tools together into a single automated pipeline."
                icon={Sparkles}
                color="from-purple-500 to-pink-500"
            />

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Left: Builder Panel */}
                <div className="lg:col-span-2 space-y-6">

                    {/* 1. File Input */}
                    <GlassCard className="p-6">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs">1</span>
                            Input Document
                        </h3>
                        {file ? (
                            <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded bg-red-500/20 flex items-center justify-center text-red-500 font-bold text-xs">PDF</div>
                                    <div>
                                        <div className="font-medium text-white truncate max-w-[200px]">{file.name}</div>
                                        <div className="text-xs text-slate-400">{formatFileSize(file.size)}</div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => { setFile(null); setResult(null); }} className="text-red-400 hover:text-red-300">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <FileUpload
                                onFilesSelected={handleFileSelected}
                                files={[]}
                                multiple={false}
                                maxSize={limits.maxFileSize}
                                isPro={isPro}
                            />
                        )}
                    </GlassCard>

                    {/* 2. Step Builder */}
                    <GlassCard className="p-6 min-h-[400px]">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs">2</span>
                                Workflow Steps
                            </h3>
                            <div className="flex gap-2">
                                {/* Add Step Dropdown (Simplified as horizontal list for MVP) */}
                                {AVAILABLE_ACTIONS.slice(0, 3).map(action => (
                                    <button
                                        key={action.id}
                                        onClick={() => addStep(action.id)}
                                        className="text-xs px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 border border-slate-700 transition-colors flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3" /> {action.label}
                                    </button>
                                ))}
                                {/* More... */}
                            </div>
                        </div>

                        {steps.length === 0 ? (
                            <div className="border-2 border-dashed border-slate-700 rounded-xl p-12 text-center text-slate-500">
                                <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No steps added yet.</p>
                                <p className="text-sm">Add tools from the sidebar to verify the chain.</p>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={steps.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-3">
                                        {steps.map((step, index) => (
                                            <SortableStepItem
                                                key={step.id}
                                                step={step}
                                                index={index}
                                                onRemove={removeStep}
                                                onUpdate={updateStepParams}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </GlassCard>
                </div>

                {/* Right: Sidebar / Run Panel */}
                <div className="space-y-6">
                    {/* Add Tools Panel */}
                    <GlassCard className="p-6">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Available Tools</h3>
                        <div className="grid grid-cols-1 gap-2">
                            {AVAILABLE_ACTIONS.map(action => (
                                <button
                                    key={action.id}
                                    onClick={() => addStep(action.id)}
                                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800 transition-colors text-left group w-full"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center border border-slate-700 transition-colors">
                                        {action.icon}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors">{action.label}</div>
                                        <div className="text-xs text-slate-500">{action.description}</div>
                                    </div>
                                    <Plus className="w-4 h-4 ml-auto text-slate-600 group-hover:text-white opacity-0 group-hover:opacity-100 transition-all" />
                                </button>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Execution Card */}
                    <GlassCard className="p-6 sticky top-24 border-t-4 border-t-purple-500">
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="text-slate-400">Total Steps</span>
                                <span className="text-white font-bold">{steps.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Est. Time</span>
                                <span className="text-white">~{steps.length * 2}s</span>
                            </div>
                        </div>

                        {!processing && !result && (
                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full"
                                onClick={runWorkflow}
                                disabled={!file || steps.length === 0}
                                icon={<Play className="w-5 h-5" />}
                            >
                                Run Workflow
                            </Button>
                        )}

                        {processing && (
                            <div className="space-y-2">
                                <ProgressBar progress={progress} label={currentStepInfo} />
                            </div>
                        )}

                        {result && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                                    <div>
                                        <div className="font-bold text-emerald-400">Success!</div>
                                        <div className="text-xs text-emerald-500/80">Workflow completed.</div>
                                    </div>
                                </div>
                                <Button
                                    variant="primary"
                                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                                    onClick={() => downloadFile(result.blob, result.fileName)}
                                    icon={<Download className="w-5 h-5" />}
                                >
                                    Download Result
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setResult(null)} className="w-full">
                                    Reset
                                </Button>
                            </div>
                        )}

                    </GlassCard>
                </div>
            </div>
        </div>
    );
}

// --- Subcomponent: Sortable Step Item ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SortableStepItem({ step, index, onRemove, onUpdate }: { step: StepConfig, index: number, onRemove: (id: string) => void, onUpdate: (id: string, p: any) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: step.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    // Quick Params UI based on action
    const renderParams = () => {
        if (step.action === 'watermark') {
            return (
                <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                        type="text"
                        value={step.params.text}
                        onChange={(e) => onUpdate(step.id, { text: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                        placeholder="Watermark Text"
                    />
                    <select
                        value={step.params.options.layout}
                        onChange={(e) => onUpdate(step.id, { options: { ...step.params.options, layout: e.target.value } })}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                    >
                        <option value="single">Single</option>
                        <option value="mosaic">Mosaic</option>
                    </select>
                </div>
            );
        }
        if (step.action === 'protect' || step.action === 'unlock') {
            return (
                <div className="mt-2">
                    <input
                        type="password"
                        value={step.params.password}
                        onChange={(e) => onUpdate(step.id, { password: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                        placeholder="Password"
                    />
                </div>
            );
        }
        if (step.action === 'pageNumbers') {
            return (
                <div className="mt-2">
                    <input
                        type="text"
                        value={step.params.textPattern}
                        onChange={(e) => onUpdate(step.id, { textPattern: e.target.value })}
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white w-full"
                        placeholder="{n} of {total}"
                    />
                    <div className="flex gap-2 mt-1">
                        <label className="flex items-center gap-1 text-xs text-slate-400">
                            <input
                                type="checkbox"
                                checked={step.params.mirror}
                                onChange={(e) => onUpdate(step.id, { mirror: e.target.checked })}
                            /> Mirror
                        </label>
                    </div>
                </div>
            );
        }
        // Add more quick params for other tools
        return null;
    };

    const actionInfo = AVAILABLE_ACTIONS.find(a => a.id === step.action);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group relative bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg p-3 transition-colors"
        >
            <div className="flex items-start gap-3">
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-1 text-slate-500 hover:text-white cursor-grab active:cursor-grabbing"
                >
                    <GripVertical className="w-5 h-5" />
                </button>

                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-blue-400">Step {index + 1}</span>
                            <span className="text-sm font-semibold text-white flex items-center gap-1">
                                {actionInfo?.icon} {actionInfo?.label}
                            </span>
                        </div>
                        <button
                            onClick={() => onRemove(step.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Params Editor */}
                    {renderParams()}
                </div>
            </div>

            {/* Connector Line Logic (visual only) */}
            <div className="absolute left-5 -bottom-4 w-0.5 h-4 bg-slate-700 group-last:hidden" />
        </div>
    );
}
