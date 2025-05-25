
# Hierarchical State Machine Visualizer & Editor

## Description

The Hierarchical State Machine Visualizer & Editor is a web application designed for creating, visualizing, and modifying hierarchical state machines. It offers a Node-RED-like user interface with a vertical flow, allowing users to intuitively design complex state logic. The application supports nested state machines, variable management, and interactive editing of transitions and states.

**Acknowledgements:** This project was significantly developed with the assistance of Google's Gemini model, which contributed to coding, component structure, feature implementation, and documentation.

## Features

*   **Visual State Machine Design:** Create and arrange states and transitions on an interactive canvas.
*   **Hierarchical States:** Define complex states by nesting entire state machines within a hierarchical node. Expand and collapse these nodes on the canvas to view sub-machine details.
*   **Node & Transition Editing:**
    *   Add new state nodes (Simple or Hierarchical) via sidebar or canvas.
    *   Define node names, types, and associate existing machine variables as inputs.
    *   Create transitions by dragging between node connection points (top, bottom, left, right).
    *   Edit transition rules and connection sides via a modal.
    *   Adjust transition line curves by dragging their midpoint.
*   **Variable Management:**
    *   Define machine-level variables (Input, Output, Intermediate) for each state machine.
    *   Modal dialog for adding new variables with name and type.
*   **Interactive Canvas:**
    *   Pan and zoom the canvas for better navigation.
    *   "Zoom to Fit" functionality.
    *   Select and highlight nodes or transitions.
    *   Delete selected components using the "Delete" key or context menus for transitions.
*   **Sidebar Explorer:**
    *   View a hierarchical list of all loaded state machines.
    *   Under each machine:
        *   Nodes are listed, each expandable to show its inputs and outputs (identified by icons).
        *   A "Variables" section lists machine-specific variables.
    *   Add new variables or state nodes to the active machine directly from the sidebar.
    *   Collapsible sidebar to maximize canvas space.
*   **Undo/Redo:** Supports undo and redo for major operations like node/transition creation, deletion, and updates to transitions or variables.
*   **Import/Export:**
    *   Load state machine definitions from a JSON file.
    *   Export the current set of state machines to a JSON file.
*   **Theming:** Supports Light, Dark, and System themes.
*   **Context Menus:** Right-click on transitions to delete them.
*   **Toast Notifications:** Provides user feedback for various actions.

## Technologies Used

*   **React:** For building the user interface.
*   **TypeScript:** For static typing and improved code quality.
*   **Tailwind CSS:** For styling the application (via CDN).
*   **HTML5 & CSS3:** Standard web technologies.
*   **ES Modules:** Native browser module system for JavaScript.

## Project Structure

The application consists of several key components and contexts:

*   `index.html`: The main entry point, includes Tailwind CSS and the import map for ES modules.
*   `index.tsx`: Mounts the React application.
*   `App.tsx`: The main application component, managing state and core logic.
*   `components/`: Directory for UI components.
    *   `TopBar.tsx`: Header with global actions (upload, export, undo/redo, theme).
    *   `SideBar.tsx`: Explorer for machines, nodes, and variables.
    *   `CanvasArea.tsx`: The interactive canvas for displaying and editing state machines.
    *   `StateNodeDisplay.tsx`: Renders individual state nodes.
    *   `TransitionLineDisplay.tsx`: Renders transitions between nodes.
    *   `Modal.tsx`: Reusable modal component.
    *   `ContextMenu.tsx`: For right-click menus.
    *   `Toast.tsx`, `ToastContainer.tsx`: For displaying notifications.
    *   `icons/`: SVG icons used throughout the application.
*   `contexts/`: React context for shared state.
    *   `ToastContext.tsx`: Manages toast notifications.
    *   `ThemeContext.tsx`: Manages application theme.
*   `types.ts`: TypeScript type definitions and interfaces.
*   `constants.ts`: Shared constants and utility functions like `assignNodeSizes`.
*   `default-state-machine.ts`: Defines the initial state machines loaded on startup.

## Quick Start / Usage

1.  **Prerequisites:**
    *   A modern web browser that supports ES Modules (e.g., Chrome, Firefox, Edge, Safari).
2.  **Running the Application:**
    *   Clone the repository or download the project files.
    *   Open the `index.html` file directly in your web browser. No build step is required for basic operation due to the use of ES modules and CDN for Tailwind.
    *   Alternatively, serve the project directory using a simple HTTP server (e.g., `npx serve .`).
3.  **Interacting with the Application:**
    *   **Loading Machines:** Default machines are loaded on startup. Use the "Upload" button in the Top Bar to load additional state machines from a JSON file (see `default-state-machine.ts` for an example of the expected format).
    *   **Selecting a Machine:** Click on a machine name in the "Explorer" sidebar to make it active on the canvas.
    *   **Canvas Navigation:**
        *   **Pan:** Click and drag on an empty area of the canvas.
        *   **Zoom:** Use the mouse wheel or zoom buttons (top-right of the canvas).
        *   **Zoom to Fit:** Click the "Fit to Screen" icon (top-right of the canvas).
    *   **Adding Nodes:**
        *   **From Sidebar:** Click the "+" icon next to the active machine's name in the sidebar.
        *   **From Canvas:** Click the "+" icon on the top-left of the canvas.
        *   In the "Add New State Node" modal:
            *   Select node type (Simple/Hierarchical).
            *   Enter node name.
            *   Optionally, create a new variable for the machine or add existing machine variables as inputs to the node.
    *   **Adding Transitions:** Click and drag from a connection point (small gray circles on node edges) on one node to a connection point on another node. The transition modal will open automatically to define rules.
    *   **Editing Nodes/Transitions:**
        *   **Node Position:** Click and drag a node to move it.
        *   **Node Expansion (Hierarchical):** Click the (+)/(-) icon on a hierarchical node to expand/collapse its sub-machine view.
        *   **Transition Curve:** Drag the midpoint handle (blue arrow) on a transition line.
        *   **Transition Details:** Double-click a transition line to open the modal for editing rules and connection sides.
    *   **Adding Machine Variables:** Click the "+" icon next to the "Variables" group under the active machine in the sidebar.
    *   **Deleting Components:**
        *   Select a node or transition by clicking on it.
        *   Press the "Delete" or "Backspace" key.
        *   Alternatively, right-click a transition line and select "Delete Transition" from the context menu.
    *   **Sidebar Management:**
        *   Click the collapse/expand icon (double chevrons) at the top of the sidebar.
        *   Expand/collapse machines, nodes, and variable groups by clicking the chevrons next to their names.
    *   **Undo/Redo:** Use the "Undo" and "Redo" buttons in the Top Bar.
    *   **Exporting:** Click the "Export" button to download all current state machines as a JSON file.
    *   **Theme:** Use the theme switcher in the Top Bar to change between Light, Dark, and System themes.

## Contributing

Contributions are welcome! If you'd like to contribute, please consider the following:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix.
3.  **Make your changes.** Ensure code is well-formatted and follows existing patterns.
4.  **Test your changes thoroughly.**
5.  **Submit a pull request** with a clear description of your changes.

Please refer to the `developer-docs.md` and `TODO.md` for insights into the codebase and potential areas for contribution.

## License

This project is open-source and available under the [MIT License](LICENSE.md) (You would need to create a LICENSE.md file with the MIT license text).

---
*This README was generated with the assistance of AI and based on the provided project structure.*
