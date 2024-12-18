import { useState, useCallback } from 'react';

interface Toast {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
}

interface ToastState extends Toast {
    id: number;
}

export const useToast = () => {
    const [toasts, setToasts] = useState<ToastState[]>([]);

    const toast = useCallback((toast: Toast) => {
        const id = Date.now();
        setToasts(prev => [...prev, { ...toast, id }]);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    return { toast, toasts };
};
