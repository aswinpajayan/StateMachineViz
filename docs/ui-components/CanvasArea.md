
# CanvasArea.tsx Documentation

The `CanvasArea.tsx` component is the central interactive workspace where users visualize and manipulate hierarchical state machines.

## Responsibilities

*   **Rendering State Machines:** Displays the nodes and transitions of the currently active state machine and any expanded hierarchical sub-machines.
*   **User Interactions:** Handles user input for:
    *   Panning the canvas.
    *   Zooming the canvas (mouse wheel and buttons).
    *   Dragging nodes to new positions.
    *   Dragging transition midpoints to adjust curves.
    *   Creating new transitions by dragging between node connection points.
    *   Selecting nodes and transitions.
    *   Opening context menus for transitions.
    *   Opening modals for editing transition details (on double-click).
    *   Toggling the expansion of hierarchical nodes.
*   **Coordinate Transformation:** Manages SVG transformations (translation and scaling) to implement pan and zoom. Converts screen coordinates to SVG coordinates for accurate interaction.
*   **Recursive Rendering:** Implements a `renderMachineRecursive` function to display nested sub-machines when a hierarchical node is expanded. This function handles offsetting the positions of sub-machine elements relative to their parent hierarchical node.
*   **Visual Feedback:**
    *   Highlights selected nodes and transitions.
    *   Displays a preview line when creating a new transition.
    *   Shows tooltips with transition details on hover.

## Key Props

*   `machine: StateMachine`: The top-level state machine currently active on the canvas.
*   `activeMachineId: string`: The ID of the `machine` prop.
*   `allMachines: AllMachines`: A record of all loaded state machines, used to resolve sub-machines for hierarchical nodes.
*   `selectedComponent: SelectedComponent | null`: Information about the currently selected node or transition.
*   `connectingState: ConnectingState | null`: Information about an in-progress transition creation.
*   Various callback functions passed from `App.tsx` to handle events (e.g., `onSelectComponent`, `onNodePositionChange`, `onOpenTransitionModal`, `onCompleteNewTransition`, `onOpenAddNodeModalRequest`).

## Internal State

*   `transform: { x: number, y: number, k: number }`: Stores the current translation (x, y) and scale (k) of the canvas.
*   `isPanning: boolean`: Flag indicating if a pan operation is in progress.
*   `lastMousePosition: Point | null`: Stores the last mouse position during panning.
*   `draggingNodeInfo: { nodeId: string, machineId: string, startOffset: Point } | null`: Information about the node currently being dragged.
*   `draggingTransitionInfo: { ... } | null`: Information about the transition midpoint currently being dragged.
*   `hoveredTransitionDetails: HoveredTransitionDetails | null`: Data for displaying the transition tooltip.
*   `viewBox: string`: The SVG `viewBox` attribute, dynamically updated on resize.

## Core Logic

### Rendering (`renderMachineRecursive`)

This is the heart of the visual display.
*   **Input:** `machineToRender`, `currentMachineId`, `offsetX`, `offsetY`, `depth`.
*   It first renders all transitions for the `machineToRender`. For each transition, it finds the `fromNode` and `toNode`. The node positions are adjusted by `offsetX` and `offsetY` before being passed to `TransitionLineDisplay`.
*   Then, it renders all nodes of the `machineToRender`. Each node's position is also adjusted by `offsetX` and `offsetY` before being passed to `StateNodeDisplay`.
*   **Recursion:** If a rendered node is `NodeType.Hierarchical` and its `metadata.isExpanded` is true:
    *   It resolves the `subMachine` using `node.subMachineId` from `allMachines`.
    *   It calls `renderMachineRecursive` again for the `subMachine`.
    *   The `offsetX` and `offsetY` for the recursive call are calculated based on the parent hierarchical node's absolute position plus `HIERARCHICAL_NODE_PADDING` and `NODE_HEADER_HEIGHT`, effectively nesting the sub-machine visually.
*   Event handlers (e.g., `onNodeMouseDown`, `onConnectionPointMouseDown`) within the rendered components are wrapped to ensure they pass the correct `currentMachineId` up to the `App.tsx` handlers. This allows interactions within sub-machines to correctly target the sub-machine's data.

### Event Handling

*   **Mouse Down (`handleCanvasMouseDown`, `handleNodeMouseDown`, etc.):** Initiates panning, node dragging, transition midpoint dragging, or transition creation. Sets appropriate state flags (`isPanning`, `draggingNodeInfo`, etc.) and updates cursor styles.
*   **Mouse Move (`handleMouseMove`):**
    *   If panning, updates `transform.x` and `transform.y`.
    *   If dragging a node, calculates the new position and calls `onNodePositionChange`.
    *   If dragging a transition midpoint, calculates the new offset and calls `onTransitionMidpointChange`.
    *   If creating a transition (`connectingState` is active), calls `onUpdateConnectingPreviewPoint` with the current SVG mouse coordinates for the preview line.
*   **Mouse Up (`handleMouseUp`):** Finalizes an operation.
    *   Resets panning/dragging state.
    *   If a node/transition was dragged a minimal amount (not a click), the selection is typically handled. If it was a click (no significant drag), `onSelectComponent` is called.
    *   If creating a transition, checks if the mouse is over a valid connection point on a target node. If so, calls `onCompleteNewTransition`; otherwise, calls `onCancelNewTransition`.
*   **Wheel (`handleWheel`):** Implements zooming by adjusting `transform.k` and recalculating `transform.x`, `transform.y` to zoom towards the mouse cursor.
*   **Hover (`handleTransitionMouseEnter`, `handleTransitionMouseLeave`):** Manages the display of `TransitionTooltip`.

### Coordinate System & Zoom/Pan

*   The SVG uses a `viewBox` and a `<g>` element with a `transform` attribute (`translate(x,y) scale(k)`).
*   `getSvgCoordinates(clientX, clientY)` converts browser screen coordinates to SVG coordinates, accounting for the current transform. This is crucial for accurate interaction placement.
*   Zooming adjusts `transform.k` and the translation components to keep the zoom centered on the mouse or canvas center.
*   Panning adjusts `transform.x` and `transform.y`.

### Zoom to Fit (`zoomToFit`)

*   Uses `getAllVisibleNodesWithPositions` (which recursively finds all nodes including those in expanded sub-machines) to determine the bounding box of all rendered content.
*   Calculates the necessary scale (`newScale`) and translation (`newX`, `newY`) to fit this content within the SVG viewport with some padding.
*   Updates the `transform` state.
*   This function is called on initial load and when the `activeMachineId` or its node count changes significantly.

### Layout Effect (`useLayoutEffect`)

*   On mount and resize, `useLayoutEffect` updates the `viewBox` attribute of the SVG to match its client dimensions. This is important for responsive behavior.
*   It also calls `zoomToFit` initially to ensure the machine is centered.
