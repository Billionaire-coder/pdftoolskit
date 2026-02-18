import React from 'react';
import { WorkflowStep } from '@/lib/workflow-engine';
import { Trash2, GripVertical, Settings } from 'lucide-react';

interface StepCardProps {
    step: WorkflowStep;
    index: number;
    onUpdate: (id: string, updates: Partial<WorkflowStep>) => void;
    onRemove: (id: string) => void;
}

export function StepCard({ step, index, onUpdate, onRemove }: StepCardProps) {

    const renderSettings = () => {
        switch (step.action) {
            case 'rotate':
                return (
                    <div className="flex gap-4 items-center mt-3">
                        <label className="text-sm text-slate-400">Rotation:</label>
                        <select
                            value={step.params.rotation || 90}
                            onChange={(e) => onUpdate(step.id, {
                                params: { ...step.params, rotation: parseInt(e.target.value) }
                            })}
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value={90}>90° Clockwise</option>
                            <option value={180}>180°</option>
                            <option value={270}>90° Counter-Clockwise</option>
                        </select>
                    </div>
                );

            case 'compress':
                return (
                    <div className="flex gap-4 items-center mt-3">
                        <label className="text-sm text-slate-400">Quality:</label>
                        <select
                            value={step.params.quality || 0.7}
                            onChange={(e) => onUpdate(step.id, {
                                params: { ...step.params, quality: parseFloat(e.target.value) }
                            })}
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value={0.8}>Low Compression (High Quality)</option>
                            <option value={0.7}>Medium Compression</option>
                            <option value={0.5}>High Compression (Low Quality)</option>
                        </select>
                    </div>
                );

            case 'protect':
                return (
                    <div className="flex gap-4 items-center mt-3">
                        <label className="text-sm text-slate-400">Password:</label>
                        <input
                            type="password"
                            placeholder="Enter password"
                            value={step.params.password || ''}
                            onChange={(e) => onUpdate(step.id, {
                                params: { ...step.params, password: e.target.value }
                            })}
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none w-full max-w-[200px]"
                        />
                    </div>
                );

            case 'watermark':
                return (
                    <div className="flex flex-col gap-3 mt-3">
                        <div className="flex gap-4 items-center">
                            <label className="text-sm text-slate-400 w-16">Text:</label>
                            <input
                                type="text"
                                placeholder="Watermark text"
                                value={step.params.text || ''}
                                onChange={(e) => onUpdate(step.id, {
                                    params: { ...step.params, text: e.target.value }
                                })}
                                className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none flex-1"
                            />
                        </div>
                        <div className="flex gap-4 items-center">
                            <label className="text-sm text-slate-400 w-16">Opacity:</label>
                            <input
                                type="range"
                                min="0.1"
                                max="1"
                                step="0.1"
                                value={step.params.opacity || 0.5}
                                onChange={(e) => onUpdate(step.id, {
                                    params: { ...step.params, opacity: parseFloat(e.target.value) }
                                })}
                                className="flex-1 accent-blue-500"
                            />
                            <span className="text-xs text-slate-500 w-8">{step.params.opacity || 0.5}</span>
                        </div>
                    </div>
                );
            case 'pageNumbers':
                return (
                    <div className="flex gap-4 items-center mt-3">
                        <label className="text-sm text-slate-400">Position:</label>
                        <select
                            value={step.params.position || 'bottom-center'}
                            onChange={(e) => onUpdate(step.id, {
                                params: { ...step.params, position: e.target.value }
                            })}
                            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="bottom-center">Bottom Center</option>
                            <option value="bottom-right">Bottom Right</option>
                            <option value="bottom-left">Bottom Left</option>
                            <option value="top-center">Top Center</option>
                            <option value="top-right">Top Right</option>
                            <option value="top-left">Top Left</option>
                        </select>
                    </div>
                );

            case 'flatten':
                return (
                    <div className="mt-2 text-xs text-slate-500 italic">
                        Flattens form fields and annotations.
                    </div>
                );

            default:
                return (
                    <div className="mt-2 text-xs text-slate-500 italic">
                        No settings available for this step.
                    </div>
                );
        }
    };

    const getStepIcon = () => {
        // You could map icons here, for now using generic names styled
        return null;
    };

    return (
        <div className="group relative flex gap-4 p-4 rounded-xl bg-slate-900/50 border border-white/5 hover:border-blue-500/30 transition-all mb-3 text-left">
            <div className="flex items-center text-slate-600 cursor-grab active:cursor-grabbing">
                <GripVertical className="w-5 h-5" />
            </div>

            <div className="flex-1">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-mono">
                            {index + 1}
                        </span>
                        <h3 className="font-medium text-white capitalize">
                            {step.action.replace(/([A-Z])/g, ' $1').trim()}
                        </h3>
                    </div>
                    <button
                        onClick={() => onRemove(step.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <div className="pl-9">
                    {renderSettings()}
                </div>
            </div>
        </div>
    );
}
