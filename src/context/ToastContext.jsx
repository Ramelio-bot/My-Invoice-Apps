import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

let toastId = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, type = 'success', duration = 3000) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, removeToast }) {
    if (toasts.length === 0) return null;
    return (
        <div className="toast-container">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`toast toast-${toast.type}`}
                    onClick={() => removeToast(toast.id)}
                    style={{ cursor: 'pointer' }}
                >
                    <span style={{ flex: 1 }}>{toast.message}</span>
                    <button
                        onClick={() => removeToast(toast.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: 18, lineHeight: 1, padding: 0 }}
                    >
                        &times;
                    </button>
                </div>
            ))}
        </div>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
