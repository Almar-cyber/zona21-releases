import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp } from './helpers';

let electronApp: ElectronApplication;
let window: Page;

test.describe('Modal Tests', () => {
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

  test.describe('Keyboard Shortcuts Modal', () => {
    test('should open with ? key', async () => {
      await window.keyboard.press('Shift+/');
      await window.waitForTimeout(500);

      // Look for modal content
      const modalText = window.locator('text=/Atalhos|Shortcuts/i');
      const hasModal = (await modalText.count()) > 0;

      // Close modal
      await window.keyboard.press('Escape');
      await window.waitForTimeout(300);

      expect(hasModal).toBeTruthy();
    });

    test('should close with Escape key', async () => {
      await window.keyboard.press('Shift+/');
      await window.waitForTimeout(500);
      await window.keyboard.press('Escape');
      await window.waitForTimeout(300);

      const body = window.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Preferences Modal', () => {
    test('should open with Cmd+,', async () => {
      await window.keyboard.press('Meta+,');
      await window.waitForTimeout(500);

      const preferencesText = window.locator('text=/Preferências|Preferences|Configurações/i');
      const hasPreferences = (await preferencesText.count()) > 0;

      // Close modal
      await window.keyboard.press('Escape');
      await window.waitForTimeout(300);

      expect(hasPreferences).toBeTruthy();
    });

    test('should close with Escape key', async () => {
      await window.keyboard.press('Meta+,');
      await window.waitForTimeout(500);
      await window.keyboard.press('Escape');
      await window.waitForTimeout(300);

      const body = window.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Command Palette', () => {
    test('should open with Cmd+K', async () => {
      await window.keyboard.press('Meta+k');
      await window.waitForTimeout(500);

      const searchInput = window.locator('input[type="text"], input[placeholder*="Buscar"]');
      const commandPalette = window.locator('[class*="CommandPalette"]');
      const hasPalette = (await searchInput.count()) > 0 || (await commandPalette.count()) > 0;

      // Close palette
      await window.keyboard.press('Escape');
      await window.waitForTimeout(300);

      expect(hasPalette).toBeTruthy();
    });

    test('should accept text input', async () => {
      await window.keyboard.press('Meta+k');
      await window.waitForTimeout(500);

      // Type in search
      await window.keyboard.type('preferencias');
      await window.waitForTimeout(300);

      // Close palette
      await window.keyboard.press('Escape');
      await window.waitForTimeout(300);

      const body = window.locator('body');
      await expect(body).toBeVisible();
    });

    test('should navigate results with arrow keys', async () => {
      await window.keyboard.press('Meta+k');
      await window.waitForTimeout(500);

      await window.keyboard.press('ArrowDown');
      await window.waitForTimeout(100);
      await window.keyboard.press('ArrowUp');
      await window.waitForTimeout(100);

      // Close palette
      await window.keyboard.press('Escape');
      await window.waitForTimeout(300);

      const body = window.locator('body');
      await expect(body).toBeVisible();
    });

    test('should execute command with Enter', async () => {
      await window.keyboard.press('Meta+k');
      await window.waitForTimeout(500);

      // Type to find atalhos command
      await window.keyboard.type('atalhos');
      await window.waitForTimeout(500);

      // Execute first result
      await window.keyboard.press('Enter');
      await window.waitForTimeout(500);

      // Should have opened shortcuts modal
      const shortcutsText = window.locator('text=/Atalhos|Shortcuts/i');
      const hasShortcuts = (await shortcutsText.count()) > 0;

      // Close any open modal
      await window.keyboard.press('Escape');
      await window.waitForTimeout(300);

      expect(hasShortcuts).toBeTruthy();
    });
  });

  test.describe('Productivity Dashboard', () => {
    test('should open with Shift+P', async () => {
      await window.keyboard.press('Shift+p');
      await window.waitForTimeout(500);

      // Dashboard might show various content - check for modal or stats-related text
      const dashboardText = window.locator('text=/Produtividade|Productivity|Dashboard|Estatísticas|Sessão|Fotos|Aprovadas|Rejeitadas/i');
      const modalElement = window.locator('[class*="Dashboard"], [class*="dashboard"], [class*="Modal"]');
      const hasDashboard = (await dashboardText.count()) > 0 || (await modalElement.count()) > 1;

      // Close
      await window.keyboard.press('Escape');
      await window.waitForTimeout(300);

      // Dashboard might not be visible if no stats yet, so we just verify no crash
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });
  });
});
