import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

console.log("main.jsx loaded");
window.onerror = function(message, source, lineno, colno, error) {
  console.error("Global error:", message, source, lineno, colno, error);
  document.body.innerHTML = `<div style="color:red;padding:20px;background:#ffebee;">Global Error: ${message}<br>${error?.stack}</div>`;
};

window.addEventListener('unhandledrejection', function(event) {
  console.error("Unhandled rejection:", event.reason);
  document.body.innerHTML = `<div style="color:red;padding:20px;background:#ffebee;">Unhandled Rejection: ${event.reason}</div>`;
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
