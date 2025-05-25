
import React, { useEffect } from 'react';
import { ToastMessage } from '../types';
import { InfoIcon, CheckCircleSolidIcon, ExclamationSolidIcon, XCircleSolidIcon, XIcon } from './icons/FeedbackIcons';

interface ToastProps {
  message: ToastMessage;
  onDismiss: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, onDismiss, duration = 5000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  const baseClasses = "flex items-center p-4 rounded-lg shadow-xl transition-all duration-300 ease-in-out transform";
  let typeClasses = "";
  let textAndIconColor = "text-white";
  let IconComponent: React.FC<React.SVGProps<SVGSVGElement>> | null = null;

  switch (message.type) {
    case 'success':
      typeClasses = "bg-green-500 dark:bg-green-600";
      IconComponent = CheckCircleSolidIcon;
      break;
    case 'error':
      typeClasses = "bg-red-500 dark:bg-red-600";
      IconComponent = XCircleSolidIcon;
      break;
    case 'warning':
        typeClasses = "bg-yellow-400 dark:bg-yellow-500";
        textAndIconColor = "text-yellow-900 dark:text-yellow-50"; // Darker text for light yellow, lighter for dark yellow
        IconComponent = ExclamationSolidIcon;
        break;
    case 'info':
    default:
      typeClasses = "bg-blue-500 dark:bg-blue-600";
      IconComponent = InfoIcon;
      break;
  }

  return (
    <div className={`${baseClasses} ${typeClasses} animate-fadeInRight ${textAndIconColor}`}>
      {IconComponent && <IconComponent className={`w-6 h-6 mr-3 flex-shrink-0 ${textAndIconColor}`} />}
      <span className={`flex-grow text-sm ${textAndIconColor}`}>{message.message}</span>
      <button 
        onClick={onDismiss} 
        className={`ml-4 p-1 rounded-full hover:bg-black hover:bg-opacity-20 transition-colors ${textAndIconColor}`}
        aria-label="Dismiss toast"
      >
        <XIcon className="w-4 h-4" />
      </button>
      <style>{`
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeInRight { animation: fadeInRight 0.3s ease-out; }
      `}</style>
    </div>
  );
};
