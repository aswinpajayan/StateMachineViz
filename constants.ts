
import { StateMachine, NodeType, VariableType, StateNode, Transition, HierarchicalItem, Variable, Point } from './types';

export const DEFAULT_NODE_WIDTH = 180;
export const DEFAULT_NODE_MIN_CONTENT_HEIGHT = 20; // Minimum height for the content area below the header
export const NODE_HEADER_HEIGHT = 32;
export const NODE_CONTENT_PADDING = 8;
// Fix: Define and export DEFAULT_NODE_HEIGHT
// This value corresponds to the calculated height for a simple node in assignNodeSizes:
// NODE_HEADER_HEIGHT + DEFAULT_NODE_MIN_CONTENT_HEIGHT + NODE_CONTENT_PADDING = 32 + 20 + 8 = 60
export const DEFAULT_NODE_HEIGHT = NODE_HEADER_HEIGHT + DEFAULT_NODE_MIN_CONTENT_HEIGHT + NODE_CONTENT_PADDING; 
export const IO_LINE_HEIGHT = 20; // Height per I/O line in popover
export const MAX_IO_LINES = 3; // Max I/O lines before "and X more" in popover
export const POPOVER_PADDING = 8;
export const POPOVER_MAX_WIDTH = 250;

export const CONNECTION_POINT_RADIUS = 5;
export const CONNECTION_POINT_COLOR = "fill-slate-400 dark:fill-slate-500 hover:fill-indigo-500 dark:hover:fill-indigo-400";
export const CONNECTION_POINT_HOVER_COLOR = "fill-indigo-500 dark:fill-indigo-400";

export const HIERARCHICAL_NODE_PADDING = 20; // Padding inside hierarchical node for sub-machine content


export const assignNodeSizes = (nodes: StateNode[]): StateNode[] => {
  return nodes.map(node => {
    // Default height is header + padding + minimal content area
    // Inputs and outputs will be shown in a popover, so they don't contribute to the main node height here.
    const baseContentHeight = node.type === NodeType.Hierarchical ? DEFAULT_NODE_MIN_CONTENT_HEIGHT + 10 : DEFAULT_NODE_MIN_CONTENT_HEIGHT;
    // Height for hierarchical nodes might be larger if they are expanded and showing content, 
    // but this function sets a base size. CanvasArea will determine actual render box for expanded content.
    const height = NODE_HEADER_HEIGHT + baseContentHeight + NODE_CONTENT_PADDING;

    return {
      ...node,
      metadata: {
        ...node.metadata, // Preserve existing metadata like position and isExpanded
        size: { width: DEFAULT_NODE_WIDTH, height: height }
      }
    };
  });
};

export type { StateMachine, NodeType, VariableType, StateNode, Transition, HierarchicalItem, Variable, Point };