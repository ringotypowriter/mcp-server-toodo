import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { TodoManager } from './src/todoManager.js';
import { TrayManager } from './src/trayManager.js';

describe("TrayManager Integration", () => {
    let todoManager: TodoManager;
    let trayManager: TrayManager;

    beforeAll(() => {
        todoManager = new TodoManager();
        trayManager = new TrayManager(todoManager);
    });

    afterAll(async () => {
        await trayManager.cleanup();
    });

    test("should initialize tray manager", () => {
        expect(trayManager).toBeDefined();
    });

    test("should create and display todo in tray", async () => {
        await todoManager.create('test-todo-1');
        const todo = await todoManager.get('test-todo-1');

        expect(todo).toBeDefined();
        expect(todo?.name).toBe('test-todo-1');
    });

    test("should add steps to todo", async () => {
        await todoManager.addStep('test-todo-1', 'First step');
        await todoManager.addStep('test-todo-1', 'Second step');

        const todo = await todoManager.get('test-todo-1');
        expect(todo?.steps.length).toBe(2);
    });

    test("should complete a step", async () => {
        await todoManager.completeStep('test-todo-1', 0);

        const todo = await todoManager.get('test-todo-1');
        expect(todo?.steps[0]?.completed).toBe(true);
    });

    test("should handle multiple todos", async () => {
        await todoManager.create('test-todo-2');
        await todoManager.create('test-todo-3');

        const todo2 = await todoManager.get('test-todo-2');
        const todo3 = await todoManager.get('test-todo-3');

        expect(todo2).toBeDefined();
        expect(todo3).toBeDefined();
    });

    test("should update tray when todo is modified", async () => {
        await todoManager.addStep('test-todo-2', 'New step');

        const todo = await todoManager.get('test-todo-2');
        expect(todo?.steps.length).toBeGreaterThan(0);
    });
});
