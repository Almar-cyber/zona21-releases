#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '..');

// Start TypeScript compiler in watch mode for Electron main process
const tscProcess = spawn('tsc', [
  '-p',
  'tsconfig.electron.json',
  '--watch',
  '--preserveWatchOutput'
], {
  cwd: projectRoot,
  stdio: 'inherit',
  shell: true
});

// Wait for initial compilation
setTimeout(() => {
  // Start Vite dev server for renderer
  const viteProcess = spawn('vite', [
    '--port',
    '5174',
    '--strictPort'
  ], {
    cwd: projectRoot,
    stdio: 'inherit',
    shell: true
  });

  // Wait for Vite to be ready, then start Electron
  setTimeout(() => {
    const electronProcess = spawn('electron', ['.'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        ELECTRON_IS_DEV: '1',
        VITE_DEV_SERVER_URL: 'http://localhost:5174'
      }
    });

    // Handle process cleanup
    const cleanup = () => {
      console.log('\nShutting down...');
      tscProcess.kill();
      viteProcess.kill();
      electronProcess.kill();
      process.exit(0);
    };

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    electronProcess.on('exit', () => {
      console.log('Electron exited, restarting...');
      // Restart electron on exit (for auto-reload)
    });
  }, 3000);
}, 5000);
