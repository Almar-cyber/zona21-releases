import { _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';

/**
 * Launch the Electron app and return the main window
 */
export async function launchApp(): Promise<{ app: ElectronApplication; window: Page }> {
  const electronApp = await electron.launch({
    args: [path.join(__dirname, '..', '.vite', 'build', 'index.js')],
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });

  // Wait for the first window
  let window = await electronApp.firstWindow();

  // If this is DevTools, wait for the main window
  const title = await window.title();
  if (title === 'DevTools' || title.includes('DevTools')) {
    // Get all windows and find the main one
    const windows = electronApp.windows();
    for (const w of windows) {
      const t = await w.title();
      if (t !== 'DevTools' && !t.includes('DevTools')) {
        window = w;
        break;
      }
    }
    // If still DevTools, wait for new window
    if ((await window.title()).includes('DevTools')) {
      window = await electronApp.waitForEvent('window');
    }
  }

  await window.waitForLoadState('domcontentloaded');

  // Wait for loading screen to disappear
  await window.waitForTimeout(3500);

  return { app: electronApp, window };
}

/**
 * Find the main app window from all windows
 */
export async function getMainWindow(app: ElectronApplication): Promise<Page | null> {
  const windows = app.windows();
  for (const w of windows) {
    const title = await w.title();
    if (title !== 'DevTools' && !title.includes('DevTools')) {
      return w;
    }
  }
  return null;
}
