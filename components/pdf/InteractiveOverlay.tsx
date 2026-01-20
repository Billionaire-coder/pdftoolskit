'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface SelectionRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface InteractiveOverlayProps {
    width: number;
    height: number;
    selection: SelectionRect | null;
    onSelectionChange: (rect: SelectionRect) => void;
    mode?: 'draw' | 'view'; // default 'draw'
    label?: string;
    className?: string;
    children?: React.ReactNode;
    color?: string; // Hex color for border/bg
}

export function InteractiveOverlay({
    width,
    height,
    selection,
    onSelectionChange,
    mode = 'draw',
    label,
    className,
    children,
    color
}: InteractiveOverlayProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const getMousePos = (e: React.MouseEvent | TouchEvent) => {
        if (!containerRef.current) return { x: 0, y: 0 };
        const rect = containerRef.current.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if ('clientX' in e) {
            // MouseEvent
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        } else {
            return { x: 0, y: 0 };
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (mode !== 'draw') return;
        e.preventDefault(); // Prevent scrolling on touch
        const pos = getMousePos(e);
        setStartPos(pos);
        setIsDragging(true);

        // Initial click starts a 0-size box
        onSelectionChange({ x: pos.x, y: pos.y, width: 0, height: 0 });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const currentPos = getMousePos(e);

        // Calculate new rect based on startPos and currentPos
        const x = Math.min(startPos.x, currentPos.x);
        const y = Math.min(startPos.y, currentPos.y);
        const w = Math.abs(currentPos.x - startPos.x);
        const h = Math.abs(currentPos.y - startPos.y);

        // Constrain to container
        const constrainedX = Math.max(0, x);
        const constrainedY = Math.max(0, y);
        const constrainedW = Math.min(w, width - constrainedX);
        const constrainedH = Math.min(h, height - constrainedY);

        onSelectionChange({
            x: constrainedX,
            y: constrainedY,
            width: constrainedW,
            height: constrainedH
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleTouchStart = (e: any) => {
        if (mode !== 'draw') return;
        // logic for touch...
        // For now let's just use mouse events, touch is tricky with scrolling
        // We can expand later if needed.
    };

    return (
        <div
            ref={containerRef}
            className={cn("absolute inset-0 cursor-crosshair touch-none select-none z-20", className)}
            style={{ width, height }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Overlay background (dimmed) */}
            {/* If we want to dim the area OUTSIDE the selection, we need complex CSS or SVG mask */}
            {/* For now, just show the box */}

            {selection && selection.width > 0 && (
                <div
                    className={cn("absolute border-2 shadow-sm", !color && "border-red-500 bg-red-500/20")}
                    style={{
                        left: selection.x,
                        top: selection.y,
                        width: selection.width,
                        height: selection.height,
                        borderColor: color,
                        backgroundColor: color ? `${color}33` : undefined // 20% opacity approx
                    }}
                >
                    {label && (
                        <div
                            className={cn("absolute -top-6 left-0 text-white text-xs px-2 py-1 rounded", !color && "bg-red-500")}
                            style={{ backgroundColor: color }}
                        >
                            {label}
                        </div>
                    )}

                    {children}

                    {/* Size indicator */}
                    <div className="absolute bottom-1 right-1 text-[10px] text-white bg-black/50 px-1 rounded pointer-events-none">
                        {Math.round(selection.width)} x {Math.round(selection.height)}
                    </div>
                </div>
            )}
        </div>
    );
}
