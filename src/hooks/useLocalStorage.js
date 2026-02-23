import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage(key, initialValue) {
    const [value, setValue] = useState(() => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : initialValue;
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
