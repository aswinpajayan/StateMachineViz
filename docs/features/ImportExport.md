
# Import/Export Logic Documentation

The application allows users to import state machine definitions from a JSON file and export the current set of all loaded state machines to a JSON file.

## Exporting State Machines

Triggered by the "Export" button in `TopBar.tsx`.

### `handleExport()` in `App.tsx`

1.  **Check for Data:** If `Object.keys(allMachines).length === 0`, an error toast is shown, and the function returns.
2.  **Data Preparation:**
    *   `Object.values(allMachines).map(m => { ... })` is used to create an array of state machines for export.
    *   For each machine `m`:
        *   Node types (`NodeType` enum) are converted from their TypeScript enum value (e.g., `NodeType.Simple`) back to their string representation (e.g., `"SIMPLE"`) for JSON compatibility. This is done using `NodeType[n.type]`.
        *   Variable types (`VariableType` enum) within `m.variables` are similarly converted back to string representations like `"input"`, `"output"`.
        *   Other properties like `id`, `name`, `metadata` (positions, offsets, sides), `rules` are included as is.
3.  **JSON Serialization:**
    *   `JSON.stringify(exportData, null, 2)` converts the prepared array of machines into a formatted JSON string (with 2-space indentation).
4.  **File Download:**
    *   A new `Blob` is created from the `jsonString` with `type: 'application/json'`.
    *   A temporary `<a>` (link) element is created.
    *   `URL.createObjectURL(blob)` generates a URL for the blob.
    *   The link's `href` is set to this URL, and `download` attribute is set to a filename (e.g., `state_machines_export.json`).
    *   The link is appended to the document, clicked programmatically to trigger the download, and then removed.
    *   `URL.revokeObjectURL(link.href)` cleans up the object URL.
5.  **Feedback:** A success toast is displayed.

### Exported JSON Format

The exported JSON will be an array of `StateMachine` objects. Refer to `default-state-machine.ts` for a practical example of the structure, keeping in mind the enum-to-string conversions mentioned above for `type` fields. Node metadata (position, size, isExpanded) and transition metadata (midPointOffset, fromNodeSide, toNodeSide) are included.

## Importing State Machines

Triggered by the "Upload" button in `TopBar.tsx`.

### `handleFileUpload(file: File)` in `App.tsx`

1.  **File Reading:**
    *   A `FileReader` instance is created.
    *   `reader.readAsText(file)` initiates reading the file content.
2.  **`reader.onload` Callback:**
    *   **Parsing:**
        *   `event.target?.result as string` gets the file content.
        *   `JSON.parse(content)` attempts to parse the JSON string.
    *   **Validation (Basic):**
        *   Checks if `parsedJson` is an array.
        *   Checks if every element in the array looks like a state machine (has `id`, `name`, `nodes` array, `transitions` array).
        *   If validation fails, an error is thrown, caught, and an error toast is displayed.
    *   **Data Processing:**
        *   `newMachinesData = parsedJson as any[]` (casting to `any[]` before more specific processing).
        *   A `newMachinesRecord: Record<string, StateMachine> = {}` is created.
        *   Iterates through `newMachinesData`:
            *   For each `loadedMachine`:
                *   **Node Processing:**
                    *   `loadedMachine.nodes.map(...)` processes each node.
                    *   Node `type` is converted from string (e.g., "HIERARCHICAL") to `NodeType` enum (e.g., `NodeType.Hierarchical`).
                    *   `metadata` (position, size, isExpanded) is extracted. It attempts to read from `n.metadata?.position` or `n.position` (for backward compatibility with potentially older formats if `position` was a direct property). Defaults are applied if properties are missing.
                    *   `assignNodeSizes()` is called on the processed nodes to ensure correct default sizes.
                *   **Transition Processing:**
                    *   `loadedMachine.transitions.map(...)` processes each transition.
                    *   `metadata` (midPointOffset, fromNodeSide, toNodeSide) is extracted, with defaults for missing properties. Similar backward compatibility checks for `midPointOffset` might be present.
                *   **Variables:** `loadedMachine.variables` are taken as is, or an empty object ` {}` is used if undefined. (Note: Variable types are enums in the app; the export converts them to strings. The import should ideally convert them back to enums if the raw JSON uses string representations for `variable.type`). The current import logic for variables might directly assign the string type if the JSON has it as a string.
                *   The processed machine is added to `newMachinesRecord`.
                *   The ID of the first loaded machine is stored in `firstNewMachineId`.
    *   **State Update:**
        *   `setAllMachines(newMachinesRecord)` replaces all existing machines.
        *   `setUndoStack([])` and `setRedoStack([])` clear the undo/redo history.
    *   **Feedback:**
        *   A success toast is shown, indicating which machine is now active (if any).
        *   Warning toasts are shown if the file was loaded but empty or if an active machine couldn't be set.
3.  **`reader.onerror` Callback:** Displays an error toast if file reading fails.

### Expected Import JSON Format

The import expects an array of objects, where each object largely conforms to the `StateMachine` interface. Key points for successful import:
*   Top-level structure must be an array `[]`.
*   Each object in the array must have `id`, `name`, `nodes` (array), `transitions` (array).
*   Node `type` should be a string like "SIMPLE" or "HIERARCHICAL".
*   Node `metadata` should contain `position`. `size` and `isExpanded` are optional.
*   Transition `metadata` should contain `midPointOffset`, `fromNodeSide`, `toNodeSide`.
*   `variables` should be a record where values have a `type` string ("input", "output", "intermediate").

The system is somewhat resilient to missing optional metadata, applying defaults.
