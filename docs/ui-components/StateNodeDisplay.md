
# StateNodeDisplay.tsx Documentation

The `StateNodeDisplay.tsx` component is responsible for rendering a single state node on the canvas.

## Responsibilities

*   **Visual Representation:** Renders the node's rectangle, title, and header.
*   **Type Indication:** Styles the node differently based on its `type` (Simple or Hierarchical).
*   **Expansion Indicator:** For hierarchical nodes, displays a "+" or "-" icon to indicate if it can be/is expanded, and calls `onToggleExpand` when clicked.
*   **Selection Highlighting:** Changes appearance (e.g., border color/width) if the node is selected.
*   **Connection Points:** Renders four small circles on the edges (top, bottom, left, right) that act as anchors for creating transitions.
*   **I/O Popover:** Displays a popover with the node's inputs and outputs when the node is hovered.
*   **Event Handling:** Handles mousedown events on the node body (for dragging, handled by `CanvasArea`) and on connection points (for initiating transition creation).

## Key Props

*   `node: StateNode`: The state node data to display. The `node.metadata.position` is expected to be the absolute canvas position provided by `CanvasArea` after considering offsets of parent hierarchical nodes.
*   `scale: number`: The current zoom scale of the canvas, used for adjusting font sizes or other scale-dependent rendering.
*   `isSelected: boolean`: True if the node is currently selected.
*   `onClick: () => void`: Callback for when the node is clicked (primarily for selection logic handled by `CanvasArea` after a drag check).
*   `onToggleExpand?: () => void`: Callback for when the expand/collapse icon on a hierarchical node is clicked.
*   `onNodeMouseDown?: (event: React.MouseEvent) => void`: Callback for `mousedown` on the node body.
*   `onConnectionPointMouseDown?: (originalNodeId: string, side: NodeConnectionSide, event: React.MouseEvent) => void`: Callback for `mousedown` on a connection point. `originalNodeId` is `node.id`.
*   `machineId: string`: The ID of the machine this node belongs to, used for `data-machine-id` attributes on connection points.

## Internal State

*   `isNodeHovered: boolean`: Tracks if the mouse is currently hovering over the node, used to trigger the I/O popover.
*   `hoveredConnectionPoint: NodeConnectionSide | null`: Tracks if the mouse is hovering over a specific connection point for hover effects.

## Rendering Logic

*   **Main Body:** A main SVG `<g>` element is transformed using `translate(${x}, ${y})` based on `node.metadata.position`.
*   **Node Rectangle:** An SVG `<rect>` forms the main body of the node. Its fill and stroke are determined by `isSelected` and `node.type`. If the node is hierarchical and expanded, an inner rectangle might be drawn to visually demarcate the content area.
*   **Header:** Another `<rect>` is drawn for the node header, typically with a distinct fill color (e.g., indigo, with a different shade for hierarchical nodes).
*   **Title:** An SVG `<text>` element displays `node.title`, centered in the header. Text is truncated if it's too long for the node width. Font size is adjusted based on `scale`.
*   **Expand/Collapse Icon:** If `node.type === NodeType.Hierarchical` and `onToggleExpand` is provided, a `PlusCircleIcon` or `MinusCircleIcon` is rendered in the header. Clicking it calls `onToggleExpand`.
*   **Connection Points:** Four SVG `<circle>` elements are rendered, one on each side of the node.
    *   They have `data-node-id`, `data-connection-side`, and `data-machine-id` attributes.
    *   `onMouseDown` on these circles calls `props.onConnectionPointMouseDown`.
    *   Hover effects change their fill color.
*   **I/O Popover:**
    *   Rendered as an SVG `<g>` when `isNodeHovered` is true and the node has inputs or outputs.
    *   Positioned to the right of the node.
    *   Contains a background `<rect>` and uses `renderIOListToPopover` helper to list inputs and outputs.
    *   `renderIOListToPopover`:
        *   Takes items (inputs/outputs), title, offset, and popover width.
        *   Truncates long lists with an "...and X more" indicator.
        *   Truncates long variable names.
        *   Calculates required height and returns the SVG elements and height.
    *   Popover width adjusts slightly based on the longest I/O item name.

## Styling and Constants

*   Uses constants from `constants.ts` for default sizes, padding, colors (e.g., `DEFAULT_NODE_WIDTH`, `NODE_HEADER_HEIGHT`, `CONNECTION_POINT_RADIUS`, `CONNECTION_POINT_COLOR`).
*   Tailwind CSS classes (applied via SVG `className` attributes) are used for colors and some layout properties, though much of the styling is direct SVG attributes.
