
import React, { useRef, useState } from 'react';
import { UploadIcon, CheckCircleIcon, PlayIcon, DownloadIcon, UndoIcon, RedoIcon } from './icons/ActionIcons';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from './icons/ThemeIcons';
import { ChevronDownIcon } from './icons/ChevronIcons';
import { useTheme } from '../contexts/ThemeContext';
import { Theme } from '../types';

interface TopBarProps {
  onFileUpload: (file: File) => void;
  onValidate: () => void;
  onRun: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  currentMachineName: string;
}

const Button: React.FC<React.PropsWithChildren<{ onClick?: () => void; className?: string; title?: string; disabled?: boolean }>> = ({ onClick, children, className = '', title, disabled }) => (
  <button
    onClick={onClick}
    title={title}
    disabled={disabled}
    className={`flex items-center px-3 py-2 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-md shadow-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 focus:ring-opacity-75 ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const themes: { value: Theme; label: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
    { value: 'light', label: 'Light', icon: SunIcon },
    { value: 'dark', label: 'Dark', icon: MoonIcon },
    { value: 'system', label: 'System', icon: ComputerDesktopIcon },
  ];

  const currentThemeConfig = themes.find(t => t.value === theme) || themes[2];

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 rounded-md shadow transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500"
        title="Change theme"
      >
        <currentThemeConfig.icon className="w-5 h-5 mr-2" />
        <span className="hidden sm:inline">{currentThemeConfig.label}</span>
        <ChevronDownIcon className={`w-4 h-4 ml-1 sm:ml-2 transform transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-700 rounded-md shadow-xl z-10 border border-slate-200 dark:border-slate-600">
          {themes.map(t => (
            <button
              key={t.value}
              onClick={() => {
                setTheme(t.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center px-4 py-2 text-sm text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 ${theme === t.value ? 'bg-slate-100 dark:bg-slate-600 font-semibold' : ''}`}
            >
              <t.icon className="w-5 h-5 mr-3" />
              {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};


export const TopBar: React.FC<TopBarProps> = ({ 
  onFileUpload, 
  onValidate, 
  onRun, 
  onExport, 
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  currentMachineName 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-700 p-3 shadow-lg flex justify-between items-center border-b border-slate-300 dark:border-slate-600">
      <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100 truncate max-w-xs sm:max-w-md md:max-w-lg">
        State Machine: <span className="text-blue-600 dark:text-blue-400">{currentMachineName}</span>
      </h1>
      <div className="flex items-center space-x-1 sm:space-x-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".json"
          className="hidden"
          id="json-upload"
        />
        <Button onClick={() => fileInputRef.current?.click()} title="Upload JSON">
          <UploadIcon className="w-5 h-5 md:mr-1" /> <span className="hidden md:inline">Upload</span>
        </Button>
        <Button onClick={onValidate} title="Validate State Machine">
          <CheckCircleIcon className="w-5 h-5 md:mr-1" /> <span className="hidden md:inline">Validate</span>
        </Button>
        <Button onClick={onRun} title="Run State Machine">
          <PlayIcon className="w-5 h-5 md:mr-1" /> <span className="hidden md:inline">Run</span>
        </Button>
        <Button onClick={onExport} title="Export to JSON">
          <DownloadIcon className="w-5 h-5 md:mr-1" /> <span className="hidden md:inline">Export</span>
        </Button>
        <div className="h-6 w-px bg-slate-300 dark:bg-slate-500 mx-1"></div> {/* Divider */}
        <Button onClick={onUndo} title="Undo" disabled={!canUndo}>
          <UndoIcon className="w-5 h-5 md:mr-1" /> <span className="hidden md:inline">Undo</span>
        </Button>
        <Button onClick={onRedo} title="Redo" disabled={!canRedo}>
          <RedoIcon className="w-5 h-5 md:mr-1" /> <span className="hidden md:inline">Redo</span>
        </Button>
        <div className="h-6 w-px bg-slate-300 dark:bg-slate-500 mx-1"></div> {/* Divider */}
        <ThemeSwitcher />
      </div>
    </div>
  );
};
