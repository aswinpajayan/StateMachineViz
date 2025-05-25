
# Modal.tsx Documentation

The `Modal.tsx` component is a reusable dialog component used throughout the application to display information or forms to the user in an overlay.

## Responsibilities

*   **Overlay Display:** Renders a semi-transparent backdrop covering the main application content.
*   **Dialog Container:** Provides a styled container for the modal content, centered on the screen.
*   **Title:** Displays a title at the top of the modal.
*   **Close Mechanism:** Includes an "X" icon button to close the modal. Clicking the backdrop also closes the modal.
*   **Content Projection:** Accepts `children` prop to render arbitrary content within the modal body.
*   **Primary Action Button:** Can optionally display a primary action button (e.g., "Save Rules", "Add Variable") at the bottom, controlled by `primaryActionText` and `onSavePrimaryAction` props.
*   **Accessibility:** Uses `aria-label` for the close button.

## Key Props

*   `isOpen: boolean`: Controls the visibility of the modal. If `false`, the modal is not rendered.
*   `onClose: () => void`: Callback function invoked when the modal is requested to be closed (e.g., by clicking the "X" button or the backdrop).
*   `title: string`: The text to display as the modal's title.
*   `children: React.ReactNode`: The main content to be rendered inside the modal. This allows `App.tsx` (or other parent components) to define specific forms or information displays.
*   `onSavePrimaryAction?: () => void`: Optional callback function for the primary action button. If provided along with `primaryActionText`, the button is rendered.
*   `primaryActionText?: string`: Optional text for the primary action button.

## Structure and Styling

*   **Outermost `div`:** Fixed position, covers the entire screen, acts as the backdrop. `onClick` handler calls `props.onClose`.
*   **Inner `div` (Dialog Box):**
    *   Styled with background color, padding, rounded corners, shadow.
    *   Centered on the screen.
    *   `onClick` handler calls `e.stopPropagation()` to prevent clicks inside the modal from closing it via the backdrop's click handler.
    *   Max width and max height are set to ensure it's responsive and doesn't overflow small screens.
    *   Uses flexbox to arrange header, content, and optional footer.
*   **Header Section:**
    *   Displays the `title`.
    *   Contains the close "X" button (`XIcon`).
*   **Content Section:**
    *   Renders `props.children`.
    *   Set to `overflow-y-auto` to allow scrolling if the content is too tall.
*   **Footer Section (Conditional):**
    *   Rendered if `onSavePrimaryAction` and `primaryActionText` are provided.
    *   Contains the primary action button.

## Usage Example (from `App.tsx` for Transition Details)

```tsx
// In App.tsx
{selectedModalTransition && allMachines[selectedModalTransition.machineId] && (
  <Modal
    title="Transition Details"
    isOpen={!!selectedModalTransition}
    onClose={() => setSelectedModalTransition(null)}
    primaryActionText="Save Rules"
    onSavePrimaryAction={handleSaveTransitionRules}
  >
    {/* Children JSX defining the form for transition rules, connection sides, etc. */}
    <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded space-y-3">
      {/* ... form elements ... */}
    </div>
  </Modal>
)}
```

In this example:
*   `App.tsx` controls `isOpen` via `!!selectedModalTransition`.
*   `onClose` sets `selectedModalTransition` to `null`.
*   `App.tsx` provides the title.
*   The specific form for editing transition rules (labels, dropdowns, textarea) is passed as `children`.
*   The "Save Rules" button is rendered by `Modal.tsx`, and its click action is `handleSaveTransitionRules` from `App.tsx`.

This pattern allows `Modal.tsx` to be generic for the container and common actions, while `App.tsx` defines the specific content and save logic for different use cases (e.g., transition editing, adding variables, adding nodes).
