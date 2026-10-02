import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import CloudRoot from './cloud/CloudRoot';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CloudRoot />
  </StrictMode>,
);
