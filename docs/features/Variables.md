
# Variable Management Documentation

The application allows for the definition and display of variables associated with state machines and nodes.

## Variable Types (`types.ts`)

*   **`VariableType` Enum:** Defines the kinds of variables:
    *   `Input`: Typically represents data coming into a state machine or node.
    *   `Output`: Represents data going out from a state machine or node.
    *   `Intermediate`: Represents internal variables used within a state machine's logic.
*   **`Variable` Interface:**
    ```typescript
    export interface Variable {
      type: VariableType;
      value?: any; // Optional initial or current value
    }
    ```

## Machine-Level Variables

Each `StateMachine` object can have a `variables?: Record<string, Variable>` property. This is a dictionary where keys are variable names and values are `Variable` objects.

### Adding Machine Variables

1.  **User Interaction (`SideBar.tsx`):**
    *   The user clicks the "+" (PlusIcon) button next to the "Variables" group under the *active* machine in the sidebar.
    *   The `SideBarItem` component calls `props.onOpenAddVariableModal(activeMachineId)`.
2.  **Modal Opening (`App.tsx`):**
    *   `handleOpenAddVariableModal(machineId)` in `App.tsx` is invoked.
    *   It sets `isAddVariableModalOpen = true`, `targetMachineIdForNewVariable = machineId`, and resets modal input states (`newVariableName`, `newVariableType`).
3.  **"Add New Variable" Modal (`App.tsx` rendering content for `Modal.tsx`):**
    *   **Inputs:**
        *   A dropdown (`<select>`) for `newVariableType` (options: Input, Output, Intermediate) with a "Select type" placeholder.
        *   An input field for `newVariableName` with a placeholder "Enter variable name".
    *   **Saving:**
        *   User clicks the "Add Variable" button (primary action).
        *   `Modal.tsx` calls `props.onSavePrimaryAction`, which is `handleSaveNewVariable` in `App.tsx`.
4.  **`handleSaveNewVariable()` in `App.tsx`:**
    *   Validates that `targetMachineIdForNewVariable`, `newVariableName` (trimmed), and `newVariableType` are provided.
    *   Checks if the variable name already exists in the target machine's `variables`.
    *   Creates a `newVariable: Variable` object.
    *   Pushes an `ADD_MACHINE_VARIABLE` action to the `undoStack` (containing `machineId`, `variableName`, `variable`).
    *   Updates `allMachines`: finds the target machine and adds the new variable to its `variables` record.
    *   Closes the modal and shows a success toast.

### Displaying Machine Variables (`SideBar.tsx`)

*   The `buildSidebarHierarchy` function in `App.tsx`:
    *   For each machine, it creates a `HierarchicalItem` for "Variables" (`type: 'variable_group'`, `isMachineVariablesGroup: true`).
    *   It iterates through `machine.variables`, creating a child `HierarchicalItem` for each variable (`type: 'variable'`, with `variableType` and `name`).
*   `SideBarItem.tsx` renders these:
    *   The "Variables" group is collapsible (defaults to collapsed).
    *   Individual variables are displayed with appropriate icons (`InputIcon`, `OutputIcon`, `IntermediateIcon`) based on their `variableType`.

## Node Inputs and Outputs

`StateNode` objects have `inputs: string[]` and `outputs: string[]` arrays, which store the *names* of variables that act as inputs or outputs for that specific node. These names typically refer to variables defined at the machine level or passed from a parent machine in a hierarchical context.

### Associating Variables with New Nodes

When adding a new state node via the "Add New State Node" modal (`App.tsx`):
1.  **"Create new variable" Button:**
    *   Allows the user to click a button within the "Add Node" modal.
    *   This button calls `handleOpenAddVariableModal(targetMachineIdForNewNode)`, opening the "Add Variable" modal to define a new variable for the machine that the new node will belong to.
2.  **"Add Variables" Section Toggle:**
    *   A button (labeled "Add Variables" with a PlusIcon) toggles the visibility (`showAddNodeVariableSelector` state) of a selection UI.
3.  **Variable Selection UI (if visible):**
    *   A dropdown lists all variables from `allMachines[targetMachineIdForNewNode].variables` that haven't already been added to `newNodeSelectedMachineVariables`.
    *   An "Add to Node" button calls `handleAddVariableToNewNodeList(variableToAddFromMachine)`.
    *   `handleAddVariableToNewNodeList` adds the selected `variableToAddFromMachine` to the `newNodeSelectedMachineVariables` array (local state for the modal).
    *   A list displays `newNodeSelectedMachineVariables`, with "X" buttons to remove variables via `handleRemoveVariableFromNewNodeList`.
4.  **Saving the Node (`handleSaveNewNode` in `App.tsx`):**
    *   The `newNodeSelectedMachineVariables` array is assigned to the new node's `inputs` property (e.g., `inputs: [...newNodeSelectedMachineVariables]`).
    *   Currently, variables selected this way are all added as inputs. A more complex UI could allow specifying if they are inputs or outputs for the node.

### Displaying Node Inputs/Outputs in Sidebar (`SideBar.tsx`)

*   The `buildSidebarHierarchy` function in `App.tsx`:
    *   When creating the `HierarchicalItem` for a `StateNode` (`type: 'node'`):
        *   It iterates through `node.inputs` and creates child `HierarchicalItem`s of `type: 'variable'` with `variableType: VariableType.Input` for each.
        *   It iterates through `node.outputs` and creates child `HierarchicalItem`s of `type: 'variable'` with `variableType: VariableType.Output` for each.
        *   These I/O variable items become direct children of the node's `HierarchicalItem`.
*   `SideBarItem.tsx`:
    *   Node items are collapsible by default.
    *   When expanded, they directly list their input and output variables, each with the appropriate icon.

## Current Limitations / Future Considerations

*   **Variable Scope:** Currently, variables are primarily machine-scoped. The `inputs`/`outputs` arrays on nodes declare usage but don't define new scopes.
*   **Data Flow:** The application visualizes the structure; it doesn't simulate data flow or enforce type checking between connected node I/O and machine variables.
*   **Node I/O vs. Machine Variables:** The distinction and relationship between a node's declared inputs/outputs and the machine-level variables could be made more explicit in the UI and data model if complex data mapping is required.
