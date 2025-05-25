
# ToastContext.tsx Documentation

The `ToastContext` is responsible for managing and providing a global way to display toast notifications to the user.

## Responsibilities

*   **Toast State Management:** Maintains an array of active `ToastMessage` objects.
*   **Adding Toasts:** Provides an `addToast` function that components can call to trigger a new notification.
*   **Removing Toasts:** Provides a mechanism (implicitly via `ToastContainer`) to remove toasts after they are displayed or dismissed.
*   **Rendering Container:** Includes the `ToastContainer` component to display the actual toast messages.

## `ToastProvider` Component

*   **Props:** `children: React.PropsWithChildren<{}>`
*   **Functionality:**
    *   Manages `toasts: ToastMessage[]` state using `useState`.
    *   `addToast(message, type)`:
        *   A `useCallback` function.
        *   Creates a new `ToastMessage` object with a unique ID (using `Date.now() + Math.random()`), the provided `message`, and `type` (defaults to `'info'`).
        *   Appends the new toast to the `toasts` array using `setToasts`.
    *   `removeToast(id)`:
        *   A `useCallback` function.
        *   Filters the `toasts` array to remove the toast with the given `id`.
        *   Passed to `ToastContainer`, which then passes it to individual `Toast` components.
    *   Provides `{ addToast }` through `ToastContext.Provider`.
    *   Renders its `children` and also renders the `<ToastContainer toasts={toasts} removeToast={removeToast} />` to display the toasts.

## `useToast` Hook

*   A custom hook that provides easy access to the `ToastContext`.
*   Usage: `const { addToast } = useToast();`
*   Allows any component within the `ToastProvider` to easily display a toast notification by calling `addToast("My message", "success")`.
*   Throws an error if used outside of a `ToastProvider`.

## How it Works

1.  `ToastProvider` wraps a part of the application (typically the root `App` component or a high-level layout component, as seen in `index.tsx`).
2.  Components needing to show a toast call `addToast()` obtained from `useToast()`.
3.  This updates the `toasts` state within `ToastProvider`.
4.  The `ToastContainer` (rendered by `ToastProvider`) receives the updated `toasts` array and renders the corresponding `Toast` components.
5.  Each `Toast` component manages its own auto-dismissal timer or manual dismissal, eventually calling `removeToast(id)` (which was passed down from `ToastProvider` via `ToastContainer`) to remove itself from the `toasts` state.

This system decouples the triggering of toasts from their actual rendering and management, making it easy to display notifications from anywhere in the component tree.
