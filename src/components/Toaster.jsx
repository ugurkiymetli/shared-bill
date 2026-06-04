import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function Toaster({ toasts, onRemoveToast }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
    info: <Info className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />,
  };

  const borderColors = {
    success: 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/95 dark:bg-emerald-950/95 shadow-lg text-emerald-900 dark:text-emerald-100',
    error: 'border-rose-200 dark:border-rose-900/50 bg-rose-50/95 dark:bg-rose-950/95 shadow-lg text-rose-900 dark:text-rose-100',
    info: 'border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 shadow-lg text-neutral-900 dark:text-neutral-100',
  };

  const closeButtonColors = {
    success: 'text-emerald-500 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300',
    error: 'text-rose-500 hover:text-rose-800 dark:text-rose-400 dark:hover:text-rose-300',
    info: 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-4 rounded-xl border flex items-start gap-3 pointer-events-auto shadow-2xl animate-fade-in ${borderColors[toast.type]}`}
        >
          <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
          <div className="flex-grow">
            <p className="text-xs font-semibold">{toast.message}</p>
          </div>
          <button
            onClick={() => onRemoveToast(toast.id)}
            className={`flex-shrink-0 transition-colors p-0.5 rounded-lg ${closeButtonColors[toast.type]}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
