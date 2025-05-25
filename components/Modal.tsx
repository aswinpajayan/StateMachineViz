
import React from 'react';
import { XIcon } from './icons/ActionIcons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  // Props for editable transition rules (will be part of children if needed by App.tsx)
  // rules?: string; // Kept if children content needs it, but save logic generalized
  // onRulesChange?: (newRules: string) => void; // Kept if children content needs it

  // Generic primary action
  onSavePrimaryAction?: () => void;
  primaryActionText?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  onSavePrimaryAction,
  primaryActionText
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 dark:bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ease-in-out"
      onClick={onClose} 
    >
      <div 
        className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-lg shadow-2xl w-full max-w-lg relative text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()} 
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
            aria-label="Close modal"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="overflow-y-auto pr-1 flex-grow"> 
          {children}
        </div>
        {onSavePrimaryAction && primaryActionText && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={onSavePrimaryAction}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
            >
              {primaryActionText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
