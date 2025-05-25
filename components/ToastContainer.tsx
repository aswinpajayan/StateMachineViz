
import React from 'react';
import { ToastMessage } from '../types';
import { Toast } from './Toast';

interface ToastContainerProps {
  toasts: ToastMessage[];
  removeToast: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-5 right-5 z-[100] w-auto max-w-sm space-y-3">
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};
