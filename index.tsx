import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
console.log("Index.tsx executing");
if (!rootElement) {
  console.error("Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}
console.log("Root element found", rootElement);

const root = ReactDOM.createRoot(rootElement);
console.log("Creating root and rendering");
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);