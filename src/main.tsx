import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

console.log('[main.tsx] Starting React mount...');
const rootElement = document.getElementById('root');
console.log('[main.tsx] Root element:', rootElement);

ReactDOM.createRoot(rootElement!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

console.log('[main.tsx] React render called');
