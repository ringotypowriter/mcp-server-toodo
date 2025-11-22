import { describe, test, expect, beforeAll } from "bun:test";
import { TodoManager } from "./src/todoManager.js";

describe("TodoManager", () => {
    let manager: TodoManager;
    const todoName = "test_mission";

    beforeAll(() => {
        manager = new TodoManager();
    });

    test("should create a todo", async () => {
        await manager.create(todoName);
        const todo = await manager.get(todoName);

        expect(todo).toBeDefined();
        expect(todo?.name).toBe(todoName);
    });

    test("should add a step to todo", async () => {
        await manager.addStep(todoName, "Secure the package");
        const todo = await manager.get(todoName);

        expect(todo?.steps.length).toBe(1);
        expect(todo?.steps[0]?.description).toBe("Secure the package");
    });

    test("should complete a step", async () => {
        await manager.completeStep(todoName, 0);
        const todo = await manager.get(todoName);

        expect(todo?.steps[0]?.completed).toBe(true);
    });

    test("should add another step", async () => {
        await manager.addStep(todoName, "Eat apple pie");
        const todo = await manager.get(todoName);

        expect(todo?.steps.length).toBe(2);
        expect(todo?.steps[1]?.description).toBe("Eat apple pie");
    });

    test("should delete a step", async () => {
        await manager.deleteStep(todoName, 0);
        const todo = await manager.get(todoName);

        expect(todo?.steps.length).toBe(1);
        expect(todo?.steps[0]?.description).toBe("Eat apple pie");
    });

    test("should have expiration time set", async () => {
        const todo = await manager.get(todoName);

        expect(todo?.expiresAt).toBeDefined();
        expect(new Date(todo!.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });
});
