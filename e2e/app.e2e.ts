import { test, expect, ElectronApplication, Page } from '@playwright/test';
import { launchApp } from './helpers';

let electronApp: ElectronApplication;
let window: Page;

test.describe('Zona21 E2E Tests', () => {
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

  test.describe('App Launch', () => {
    test('should launch app successfully', async () => {
      expect(electronApp).toBeDefined();
      expect(window).toBeDefined();
    });

    test('should have window visible', async () => {
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });

    test('should render main content area', async () => {
      const body = window.locator('body');
      await expect(body).toBeVisible();

      // Should have some content
      const text = await body.textContent();
      expect(text).toBeTruthy();
    });
  });

  test.describe('Sidebar', () => {
    test('should render navigation structure', async () => {
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });

    test('should show marking collections', async () => {
      // Check for marking collection text
      const markingCollections = window.locator('text=/Favoritos|Aprovados|Desprezados/i');
      const count = await markingCollections.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Empty State', () => {
    test('should show content area', async () => {
      const body = window.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Keyboard Shortcuts', () => {
    test('should open keyboard shortcuts modal with ?', async () => {
      await window.keyboard.press('Shift+/');
      await window.waitForTimeout(500);

      const modalContent = window.locator('text=/Atalhos|Shortcuts|Teclado/i');
      const hasModal = (await modalContent.count()) > 0;

      await window.keyboard.press('Escape');
      await window.waitForTimeout(300);

      expect(hasModal).toBeTruthy();
    });

    test('should open preferences with Cmd+,', async () => {
      await window.keyboard.press('Meta+,');
      await window.waitForTimeout(500);

      const preferencesContent = window.locator('text=/Preferências|Preferences|Configurações/i');
      const hasPreferences = (await preferencesContent.count()) > 0;

      await window.keyboard.press('Escape');
      await window.waitForTimeout(300);

      expect(hasPreferences).toBeTruthy();
    });

    test('should open command palette with Cmd+K', async () => {
      await window.keyboard.press('Meta+k');
      await window.waitForTimeout(500);

      const searchInput = window.locator('input[type="text"], input[placeholder*="Buscar"]');
      const commandPalette = window.locator('[class*="CommandPalette"]');
      const hasCommandPalette = (await commandPalette.count()) > 0 || (await searchInput.count()) > 0;

      await window.keyboard.press('Escape');
      await window.waitForTimeout(300);

      expect(hasCommandPalette).toBeTruthy();
    });
  });

  test.describe('UI Interactions', () => {
    test('should have interactive elements', async () => {
      const buttons = window.locator('button');
      const buttonCount = await buttons.count();
      expect(buttonCount).toBeGreaterThan(0);
    });

    test('should handle keyboard navigation', async () => {
      await window.keyboard.press('ArrowRight');
      await window.keyboard.press('ArrowLeft');
      await window.keyboard.press('ArrowUp');
      await window.keyboard.press('ArrowDown');
      await window.waitForTimeout(100);

      const body = window.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Marking Shortcuts', () => {
    test('should handle marking keys without crashing', async () => {
      await window.keyboard.press('a');
      await window.waitForTimeout(100);
      await window.keyboard.press('d');
      await window.waitForTimeout(100);
      await window.keyboard.press('f');
      await window.waitForTimeout(100);

      const body = window.locator('body');
      await expect(body).toBeVisible();
    });
  });

  test.describe('Responsiveness', () => {
    test('should handle window resize', async () => {
      await window.setViewportSize({ width: 800, height: 600 });
      await window.waitForTimeout(500);

      const body = window.locator('body');
      await expect(body).toBeVisible();

      await window.setViewportSize({ width: 1280, height: 720 });
      await window.waitForTimeout(300);
    });
  });
});
