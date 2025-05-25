
import React from 'react';

// Base classes for icons to allow override and ensure visibility
const baseIconClass = "dark:opacity-90";

export const InputIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`text-sky-500 dark:text-sky-400 ${baseIconClass} ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

export const OutputIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`text-lime-500 dark:text-lime-400 ${baseIconClass} ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0110.5 3h6a2.25 2.25 0 012.25 2.25v13.5A2.25 2.25 0 0116.5 21h-6a2.25 2.25 0 01-2.25-2.25V15m-3 0l3-3m0 0l3 3m-3-3H3.75" />
  </svg>
);

export const IntermediateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`text-amber-500 dark:text-amber-400 ${baseIconClass} ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
  </svg>
);

export const StateMachineIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`text-indigo-500 dark:text-indigo-400 ${baseIconClass} ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12A2.25 2.25 0 0020.25 14.25V3M3.75 14.25V21M12 13.5h.01M12 16.5h.01M12 19.5h.01M6 21v-2.25A2.25 2.25 0 018.25 16.5H12M18 21v-2.25A2.25 2.25 0 0015.75 16.5H12" />
  </svg>
);

export const FolderIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`text-slate-500 dark:text-slate-400 ${baseIconClass} ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

export const NodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( // Generic Node Icon
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`text-teal-500 dark:text-teal-400 ${baseIconClass} ${props.className || ''}`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6A2.25 2.25 0 008.25 8.25v7.5A2.25 2.25 0 0010.5 18h3a2.25 2.25 0 002.25-2.25v-7.5A2.25 2.25 0 0013.5 6h-3zm-7.125 3.125a2.25 2.25 0 012.25-.375h11.25c1.036 0 1.92.714 2.194 1.727L21 12.75M3.375 9.125c0-1.016.787-1.85 1.794-2.073L7.5 6.75M20.625 9.125c0-1.016-.787-1.85-1.794-2.073L16.5 6.75" />
  </svg>
);

export const SimpleNodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( // Simple Node Icon
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`text-sky-500 dark:text-sky-400 ${baseIconClass} ${props.className || ''}`}>
    <rect x="6" y="8" width="12" height="8" rx="2" />
  </svg>
);

export const HierarchicalNodeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => ( // Hierarchical Node Icon
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props} className={`text-purple-500 dark:text-purple-400 ${baseIconClass} ${props.className || ''}`}>
    <rect x="5" y="6" width="14" height="12" rx="2" />
    <rect x="7" y="9" width="10" height="6" rx="1" strokeWidth="1" className="stroke-current opacity-50"/>
  </svg>
);