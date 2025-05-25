
import React from 'react';
import { Transition, Point, NodeConnectionSide } from '../types';

interface HoveredTransitionDetails {
  transition: Transition;
  fromNodeTitle: string;
  toNodeTitle: string;
}

interface TransitionTooltipProps {
  details: HoveredTransitionDetails;
  position: Point; // clientX, clientY
}

export const TransitionTooltip: React.FC<TransitionTooltipProps> = ({ details, position }) => {
  const { transition, fromNodeTitle, toNodeTitle } = details;
  const { rules, metadata } = transition;
  const { midPointOffset, fromNodeSide, toNodeSide } = metadata;

  const style: React.CSSProperties = {
    position: 'fixed',
    top: `${position.y + 20}px`, // Increased offset from cursor
    left: `${position.x + 20}px`, // Increased offset from cursor
    transform: 'translateZ(0)', 
    pointerEvents: 'none', 
    zIndex: 1000, 
  };

  return (
    <div 
      style={style}
      className="p-4 bg-slate-50 dark:bg-slate-800 rounded-md shadow-lg border border-slate-300 dark:border-slate-600 text-xs text-slate-700 dark:text-slate-200 max-w-sm min-w-[200px]" // Increased padding, set min-width
    >
      <p className="font-semibold mb-1">From: <span className="font-normal">{fromNodeTitle} ({fromNodeSide || 'auto'})</span></p>
      <p className="font-semibold mb-1">To: <span className="font-normal">{toNodeTitle} ({toNodeSide || 'auto'})</span></p>
      {rules && (
        <div className="mt-1.5 mb-1.5"> {/* Adjusted margin */}
          <p className="font-semibold">Rules:</p>
          <pre className="bg-slate-100 dark:bg-slate-700 p-1.5 rounded text-xs whitespace-pre-wrap break-all max-h-28 overflow-y-auto leading-snug"> {/* Adjusted line-height, max-h */}
            {rules}
          </pre>
        </div>
      )}
      {!rules && <p className="italic text-slate-500 dark:text-slate-400 my-1.5">No rules defined.</p>}
      {midPointOffset && (
        <p className="mt-1.5 text-slate-500 dark:text-slate-400"> {/* Adjusted margin */}
          Curve: ({midPointOffset.x.toFixed(0)}, {midPointOffset.y.toFixed(0)})
        </p>
      )}
    </div>
  );
};
