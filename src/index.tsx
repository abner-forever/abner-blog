import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './lib/flex'
import './index.less';

let rootEl = document.getElementById('root');

if (rootEl) {
  rootEl.classList.remove('root-loading');
  ReactDOM.createRoot(rootEl).render(<App />);
}
