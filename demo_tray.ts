#!/usr/bin/env bun
/**
 * Standalone tray demo - keeps running to show the tray
 * This demonstrates what the tray looks like with existing todos
 */

import { TodoManager } from './src/todoManager.js';
import { TrayManager } from './src/trayManager.js';

async function main() {
    console.log('🚀 Starting Toodo Tray Demo...\n');
    console.log('This will display the system tray with existing todos.');
    console.log('Look at your macOS menu bar (top right) for the Toodo icon.\n');

    const todoManager = new TodoManager();
    const trayManager = new TrayManager(todoManager);

    // List existing todos
    const todos = await todoManager.listTodos();
    console.log(`📊 Found ${todos.length} active todos:\n`);

    for (const todo of todos.slice(0, 3)) {
        const completed = todo.steps.filter(s => s.completed).length;
        console.log(`  📝 ${todo.name} (${completed}/${todo.steps.length})`);
        for (const step of todo.steps) {
            const icon = step.completed ? '✅' : '⬜';
            console.log(`     ${icon} ${step.description}`);
        }
        console.log('');
    }

    if (todos.length === 0) {
        console.log('⚠️  No todos found! The tray will be hidden.');
        console.log('💡 Run test_tray.ts first to create some todos.\n');
    } else {
        console.log('✅ Tray is now visible in your menu bar!');
        console.log('🖱️  Click the tray icon to see the menu.\n');
    }

    console.log('⏰ Press Ctrl+C to exit and hide the tray.\n');

    // Keep running
    process.on('SIGINT', async () => {
        console.log('\n🧹 Cleaning up tray...');
        await trayManager.cleanup();
        console.log('👋 Bye!');
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        await trayManager.cleanup();
        process.exit(0);
    });

    // Keep the process alive with a heartbeat
    setInterval(() => {
        // Just keep the event loop busy
    }, 1000);
}

main().catch(console.error);
