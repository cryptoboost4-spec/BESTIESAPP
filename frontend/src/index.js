import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Suppress React Router v6 future-flag deprecation warnings.
// We've opted into both flags via <BrowserRouter future={...}> but the
// installed version (6.30.x) still emits them regardless.
const _warn = console.warn.bind(console);
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('React Router Future Flag Warning')) return;
  _warn(...args);
};

// Suppress Firebase SDK's "Uncaught Error in snapshot listener" log.
// This fires at the SDK level for any getDoc() call that gets a permission-denied
// error, even when the error is caught by user code. Individual components log
// their own errors via onSnapshot error callbacks and try/catch blocks.
const _error = console.error.bind(console);
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Uncaught Error in snapshot listener')) return;
  _error(...args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
