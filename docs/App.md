
# App.tsx - Core Application Logic

`App.tsx` is the main component of the Hierarchical State Machine Visualizer. It serves as the central hub for state management, event handling, and orchestration of UI components.

## Responsibilities

*   **Global State Management:** Holds and manages all critical application state, including:
    *   `allMachines`: A record of all loaded state machines (`Record<string, StateMachine>`). This is the single source of truth for state machine data.
    *   `activeMachineId`: The ID of the state machine currently being viewed and edited on the canvas.
    *   `sidebarHierarchy`: Data structure for rendering the sidebar explorer.
    *   `selectedComponent`: Information about the currently selected node or transition on the canvas.
    *   Modal States: Boolean flags and data for various modals (transition details, add variable, add node). E.g., `selectedModalTransition`, `isAddVariableModalOpen`, `isAddNodeModalOpen`.
    *   `connectingState`: Manages the state during interactive transition creation.
    *   `contextMenuInfo`: Information for displaying the context menu.
    *   `undoStack`, `redoStack`: Arrays for managing undo/redo operations.
    *   `isSidebarCollapsed`: Boolean state for sidebar visibility.
*   **Initialization:** Loads default state machines (`default-state-machine.ts`) on startup and prepares them for use (e.g., `assignNodeSizes`).
*   **Event Handling:** Contains most of the callback functions triggered by user interactions in child components. These handlers perform actions like:
    *   Modifying state machines (adding/deleting nodes/transitions/variables, updating properties).
    *   Managing UI state (opening/closing modals, selection).
    *   Interacting with the undo/redo system.
*   **Data Flow Orchestration:** Passes state down to child components as props and receives events via callback props.
*   **Rendering Layout:** Defines the main application layout, including `TopBar`, `SideBar`, and `CanvasArea`.
*   **Modal Logic:** Defines the content and save/close logic for all modal dialogs, using the reusable `Modal.tsx` component.

## Key State Variables

*   `allMachines: Record<string, StateMachine>`: The canonical store for all state machine data. Updated immutably.
*   `activeMachineId: string`: Determines which machine from `allMachines` is rendered on the canvas.
*   `undoStack: UndoRedoAction[]`, `redoStack: UndoRedoAction[]`: Store actions for undo/redo functionality.
*   `selectedComponent: SelectedComponent | null`: Tracks the currently selected UI element on the canvas.
*   `selectedModalTransition: {transition: Transition, machineId: string} | null`: Holds data for the transition details modal.
*   `isAddVariableModalOpen: boolean`, `isAddNodeModalOpen: boolean`: Control visibility of their respective modals.
*   `connectingState: ConnectingState | null`: Tracks the state when a user is drawing a new transition line.

## Core Handler Functions (Examples)

*   **`handleSelectComponent(type, id, machineId)`:** Updates `selectedComponent` state.
*   **`handleOpenTransitionModal(transition, targetMachineId)`:** Opens the transition details modal.
*   **`handleSaveTransitionRules()`:** Saves changes made in the transition modal, updates `allMachines`, and pushes to `undoStack`.
*   **`handleDeleteNode(nodeId, targetMachineId)`:** Deletes a node and its connected transitions, updates `allMachines`, pushes to `undoStack`.
*   **`handleDeleteTransition(transitionId, targetMachineId)`:** Deletes a transition, updates `allMachines`, pushes to `undoStack`.
*   **`handleNodePositionChange(nodeId, newPosition, targetMachineId)`:** Updates a node's position (does not typically go to undo stack for performance during drag).
*   **`handleTransitionMidpointChange(transitionId, newOffset, oldOffset, targetMachineId)`:** Updates a transition's curve, pushes to `undoStack` upon drag completion.
*   **`handleNodeToggleExpand(nodeId, targetMachineId)`:** Toggles the `isExpanded` state of a hierarchical node, pushes to `undoStack`.
*   **`handleCompleteNewTransition(targetMachineId, targetNodeId, targetSide)`:** Finalizes the creation of a new transition, updates `allMachines`, pushes to `undoStack`.
*   **`handleSaveNewVariable()`:** Adds a new variable to a machine, updates `allMachines`, pushes to `undoStack`.
*   **`handleSaveNewNode()`:** Adds a new node to a machine, updates `allMachines`, pushes to `undoStack`.
*   **`handleFileUpload(file)`:** Parses an uploaded JSON file and updates `allMachines`.
*   **`handleExport()`:** Serializes `allMachines` to JSON and triggers a download.
*   **`handleUndo()` & `handleRedo()`:** Implement the undo/redo logic by processing `undoStack` and `redoStack`.
*   **`buildSidebarHierarchy(machines)`:** A crucial utility function that transforms the `allMachines` data into the `HierarchicalItem[]` structure required by the `SideBar` component. This function is responsible for creating the nested tree structure for machines, their nodes (with direct I/O variables), and the machine-level "Variables" groups.

## Effects (`useEffect`)

*   One effect initializes the application with default machines and shows an initial toast message.
*   Another effect watches `allMachines` and `activeMachineId`. It calls `buildSidebarHierarchy` to update the `sidebarHierarchy` state. It also ensures `activeMachineId` is valid or defaults to the first available machine.
*   An effect watches `selectedModalTransition` to populate the input fields (rules, connection sides) of the transition modal.
*   Keyboard event listeners for "Delete" key (to delete selected components) and "Escape" key (to close context menu) are set up and cleaned up.
*   A listener for clicks outside the context menu to close it.

## Hierarchical Node Expansion

When a hierarchical node is expanded, `App.tsx` updates the `isExpanded` flag in that node's metadata within the `allMachines` state. The `CanvasArea.tsx` component then uses this flag in its `renderMachineRecursive` function to render the sub-machine. Handlers in `App.tsx` that operate on nodes or transitions (e.g., `handleSelectComponent`, `handleDeleteNode`) are designed to work with a `targetMachineId`, allowing them to correctly modify components within either the main active machine or an expanded sub-machine.

Refer to [`docs/features/HierarchicalExpansion.md`](./features/HierarchicalExpansion.md) for more details.

## Undo/Redo System

`App.tsx` maintains `undoStack` and `redoStack`. Operations like creating/deleting nodes/transitions or updating their details push an `UndoRedoAction` object onto the `undoStack` and clear the `redoStack`. The `handleUndo` and `handleRedo` functions apply the inverse or original action respectively, modifying `allMachines`.

Refer to [`docs/features/UndoRedo.md`](./features/UndoRedo.md) for more details.
