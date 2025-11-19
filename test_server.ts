import { TodoManager } from "./src/todoManager.js";

async function runTests() {
    console.log("Starting tests...");
    const manager = new TodoManager();
    const todoName = "test_mission";

    // 1. Create Todo
    console.log(`Creating todo: ${todoName}`);
    await manager.create(todoName);
    let todo = await manager.get(todoName);
    if (!todo) throw new Error("Failed to create todo");
    console.log("✅ Todo created");

    // 2. Add Step
    console.log("Adding step 1");
    await manager.addStep(todoName, "Secure the package");
    todo = await manager.get(todoName);
    if (todo?.steps.length !== 1) throw new Error("Failed to add step");
    console.log("✅ Step added");

    // 3. Complete Step
    console.log("Completing step 0");
    await manager.completeStep(todoName, 0);
    todo = await manager.get(todoName);
    if (!todo?.steps[0]?.completed) throw new Error("Failed to complete step");
    console.log("✅ Step completed");

    // 4. Add another step
    console.log("Adding step 2");
    await manager.addStep(todoName, "Eat apple pie");
    todo = await manager.get(todoName);
    if (todo?.steps.length !== 2) throw new Error("Failed to add second step");
    console.log("✅ Second step added");

    // 5. Delete Step
    console.log("Deleting step 0");
    await manager.deleteStep(todoName, 0);
    todo = await manager.get(todoName);
    if (todo?.steps.length !== 1 || todo?.steps[0]?.description !== "Eat apple pie") throw new Error("Failed to delete step");
    console.log("✅ Step deleted");

    // 6. Expiration Test (Manual check required or mock time, but let's just check it exists for now)
    console.log(`Expiration time: ${new Date(todo!.expiresAt).toLocaleString()}`);

    console.log("🎉 All tests passed!");
}

runTests().catch(console.error);
