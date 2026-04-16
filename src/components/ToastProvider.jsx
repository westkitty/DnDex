import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, History, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={cn(
                "pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl glass-dark border border-white/10 shadow-2xl min-w-[280px] max-w-md",
                toast.type === 'history' && "border-indigo-500/30 bg-indigo-950/20",
                toast.type === 'success' && "border-health-base/30 bg-health-base/5",
                toast.type === 'warning' && "border-warning-base/30 bg-warning-dark/5"
              )}
            >
              <div className="shrink-0">
                {toast.type === 'history' && <History className="w-5 h-5 text-indigo-400" />}
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-health-base" />}
                {toast.type === 'warning' && <AlertCircle className="w-5 h-5 text-warning-base" />}
                {toast.type === 'info' && <Info className="w-5 h-5 text-dragon-400" />}
              </div>
              
              <div className="flex-1 text-sm font-semibold text-white/90 leading-tight">
                {toast.message}
              </div>

              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-white/5 rounded-lg transition-colors text-dragon-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
