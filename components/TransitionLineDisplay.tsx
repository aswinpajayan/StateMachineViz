
import React from 'react';
import { Transition, StateNode, Point, NodeConnectionSide } from '../types';
import { DEFAULT_NODE_WIDTH, DEFAULT_NODE_HEIGHT } from '../constants';

interface TransitionLineDisplayProps {
  transition: Transition;
  fromNode: StateNode;
  toNode: StateNode;
  isSelected: boolean;
  onMidpointMouseDown: (event: React.MouseEvent) => void; 
  onMouseEnterLine: (event: React.MouseEvent) => void;
  onMouseLeaveLine: (event: React.MouseEvent) => void;
  onContextMenuRequested: (event: React.MouseEvent) => void;
  onDoubleClick: () => void;
}

const getEdgePoint = (node: StateNode, edge: NodeConnectionSide): Point => {
    const { position, size } = node.metadata;
    const nodeX = position.x;
    const nodeY = position.y;
    const nodeWidth = size?.width || DEFAULT_NODE_WIDTH;
    const nodeHeight = size?.height || DEFAULT_NODE_HEIGHT;

    switch(edge) {
        case 'top': return { x: nodeX + nodeWidth / 2, y: nodeY };
        case 'bottom': return { x: nodeX + nodeWidth / 2, y: nodeY + nodeHeight };
        case 'left': return { x: nodeX, y: nodeY + nodeHeight / 2 };
        case 'right': return { x: nodeX + nodeWidth, y: nodeY + nodeHeight / 2 };
        default: 
            return { x: nodeX + nodeWidth / 2, y: nodeY + nodeHeight };
    }
};


export const TransitionLineDisplay: React.FC<TransitionLineDisplayProps> = ({ 
  transition, 
  fromNode, 
  toNode, 
  isSelected,
  onMidpointMouseDown,
  onMouseEnterLine,
  onMouseLeaveLine,
  onContextMenuRequested,
  onDoubleClick
}) => {
  const { midPointOffset, fromNodeSide, toNodeSide } = transition.metadata;

  const startSide = fromNodeSide || 'bottom';
  const endSide = toNodeSide || 'top';

  const startPoint = getEdgePoint(fromNode, startSide); 
  const endPoint = getEdgePoint(toNode, endSide);     
  
  const geometricMidPoint: Point = {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2,
  };

  const userOffset = midPointOffset || { x: 0, y: 0 };

  // This is the point on the curve where the draggable handle and arrow will be placed
  const handlePosition: Point = {
    x: geometricMidPoint.x + userOffset.x,
    y: geometricMidPoint.y + userOffset.y,
  };

  // This is the control point for the quadratic Bezier curve
  const bezierControlPoint: Point = {
    x: geometricMidPoint.x + 2 * userOffset.x, // Amplified offset for control point
    y: geometricMidPoint.y + 2 * userOffset.y,
  };

  const pathData = `M ${startPoint.x} ${startPoint.y} Q ${bezierControlPoint.x} ${bezierControlPoint.y}, ${endPoint.x} ${endPoint.y}`;

  const strokeColor = isSelected 
    ? "stroke-indigo-500 dark:stroke-indigo-400" 
    : "stroke-slate-400 dark:stroke-slate-500 hover:stroke-indigo-500 dark:hover:stroke-indigo-400";
  const strokeWidth = isSelected ? 2.5 : 2;
  const markerId = isSelected ? "url(#arrowhead-selected)" : "url(#arrowhead)";
  
  // Calculate tangent for midpoint arrow orientation
  const tangentDx = (bezierControlPoint.x - startPoint.x) + (endPoint.x - bezierControlPoint.x);
  const tangentDy = (bezierControlPoint.y - startPoint.y) + (endPoint.y - bezierControlPoint.y);
  const tangentAngle = Math.atan2(tangentDy, tangentDx) * 180 / Math.PI;

  // Larger arrow path data, points to the right (0 degrees). Will be rotated.
  const midArrowPathData = "M0,-4 L8,0 L0,4 Z"; 
  const midArrowFillColor = "fill-blue-500 dark:fill-blue-400";


  return (
    <g 
      className="node-interactive-element transition-line-group"
      onMouseEnter={onMouseEnterLine}
      onMouseLeave={onMouseLeaveLine}
      onContextMenu={onContextMenuRequested}
      onDoubleClick={onDoubleClick}
    >
      <path
        d={pathData}
        className={`${strokeColor} fill-none transition-stroke`}
        strokeWidth={strokeWidth}
        markerEnd={markerId}
        style={{ transition: 'stroke 0.1s ease-in-out' }}
      />
      <path
        d={pathData}
        className="fill-none stroke-transparent" // Hit area for hover/click on the line itself
        strokeWidth="10" 
      />
      
      {/* Static directional arrow at the midpoint */}
      <path
        d={midArrowPathData}
        className={midArrowFillColor}
        transform={`translate(${handlePosition.x}, ${handlePosition.y}) rotate(${tangentAngle})`}
        style={{ pointerEvents: 'none' }} // Non-interactive arrow
      />

      {/* Draggable circle handle */}
      <circle
        cx={handlePosition.x}
        cy={handlePosition.y}
        r="6" // Visible circle size
        className={`fill-white dark:fill-slate-300 ${strokeColor} cursor-move`}
        strokeWidth="1.5"
        onMouseDown={onMidpointMouseDown}
      />
      <circle 
        cx={handlePosition.x}
        cy={handlePosition.y}
        r="12" // Larger hit area for easier dragging
        className="fill-transparent cursor-move"
        onMouseDown={onMidpointMouseDown}
      />
    </g>
  );
};