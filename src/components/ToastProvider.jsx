import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, History, AlertCircle, CheckCircle2, X, Zap } from 'lucide-react';
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
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -30, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)', transition: { duration: 0.2 } }}
              className={cn(
                "pointer-events-auto flex items-center gap-4 px-5 py-4 rounded-[1.5rem] bg-[var(--color-obsidian-900)] border shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[320px] max-w-lg",
                toast.type === 'history' && "border-indigo-500/30",
                toast.type === 'success' && "border-emerald-500/30",
                toast.type === 'warning' && "border-amber-500/30",
                toast.type === 'info' && "border-white/10"
              )}
            >
               <div className={cn(
                "p-2.5 rounded-xl shrink-0",
                toast.type === 'history' && "bg-indigo-500/10 text-indigo-400",
                toast.type === 'success' && "bg-emerald-500/10 text-emerald-400",
                toast.type === 'warning' && "bg-amber-500/10 text-amber-400",
                toast.type === 'info' && "bg-white/5 text-slate-400"
              )}>
                {toast.type === 'history' && <History className="w-5 h-5" />}
                {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {toast.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                {toast.type === 'info' && <Zap className="w-5 h-5" />}
              </div>
              
              <div className="flex-1">
                <div className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">Tactical Update</div>
                <div className="text-xs font-bold text-slate-100 leading-tight">
                  {toast.message}
                </div>
              </div>

              <button 
                onClick={() => removeToast(toast.id)}
                className="p-1.5 hover:bg-white/5 rounded-xl transition-all text-slate-600 hover:text-white"
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
