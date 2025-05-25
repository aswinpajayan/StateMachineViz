
# SideBar.tsx Documentation

The `SideBar.tsx` component provides the "Explorer" panel, allowing users to navigate the hierarchy of loaded state machines, their nodes, and variables. It also provides controls for adding new variables or nodes to the active machine.

## Responsibilities

*   **Display Hierarchy:** Renders a tree-like structure of:
    *   Loaded State Machines.
    *   Under each machine:
        *   Nodes (each expandable to show its direct inputs/outputs).
        *   A "Variables" group listing machine-specific variables (inputs, outputs, intermediate).
*   **Navigation:** Allows users to select an active state machine by clicking its name.
*   **Collapsibility:**
    *   The entire sidebar can be collapsed to a minimal width or expanded.
    *   Individual items in the tree (machines, nodes, variable groups) can be expanded or collapsed to show/hide their children.
*   **Adding Entities:**
    *   Displays a "+" button next to the active machine's name to trigger the "Add New State Node" modal.
    *   Displays a "+" button next to the "Variables" group of the active machine to trigger the "Add New Variable" modal.
*   **Visual Cues:** Uses icons to represent different item types (machine, node, variable type, folder). Highlights the currently active machine.

## Key Props

*   `hierarchy: HierarchicalItem[]`: An array of `HierarchicalItem` objects representing the top-level items to display (usually a list of machines). The `HierarchicalItem` structure is recursive via its `children` property.
*   `activeMachineId?: string`: The ID of the currently active state machine, used for highlighting.
*   `onMachineSelect: (machineId: string) => void`: Callback function invoked when a machine item is clicked.
*   `isCollapsed: boolean`: Boolean indicating if the sidebar is in its collapsed state.
*   `onToggleCollapse: () => void`: Callback to toggle the sidebar's collapsed state.
*   `onOpenAddVariableModal: (machineId: string) => void`: Callback to open the "Add Variable" modal for the specified machine.
*   `onOpenAddNodeModal: (machineId: string) => void`: Callback to open the "Add Node" modal for the specified machine.

## `SideBarItem` Sub-Component

The `SideBar` component uses an internal recursive `SideBarItem` component to render each item in the hierarchy.

### `SideBarItem` Props:

*   `item: HierarchicalItem`: The data for the current item to render.
*   `level: number`: The current nesting level (for indentation).
*   `activeMachineId?: string`: Passed down for highlighting.
*   `onMachineSelect`: Passed down.
*   `isSidebarCollapsed`: Passed down to adjust rendering in collapsed mode.
*   `onOpenAddVariableModal?`: Passed down.
*   `onOpenAddNodeModal?`: Passed down.

### `SideBarItem` Internal State:

*   `isExpanded: boolean`: Tracks if the current item's children are visible.
    *   Defaults to `true` for `item.type === 'machine'`.
    *   Defaults to `false` for other expandable types (nodes with I/O, variable groups).

### `SideBarItem` Rendering Logic:

*   **Indentation:** `paddingLeft` is calculated based on `level` and `isSidebarCollapsed`.
*   **Icon:** An appropriate icon (`StateMachineIcon`, `FolderIcon`, `SimpleNodeIcon`, `HierarchicalNodeIcon`, `InputIcon`, etc.) is selected based on `item.type`, `item.nodeType`, or `item.variableType`.
*   **Expand/Collapse Chevron:** If `item.children` exist and the sidebar is not collapsed, a `ChevronDownIcon` or `ChevronRightIcon` is displayed to toggle `isExpanded`.
*   **Name:** The `item.name` is displayed. It's truncated if the sidebar is not collapsed and the name is too long.
*   **"+" Buttons:**
    *   If `item.type === 'machine'` and `item.id === activeMachineId` and `onOpenAddNodeModal` is provided, a "+" button is shown to add a node.
    *   If `item.type === 'variable_group'`, `item.isMachineVariablesGroup` is true, `item.id` matches the active machine's variable group ID, and `onOpenAddVariableModal` is provided, a "+" button is shown to add a variable.
*   **Click Handling:** Clicking an item toggles its `isExpanded` state (if it has children) and calls `onMachineSelect` if it's a machine item.
*   **Recursive Rendering:** If `isExpanded` is true and `item.children` exist (and sidebar is not collapsed), it recursively renders `SideBarItem` for each child, incrementing the `level`.
*   **Collapsed Mode Display:** When `isSidebarCollapsed` is true:
    *   Only icons for top-level machines (first few) are shown.
    *   Text names and expand/collapse chevrons are hidden.
    *   "+" buttons for adding nodes/variables are hidden.

## Main `SideBar` Component Logic

*   Displays a header with an "Explorer" title (if not collapsed) and a toggle button (`ChevronDoubleLeftIcon`/`ChevronDoubleRightIcon`) that calls `onToggleCollapse`.
*   If not collapsed, it maps over the `hierarchy` prop, rendering a `SideBarItem` for each top-level item.
*   If collapsed, it displays a compact list of icons for the first few machines.
*   The main `div` of the `SideBar` transitions its `width` based on the `isCollapsed` prop.
