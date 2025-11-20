#!/usr/bin/env bun
/**
 * Test script for Toodo system tray functionality
 * This script simulates MCP tool calls to test the tray integration
 */

import { TodoManager } from './src/todoManager.js';
import { TrayManager } from './src/trayManager.js';

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('🚀 Starting Toodo Tray Test...\n');

    const todoManager = new TodoManager();
    const trayManager = new TrayManager(todoManager);

    console.log('✅ TrayManager initialized');
    console.log('📊 Initial state: Tray should be hidden (no todos)\n');

    await sleep(2000);

    // Test 1: Create first todo
    console.log('📝 Test 1: Creating first todo "implement-auth"...');
    await todoManager.create('implement-auth');
    console.log('✅ Todo created - Tray should now appear!\n');

    await sleep(3000);

    // Test 2: Add steps
    console.log('📝 Test 2: Adding steps to "implement-auth"...');
    await todoManager.addStep('implement-auth', 'Design database schema');
    await sleep(1000);
    await todoManager.addStep('implement-auth', 'Implement JWT tokens');
    await sleep(1000);
    await todoManager.addStep('implement-auth', 'Add password hashing');
    console.log('✅ Steps added - Check tray menu!\n');

    await sleep(3000);

    // Test 3: Create second todo
    console.log('📝 Test 3: Creating second todo "fix-bug-123"...');
    await todoManager.create('fix-bug-123');
    await sleep(1000);
    await todoManager.addStep('fix-bug-123', 'Reproduce issue');
    await sleep(1000);
    await todoManager.addStep('fix-bug-123', 'Write unit test');
    console.log('✅ Second todo created - Should appear in tray!\n');

    await sleep(3000);

    // Test 4: Create third todo
    console.log('📝 Test 4: Creating third todo "write-docs"...');
    await todoManager.create('write-docs');
    await sleep(1000);
    await todoManager.addStep('write-docs', 'API documentation');
    console.log('✅ Third todo created - All 3 should show in tray!\n');

    await sleep(3000);

    // Test 5: Create fourth todo (should push oldest out)
    console.log('📝 Test 5: Creating fourth todo "refactor-code"...');
    await todoManager.create('refactor-code');
    await sleep(1000);
    await todoManager.addStep('refactor-code', 'Extract common utilities');
    console.log('✅ Fourth todo created - Only top 3 most recent should show!\n');

    await sleep(3000);

    // Test 6: Update an old todo (should bring it to top)
    console.log('📝 Test 6: Updating "implement-auth" (adding a step)...');
    await todoManager.addStep('implement-auth', 'Add rate limiting');
    console.log('✅ Updated old todo - Should move to top of tray!\n');

    await sleep(3000);

    // Test 7: Complete a step
    console.log('📝 Test 7: Completing step in "implement-auth"...');
    await todoManager.completeStep('implement-auth', 0);
    console.log('✅ Step completed - Should show ✅ in tray!\n');

    await sleep(3000);

    console.log('🎉 Test complete! Check your system tray.');
    console.log('📌 The tray should show the 3 most recently updated todos.');
    console.log('⏰ Press Ctrl+C to exit and cleanup tray.\n');

    // Keep running
    process.on('SIGINT', async () => {
        console.log('\n🧹 Cleaning up...');
        await trayManager.cleanup();
        process.exit(0);
    });
}

main().catch(console.error);
