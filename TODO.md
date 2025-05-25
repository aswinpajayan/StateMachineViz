
# TODO List - Hierarchical State Machine Visualizer

This file tracks planned features, improvements, and tasks for the project.

## Features & Enhancements

*   **JSON Display and Editing:**
    *   Add a provision (e.g., a separate panel or modal) to display the raw JSON representation of the currently active state machine.
    *   Allow users to directly edit this JSON.
    *   Implement robust validation on JSON save to ensure structural integrity before updating the application state.
    *   Consider integrating a JSON editor library for a better editing experience (e.g., Monaco Editor or Ace Editor, if feasible within the esm.sh setup).

*   **FastAPI Endpoint Integration (Example):**
    *   Set up a basic FastAPI backend (this would be a separate project/service).
    *   **Example 1: Save to Server:**
        *   Modify the "Export" button's functionality or add a new "Save to Server" button.
        *   On click, send the current `allMachines` JSON data to a FastAPI endpoint (e.g., `/api/save_machines`).
        *   The FastAPI endpoint would then store this data (e.g., in a file or database).
    *   **Example 2: Load from Server:**
        *   Modify the "Upload" button or add a "Load from Server" button.
        *   On click, fetch state machine data from a FastAPI endpoint (e.g., `/api/load_machines`).
        *   Update the application state with the fetched data.
    *   **Example 3: Validate via Server:**
        *   The "Validate" button could send the active state machine's JSON to a FastAPI endpoint (e.g., `/api/validate_machine`).
        *   The backend would perform validation logic and return results (success/errors).
        *   Display validation results in the UI.
    *   _Note: This requires setting up CORS on the FastAPI backend if it's on a different origin._

*   **Enhanced Variable Management:**
    *   Allow specifying variable data types (e.g., string, number, boolean, custom object via JSON schema) in the "Add Variable" modal.
    *   Show variable types in the sidebar.
    *   Visual cues or validation for type mismatches in transition rules (advanced).

*   **Improved Node I/O Management:**
    *   In the "Add Node" modal, allow specifying whether a selected machine variable is an input *or* an output for the new node, instead of defaulting all to inputs.
    *   Allow editing a node's declared inputs/outputs after creation.

*   **Simulation/Runtime:**
    *   Implement basic state transition simulation based on rules (client-side).
    *   Highlight active state and visualize variable changes during simulation.

*   **Advanced Validation:**
    *   Implement more comprehensive validation logic for state machines (e.g., unreachable states, dead-end states, conflicting transitions, valid rule syntax).

*   **Comments/Annotations:**
    *   Allow users to add comments or annotations to nodes and transitions.

*   **Code Generation:**
    *   Option to generate boilerplate code (e.g., Python, JavaScript) from the state machine definition.

*   **Usability & UX Improvements:**
    *   More granular control over transition line routing (e.g., waypoints).
    *   Search/filter functionality in the sidebar.
    *   Keyboard shortcuts for common actions.
    *   Customizable node appearance (colors, icons).
    *   Better error handling and feedback for invalid user inputs or operations.

## Refactoring & Technical Debt

*   **Testing:** Implement unit and integration tests.
*   **Performance Optimization:** Profile and optimize rendering for very large state machines.
*   **Code Cleanup:** Review and refactor complex sections for clarity and maintainability.
*   **Dependency Management:** Evaluate if direct `esm.sh` imports are sustainable long-term or if a local vendoring/bundling step would be beneficial for stability and offline use. (Currently, the project uses a direct ESM setup).

## Documentation

*   Keep `README.md` and `developer-docs.md` (and its sub-pages) up-to-date with new features and changes.
*   Add more inline code comments for complex logic.
