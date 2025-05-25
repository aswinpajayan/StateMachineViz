
# TransitionLineDisplay.tsx Documentation

The `TransitionLineDisplay.tsx` component is responsible for rendering a single transition (the line, its midpoint handle, and arrowhead) between two state nodes on the canvas.

## Responsibilities

*   **Path Rendering:** Draws a quadratic Bezier curve between the source and target nodes.
*   **Connection Points:** Calculates the start and end points of the line based on the specified `fromNodeSide` and `toNodeSide` of the connected nodes.
*   **Curve Adjustment:**
    *   Displays a draggable handle (a circle) at the visual midpoint of the curve.
    *   The curve's shape is determined by `transition.metadata.midPointOffset`.
*   **Directional Arrow:**
    *   Renders an arrowhead at the end of the transition line.
    *   Renders a static blue arrow at the midpoint of the curve, indicating the transition's flow along the curve.
*   **Selection Highlighting:** Changes the line and arrowhead color if the transition is selected.
*   **Event Handling:**
    *   Handles `mousedown` on the midpoint handle to initiate curve dragging (via `onMidpointMouseDown`).
    *   Handles `mouseenter` and `mouseleave` on the line for hover effects (e.g., showing tooltips).
    *   Handles `contextmenu` requests on the line.
    *   Handles `doubleclick` on the line (typically to open the edit modal).

## Key Props

*   `transition: Transition`: The transition data to display.
*   `fromNode: StateNode`: The source state node. Node positions are expected to be absolute canvas coordinates.
*   `toNode: StateNode`: The target state node. Node positions are expected to be absolute canvas coordinates.
*   `isSelected: boolean`: True if the transition is currently selected.
*   `onMidpointMouseDown: (event: React.MouseEvent) => void`: Callback for `mousedown` on the draggable midpoint handle.
*   `onMouseEnterLine: (event: React.MouseEvent) => void`: Callback for mouse entering the line area.
*   `onMouseLeaveLine: (event: React.MouseEvent) => void`: Callback for mouse leaving the line area.
*   `onContextMenuRequested: (event: React.MouseEvent) => void`: Callback for right-click/context menu request on the line.
*   `onDoubleClick: () => void`: Callback for double-clicking the line.

## Rendering Logic

*   **Edge Point Calculation (`getEdgePoint` utility):**
    *   Determines the exact (x, y) coordinates on the border of the `fromNode` and `toNode` based on `transition.metadata.fromNodeSide` and `transition.metadata.toNodeSide`.
*   **Path Calculation:**
    *   **Start Point (`startPoint`):** Calculated using `getEdgePoint` on `fromNode`.
    *   **End Point (`endPoint`):** Calculated using `getEdgePoint` on `toNode`.
    *   **Geometric Midpoint:** The simple average of `startPoint` and `endPoint`.
    *   **User Offset (`userOffset`):** From `transition.metadata.midPointOffset`.
    *   **Handle Position (`handlePosition`):** `geometricMidpoint + userOffset`. This is where the draggable circle and the midpoint arrow are rendered.
    *   **Bezier Control Point (`bezierControlPoint`):** `geometricMidpoint + 2 * userOffset`. This calculation ensures that the curve passes through `handlePosition` at its t=0.5 parameter.
    *   **Path Data (`pathData`):** An SVG path string for a quadratic Bezier curve: `M ${startPoint.x} ${startPoint.y} Q ${bezierControlPoint.x} ${bezierControlPoint.y}, ${endPoint.x} ${endPoint.y}`.
*   **Main Line:** An SVG `<path>` element uses `pathData`.
    *   Stroke color and width change based on `isSelected`.
    *   `markerEnd` attribute points to an SVG `<marker>` definition (either `arrowhead` or `arrowhead-selected`) in `CanvasArea.tsx`.
*   **Hit Area:** An invisible, wider SVG `<path>` is rendered on top of the visible line to provide a larger target area for mouse interactions.
*   **Midpoint Static Arrow:**
    *   An SVG `<path>` (e.g., `M0,-4 L8,0 L0,4 Z`) is rendered.
    *   It's translated to `handlePosition`.
    *   It's rotated based on the tangent of the Bezier curve at `handlePosition` to point along the curve's direction.
    *   Filled with a distinct color (e.g., blue).
*   **Draggable Midpoint Handle:**
    *   Two SVG `<circle>` elements are rendered at `handlePosition`:
        *   A visible smaller circle with a stroke.
        *   A larger, transparent circle behind it to increase the draggable hit area.
    *   `onMouseDown` on these circles calls `props.onMidpointMouseDown`.

## Styling and Interactivity

*   The line and arrowhead colors change when `isSelected` is true (typically to an indigo color).
*   The midpoint handle uses `cursor-move`.
*   The entire group listens for `mouseenter`, `mouseleave`, `contextmenu`, and `doubleclick` events.
