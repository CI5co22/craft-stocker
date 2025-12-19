
import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDestructive ? 'bg-red-50 dark:bg-red-900/20 text-red-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex gap-3 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg text-white font-medium shadow-sm transition-all active:scale-95 text-sm flex items-center gap-2 ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-red-900/40' 
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-emerald-900/40'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
