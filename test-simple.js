const { app, BrowserWindow } = require('electron');

console.log('[TEST] app:', typeof app);
console.log('[TEST] BrowserWindow:', typeof BrowserWindow);

if (typeof app === 'object') {
  console.log('[TEST] SUCCESS!');
  app.whenReady().then(() => {
    console.log('[TEST] App ready!');
    app.quit();
  });
} else {
  console.log('[TEST] FAIL! electron is:', require('electron'));
  process.exit(1);
}
