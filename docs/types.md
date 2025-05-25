
# types.ts - Data Structures Documentation

The `types.ts` file defines the core data structures, interfaces, and enums used throughout the Hierarchical State Machine Visualizer application.

## Core Entities

### `Point`
Represents a 2D coordinate.
```typescript
export interface Point {
  x: number;
  y: number;
}
```

### `NodeType`
Enum for the types of state nodes.
```typescript
export enum NodeType {
  Simple = 'SIMPLE',
  Hierarchical = 'HIERARCHICAL',
}
```

### `NodeConnectionSide`
Defines the possible sides of a node where a transition can connect.
```typescript
export type NodeConnectionSide = 'top' | 'bottom' | 'left' | 'right';
```

### `NodeUIMetadata`
UI-specific metadata for a `StateNode`.
```typescript
export interface NodeUIMetadata {
  position: Point;
  size?: { width: number; height: number }; // Calculated by assignNodeSizes
  isExpanded?: boolean; // For hierarchical nodes
}
```

### `TransitionUIMetadata`
UI-specific metadata for a `Transition`.
```typescript
export interface TransitionUIMetadata {
  midPointOffset?: Point; // User-defined offset for the curve's control point
  fromNodeSide?: NodeConnectionSide;
  toNodeSide?: NodeConnectionSide;
}
```

### `StateNode`
Represents a single state in a state machine.
```typescript
export interface StateNode {
  id: string; // Unique ID for the node
  title: string; // Display name
  type: NodeType; // Simple or Hierarchical
  inputs: string[]; // Array of input variable names this node declares/uses
  outputs: string[]; // Array of output variable names this node declares/uses
  subMachineId?: string; // If type is Hierarchical, ID of the sub-machine
  metadata: NodeUIMetadata;
}
```

### `Transition`
Represents a transition between two state nodes.
```typescript
export interface Transition {
  id: string; // Unique ID for the transition
  fromNodeId: string; // ID of the source StateNode
  toNodeId: string; // ID of the target StateNode
  rules?: string; // Condition for the transition to occur
  metadata: TransitionUIMetadata;
}
```

### `VariableType`
Enum for the types of variables within a state machine.
```typescript
export enum VariableType {
  Input = 'input',
  Output = 'output',
  Intermediate = 'intermediate',
}
```

### `Variable`
Represents a variable defined within a state machine.
```typescript
export interface Variable {
  type: VariableType;
  value?: any; // Optional initial or current value
}
```

### `StateMachine`
The main structure for a state machine.
```typescript
export interface StateMachine {
  id:string; // Unique ID for the state machine
  name: string; // Display name
  nodes: StateNode[];
  transitions: Transition[];
  variables?: Record<string, Variable>; // Machine-scoped variables
}
```

### `AllMachines`
A record (dictionary) to store all loaded state machines, keyed by their `id`.
```typescript
export type AllMachines = Record<string, StateMachine>;
```

## UI & Interaction Types

### `ToastMessage`
Structure for toast notifications.
```typescript
export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
```

### `HierarchicalItem`
Used for building the tree structure in the `SideBar`.
```typescript
export interface HierarchicalItem {
  id: string;
  name: string;
  type: 'machine' | 'variable_group' | 'variable' | 'node_group' | 'node';
  children?: HierarchicalItem[];
  icon?: React.ReactNode; // Resolved in SideBarItem
  variableType?: VariableType; // For 'variable' type items
  nodeType?: NodeType; // For 'node' type items
  isMachineVariablesGroup?: boolean; // Flag for the "Variables" group under a machine
}
```
*   `node_group` was previously used for a "Nodes" folder under a machine but is currently not used in the active sidebar structure where nodes are direct children of machines.
*   `variable_group` is used for the machine-level "Variables" folder.

### `Theme`
Possible theme values.
```typescript
export type Theme = 'light' | 'dark' | 'system';
```

### `ConnectingState`
State during interactive transition creation.
```typescript
export interface ConnectingState {
  sourceMachineId: string; // Machine where connection starts
  fromNodeId: string;
  fromNodeSide: NodeConnectionSide;
  previewEndPoint: Point; // Current mouse position in SVG for preview line
}
```

### `ContextMenuAction`
Structure for actions in the `ContextMenu`.
```typescript
export interface ContextMenuAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}
```

### `SelectedComponent`
Information about the currently selected component on the canvas.
```typescript
export interface SelectedComponent {
  type: 'node' | 'transition';
  id: string;
  machineId: string; // ID of the machine this component belongs to
}
```

## Undo/Redo System

### `UndoRedoAction`
A discriminated union representing all actions that can be undone/redone.
```typescript
export type UndoRedoAction =
  | { type: 'CREATE_NODE'; machineId: string; node: StateNode }
  | { type: 'DELETE_NODE'; machineId: string; node: StateNode; connectedTransitions: Transition[] }
  | { type: 'CREATE_TRANSITION'; machineId: string; transition: Transition }
  | { type: 'DELETE_TRANSITION'; machineId: string; transition: Transition }
  | { 
      type: 'UPDATE_TRANSITION_DETAILS'; 
      machineId: string; 
      transitionId: string;
      oldRules: string | undefined; newRules: string | undefined;
      oldFromSide: NodeConnectionSide | undefined; newFromSide: NodeConnectionSide | undefined;
      oldToSide: NodeConnectionSide | undefined; newToSide: NodeConnectionSide | undefined;
      oldMidPointOffset: Point | undefined; newMidPointOffset: Point | undefined;
    }
  | { type: 'UPDATE_NODE_EXPANSION'; machineId: string; nodeId: string; oldIsExpanded: boolean; newIsExpanded: boolean }
  | { type: 'ADD_MACHINE_VARIABLE'; machineId: string; variableName: string; variable: Variable }
  | { type: 'DELETE_MACHINE_VARIABLE'; machineId: string; variableName: string; variable: Variable };
```
This set of types forms the backbone of the application's data model, ensuring consistency and type safety across components and state management logic.
