
# Undo/Redo System Documentation

The application implements an undo/redo system to allow users to revert and reapply certain actions, enhancing the editing experience.

## Core Components

*   **`App.tsx`:** Manages the undo and redo stacks and the logic for applying/reverting actions.
*   **`types.ts` (`UndoRedoAction`):** Defines the discriminated union type for all actions that can be undone/redone.
*   **`TopBar.tsx`:** Contains the UI buttons for triggering undo and redo.

## State Management (`App.tsx`)

*   **`undoStack: UndoRedoAction[]`:** An array storing the history of actions performed by the user.
*   **`redoStack: UndoRedoAction[]`:** An array storing actions that have been undone and can be redone.
*   `MAX_UNDO_STACK_SIZE`: A constant (e.g., 50) to limit the size of the `undoStack`.

## `UndoRedoAction` Type (`types.ts`)

This is a discriminated union defining the structure of each action object stored in the stacks. Each action includes a `type` and `machineId` (to target the correct state machine), along with data necessary to undo or redo the action.

**Examples of actions:**

*   `{ type: 'CREATE_NODE', machineId: string, node: StateNode }`
*   `{ type: 'DELETE_NODE', machineId: string, node: StateNode, connectedTransitions: Transition[] }` (stores connected transitions because deleting a node also deletes them)
*   `{ type: 'CREATE_TRANSITION', machineId: string, transition: Transition }`
*   `{ type: 'DELETE_TRANSITION', machineId: string, transition: Transition }`
*   `{ type: 'UPDATE_TRANSITION_DETAILS', machineId: string, transitionId: string, oldRules, newRules, oldFromSide, newFromSide, ... }` (stores both old and new values)
*   `{ type: 'UPDATE_NODE_EXPANSION', machineId: string, nodeId: string, oldIsExpanded: boolean, newIsExpanded: boolean }`
*   `{ type: 'ADD_MACHINE_VARIABLE', machineId: string, variableName: string, variable: Variable }`
*   `{ type: 'DELETE_MACHINE_VARIABLE', machineId: string, variableName: string, variable: Variable }`

## Workflow

1.  **Performing an Action:**
    *   When a user performs an undoable action (e.g., `handleDeleteNode`, `handleSaveTransitionRules`, `handleCompleteNewTransition`, `handleSaveNewVariable` in `App.tsx`):
        *   Before the state (`allMachines`) is modified, an `UndoRedoAction` object is created. This object captures the current state relevant to undoing this action (e.g., for a delete, it stores the item being deleted; for an update, it stores the old values).
        *   This action object is pushed onto the `undoStack` via the `pushToUndoStack` function.
        *   `pushToUndoStack` also clears the `redoStack` because a new action invalidates the previous redo history.
        *   The actual state modification then occurs (e.g., `setAllMachines`).

2.  **Undoing an Action (`handleUndo` in `App.tsx`):**
    *   If `undoStack` is not empty:
        *   The last action (`lastAction`) is popped from `undoStack`.
        *   This `lastAction` is pushed onto the `redoStack`.
        *   `setAllMachines` is called. Inside its callback, a `switch` statement based on `lastAction.type` performs the *inverse* operation:
            *   If `CREATE_NODE`, it filters out the node.
            *   If `DELETE_NODE`, it adds the node and its `connectedTransitions` back.
            *   If `UPDATE_TRANSITION_DETAILS`, it applies the `oldRules`, `oldFromSide`, etc.
            *   ...and so on for other action types.
        *   `selectedComponent` is cleared.
        *   A toast notification indicates the undo.

3.  **Redoing an Action (`handleRedo` in `App.tsx`):**
    *   If `redoStack` is not empty:
        *   The first action (`actionToRedo`) is taken from `redoStack` (and removed).
        *   This `actionToRedo` is pushed back onto `undoStack`.
        *   `setAllMachines` is called. Inside its callback, a `switch` statement based on `actionToRedo.type` performs the *original* operation again:
            *   If `CREATE_NODE`, it adds the node back.
            *   If `DELETE_NODE`, it filters out the node and its connected transitions.
            *   If `UPDATE_TRANSITION_DETAILS`, it applies the `newRules`, `newFromSide`, etc.
            *   ...and so on.
        *   `selectedComponent` is cleared.
        *   A toast notification indicates the redo.

## UI (`TopBar.tsx`)

*   The "Undo" and "Redo" buttons in the `TopBar` are enabled/disabled based on whether `undoStack.length > 0` and `redoStack.length > 0` respectively.
*   Clicking these buttons calls `handleUndo` or `handleRedo` from `App.tsx`.

## Scope of Undo/Redo

Currently, the undo/redo system primarily covers:
*   Node creation and deletion (including implicitly deleted connected transitions).
*   Transition creation and deletion.
*   Updates to transition details (rules, connection sides, curve midpoint offset).
*   Hierarchical node expansion/collapse state.
*   Machine-level variable creation and deletion.

Actions not typically covered by undo/redo (for performance or simplicity):
*   Node dragging (position changes are frequent).
*   Canvas panning and zooming.
*   Component selection.
*   File uploads (these reset the entire state and undo history).
