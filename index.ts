#!/usr/bin/env bun
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { TodoManager } from "./src/todoManager.js";
import { TrayManager } from "./src/trayManager.js";

const server = new McpServer({
    name: "toodo",
    version: "1.0.0",
});

const todoManager = new TodoManager();
console.error("[TrayManager] about to create TrayKit client");
const trayManager = new TrayManager(todoManager);

// Graceful shutdown
process.on('SIGINT', async () => {
    await trayManager.cleanup();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await trayManager.cleanup();
    process.exit(0);
});

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

server.tool(
    "list_todos",
    {},
    async () => {
        try {
            const todos = await todoManager.listTodos();

            if (todos.length === 0) {
                return {
                    content: [{ type: "text", text: "目前没有可用的 todo。" }],
                };
            }

            let text = "# 当前可用的 todos\n\n";
            todos.forEach((todo, index) => {
                const completedSteps = todo.steps.filter(s => s.completed).length;
                const totalSteps = todo.steps.length;
                text += `${index}. ${todo.name} [${completedSteps}/${totalSteps}]\n`;
                text += `   创建时间: ${new Date(todo.createdAt).toLocaleString()}\n`;
                text += `   最近更新: ${new Date(todo.lastUpdatedAt).toLocaleString()}\n`;
                text += `   过期时间: ${new Date(todo.expiresAt).toLocaleString()}\n\n`;
            });

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
    "delete_todo",
    { name: z.string() },
    async ({ name }) => {
        try {
            await todoManager.delete(name);
            return {
                content: [{ type: "text", text: `Todo '${name}' deleted.` }],
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

// Keep event loop alive for TrayKit
// MCP server uses stdio which may not keep the event loop busy enough
setInterval(() => {
    // This ensures TrayKit's event loop can run
}, 1000);
