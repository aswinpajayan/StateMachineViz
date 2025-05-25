
# TopBar.tsx Documentation

The `TopBar.tsx` component serves as the main application header. It provides global action buttons and displays the name of the currently active state machine.

## Responsibilities

*   **Display Active Machine Name:** Shows the `name` of the `currentMachineName` prop.
*   **Global Actions:** Provides buttons for:
    *   Uploading a JSON file (`onFileUpload`).
    *   Validating the current state machine (`onValidate` - currently a placeholder).
    *   Running/simulating the state machine (`onRun` - currently a placeholder).
    *   Exporting all loaded state machines to JSON (`onExport`).
    *   Undo (`onUndo`) and Redo (`onRedo`) actions.
*   **Theme Switching:** Includes a `ThemeSwitcher` component to allow users to change the application theme (Light, Dark, System).
*   **Responsive Design:** Hides text labels for buttons on smaller screens, showing only icons.

## Key Props

*   `onFileUpload: (file: File) => void`: Callback triggered when a file is selected for upload.
*   `onValidate: () => void`: Callback for the "Validate" button.
*   `onRun: () => void`: Callback for the "Run" button.
*   `onExport: () => void`: Callback for the "Export" button.
*   `onUndo: () => void`: Callback for the "Undo" button.
*   `onRedo: () => void`: Callback for the "Redo" button.
*   `canUndo: boolean`: Determines if the "Undo" button should be enabled.
*   `canRedo: boolean`: Determines if the "Redo" button should be enabled.
*   `currentMachineName: string`: The name of the currently active state machine to display.

## Internal Components

*   **`Button`:** A simple styled button component used for all action buttons in the `TopBar`. It accepts `onClick`, `children`, `className`, `title`, and `disabled` props.
*   **`ThemeSwitcher`:**
    *   Uses `useTheme` hook from `../contexts/ThemeContext.tsx`.
    *   Displays the current theme icon and label.
    *   On click, opens a dropdown menu to select a new theme (Light, Dark, System).
    *   Manages its own open/close state for the dropdown.
    *   Dropdown closes on outside click.

## Structure and Styling

*   The `TopBar` is a flex container aligning its children: the title on the left and action buttons/theme switcher on the right.
*   Uses Tailwind CSS classes for styling, providing a consistent look and feel with the rest of the application.
*   Buttons include relevant icons from `components/icons/ActionIcons.tsx` and `components/icons/ThemeIcons.tsx`.
*   Dividers (`<div className="h-6 w-px bg-slate-300 dark:bg-slate-500 mx-1"></div>`) are used to visually separate groups of buttons.
*   The file upload is handled by a hidden `<input type="file">` element, which is triggered programmatically when the "Upload" button is clicked.

## Event Handling

*   **File Upload:**
    *   The "Upload" `Button` clicks a hidden `fileInputRef.current`.
    *   The `onChange` event of the file input calls `handleFileChange`.
    *   `handleFileChange` retrieves the selected file and calls `props.onFileUpload(file)`. It also resets the file input's value to allow uploading the same file again if needed.
*   Other action buttons directly call their respective `onClick` props (`onValidate`, `onRun`, `onExport`, `onUndo`, `onRedo`).
*   Undo/Redo buttons are disabled based on `canUndo` and `canRedo` props.
