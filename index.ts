import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TodoManager } from "./src/todoManager.js";

const server = new McpServer({
    name: "toodo",
    version: "1.0.0",
});

const todoManager = new TodoManager();

server.tool(
    "create_todo",
    { name: z.string() },
    async ({ name }) => {
        await todoManager.create(name);
        return {
            content: [{ type: "text", text: `Todo '${name}' created.` }],
        };
    }
);

server.tool(
    "read_todo",
    { name: z.string() },
    async ({ name }) => {
        try {
            const todo = await todoManager.get(name);
            if (!todo) {
                return {
                    content: [{ type: "text", text: `Todo '${name}' not found.` }],
                    isError: true,
                };
            }

            let text = `# ${todo.name}\n`;
            text += `Expires at: ${new Date(todo.expiresAt).toLocaleString()}\n\n`;

            if (todo.steps.length === 0) {
                text += "(No steps yet)";
            } else {
                todo.steps.forEach((step, index) => {
                    const status = step.completed ? "[x]" : "[ ]";
                    text += `${index}. ${status} ${step.description}\n`;
                });
            }

            return {
                content: [{ type: "text", text }],
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: error.message }],
                isError: true,
            };
        }
    }
);

server.tool(
    "add_step",
    {
        todo_name: z.string(),
        step_content: z.string()
    },
    async ({ todo_name, step_content }) => {
        try {
            await todoManager.addStep(todo_name, step_content);
            return {
                content: [{ type: "text", text: `Step added to '${todo_name}'.` }],
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: error.message }],
                isError: true,
            };
        }
    }
);

server.tool(
    "complete_step",
    {
        todo_name: z.string(),
        step_index: z.number()
    },
    async ({ todo_name, step_index }) => {
        try {
            await todoManager.completeStep(todo_name, step_index);
            return {
                content: [{ type: "text", text: `Step ${step_index} completed in '${todo_name}'.` }],
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: error.message }],
                isError: true,
            };
        }
    }
);

server.tool(
    "delete_step",
    {
        todo_name: z.string(),
        step_index: z.number()
    },
    async ({ todo_name, step_index }) => {
        try {
            await todoManager.deleteStep(todo_name, step_index);
            return {
                content: [{ type: "text", text: `Step ${step_index} deleted from '${todo_name}'.` }],
            };
        } catch (error: any) {
            return {
                content: [{ type: "text", text: error.message }],
                isError: true,
            };
        }
    }
);

const transport = new StdioServerTransport();
await server.connect(transport);