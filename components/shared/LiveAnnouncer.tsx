'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

type Announcement = {
    message: string;
    politeness: 'polite' | 'assertive';
    id: string;
};

interface LiveAnnouncerContextValue {
    announce: (message: string, politeness?: 'polite' | 'assertive') => void;
}

const LiveAnnouncerContext = createContext<LiveAnnouncerContextValue | null>(null);

export const useLiveAnnouncer = () => {
    const context = useContext(LiveAnnouncerContext);
    if (!context) {
        throw new Error('useLiveAnnouncer must be used within a LiveAnnouncerProvider');
    }
    return context;
};

export const LiveAnnouncerProvider = ({ children }: { children: React.ReactNode }) => {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null);

    const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
        // Use a unique ID to trigger re-renders even for same messages
        setAnnouncement({ message, politeness, id: Math.random().toString(36).substring(7) });
    }, []);

    return (
        <LiveAnnouncerContext.Provider value={{ announce }}>
            {children}
            <div
                className="sr-only"
                style={{
                    position: 'absolute',
                    width: '1px',
                    height: '1px',
                    padding: 0,
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0,
                }}
                aria-live={announcement?.politeness ?? 'polite'}
                aria-atomic="true"
            >
                {announcement?.message}
            </div>
        </LiveAnnouncerContext.Provider>
    );
};
