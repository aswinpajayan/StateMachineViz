
# Initial Data & Constants Documentation

This document covers how the application initializes its data and the constants it uses.

## `default-state-machine.ts`

This file defines the initial set of state machines that are loaded when the application starts. It serves as an example of the expected data structure for state machines and provides a starting point for users.

### Structure

*   Exports two `StateMachine` objects:
    *   `mainSystemControllerMachine: StateMachine`
    *   `missionLogicSubMachine: StateMachine`
*   Each `StateMachine` object adheres to the interface defined in `types.ts`, specifying its `id`, `name`, `nodes`, `transitions`, and `variables`.
*   **Nodes (`StateNode[]`)**:
    *   Each node has an `id`, `title`, `type` (`NodeType.Simple` or `NodeType.Hierarchical`), `inputs` (array of strings), `outputs` (array of strings), and `metadata`.
    *   Hierarchical nodes (e.g., 'Active Mission' in `mainSystemControllerMachine`) include a `subMachineId` property linking them to another `StateMachine` (e.g., `missionLogicSubMachine`).
    *   `metadata` includes `position` and optionally `size` and `isExpanded`. Initial sizes are provided but are typically recalculated by `assignNodeSizes` in `App.tsx` during initialization.
*   **Transitions (`Transition[]`)**:
    *   Each transition has an `id`, `fromNodeId`, `toNodeId`, optional `rules` (string), and `metadata`.
    *   `metadata` includes default `fromNodeSide` and `toNodeSide`. `midPointOffset` defaults if not specified.
*   **Variables (`Record<string, Variable>`)**:
    *   A dictionary of machine-scoped variables. Each key is the variable name.
    *   Each `Variable` object has a `type` (`VariableType.Input`, `VariableType.Output`, `VariableType.Intermediate`) and an optional initial `value`.

### Usage in `App.tsx`

*   `App.tsx` imports these default machines:
    ```typescript
    import { mainSystemControllerMachine, missionLogicSubMachine } from './default-state-machine';
    const initialDefaultMachines: StateMachine[] = [mainSystemControllerMachine, missionLogicSubMachine];
    ```
*   During the initialization of the `allMachines` state, `App.tsx` processes `initialDefaultMachines`:
    *   It iterates through each default machine.
    *   Nodes are processed to ensure `metadata` (position, isExpanded, size) is correctly initialized. `assignNodeSizes` is called here.
    *   Transitions are processed to ensure `metadata` (midPointOffset, connection sides) has default values.
    *   Variables are also initialized with defaults if not fully specified.
    *   The processed machines are stored in the `allMachines` state record.

This file is crucial for providing a working example and ensuring the application has some data to display on first load without requiring an immediate file upload.

## `constants.ts`

This file defines various constants used throughout the application, primarily for UI rendering, calculations, and default values.

### Key Constants

*   **Node Sizing & Layout:**
    *   `DEFAULT_NODE_WIDTH = 180`
    *   `NODE_HEADER_HEIGHT = 32`
    *   `DEFAULT_NODE_MIN_CONTENT_HEIGHT = 20`
    *   `NODE_CONTENT_PADDING = 8`
    *   `DEFAULT_NODE_HEIGHT`: Calculated as `NODE_HEADER_HEIGHT + DEFAULT_NODE_MIN_CONTENT_HEIGHT + NODE_CONTENT_PADDING`. Represents the base height for a simple node.
    *   `HIERARCHICAL_NODE_PADDING = 20`: Padding used inside an expanded hierarchical node to offset its sub-machine content.
*   **I/O Popover (for `StateNodeDisplay`):**
    *   `IO_LINE_HEIGHT = 20`
    *   `MAX_IO_LINES = 3`: Maximum lines shown before "and X more".
    *   `POPOVER_PADDING = 8`
    *   `POPOVER_MAX_WIDTH = 250`
*   **Connection Points (for `StateNodeDisplay`):**
    *   `CONNECTION_POINT_RADIUS = 5`
    *   `CONNECTION_POINT_COLOR`: Tailwind class string for default color.
    *   `CONNECTION_POINT_HOVER_COLOR`: Tailwind class string for hover color.
*   **`assignNodeSizes(nodes: StateNode[]): StateNode[]` function:**
    *   A utility function exported from this file.
    *   Takes an array of `StateNode` objects.
    *   Calculates and assigns a default `size` (width and height) to each node's `metadata` if not already present or to standardize them.
    *   The height calculation considers `NODE_HEADER_HEIGHT`, `DEFAULT_NODE_MIN_CONTENT_HEIGHT`, and `NODE_CONTENT_PADDING`. For hierarchical nodes, it might add a slight base height increase.
    *   Inputs and outputs displayed in the popover *do not* directly influence the main node's height calculated by this function.
    *   This function is called in `App.tsx` during the initialization of `allMachines` and when new nodes are created.

These constants help maintain consistency in the visual appearance and layout calculations across different components.
