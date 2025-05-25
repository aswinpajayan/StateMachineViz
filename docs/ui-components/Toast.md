
# Toast Components Documentation (`Toast.tsx`, `ToastContainer.tsx`)

Toast notifications are used to provide brief, auto-expiring messages to the user about the outcome of actions or important events. The system consists of two main components and a context.

## 1. `Toast.tsx`

This component renders an individual toast message.

### Responsibilities

*   **Display Message:** Shows the toast message text and an icon corresponding to its type (success, error, info, warning).
*   **Auto-Dismiss:** Automatically calls `onDismiss` after a specified `duration` (default 5 seconds).
*   **Manual Dismiss:** Provides an "X" button to allow the user to dismiss the toast manually.
*   **Styling:** Applies different background colors and icons based on the `message.type`.
*   **Animation:** Includes a simple fade-in animation.

### Key Props

*   `message: ToastMessage`: An object containing:
    *   `id: number`: A unique identifier for the toast.
    *   `message: string`: The text content of the toast.
    *   `type: 'success' | 'error' | 'info' | 'warning'`: Determines the styling and icon.
*   `onDismiss: () => void`: Callback function invoked when the toast should be removed (either automatically or manually).
*   `duration?: number`: Optional duration in milliseconds before the toast auto-dismisses (default: 5000ms).

### Logic

*   An `useEffect` hook sets up a `setTimeout` to call `onDismiss` after `duration`. The timer is cleared on component unmount or if `duration` or `onDismiss` changes.
*   Selects an appropriate icon (`CheckCircleSolidIcon`, `XCircleSolidIcon`, etc. from `FeedbackIcons.tsx`) and applies Tailwind CSS classes for styling based on `message.type`.
*   Includes inline CSS for a `fadeInRight` animation.

## 2. `ToastContainer.tsx`

This component acts as a container for all active toast messages, managing their layout on the screen.

### Responsibilities

*   **Layout:** Positions toasts in a stack, typically at the bottom-right or top-right of the screen.
*   **Rendering Toasts:** Maps over an array of `ToastMessage` objects and renders a `Toast` component for each one.

### Key Props

*   `toasts: ToastMessage[]`: An array of current toast messages to display.
*   `removeToast: (id: number) => void`: Callback function passed down to each `Toast` component. When a `Toast`'s `onDismiss` is called, it will invoke this `removeToast` with its ID.

### Structure

*   A `div` with fixed positioning (`fixed bottom-5 right-5 z-[100]`) to float above other content.
*   Iterates through the `toasts` array and renders `<Toast key={toast.id} message={toast} onDismiss={() => removeToast(toast.id)} />`.

## Integration with `ToastContext.tsx`

(Refer to [`docs/contexts/ToastContext.md`](../contexts/ToastContext.md) for details on the context itself.)

*   `ToastProvider` (from `ToastContext.tsx`) manages the `toasts` state and the `addToast` / `removeToast` functions.
*   `ToastProvider` renders `ToastContainer` internally, passing it the current `toasts` array and the `removeToast` function.
*   Other components in the application use the `useToast()` hook to get the `addToast` function, allowing them to easily trigger new toast notifications without directly managing the `ToastContainer`.
