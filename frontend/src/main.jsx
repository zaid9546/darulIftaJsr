import React    from 'react';
import ReactDOM from 'react-dom/client';
import { Provider }     from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from './app/store';
import App   from './App';

// Global spinner animation (for ProtectedRoute loader)
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
  @keyframes spin {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', system-ui, sans-serif; background: #f8fafc; }
`;
document.head.appendChild(spinnerStyle);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
