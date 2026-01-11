import { useState, useCallback, useRef, useEffect } from "react";

// Helper Hook to manage temporary states (e.g. showing checkmark for 2s)
export function useTemporarySet<T>(duration: number = 2000) {
    const [items, setItems] = useState<T[]>([]);
    const timersRef = useRef<Map<T, NodeJS.Timeout>>(new Map());

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            timersRef.current.forEach(timer => clearTimeout(timer));
            timersRef.current.clear();
        };
    }, []);

    const add = useCallback((item: T) => {
        setItems(prev => {
            if (prev.includes(item)) return prev;
            return [...prev, item];
        });

        // Clear existing timer if any
        if (timersRef.current.has(item)) {
            clearTimeout(timersRef.current.get(item)!);
        }

        // Set new timer
        const timer = setTimeout(() => {
            setItems(prev => prev.filter(i => i !== item));
            timersRef.current.delete(item);
        }, duration);

        timersRef.current.set(item, timer);
    }, [duration]);

    const clear = useCallback(() => {
        timersRef.current.forEach(timer => clearTimeout(timer));
        timersRef.current.clear();
        setItems([]);
    }, []);

    return { items, add, clear };
}
