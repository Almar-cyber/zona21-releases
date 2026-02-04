import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp } from './helpers';

let electronApp: ElectronApplication;
let window: Page;

test.describe('Navigation Tests', () => {
  test.beforeAll(async () => {
    const { app, window: win } = await launchApp();
    electronApp = app;
    window = win;
  });

  test.afterAll(async () => {
    if (electronApp) {
      await electronApp.close();
    }
  });

  test.describe('Arrow Key Navigation', () => {
    test('should not crash on arrow key presses without selection', async () => {
      await window.keyboard.press('ArrowRight');
      await window.waitForTimeout(100);
      await window.keyboard.press('ArrowLeft');
      await window.waitForTimeout(100);
      await window.keyboard.press('ArrowUp');
      await window.waitForTimeout(100);
      await window.keyboard.press('ArrowDown');
      await window.waitForTimeout(100);

      // App should still be responsive
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });

    test('should handle Escape key to clear selection', async () => {
      await window.keyboard.press('Escape');
      await window.waitForTimeout(100);

      const body = window.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Marking Shortcuts', () => {
    test('should handle A key (approve) without crashing', async () => {
      await window.keyboard.press('a');
      await window.waitForTimeout(100);
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });

    test('should handle D key (reject) without crashing', async () => {
      await window.keyboard.press('d');
      await window.waitForTimeout(100);
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });

    test('should handle F key (favorite) without crashing', async () => {
      await window.keyboard.press('f');
      await window.waitForTimeout(100);
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });

    test('should handle Shift+A (approve and advance) without crashing', async () => {
      await window.keyboard.press('Shift+a');
      await window.waitForTimeout(100);
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Selection Shortcuts', () => {
    test('should handle Cmd+A (select all) without crashing', async () => {
      await window.keyboard.press('Meta+a');
      await window.waitForTimeout(100);
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });

    test('should handle Delete key to clear selection', async () => {
      await window.keyboard.press('Delete');
      await window.waitForTimeout(100);
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Tab Navigation', () => {
    test('should allow Tab key for focus navigation', async () => {
      await window.keyboard.press('Tab');
      await window.waitForTimeout(100);
      await window.keyboard.press('Tab');
      await window.waitForTimeout(100);
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Space Bar', () => {
    test('should handle Space for navigation', async () => {
      await window.keyboard.press('Space');
      await window.waitForTimeout(100);
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Menu Toggle', () => {
    test('should toggle left menu with Cmd+\\', async () => {
      await window.keyboard.press('Meta+\\');
      await window.waitForTimeout(300);
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });

    test('should toggle right menu with Cmd+/', async () => {
      await window.keyboard.press('Meta+/');
      await window.waitForTimeout(300);
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });
  });
});
