import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export interface TodoStep {
    description: string;
    completed: boolean;
}

export interface Todo {
    name: string;
    steps: TodoStep[];
    expiresAt: number;
}

export class TodoManager {
    private baseDir: string;
    private defaultExpirationSeconds: number;

    constructor() {
        // Expand ~ to home directory
        const homeDir = os.homedir();
        this.baseDir = path.join(homeDir, '.config', 'todos');

        // Default expiration: 1 hour (3600 seconds)
        const envExpiration = process.env.TODO_DEFAULT_EXPIRATION;
        this.defaultExpirationSeconds = envExpiration ? parseInt(envExpiration, 10) : 3600;
    }

    private getFilePath(name: string): string {
        // Sanitize name to be safe for filenames
        const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '_');
        return path.join(this.baseDir, `${safeName}.md`);
    }

    private async ensureDir(): Promise<void> {
        try {
            await fs.access(this.baseDir);
        } catch {
            await fs.mkdir(this.baseDir, { recursive: true });
        }
    }

    private parseTodo(content: string, name: string): Todo {
        const lines = content.split('\n');
        let expiresAt = Date.now() + this.defaultExpirationSeconds * 1000;
        const steps: TodoStep[] = [];

        for (const line of lines) {
            const metaMatch = line.match(/<!-- meta: (.*) -->/);
            if (metaMatch) {
                try {
                    const meta = JSON.parse(metaMatch[1]!);
                    if (meta.expiresAt) {
                        expiresAt = meta.expiresAt;
                    }
                } catch (e) {
                    // Ignore invalid meta
                }
            }

            const stepMatch = line.match(/- \[(x| )\] (.*)/);
            if (stepMatch) {
                steps.push({
                    completed: stepMatch[1] === 'x',
                    description: stepMatch[2]!.trim(),
                });
            }
        }

        return { name, steps, expiresAt };
    }

    private serializeTodo(todo: Todo): string {
        const meta = JSON.stringify({ expiresAt: todo.expiresAt });
        let content = `<!-- meta: ${meta} -->\n`;
        content += `# ${todo.name}\n\n`;

        for (const step of todo.steps) {
            const check = step.completed ? 'x' : ' ';
            content += `- [${check}] ${step.description}\n`;
        }

        return content;
    }

    async create(name: string): Promise<void> {
        await this.ensureDir();
        const filePath = this.getFilePath(name);

        const expiresAt = Date.now() + this.defaultExpirationSeconds * 1000;
        const todo: Todo = {
            name,
            steps: [],
            expiresAt
        };

        await fs.writeFile(filePath, this.serializeTodo(todo), 'utf-8');
    }

    async get(name: string): Promise<Todo | null> {
        const filePath = this.getFilePath(name);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const todo = this.parseTodo(content, name);

            if (Date.now() > todo.expiresAt) {
                await fs.unlink(filePath);
                throw new Error(`Todo '${name}' has expired and been deleted.`);
            }

            return todo;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    async addStep(name: string, stepContent: string): Promise<void> {
        const todo = await this.get(name);
        if (!todo) {
            throw new Error(`Todo '${name}' not found.`);
        }

        todo.steps.push({
            description: stepContent,
            completed: false
        });

        await fs.writeFile(this.getFilePath(name), this.serializeTodo(todo), 'utf-8');
    }

    async completeStep(name: string, stepIndex: number): Promise<void> {
        const todo = await this.get(name);
        if (!todo) {
            throw new Error(`Todo '${name}' not found.`);
        }

        if (stepIndex < 0 || stepIndex >= todo.steps.length) {
            throw new Error(`Step index ${stepIndex} out of bounds.`);
        }

        todo.steps[stepIndex]!.completed = true;

        await fs.writeFile(this.getFilePath(name), this.serializeTodo(todo), 'utf-8');
    }

    async deleteStep(name: string, stepIndex: number): Promise<void> {
        const todo = await this.get(name);
        if (!todo) {
            throw new Error(`Todo '${name}' not found.`);
        }

        if (stepIndex < 0 || stepIndex >= todo.steps.length) {
            throw new Error(`Step index ${stepIndex} out of bounds.`);
        }

        todo.steps.splice(stepIndex, 1);

        await fs.writeFile(this.getFilePath(name), this.serializeTodo(todo), 'utf-8');
    }
}
