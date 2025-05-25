
# Hierarchical Node Expansion Documentation

One of the key features of this application is the ability to define and visualize hierarchical state machines, where a single state node in a parent machine can represent an entire sub-state machine. Users can expand these hierarchical nodes on the canvas to view and interact with the underlying sub-machine.

## Core Concepts

*   **`NodeType.Hierarchical`:** In `types.ts`, a `StateNode` can have its `type` set to `NodeType.Hierarchical`.
*   **`subMachineId`:** A hierarchical node must have a `subMachineId` property (string) which is the `id` of another `StateMachine` defined in `allMachines`. This links the hierarchical node to its corresponding sub-machine.
*   **`metadata.isExpanded`:** Each `StateNode` has an `isExpanded` boolean flag in its `metadata`. For hierarchical nodes, if this is `true`, the sub-machine should be rendered.

## User Interaction

*   **Toggling Expansion:**
    *   Hierarchical nodes display a "+" (PlusCircleIcon) or "-" (MinusCircleIcon) in their header in `StateNodeDisplay.tsx`.
    *   Clicking this icon triggers the `onToggleExpand` prop, which is connected to `handleNodeToggleExpand(nodeId, targetMachineId)` in `App.tsx`.
*   **`handleNodeToggleExpand(nodeId, targetMachineId)` in `App.tsx`:**
    *   Finds the specified hierarchical node in the `targetMachineId`.
    *   Records the current `isExpanded` state for undo purposes.
    *   Flips the `node.metadata.isExpanded` boolean value.
    *   Pushes an `UPDATE_NODE_EXPANSION` action to the `undoStack`.
    *   Updates the `allMachines` state with the modified node.

## Rendering Expanded Sub-Machines (`CanvasArea.tsx`)

The magic happens in the `renderMachineRecursive` function within `CanvasArea.tsx`.

1.  **Initial Call:** `renderMachineRecursive` is initially called with the `activeTopLevelMachine`, its `activeMachineId`, and offsets `(0, 0)`.
2.  **Node Iteration:** As it iterates through the nodes of the machine it's currently rendering:
    *   It renders each node using `StateNodeDisplay.tsx`. The position passed to `StateNodeDisplay` is the node's `metadata.position` plus the current `offsetX` and `offsetY` of the machine being rendered.
3.  **Recursive Call:**
    *   If a node is `NodeType.Hierarchical`, has a `subMachineId`, and `node.metadata.isExpanded` is `true`:
        *   The corresponding `subMachine` is retrieved from `allMachines` using `node.subMachineId`.
        *   **New Offsets Calculated:**
            *   `subMachineOffsetX = nodeAbsoluteX + HIERARCHICAL_NODE_PADDING`
            *   `subMachineOffsetY = nodeAbsoluteY + NODE_HEADER_HEIGHT + HIERARCHICAL_NODE_PADDING`
            (where `nodeAbsoluteX/Y` are the already calculated screen positions of the parent hierarchical node).
        *   `renderMachineRecursive` is called again with the `subMachine`, its `id` as the `currentMachineId`, and the newly calculated `subMachineOffsetX` and `subMachineOffsetY`. The `depth` is incremented.
4.  **Stacking and Offsetting:**
    *   This recursive process means that the sub-machine's nodes and transitions will be rendered *relative* to its parent hierarchical node's position, effectively appearing "inside" it on the canvas.
    *   All coordinates for drawing (nodes, transition start/end points) within a sub-machine rendering pass are adjusted by the cumulative offsets passed down.
5.  **Visual Cue (`StateNodeDisplay.tsx`):**
    *   An expanded hierarchical node might have a slightly different background or an inner border to visually indicate it's a container for the sub-machine content.

## Interactions within Sub-Machines

*   **Targeting Correct Machine:** When an interaction occurs (e.g., clicking a node, starting a transition) on an element within an expanded sub-machine, it's crucial that the event handlers in `App.tsx` modify the correct `StateMachine` object in `allMachines`.
    *   The `renderMachineRecursive` function in `CanvasArea.tsx` ensures that event handlers invoked for elements within a sub-machine are called with the `subMachineId` as the `targetMachineId`. For example, when `StateNodeDisplay` calls `onNodeMouseDown` for a node in a sub-machine, it's actually calling a wrapper function in `CanvasArea` that already knows the correct `machineId` for that node.
*   **Selection:** The `selectedComponent` state in `App.tsx` includes `machineId` to correctly identify which machine a selected node or transition belongs to.
*   **Coordinates:** All position data (`node.metadata.position`, `transition.metadata.midPointOffset`) is stored relative to the machine that *owns* that node or transition. `CanvasArea.tsx` handles converting these relative positions to absolute screen coordinates for rendering by applying the necessary offsets during the recursive rendering.

## `zoomToFit` Considerations

The `zoomToFit` function in `CanvasArea.tsx` uses `getAllVisibleNodesWithPositions`. This helper function recursively traverses the active machine and any expanded sub-machines to collect all currently visible nodes along with their *absolute* canvas positions. This ensures that the zoom-to-fit calculation correctly encompasses all rendered content.
