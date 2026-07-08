import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export interface ToastProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
  onClose: (id: string) => void;
}

export default function Toast({ id, message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  const bgColor = 'bg-[#111827] border-[#1E2D50] shadow-2xl';

  const textColor = type === 'success' 
    ? 'text-emerald-400' 
    : type === 'error' 
      ? 'text-rose-400' 
      : 'text-amber-400';

  const Icon = type === 'success' 
    ? CheckCircle2 
    : type === 'error' 
      ? AlertTriangle 
      : AlertTriangle;

  const iconColor = type === 'success' 
    ? 'text-emerald-500' 
    : type === 'error' 
      ? 'text-rose-500' 
      : 'text-amber-500';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className={`flex items-center gap-3 p-4 border rounded-xl shadow-lg max-w-md w-full ${bgColor} ${textColor} relative`}
    >
      <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
      <div className="text-sm font-medium pr-6">{message}</div>
      <button 
        onClick={() => onClose(id)} 
        className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
