import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد الحذف',
  cancelText = 'تراجع',
  variant = 'danger'
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm rtl" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white dark:bg-dark-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-brand-border relative"
          >
            <div className="p-8">
              <div className="flex flex-col items-center text-center gap-6 mb-8">
                <div className={cn(
                  "p-5 rounded-full",
                  variant === 'danger' ? "bg-red-50 text-red-500" :
                  variant === 'warning' ? "bg-amber-50 text-amber-500" :
                  "bg-blue-50 text-blue-500"
                )}>
                  <AlertTriangle size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-serif font-bold dark:text-dark-text mb-2">{title}</h3>
                  <p className="text-slate-500 dark:text-dark-muted text-sm leading-relaxed">
                    {message}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={cn(
                    "flex-1 py-4 px-6 rounded-xl font-bold transition-all active:scale-95 shadow-md",
                    variant === 'danger' ? "bg-red-500 text-white hover:bg-red-600 shadow-red-200 dark:shadow-none" :
                    variant === 'warning' ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200 dark:shadow-none" :
                    "bg-brand-pink text-brand-accent hover:bg-brand-pink/80 shadow-pink-100 dark:shadow-none"
                  )}
                >
                  {confirmText}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-4 px-6 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-dark-text hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                >
                  {cancelText}
                </button>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 left-4 p-2 text-slate-300 hover:text-slate-500 dark:hover:text-dark-text transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
