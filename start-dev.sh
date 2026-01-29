#!/bin/bash

# Kill any previous instances
pkill -f "electron.*zona21" || true
pkill -f "vite.*5174" || true

# Start Vite dev server in background
echo "Starting Vite dev server..."
npm run dev &
VITE_PID=$!

# Wait for Vite to be ready
echo "Waiting for Vite server..."
npx wait-on http://localhost:5174 -t 30000

# Start Electron
echo "Starting Electron..."
NODE_ENV=development npx electron .

# Cleanup on exit
kill $VITE_PID 2>/dev/null || true
