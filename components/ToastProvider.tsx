"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  id: string;
  message: string;
}

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600); // 2.6s auto-dismiss per spec
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-[10000] flex flex-col items-center pointer-events-none gap-3">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className="bg-card-solid backdrop-blur-xl text-foreground px-7 py-3.5 rounded-full font-semibold text-[0.85rem] shadow-[0_20px_35px_-12px_rgba(0,0,0,0.3)] border-l-[3px] border-secondary animate-in slide-in-from-bottom-8 fade-in duration-300 font-sans pointer-events-auto flex items-center whitespace-nowrap"
          >
             <i className="fas fa-check-circle mr-2 text-secondary"></i> {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};
