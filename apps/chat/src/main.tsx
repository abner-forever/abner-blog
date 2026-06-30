import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import './i18n';
import './styles/chat-tokens.less';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(<App />);
