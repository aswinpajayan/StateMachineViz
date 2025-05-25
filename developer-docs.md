
# Developer Documentation: Hierarchical State Machine Visualizer

This document provides an overview of the project's architecture, code flow, and key components. For more detailed information on specific modules or UI components, please refer to their individual documentation files linked below.

## Table of Contents

1.  [Architecture Overview](#architecture-overview)
2.  [Project Structure](#project-structure)
3.  [Core State Management (`App.tsx`)](./docs/App.md)
4.  [UI Components](./docs/ui-components/README.md)
    *   [CanvasArea](./docs/ui-components/CanvasArea.md)
    *   [StateNodeDisplay](./docs/ui-components/StateNodeDisplay.md)
    *   [TransitionLineDisplay](./docs/ui-components/TransitionLineDisplay.md)
    *   [SideBar](./docs/ui-components/SideBar.md)
    *   [TopBar](./docs/ui-components/TopBar.md)
    *   [Modal](./docs/ui-components/Modal.md)
    *   [ContextMenu](./docs/ui-components/ContextMenu.md)
    *   [Toast Components](./docs/ui-components/Toast.md)
5.  [Contexts](./docs/contexts/README.md)
    *   [ThemeContext](./docs/contexts/ThemeContext.md)
    *   [ToastContext](./docs/contexts/ToastContext.md)
6.  [Data Structures (`types.ts`)](./docs/types.md)
7.  [Initial Data & Constants](./docs/initialization.md)
    *   [`default-state-machine.ts`](./docs/initialization.md#default-state-machines)
    *   [`constants.ts`](./docs/initialization.md#constants)
8.  [Key Features Deep Dive](./docs/features/README.md)
    *   [Undo/Redo System](./docs/features/UndoRedo.md)
    *   [Hierarchical Node Expansion](./docs/features/HierarchicalExpansion.md)
    *   [Transition Creation & Editing](./docs/features/Transitions.md)
    *   [Variable Management](./docs/features/Variables.md)
    *   [Import/Export Logic](./docs/features/ImportExport.md)
9.  [Rendering Pipeline](#rendering-pipeline)
10. [Code Flow Examples](#code-flow-examples)
    *   [Adding a New Node](#adding-a-new-node)
    *   [Deleting a Transition](#deleting-a-transition)

## Architecture Overview

The application is built using **React** with **TypeScript**. It leverages native ES Modules, allowing it to run directly in modern browsers without a complex build step for basic functionality. Styling is primarily handled by **Tailwind CSS** (via CDN).

The core architecture revolves around a main `App` component that manages the global state, including all state machines, UI states (like selected components, modal visibility), and undo/redo stacks. Components are designed to be as stateless as possible, receiving data and callbacks via props.

State changes flow uni-directionally:
1.  User interacts with a UI component (e.g., `CanvasArea`, `SideBar`).
2.  The component calls a handler function passed down from `App.tsx`.
3.  The handler in `App.tsx` updates the relevant state variables.
4.  React re-renders the `App` component and its children, reflecting the new state.

## Project Structure

(Refer to the `README.md` for a general project structure overview.)

The detailed documentation for each major part is organized into sub-folders within the `docs/` directory.

## Rendering Pipeline

The visual representation of state machines on the canvas is managed by `CanvasArea.tsx`.
*   It receives the `activeTopLevelMachine` and `allMachines` from `App.tsx`.
*   The core rendering logic is within the `renderMachineRecursive` function inside `CanvasArea.tsx`.
    *   This function takes a `machineToRender`, its `currentMachineId`, and `offsetX`/`offsetY` (for positioning sub-machines).
    *   It iterates through the machine's nodes and transitions.
    *   `StateNodeDisplay.tsx` is used to render each node. If a node is hierarchical and expanded (`node.metadata.isExpanded`), `renderMachineRecursive` calls itself with the sub-machine and calculated offsets.
    *   `TransitionLineDisplay.tsx` is used to render transitions, calculating path data based on source/target node positions and connection sides.
*   SVG transformations (`transform` state in `CanvasArea.tsx`) handle panning and zooming. Node and transition coordinates are adjusted by this transform before final rendering.

## Code Flow Examples

### Adding a New Node

1.  **User Interaction:**
    *   Clicks "+" button on `SideBar.tsx` (next to active machine name) or on `CanvasArea.tsx` (top-left).
2.  **Event Handling:**
    *   `SideBarItem` (in `SideBar.tsx`) or `CanvasArea.tsx` calls `props.onOpenAddNodeModal` / `props.onOpenAddNodeModalRequest`.
3.  **`App.tsx` Logic:**
    *   These props map to `handleOpenAddNodeModal(activeMachineId)` or `handleRequestOpenAddNodeModalForActiveMachine()` in `App.tsx`.
    *   `handleOpenAddNodeModal` sets state variables: `isAddNodeModalOpen = true`, `targetMachineIdForNewNode`, and resets other modal-specific states (`newNodeName`, `newNodeType`, etc.).
4.  **Modal Display:**
    *   The `Modal` component (defined in `components/Modal.tsx`) renders with content specific to adding a node, defined within `App.tsx`'s render method. This includes inputs for node name, type, and a section for adding existing machine variables.
    *   User fills in details. If "Create new variable" is clicked, `handleOpenAddVariableModal` is called, showing another modal instance.
5.  **Saving the Node:**
    *   User clicks "Add Node" (the primary action button in the modal).
    *   `Modal` calls `props.onSavePrimaryAction`, which is `handleSaveNewNode` in `App.tsx`.
    *   `handleSaveNewNode`:
        *   Validates input.
        *   Creates a new `StateNode` object using `generateUniqueId`, data from modal state, and `assignNodeSizes`.
        *   Calls `pushToUndoStack` with a `CREATE_NODE` action.
        *   Updates `allMachines` state using `setAllMachines`, adding the new node to the `nodes` array of the `targetMachineIdForNewNode`.
        *   Calls `handleCloseAddNodeModal`.
        *   Displays a success toast.
6.  **Re-render:** React re-renders `App.tsx` and its children. `CanvasArea.tsx` and `SideBar.tsx` receive the updated `allMachines` and `activeMachine`, displaying the new node.

### Deleting a Transition

1.  **User Interaction:**
    *   Right-clicks on a transition line in `CanvasArea.tsx`.
2.  **Event Handling (`TransitionLineDisplay.tsx`):**
    *   The `onContextMenu` event on the transition's group calls `props.onContextMenuRequested(event)`.
3.  **`CanvasArea.tsx` Logic:**
    *   `onContextMenuRequested` is a wrapper around `handleTransitionContextMenu` (passed from `App.tsx`).
    *   It calls `event.preventDefault()` and then `props.onOpenTransitionContextMenu(transitionId, machineId, {x: event.clientX, y: event.clientY})`.
4.  **`App.tsx` Logic:**
    *   `handleOpenTransitionContextMenu` sets `contextMenuInfo` state (position, transition ID, machine ID) and selects the transition.
5.  **Context Menu Display:**
    *   The `ContextMenu` component (in `components/ContextMenu.tsx`) renders at the specified position, showing a "Delete Transition" action.
6.  **Deleting the Transition:**
    *   User clicks "Delete Transition".
    *   `ContextMenu` calls the action's `onClick` handler, which is `() => handleDeleteTransition(contextMenuInfo.transitionId, contextMenuInfo.machineId)`. It also calls `onClose` (`handleCloseContextMenu`).
    *   `handleDeleteTransition` in `App.tsx`:
        *   Finds the `transitionToDelete`.
        *   Calls `pushToUndoStack` with a `DELETE_TRANSITION` action.
        *   Updates `allMachines` state by filtering out the deleted transition from the appropriate machine.
        *   Clears `selectedComponent` and `contextMenuInfo`.
        *   Displays a success toast.
7.  **Re-render:** UI updates to remove the transition line.

---
*This document provides a high-level overview. For specifics, consult the linked detailed markdown files.*
