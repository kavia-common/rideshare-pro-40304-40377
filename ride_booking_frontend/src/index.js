import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
// Importing apiClient ensures the runtime banner logs once on startup.
import './services/apiClient';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
