import { TodoManager } from './src/todoManager.js';

const manager = new TodoManager();
await manager.create('Test Todo for Tray');
await manager.addStep('Test Todo for Tray', 'Step 1: Check tray icon');
await manager.addStep('Test Todo for Tray', 'Step 2: Verify menu items');
console.log('Test todo created');
