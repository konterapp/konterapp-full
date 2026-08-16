'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

const STORAGE_KEY = 'administrator-sidebar-width';
const DEFAULT_WIDTH = 288;
const COLLAPSED_WIDTH = 80;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;
const COLLAPSE_THRESHOLD = 120;

interface SidebarContextType {
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    sidebarWidth: number;
    setSidebarWidth: (width: number) => void;
    collapsedWidth: number;
    minWidth: number;
    maxWidth: number;
    collapseThreshold: number;
    isMobileOpen: boolean;
    setIsMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [sidebarWidth, setSidebarWidthState] = useState(DEFAULT_WIDTH);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    // Load saved width from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = Number(saved);
            if (parsed >= MIN_WIDTH && parsed <= MAX_WIDTH) {
                setSidebarWidthState(parsed);
            }
        }
    }, []);

    const setSidebarWidth = useCallback((width: number) => {
        const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, width));
        setSidebarWidthState(clamped);
        localStorage.setItem(STORAGE_KEY, String(clamped));
    }, []);

    return (
        <SidebarContext.Provider value={{
            isCollapsed,
            setIsCollapsed,
            sidebarWidth,
            setSidebarWidth,
            collapsedWidth: COLLAPSED_WIDTH,
            minWidth: MIN_WIDTH,
            maxWidth: MAX_WIDTH,
            collapseThreshold: COLLAPSE_THRESHOLD,
            isMobileOpen,
            setIsMobileOpen,
        }}>
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
