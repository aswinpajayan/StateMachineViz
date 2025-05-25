
# ContextMenu.tsx Documentation

The `ContextMenu.tsx` component is responsible for displaying a custom context-sensitive menu (typically triggered by a right-click).

## Responsibilities

*   **Dynamic Positioning:** Renders the menu at specific `x` and `y` screen coordinates.
*   **Action List:** Displays a list of clickable actions, each potentially with a label and an icon.
*   **Closing Mechanism:**
    *   Calls `props.onClose` when an action is clicked.
    *   Includes an effect to call `props.onClose` if a click occurs outside the menu itself. Global "Escape" key handling to close the menu is typically managed by the parent component (e.g., `App.tsx`).

## Key Props

*   `x: number`: The screen X-coordinate where the top-left corner of the menu should appear.
*   `y: number`: The screen Y-coordinate where the top-left corner of the menu should appear.
*   `actions: ContextMenuAction[]`: An array of action objects. Each `ContextMenuAction` (defined in `types.ts`) has:
    *   `label: string`: The text displayed for the action.
    *   `onClick: () => void`: The function to call when the action is clicked.
    *   `icon?: React.ReactNode`: An optional icon to display next to the label.
*   `onClose: () => void`: Callback function invoked to signal that the menu should be closed.

## Internal Logic

*   **Positioning:** Uses `position: 'fixed'` and sets `top` and `left` styles based on `props.x` and `props.y`. A high `zIndex` ensures it appears above other content.
*   **Rendering Actions:** Maps over the `props.actions` array, rendering a `<button>` for each action within an `<li>`.
*   **Outside Click Handling:**
    *   Uses a `useRef` (`menuRef`) attached to the main `div` of the context menu.
    *   A `useEffect` hook adds a `mousedown` event listener to the `document`.
    *   If a mousedown event occurs and `menuRef.current` does not contain the event target (meaning the click was outside the menu), `props.onClose()` is called.
    *   The event listener is cleaned up when the component unmounts or `onClose` changes.
*   **Action Click:** When an action button is clicked, its `action.onClick()` handler is executed, and then `props.onClose()` is called to close the menu.

## Styling

*   Styled using Tailwind CSS classes for background, shadow, border, and text.
*   The menu has a `min-w-[180px]` to ensure a reasonable default width.
*   An `id="custom-context-menu"` is applied to the root `div`, which can be used by parent components (like `App.tsx`) if they need to specifically identify the menu element (e.g., for more complex outside click logic, though the component handles basic outside clicks itself).

## Usage Example (Conceptual, based on `App.tsx` structure)

```tsx
// In App.tsx
// ... state for contextMenuInfo { transitionId, machineId, position } ...

const contextMenuActions: ContextMenuAction[] = contextMenuInfo ? [
  {
    label: 'Delete Transition',
    onClick: () => handleDeleteTransition(contextMenuInfo.transitionId, contextMenuInfo.machineId),
    icon: <TrashIcon className="w-4 h-4 mr-2 text-red-500 dark:text-red-400" />
  }
] : [];

// ... in render ...
{contextMenuInfo && (
  <ContextMenu
    x={contextMenuInfo.position.x}
    y={contextMenuInfo.position.y}
    actions={contextMenuActions}
    onClose={handleCloseContextMenu} // handleCloseContextMenu in App.tsx sets contextMenuInfo to null
  />
)}
```
When `App.tsx` determines a context menu should be shown (by setting `contextMenuInfo`), it renders the `ContextMenu` component with the appropriate position and actions.
