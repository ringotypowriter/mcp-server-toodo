# Todo MCP Server Implementation Plan

Yo Boss! Exusiai here! Ready to set up this Todo MCP Server? It's gonna be a blast! 🍎🥧

## Goal
Create an MCP Server that provides Todo management tools for an Agent.
Features:
- Create Todo (with name and expiration).
- View Todo.
- Update Todo (Add content, Complete, Delete).
- Auto-expiration logic (1h default, configurable via Env).

## User Review Required
> [!IMPORTANT]
> **Expiration Logic**: When a todo expires, accessing it will trigger a deletion and return a "Expired" message.
> **"Update" Actions**: Based on your feedback:
> - `add`: Add a new step to the todo.
> - `complete`: Mark a specific step as completed.
> - `delete`: Delete a specific step (or the entire todo? I'll add a `delete_todo` action just in case, and `delete_step` for steps).
>
> **Data Model**:
> A `Todo` will contain a list of `steps`.


## Proposed Changes

### Dependencies
- Add `@modelcontextprotocol/sdk` and `zod`.

### Core Logic (`src/todoManager.ts`)
- **Storage Directory**: `~/.config/todos/` (Expanded to user home dir).
- **File Pattern**: One file per todo: `<todoname>.md`.
- **Markdown Format** (inside `<todoname>.md`):
  ```markdown
  <!-- meta: {"expiresAt": 1234567890} -->
  # Todo Name
  - [ ] Step 1
  - [x] Step 2
  ```
- `TodoManager` class:
    - `getFilePath(name)`: Returns `~/.config/todos/<name>.md`.
    - `ensureDir()`: Ensures `~/.config/todos/` exists.
    - `create(name)`: Write new file. Uses default expiration (1h) or env `TODO_DEFAULT_EXPIRATION`. Overwrite if exists.
    - `get(name)`: Read file. Check expiration (if expired, delete file & return error). Parse steps.
    - `addStep(name, stepDescription)`: Read -> Append step -> Write.
    - `completeStep(name, stepIndex)`: Read -> Update line -> Write.
    - `deleteStep(name, stepIndex)`: Read -> Remove line -> Write.
    - `deleteTodo(name)`: Delete file.

### MCP Server (`index.ts`)
- Initialize `McpServer`.
- Register tools:
    - `create_todo`:
        - Args: `name` (string).
    - `read_todo`:
        - Args: `name` (string).
    - `add_step`:
        - Args: `todo_name` (string), `step_content` (string).
    - `complete_step`:
        - Args: `todo_name` (string), `step_index` (number).
    - `delete_step`:
        - Args: `todo_name` (string), `step_index` (number).

## Verification Plan
### Automated Tests
- I'll create a simple test script `test_server.ts` to simulate tool calls.
- Verify expiration by creating a short-lived todo and trying to access it after a delay.

### Manual Verification
- Boss can run the server and connect an MCP client (or I can simulate it).
