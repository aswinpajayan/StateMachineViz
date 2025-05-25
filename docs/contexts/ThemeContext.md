
# ThemeContext.tsx Documentation

The `ThemeContext` provides a global way to manage and apply themes (Light, Dark, or System-preference) across the application.

## Responsibilities

*   **Theme State Management:** Stores the current active theme (`'light'`, `'dark'`, or `'system'`).
*   **Theme Persistence:** Saves the user's theme preference to `localStorage` and loads it on initialization.
*   **Applying Theme:** Dynamically adds or removes the `'dark'` class to the `<html>` element based on the current theme and system preferences (if the theme is set to 'system').
*   **System Preference Listening:** If the theme is set to 'system', it listens for changes in the operating system's preferred color scheme and updates the applied theme accordingly.
*   **Providing Theme Access:** Exposes the current `theme` and a `setTheme` function to components via the `useTheme` hook.

## `ThemeProvider` Component

*   **Props:** `children: React.PropsWithChildren<{}>`
*   **Functionality:**
    *   Initializes `theme` state:
        1.  Tries to load from `localStorage.getItem('theme')`.
        2.  If not found or invalid, defaults to `'system'`.
    *   `applyTheme(themeToApply)`: A `useCallback` function that:
        *   Checks `window.matchMedia('(prefers-color-scheme: dark)').matches` if `themeToApply` is `'system'`.
        *   Adds/removes the `'dark'` class on `document.documentElement`.
    *   `useEffect` hook for `theme` changes: Calls `applyTheme(theme)` whenever the `theme` state variable changes.
    *   `useEffect` hook for system preference changes:
        *   Active only if `theme === 'system'`.
        *   Adds an event listener to `window.matchMedia('(prefers-color-scheme: dark)')` for `'change'` events.
        *   When the system preference changes, it calls `applyTheme('system')` to re-evaluate.
        *   Cleans up the event listener on unmount or if `theme` changes from `'system'`.
    *   `setTheme(newTheme)`:
        *   Updates the internal `theme` state via `setThemeState`.
        *   Saves `newTheme` to `localStorage.setItem('theme', newTheme)`.
    *   Provides `{ theme, setTheme }` through `ThemeContext.Provider`.

## `useTheme` Hook

*   A custom hook that provides easy access to the `ThemeContext`.
*   Usage: `const { theme, setTheme } = useTheme();`
*   Throws an error if used outside of a `ThemeProvider`.

## How it Works

1.  `ThemeProvider` wraps the application (e.g., in `index.tsx`).
2.  On load, it determines the initial theme (localStorage > system default).
3.  The first `useEffect` applies this initial theme to the `<html>` tag.
4.  Components can use `useTheme()` to get the current theme (e.g., for conditional styling not covered by global dark mode class) or the `setTheme` function (e.g., `ThemeSwitcher` component).
5.  When `setTheme` is called, the `theme` state updates, localStorage is updated, and the `useEffect` watching `theme` re-runs `applyTheme` to update the `<html>` class.
6.  If the theme is 'system', the second `useEffect` listens for OS-level theme changes and calls `applyTheme` to reflect them automatically.

This setup ensures a reactive theme system that respects user preferences and system settings.
