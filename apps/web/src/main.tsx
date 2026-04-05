// import { hydrateRoot } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.less';
import './utils/rem';
import './i18n';
import App from './App.tsx';
import type { BlogDto } from '@services/generated/model';

const blogs = window.__INITIAL_DATA__ as unknown as BlogDto[];
createRoot(document.getElementById('root')!).render(<App blogs={blogs} url={''} />);
