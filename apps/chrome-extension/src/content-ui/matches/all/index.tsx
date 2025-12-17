import { initAppWithShadow } from '@odis-ai/extension-shared';
import App from './App';
import './index.css';

// Initialize with shadow DOM but without inline CSS (CSS loaded separately)
initAppWithShadow({ id: 'CEB-extension-all', app: <App /> });
