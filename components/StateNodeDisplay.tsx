
import React, { useState } from 'react';
import { StateNode, NodeType, NodeConnectionSide } from '../types';
import { PlusCircleIcon, MinusCircleIcon } from './icons/HierarchyIcons';
import { DEFAULT_NODE_WIDTH, NODE_HEADER_HEIGHT, NODE_CONTENT_PADDING, IO_LINE_HEIGHT, MAX_IO_LINES, POPOVER_PADDING, POPOVER_MAX_WIDTH, CONNECTION_POINT_RADIUS, CONNECTION_POINT_COLOR, CONNECTION_POINT_HOVER_COLOR, HIERARCHICAL_NODE_PADDING } from '../constants';

interface StateNodeDisplayProps {
  node: StateNode; // Node data, position here is absolute for rendering
  scale: number; 
  isSelected: boolean;
  onClick: () => void; 
  onToggleExpand?: () => void; // Called with node.id and its machineId (handled by CanvasArea)
  onNodeMouseDown?: (event: React.MouseEvent) => void; // Called with node.id and its machineId (handled by CanvasArea)
  onConnectionPointMouseDown?: (originalNodeId: string, side: NodeConnectionSide, event: React.MouseEvent) => void; // originalNodeId is node.id
  machineId: string; // The ID of the machine this node belongs to (for data attributes)
}

const truncateText = (text: string, maxLength: number = 25): string => {
  if (maxLength <= 3) return '...';
  return text.length > maxLength ? text.substring(0, maxLength - 3) + '...' : text;
};

