import TrayKit, { type TrayClient } from "traykit-bindings";
import { TodoManager, type Todo } from "./todoManager.js";

export class TrayManager {
  private client: TrayClient | null = null;
  private todoManager: TodoManager;
  private isUpdating: boolean = false;

  constructor(todoManager: TodoManager) {
    this.todoManager = todoManager;

    // Listen for todo changes
    this.todoManager.on("change", () => {
      void this.updateTray();
    });

    // Initialize tray (async, but don't wait)
    void this.updateTray();
  }

  private async getOrCreateClient(): Promise<TrayClient> {
    if (!this.client) {
      const initialConfig = {
        icon: {
          type: "sf_symbol",
          name: "checkmark.circle",
        },
        items: [],
      };

      this.client = TrayKit.createClient({
        configJson: JSON.stringify(initialConfig),
        debug: false,
      });
    }

    return this.client;
  }

  private async resetMenu(client: TrayClient): Promise<void> {
    try {
      await client.clearItems();
    } catch (error) {
      console.error("[TrayManager] Failed to reset menu:", error);
    }
  }

  private async updateTray(): Promise<void> {
    // Prevent concurrent updates
    if (this.isUpdating) {
      return;
    }

    this.isUpdating = true;

    try {
      const todos = await this.todoManager.listTodos();
      console.error(`[TrayManager] Found ${todos.length} todos`);

      if (todos.length === 0) {
        // No todos - hide tray
        if (this.client) {
          console.error("[TrayManager] No todos, hiding tray");
          await this.client.hide();
        }
        return;
      }

      // Show top 3 most recently updated todos
      const topTodos = todos.slice(0, 3);
      console.error(
        `[TrayManager] Creating tray with ${topTodos.length} todos`,
      );

      const client = await this.getOrCreateClient();
      await client.show();
      await this.resetMenu(client);

      await client.setIcon({
        type: "sf_symbol",
        name: "checkmark.circle",
        title: `Toodo (${todos.length} 个待办)`,
      });

      await this.populateMenu(client, topTodos, todos.length);

      console.error("[TrayManager] Tray created successfully");
    } catch (error) {
      console.error("[TrayManager] Error updating tray:", error);
      // Don't throw, just log, so the server keeps running
    } finally {
      this.isUpdating = false;
    }
  }

  private async populateMenu(
    client: TrayClient,
    todos: Todo[],
    totalCount: number,
  ): Promise<void> {
    // Display top 3 todos with their steps
    for (let i = 0; i < todos.length; i++) {
      const todo = todos[i]!;
      const completedSteps = todo.steps.filter((s) => s.completed).length;
      const totalSteps = todo.steps.length;

      // Todo title with progress
      await client.addText({
        title: `${todo.name} [${completedSteps}/${totalSteps}]`,
      });

      // Display steps
      if (todo.steps.length > 0) {
        for (const step of todo.steps) {
          const icon = step.completed ? "[✓]" : "[ ]";
          await client.addText({ title: `  ${icon} ${step.description}` });
        }
      } else {
        await client.addText({ title: "  (暂无步骤)" });
      }

      // Add separator between todos (except after last one)
      if (i < todos.length - 1) {
        await client.addText({ title: "──────────", is_separator: true });
      }
    }

    // Footer actions
    await client.addText({ title: "──────────", is_separator: true });

    await client.addAction({
      title: "刷新",
      onClick: () => {
        console.error("[TrayManager] Refresh clicked");
        void this.updateTray();
      },
    });

    await client.addAction({
      title: "清空",
      onClick: async () => {
        console.error("[TrayManager] Clear clicked");
        await this.todoManager.clearVisibleTodos();
        await this.updateTray();
      },
    });

    await client.addAction({
      title: "隐藏",
      onClick: async () => {
        console.error("[TrayManager] Hide clicked");
        await this.cleanup();
      },
    });
  }

  async cleanup(): Promise<void> {
    if (this.client) {
      await this.client.hide();
      this.client = null;
    }
  }
}
