
export interface Point {
  x: number;
  y: number;
}

export enum NodeType {
  Simple = 'SIMPLE',
  Hierarchical = 'HIERARCHICAL',
}

export type NodeConnectionSide = 'top' | 'bottom' | 'left' | 'right';

export interface NodeUIMetadata {
  position: Point;
  size?: { width: number; height: number };
  isExpanded?: boolean;
}

export interface TransitionUIMetadata {
  midPointOffset?: Point;
  fromNodeSide?: NodeConnectionSide;
  toNodeSide?: NodeConnectionSide;
}

export interface StateNode {
  id: string;
  title: string;
  type: NodeType;
  inputs: string[];
  outputs: string[];
  subMachineId?: string;
  metadata: NodeUIMetadata; // Contains position, size, isExpanded
}

export interface Transition {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  rules?: string;
  metadata: TransitionUIMetadata; // Contains midPointOffset, fromNodeSide, toNodeSide
}

export enum VariableType {
  Input = 'input',
  Output = 'output',
  Intermediate = 'intermediate',
}

export interface Variable {
  type: VariableType;
  value?: any;
}

export interface StateMachine {
  id: string;
  name: string;
  nodes: StateNode[];
  transitions: Transition[];
  variables?: Record<string, Variable>;
}

// Fix: Define and export AllMachines type
export type AllMachines = Record<string, StateMachine>;

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export interface HierarchicalItem {
  id:string;
  name: string;
  type: 'machine' | 'variable_group' | 'variable' | 'node_group' | 'node';
  children?: HierarchicalItem[];
  icon?: React.ReactNode; 
  variableType?: VariableType; 
  nodeType?: NodeType; // For node items
  // Add a flag or specific ID pattern to identify if a variable_group is for machine-level variables
  isMachineVariablesGroup?: boolean; 
}

export type Theme = 'light' | 'dark' | 'system';

export interface ConnectingState {
  sourceMachineId: string; // Machine where the connection starts
  fromNodeId: string;
  fromNodeSide: NodeConnectionSide;
  previewEndPoint: Point; // Current mouse position in SVG coordinates
}

export interface ContextMenuAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

export interface SelectedComponent {
  type: 'node' | 'transition';
  id: string;
  machineId: string; // ID of the machine this component belongs to
}

// Undo/Redo Action Types
export type UndoRedoAction =
  | { type: 'CREATE_NODE'; machineId: string; node: StateNode }
  | { type: 'DELETE_NODE'; machineId: string; node: StateNode; connectedTransitions: Transition[] }
  | { type: 'CREATE_TRANSITION'; machineId: string; transition: Transition }
  | { type: 'DELETE_TRANSITION'; machineId: string; transition: Transition }
  | { 
      type: 'UPDATE_TRANSITION_DETAILS'; 
      machineId: string; 
      transitionId: string;
      oldRules: string | undefined;
      newRules: string | undefined;
      oldFromSide: NodeConnectionSide | undefined;
      newFromSide: NodeConnectionSide | undefined;
      oldToSide: NodeConnectionSide | undefined;
      newToSide: NodeConnectionSide | undefined;
      oldMidPointOffset: Point | undefined;
      newMidPointOffset: Point | undefined;
    }
  | { type: 'UPDATE_NODE_EXPANSION'; machineId: string; nodeId: string; oldIsExpanded: boolean; newIsExpanded: boolean }
  | { type: 'ADD_MACHINE_VARIABLE'; machineId: string; variableName: string; variable: Variable }
  | { type: 'DELETE_MACHINE_VARIABLE'; machineId: string; variableName: string; variable: Variable };
