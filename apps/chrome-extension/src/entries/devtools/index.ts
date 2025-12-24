import { logger } from '@odis-ai/extension/shared';

try {
  chrome.devtools.panels.create('Dev Tools', '/icon-34.png', '/devtools-panel/index.html');
} catch (e) {
  logger.error('Failed to create devtools panel', { error: e });
}
