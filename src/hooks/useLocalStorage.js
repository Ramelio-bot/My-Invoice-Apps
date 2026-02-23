import { useState, useEffect, useCallback } from 'react';

function safeInitial(parsed, initialValue) {
    // If initialValue is an array, always return an array (never null/object/etc.)
    if (Array.isArray(initialValue)) {
        return Array.isArray(parsed) ? parsed : initialValue;
    }
    // If initialValue is an object (non-null), ensure we return an object
    if (initialValue !== null && typeof initialValue === 'object') {
        return (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : initialValue;
    }
    // For primitives, return parsed if it's the same type, else initialValue
    return (parsed !== null && parsed !== undefined) ? parsed : initialValue;
}

export function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        try {
            const stored = localStorage.getItem(key);
            const parsed = stored ? JSON.parse(stored) : initialValue;
            return safeInitial(parsed, initialValue);
        } catch {
            return initialValue;
        }
    });

    const setStoredValue = useCallback((newValue) => {
        setValue(prev => {
            const valueToStore = typeof newValue === 'function' ? newValue(prev) : newValue;
            try {
                localStorage.setItem(key, JSON.stringify(valueToStore));
            } catch (e) {
                console.error('localStorage error:', e);
            }
            return valueToStore;
        });
    }, [key]);

    return [value, setStoredValue];
}

export function useCountUp(target, duration = 1000) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (target === 0) { setCount(0); return; }
        let start = 0;
        const startTime = performance.now();
        const step = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(step);
            else setCount(target);
        };
        requestAnimationFrame(step);
    }, [target, duration]);

    return count;
}
