import { hydrateRoot } from 'react-dom/client';
import App from './App';
import type { BlogDto } from '@services/generated/model';

const data = window.__INITIAL_DATA__ as unknown as BlogDto[];

hydrateRoot(document.getElementById('root')!, <App blogs={data} url="" />);
