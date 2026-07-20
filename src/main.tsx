import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Silence excessive dev logs & warnings globally in development and production environments
if (typeof window !== 'undefined') {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalInfo = console.info;

  console.log = (...args) => {
    if (localStorage.getItem('__vexo_debug__')) {
      originalLog(...args);
    }
  };
  
  console.warn = (...args) => {
    if (localStorage.getItem('__vexo_debug__')) {
       originalWarn(...args);
    }
  };

  console.info = (...args) => {
    if (localStorage.getItem('__vexo_debug__')) {
       originalInfo(...args);
    }
  };

  // Performance tracking
  const bootStart = performance.now();
  window.addEventListener('load', () => {
    const duration = performance.now() - bootStart;
    originalInfo(`[VexoKart Performance] App fully loaded in ${(duration / 1000).toFixed(2)}s`);
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
