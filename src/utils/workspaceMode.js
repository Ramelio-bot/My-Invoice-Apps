import { useState, useEffect, useCallback } from 'react';

export const WORKSPACE_MODES = ['all', 'b2b', 'pos'];
const STORAGE_PREFIX = 'myinvoice_workspace_mode_';
const CHANGE_EVENT = 'myinvoice-workspace-mode-changed';

/**
 * Resolve localStorage key for the active workspace mode per user.
 */
function getStorageKey(userId) {
    return `${STORAGE_PREFIX}${userId || 'default'}`;
}

/**
 * Read stored workspace mode ('all' | 'b2b' | 'pos'). Defaults to 'all'.
 */
export function getWorkspaceMode(userId) {
    try {
        const val = localStorage.getItem(getStorageKey(userId));
        if (WORKSPACE_MODES.includes(val)) return val;
    } catch { /* ignore storage restrictions */ }
    return 'all';
}

/**
 * Persist workspace mode and notify listeners across Sidebar and Dashboard.
 */
export function setWorkspaceMode(mode, userId) {
    const safeMode = WORKSPACE_MODES.includes(mode) ? mode : 'all';
    try {
        localStorage.setItem(getStorageKey(userId), safeMode);
    } catch { /* ignore storage restrictions */ }
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: { mode: safeMode, userId } }));
    }
    return safeMode;
}

/**
 * Infer clean default workspace mode from OnboardingWizard selected features.
 */
export function inferWorkspaceModeFromFeatures(features = []) {
    const list = Array.isArray(features) ? features : [];
    const hasPos = list.includes('kasir') || list.includes('karyawan');
    const hasB2b = list.includes('invoice') || list.includes('hutang');
    if (hasPos && !hasB2b) return 'pos';
    if (hasB2b && !hasPos) return 'b2b';
    return 'all';
}

/**
 * React hook keeping workspace mode synchronized across UI components.
 */
export function useWorkspaceMode(userId) {
    const [mode, setModeState] = useState(() => getWorkspaceMode(userId));

    useEffect(() => {
        setModeState(getWorkspaceMode(userId));
    }, [userId]);

    useEffect(() => {
        const handler = (e) => {
            if (!e?.detail?.userId || !userId || e.detail.userId === userId) {
                setModeState(getWorkspaceMode(userId));
            }
        };
        window.addEventListener(CHANGE_EVENT, handler);
        return () => window.removeEventListener(CHANGE_EVENT, handler);
    }, [userId]);

    const updateMode = useCallback((nextMode) => {
        const saved = setWorkspaceMode(nextMode, userId);
        setModeState(saved);
    }, [userId]);

    return [mode, updateMode];
}
