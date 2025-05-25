
# UI Components Documentation

This section provides detailed documentation for the various React UI components used in the Hierarchical State Machine Visualizer.

## Core Components

*   **[`CanvasArea.tsx`](./CanvasArea.md):** The main interactive area where state machines are visualized and edited.
*   **[`StateNodeDisplay.tsx`](./StateNodeDisplay.md):** Responsible for rendering individual state nodes on the canvas.
*   **[`TransitionLineDisplay.tsx`](./TransitionLineDisplay.md):** Responsible for rendering transitions (lines and handles) between nodes.
*   **[`SideBar.tsx`](./SideBar.md):** The explorer panel for navigating machines, nodes, and variables.
*   **[`TopBar.tsx`](./TopBar.md):** The header panel containing global actions like import/export, undo/redo, and theme switching.
*   **[`Modal.tsx`](./Modal.md):** A reusable modal dialog component.
*   **[`ContextMenu.tsx`](./ContextMenu.md):** A component for displaying context-sensitive right-click menus.
*   **[`Toast.tsx` & `ToastContainer.tsx`](./Toast.md):** Components for displaying toast notifications.

## Icon Components

The application uses various SVG icons, organized into sub-directories within `components/icons/`:

*   `ActionIcons.tsx` (e.g., Upload, Download, Plus, Trash)
*   `ChevronIcons.tsx` (e.g., ChevronDown, ChevronRight)
*   `FeedbackIcons.tsx` (e.g., Info, CheckCircle)
*   `HierarchyIcons.tsx` (e.g., PlusCircle, MinusCircle for node expansion)
*   `ThemeIcons.tsx` (e.g., Sun, Moon)
*   `TypeIcons.tsx` (e.g., StateMachine, Node, Variable types)
*   `ZoomIcons.tsx` (e.g., ZoomIn, ZoomOut)

These are simple functional components that render SVG markup.