export const StateNodeDisplay: React.FC<StateNodeDisplayProps> = ({ node, scale, isSelected, onClick, onToggleExpand, onNodeMouseDown, onConnectionPointMouseDown, machineId }) => {
  const { position, size, isExpanded } = node.metadata;
  const { x, y } = position; // These are absolute canvas positions passed by CanvasArea
  const width = size?.width || DEFAULT_NODE_WIDTH;
  const height = size?.height || NODE_HEADER_HEIGHT + NODE_CONTENT_PADDING * 2 + 20; 
  
  const [isNodeHovered, setIsNodeHovered] = useState(false);
  const [hoveredConnectionPoint, setHoveredConnectionPoint] = useState<NodeConnectionSide | null>(null);

  const baseFontSize = 12;
  const baseSmallFontSize = 10;

  const fontSize = Math.max(8 / scale, Math.min(baseFontSize, baseFontSize / Math.sqrt(scale)));
  const smallFontSize = Math.max(6 / scale, Math.min(baseSmallFontSize, baseSmallFontSize / Math.sqrt(scale)));

  const renderIOListToPopover = (items: string[], title: string, yOffset: number, popoverWidth: number): { element: React.ReactNode, listHeight: number } => {
    if (items.length === 0) return { element: null, listHeight: 0 };
    
    const truncatedItems = items.slice(0, MAX_IO_LINES);
    const showMoreIndicator = items.length > MAX_IO_LINES;

    const charWidthApproximation = smallFontSize * 0.65;
    const availableTextWidth = popoverWidth - POPOVER_PADDING * 2 - 10; 
    const maxChars = Math.max(5, Math.floor(availableTextWidth / charWidthApproximation));

    let currentListHeight = IO_LINE_HEIGHT * 0.9; 

    const listElements = (
      <>
        <text x={POPOVER_PADDING} y={yOffset + currentListHeight} fontSize={smallFontSize + 1} fontWeight="500" className="fill-slate-600 dark:fill-slate-300 select-none">{title}:</text>
        {truncatedItems.map((item, index) => {
          currentListHeight += IO_LINE_HEIGHT * 0.9;
          return (
            <text 
              key={index} 
              x={POPOVER_PADDING + 5} 
              y={yOffset + currentListHeight}
              fontSize={smallFontSize} 
              className="fill-slate-700 dark:fill-slate-200 select-none"
            >
              - {truncateText(item, maxChars)} 
            </text>
          );
        })}
        {showMoreIndicator && (() => {
          currentListHeight += IO_LINE_HEIGHT * 0.8;
          return (
            <text 
              x={POPOVER_PADDING + 5} 
              y={yOffset + currentListHeight}
              fontSize={smallFontSize * 0.9} 
              className="fill-slate-500 dark:fill-slate-400 select-none" 
              fontStyle="italic"
            >
              ...and {items.length - MAX_IO_LINES} more
            </text>
          );
        })()}
      </>
    );
    return { element: listElements, listHeight: currentListHeight + POPOVER_PADDING };
  };
  
  const popoverYOffset = POPOVER_PADDING;
  let popoverContentHeight = 0;
  let popoverRequiredWidth = 150; 

  const inputsContent = node.inputs.length > 0 ? renderIOListToPopover(node.inputs, "Inputs", popoverYOffset, POPOVER_MAX_WIDTH) : { element: null, listHeight: 0 };
  popoverContentHeight += inputsContent.listHeight;
  
  const outputsContentY = popoverYOffset + inputsContent.listHeight + (inputsContent.listHeight > 0 ? POPOVER_PADDING / 2 : 0);
  const outputsContent = node.outputs.length > 0 ? renderIOListToPopover(node.outputs, "Outputs", outputsContentY, POPOVER_MAX_WIDTH) : { element: null, listHeight: 0 };
  popoverContentHeight += outputsContent.listHeight + (inputsContent.listHeight > 0 && outputsContent.listHeight > 0 ? POPOVER_PADDING / 2 : 0);

  if (node.inputs.length === 0 && node.outputs.length === 0) {
    popoverContentHeight = 0;
  } else {
      popoverContentHeight = Math.max(20, popoverContentHeight) + POPOVER_PADDING * 2; 
      const allIO = [...node.inputs, ...node.outputs];
      const longestIOItemLength = allIO.reduce((max, item) => Math.max(max, item.length), 0);
      popoverRequiredWidth = Math.min(POPOVER_MAX_WIDTH, Math.max(150, longestIOItemLength * smallFontSize * 0.7 + POPOVER_PADDING * 3));
  }

  const ioPopover = isNodeHovered && popoverContentHeight > 0 && (
    <g transform={`translate(${width + 5}, ${0})`} className="pointer-events-none">
      <rect
        x="0"
        y="0"
        width={popoverRequiredWidth}
        height={popoverContentHeight}
        rx="4"
        ry="4"
        className="fill-slate-50 dark:fill-slate-700 opacity-95"
        strokeWidth="1"
        stroke="rgba(100, 116, 139, 0.7)" 
      />
      {inputsContent.element}
      {outputsContent.element}
    </g>
  );

  const connectionPoints: { side: NodeConnectionSide; cx: number; cy: number }[] = [
    { side: 'top', cx: width / 2, cy: 0 },
    { side: 'bottom', cx: width / 2, cy: height },
    { side: 'left', cx: 0, cy: height / 2 },
    { side: 'right', cx: width, cy: height / 2 },
  ];
  
  const mainRectStrokeColor = isSelected ? "stroke-indigo-500 dark:stroke-indigo-400" : "stroke-slate-400 dark:stroke-slate-500";
  const mainRectStrokeWidth = isSelected ? 2.5 : 1.5;
  const headerFillColor = node.type === NodeType.Hierarchical 
    ? (isSelected ? "fill-indigo-700 dark:fill-indigo-800" : "fill-indigo-600 dark:fill-indigo-700")
    : (isSelected ? "fill-indigo-600 dark:fill-indigo-700" : "fill-indigo-500 dark:fill-indigo-600");

  // Visual cue for expanded hierarchical node
  const expandedHierarchicalFill = (node.type === NodeType.Hierarchical && isExpanded) 
    ? "fill-slate-300/70 dark:fill-slate-700/70" // Slightly more transparent or different shade
    : (node.type === NodeType.Hierarchical ? "fill-slate-300 dark:fill-slate-700" : "fill-slate-200 dark:fill-slate-600");


  return (
    <g 
      transform={`translate(${x}, ${y})`} 
      className="node-main-group" 
      onMouseEnter={() => setIsNodeHovered(true)}
      onMouseLeave={() => setIsNodeHovered(false)}
    >
      <g className="cursor-pointer node-interactive-element" onClick={onClick} onMouseDown={onNodeMouseDown}>
        <rect
          width={width}
          height={height}
          rx="8"
          ry="8"
          className={`transition-all duration-150 
                      ${expandedHierarchicalFill}
                      ${mainRectStrokeColor}`}
          strokeWidth={isExpanded ? mainRectStrokeWidth + 0.5 : mainRectStrokeWidth} 
        />
        {/* Inner rect to simulate padding for expanded nodes if sub-machine content is inside */}
        {node.type === NodeType.Hierarchical && isExpanded && (
            <rect
                x={HIERARCHICAL_NODE_PADDING / 2}
                y={NODE_HEADER_HEIGHT + HIERARCHICAL_NODE_PADDING / 2}
                width={width - HIERARCHICAL_NODE_PADDING}
                height={height - NODE_HEADER_HEIGHT - HIERARCHICAL_NODE_PADDING}
                rx="4"
                ry="4"
                className="fill-slate-200/50 dark:fill-slate-600/50 pointer-events-none"
            />
        )}
        <rect
          width={width}
          height={NODE_HEADER_HEIGHT}
          rx="8"
          ry="8"
          className={`${headerFillColor} pointer-events-none`}
        />
        <text
          x={width / 2}
          y={NODE_HEADER_HEIGHT / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={fontSize}
          fontWeight="bold"
          className="select-none pointer-events-none"
        >
          {truncateText(node.title, Math.floor((width - (node.type === NodeType.Hierarchical ? 32 : 16) ) / (fontSize*0.7)))}
        </text>

        {node.type === NodeType.Hierarchical && onToggleExpand && (
          <g onClick={(e) => { e.stopPropagation(); onToggleExpand(); }} 
             onMouseDown={(e) => e.stopPropagation()} // Prevent node drag when clicking expand/collapse
             className="cursor-pointer expand-collapse-button">
            {isExpanded ? 
              <MinusCircleIcon className="w-5 h-5 text-indigo-200 hover:text-white" x={6} y={6} transform={`scale(${Math.min(1, 16/fontSize)})`}/> : 
              <PlusCircleIcon className="w-5 h-5 text-indigo-200 hover:text-white" x={6} y={6} transform={`scale(${Math.min(1, 16/fontSize)})`} />}
          </g>
        )}
      </g>
      
      {connectionPoints.map(p => (
        <circle
          key={p.side}
          cx={p.cx}
          cy={p.cy}
          r={CONNECTION_POINT_RADIUS}
          className={`transition-colors duration-150 cursor-crosshair node-interactive-element ${
            hoveredConnectionPoint === p.side ? CONNECTION_POINT_HOVER_COLOR : CONNECTION_POINT_COLOR
          }`}
          onMouseDown={(e) => {
            e.stopPropagation(); 
            onConnectionPointMouseDown?.(node.id, p.side, e);
          }}
          onMouseEnter={() => setHoveredConnectionPoint(p.side)}
          onMouseLeave={() => setHoveredConnectionPoint(null)}
          data-node-id={node.id}
          data-connection-side={p.side}
          data-machine-id={machineId} // Important for identifying target machine on connection complete
        />
      ))}

      {ioPopover}
    </g>
  );
};