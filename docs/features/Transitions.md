
# Transition Creation & Editing Documentation

Transitions define the pathways and conditions for moving between states in a state machine. This application provides several ways to create and modify them.

## Data Structure (`types.ts`)

A `Transition` object includes:
*   `id: string`
*   `fromNodeId: string`
*   `toNodeId: string`
*   `rules?: string`
*   `metadata: TransitionUIMetadata`
    *   `midPointOffset?: Point` (for curve adjustment)
    *   `fromNodeSide?: NodeConnectionSide` ('top', 'bottom', 'left', 'right')
    *   `toNodeSide?: NodeConnectionSide`

## Creating New Transitions

1.  **User Interaction (`CanvasArea.tsx` & `StateNodeDisplay.tsx`):**
    *   The user clicks and drags from a connection point (small gray circle) on a source `StateNode`. Connection points have `data-node-id`, `data-connection-side`, and `data-machine-id` attributes.
    *   `StateNodeDisplay` calls `props.onConnectionPointMouseDown(machineId, nodeId, side, event)`.
2.  **Initiation (`CanvasArea.tsx` -> `App.tsx`):**
    *   This maps to `handleStartTransitionCreation(sourceMachineId, sourceNodeId, sourceSide, previewStartPoint)` in `App.tsx`.
    *   `App.tsx` sets the `connectingState` object, which includes `sourceMachineId`, `fromNodeId`, `fromNodeSide`, and the initial `previewEndPoint` (mouse SVG coordinates).
    *   The canvas cursor changes to `crosshair`.
3.  **Preview Line (`CanvasArea.tsx`):**
    *   While `connectingState` is active, `handleMouseMove` in `CanvasArea.tsx` calls `onUpdateConnectingPreviewPoint(currentSvgMousePos)` in `App.tsx`.
    *   `App.tsx` updates `connectingState.previewEndPoint`.
    *   `CanvasArea.tsx` renders a temporary `<line>` from the calculated edge of the source node (based on `connectingState.fromNodeSide`) to `connectingState.previewEndPoint`.
4.  **Completion (`CanvasArea.tsx` -> `App.tsx`):**
    *   User releases the mouse button over a connection point of a target `StateNode`.
    *   `handleMouseUp` in `CanvasArea.tsx` identifies the `targetNodeId`, `targetSide`, and `targetMachineId` from the target connection point's data attributes.
    *   It calls `onCompleteNewTransition(targetMachineId, targetNodeId, targetSide)` in `App.tsx`.
    *   **Important Constraint:** `connectingState.sourceMachineId` must equal `targetMachineId`. Transitions cannot (currently) span between different top-level machines or directly from a parent machine into an unexpanded sub-machine's internals via this UI.
5.  **`handleCompleteNewTransition` in `App.tsx`:**
    *   Creates a new `Transition` object with a unique ID, the from/to node IDs and sides, empty rules, and a default `midPointOffset`.
    *   Pushes a `CREATE_TRANSITION` action to the `undoStack`.
    *   Updates `allMachines` by adding the new transition to the `transitions` array of the `targetMachineId`.
    *   Sets `selectedModalTransition` to this new transition, automatically opening the "Transition Details" modal.
    *   Clears `connectingState`.
6.  **Cancellation (`CanvasArea.tsx` -> `App.tsx`):**
    *   If the mouse is released not over a valid connection point, `onCancelNewTransition` is called, which clears `connectingState`.

## Editing Transitions

### Transition Details Modal

*   **Opening:**
    *   Automatically after creating a new transition.
    *   By double-clicking an existing transition line (`TransitionLineDisplay` calls `props.onDoubleClick`, which maps to `handleOpenTransitionModal` in `App.tsx`).
*   **Content (`App.tsx` defining children for `Modal.tsx`):**
    *   Displays "From: [Source Node Title]" and "To: [Target Node Title]".
    *   **Connection Sides:** Two dropdown (`<select>`) elements allow changing `editableTransitionFromSide` and `editableTransitionToSide`. These are bound to state variables in `App.tsx` initialized from `selectedModalTransition.transition.metadata`.
    *   **Rules:** A `<textarea>` displays and allows editing of `currentRulesInput`, also initialized from the selected transition.
    *   Displays the current curve offset.
*   **Saving (`handleSaveTransitionRules` in `App.tsx`):**
    *   Called when the "Save Rules" button in the modal is clicked.
    *   Retrieves the `oldTransition` details for the undo stack.
    *   Creates an `UPDATE_TRANSITION_DETAILS` action for the `undoStack`, capturing old and new values for rules, sides, and `midPointOffset`.
    *   Updates the transition in `allMachines` with the new rules and connection sides from `currentRulesInput`, `editableTransitionFromSide`, and `editableTransitionToSide`.
    *   Closes the modal (by updating/clearing `selectedModalTransition`).

### Curve Adjustment

*   **Interaction (`TransitionLineDisplay.tsx`):**
    *   The user drags the midpoint handle (circle with blue arrow) on the transition line.
    *   `mousedown` on the handle calls `props.onMidpointMouseDown(event)`.
*   **Initiation (`CanvasArea.tsx` -> `App.tsx`):**
    *   Maps to `handleTransitionMidpointMouseDown(machineId, transitionId, event)` in `CanvasArea.tsx`.
    *   This sets `draggingTransitionInfo` state in `CanvasArea.tsx` with initial offset and mouse position.
*   **Dragging (`CanvasArea.tsx`):**
    *   `handleMouseMove` calculates the `deltaX`, `deltaY` from the drag start.
    *   Calculates `newOffset = initialOffset + delta`.
    *   Calls `props.onTransitionMidpointChange(transitionId, newOffset, undefined, machineId)`. (The `oldOffset` for undo is handled slightly differently here for performance, with the final undo action being created on mouse up or when `handleSaveTransitionRules` is called for other changes).
*   **`handleTransitionMidpointChange` in `App.tsx`:**
    *   This function is responsible for updating the `transition.metadata.midPointOffset` in `allMachines`.
    *   **Undo/Redo:** When the drag completes (or other details are saved via the modal), `handleSaveTransitionRules` or a similar mechanism ensures an `UPDATE_TRANSITION_DETAILS` action is pushed to the undo stack, including the change in `midPointOffset`. The `handleTransitionMidpointChange` itself, if called repeatedly during drag, might push an action with the `originalMidPointOffset` on the first "significant" drag to capture the start of the drag for undo purposes. The current implementation in `App.tsx` adds the undo action with `oldOffset` (passed from `draggingTransitionInfo.originalMidPointOffset`) and `newOffset`.

## Deleting Transitions

*   **Keyboard:** Select a transition, press "Delete" or "Backspace". `useEffect` in `App.tsx` listens for keydown and calls `handleDeleteTransition`.
*   **Context Menu:** Right-click a transition line.
    *   `TransitionLineDisplay` -> `CanvasArea` -> `App.tsx`'s `handleOpenTransitionContextMenu`.
    *   `ContextMenu.tsx` displays "Delete Transition". Clicking it calls `handleDeleteTransition`.
*   **`handleDeleteTransition(transitionId, targetMachineId)` in `App.tsx`:**
    *   Finds the `transitionToDelete`.
    *   Pushes a `DELETE_TRANSITION` action to `undoStack`.
    *   Updates `allMachines` by filtering out the transition.
    *   Clears selection/context menu.
