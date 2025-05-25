
import React, { useEffect, useRef } from 'react';
import { ContextMenuAction } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, actions, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    // Add mousedown listener to handle clicks outside, keydown handled in App.tsx
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const style: React.CSSProperties = {
    position: 'fixed',
    top: `${y}px`,
    left: `${x}px`,
    zIndex: 1000, // Ensure it's above other elements
  };

  return (
    <div
      id="custom-context-menu" // For App.tsx's outside click detection
      ref={menuRef}
      style={style}
      className="bg-white dark:bg-slate-700 rounded-md shadow-xl border border-slate-200 dark:border-slate-600 py-1 min-w-[180px]"
    >
      <ul>
        {actions.map((action, index) => (
          <li key={index}>
            <button
              onClick={() => {
                action.onClick();
                onClose(); // Close menu after action
              }}
              className="w-full flex items-center px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-600"
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
