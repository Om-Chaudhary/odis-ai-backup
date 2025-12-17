import 'webextension-polyfill';
import { logger, formatErrorMessage } from '@odis-ai/extension-shared';
import { exampleThemeStorage } from '@odis-ai/extension-storage';

const bgLogger = logger.child('[Background]');

exampleThemeStorage.get().then(theme => {
  bgLogger.debug('theme', { theme });
});

bgLogger.info('Background loaded');
bgLogger.info("Edit 'chrome-extension/src/background/index.ts' and save to reload.");

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OPEN_EMAIL_EDITOR') {
    const { dischargeSummaryId } = message;
    const url = chrome.runtime.getURL(`email-editor/index.html?id=${dischargeSummaryId}`);

    chrome.tabs.create({ url }, tab => {
      sendResponse({ success: true, tabId: tab?.id });
    });

    // Return true to indicate we'll send a response asynchronously
    return true;
  }

  // Handle API calls from content scripts (bypasses CORS)
  if (message.type === 'API_REQUEST') {
    const { url, method, headers, body } = message;

    bgLogger.info('Making API request', { url, method });

    fetch(url, {
      method: method || 'GET',
      headers: headers || {},
      body: body ? JSON.stringify(body) : undefined,
    })
      .then(async response => {
        // Determine content type
        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');

        let data: unknown = {};
        let errorMessage: string | undefined;

        try {
          if (isJson) {
            // Try to parse as JSON
            const text = await response.text();
            if (text) {
              data = JSON.parse(text);
            }
          } else {
            // For non-JSON responses, try to extract error message from text
            const text = await response.text();
            if (text) {
              // Try to parse as JSON anyway (some APIs return JSON but wrong content-type)
              try {
                data = JSON.parse(text);
              } catch {
                // If not JSON, store as text for error message
                errorMessage = text.substring(0, 500); // Limit length
              }
            }
          }
        } catch (parseError) {
          bgLogger.warn('Failed to parse response', { parseError, contentType, status: response.status });
          // data remains {}
        }

        if (!response.ok) {
          // Extract error message from various possible formats
          let finalErrorMessage: string;

          // Handle specific HTTP status codes with helpful messages
          if (response.status === 405) {
            finalErrorMessage = `Method Not Allowed: The endpoint ${url} does not accept ${method} requests. The endpoint may not exist or may only accept a different HTTP method.`;
          } else if (response.status === 404) {
            finalErrorMessage = `Not Found: The endpoint ${url} does not exist on the server.`;
          } else if (response.status === 401) {
            finalErrorMessage = `Unauthorized: Authentication failed. Please sign in again.`;
          } else if (response.status === 403) {
            finalErrorMessage = `Forbidden: You do not have permission to access ${url}.`;
          } else if (response.status >= 500) {
            finalErrorMessage = `Server Error: The server encountered an error processing your request. Please try again later.`;
          } else if (errorMessage) {
            finalErrorMessage = errorMessage;
          } else if (typeof data === 'object' && data !== null) {
            const errorObj = data as Record<string, unknown>;
            // Try common error message fields
            finalErrorMessage =
              (typeof errorObj.error === 'string' ? errorObj.error : undefined) ||
              (typeof errorObj.message === 'string' ? errorObj.message : undefined) ||
              (typeof errorObj.details === 'string' ? errorObj.details : undefined) ||
              `API error: ${response.status} ${response.statusText}`;
          } else {
            finalErrorMessage = `API error: ${response.status} ${response.statusText}`;
          }

          bgLogger.error('API request failed', {
            url,
            method,
            status: response.status,
            statusText: response.statusText,
            error: finalErrorMessage,
            responseData: data,
          });

          // Track API error
          try {
            const { trackError } = await import('@odis-ai/extension-shared');
            await trackError(new Error(finalErrorMessage), {
              source: 'background_script',
              error_type: 'api_error',
              request_data: {
                url,
                method,
                body: body ? JSON.parse(typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
              },
              response_data: {
                status: response.status,
                statusText: response.statusText,
                data,
              },
            });
          } catch {
            // Ignore tracking errors
          }

          sendResponse({
            success: false,
            error: finalErrorMessage,
            status: response.status,
            data: data, // Include response data for debugging
          });
        } else {
          sendResponse({
            success: true,
            data: data,
            status: response.status,
          });
        }
      })
      .catch(async error => {
        bgLogger.error('API request failed', {
          url,
          method,
          error: formatErrorMessage(error, 'Network error'),
          errorDetails:
            error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
        });

        // Track error
        if (error instanceof Error) {
          try {
            const { trackError } = await import('@odis-ai/extension-shared');
            await trackError(error, {
              source: 'background_script',
              error_type: 'api_error',
              request_data: {
                url,
                method,
                body: body ? JSON.parse(typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
              },
            });
          } catch {
            // Ignore tracking errors - don't break error handling
          }
        }

        // Provide more specific error messages
        let errorMsg = formatErrorMessage(error, 'Network error');
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          errorMsg = 'Network error: Unable to connect to server. Please check your internet connection.';
        } else if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            errorMsg = 'Request timeout: The server took too long to respond.';
          } else if (error.message.includes('CORS')) {
            errorMsg = 'CORS error: Cross-origin request blocked.';
          }
        }

        sendResponse({
          success: false,
          error: errorMsg,
        });
      });

    // Return true to indicate async response
    return true;
  }

  // Handle page refresh request (e.g., after sign-in in popup)
  if (message.type === 'REFRESH_PAGE') {
    bgLogger.info('Refreshing active tab after authentication');

    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (tabs[0]?.id) {
        chrome.tabs.reload(tabs[0].id, { bypassCache: true }, () => {
          if (chrome.runtime.lastError) {
            bgLogger.error('Failed to refresh tab', { error: chrome.runtime.lastError.message });
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            bgLogger.info('Tab refreshed successfully');
            sendResponse({ success: true });
          }
        });
      } else {
        bgLogger.warn('No active tab found to refresh');
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });

    // Return true to indicate async response
    return true;
  }

  // Handle schedule sync request from dashboard
  if (message.type === 'SYNC_SCHEDULE') {
    const { startDate, endDate } = message;

    bgLogger.info('Received schedule sync request, forwarding to IDEXX tab', { startDate, endDate });

    // Find IDEXX tabs
    chrome.tabs.query(
      {
        url: [
          'https://*.idexxneo.com/*',
          'https://*.idexxneocloud.com/*',
          'https://neo.vet/*',
          'https://*.neosuite.com/*',
        ],
      },
      tabs => {
        if (chrome.runtime.lastError) {
          bgLogger.error('Error querying IDEXX tabs', { error: chrome.runtime.lastError.message });
          sendResponse({
            success: false,
            error: `Failed to find IDEXX tab: ${chrome.runtime.lastError.message}`,
          });
          return;
        }

        if (!tabs || tabs.length === 0) {
          bgLogger.warn('No IDEXX tabs found');
          sendResponse({
            success: false,
            error: 'No IDEXX tab found. Please open an IDEXX Neo page and try again.',
          });
          return;
        }

        // Use the first IDEXX tab
        const idexxTab = tabs[0];
        const tabId = idexxTab.id;
        if (!tabId) {
          sendResponse({ success: false, error: 'Invalid IDEXX tab' });
          return;
        }

        bgLogger.info('Sending sync request to IDEXX content script', { tabId });

        // Guard to prevent multiple responses
        let responseSent = false;
        const safeSendResponse = (response: unknown) => {
          if (!responseSent) {
            responseSent = true;
            sendResponse(response);
          } else {
            bgLogger.warn('Attempted to send multiple responses, ignoring', { tabId });
          }
        };

        // Helper function to send the sync message
        const sendSyncMessage = (isRetry = false): void => {
          chrome.tabs.sendMessage(
            tabId,
            {
              type: 'SYNC_SCHEDULE',
              startDate,
              endDate,
            },
            response => {
              // Check if tab still exists
              if (chrome.runtime.lastError) {
                const errorMsg = chrome.runtime.lastError.message || 'Unknown error';

                // Check if content script isn't loaded (only attempt injection on first try)
                const isContentScriptMissing =
                  (errorMsg.includes('Could not establish connection') ||
                    errorMsg.includes('Receiving end does not exist')) &&
                  !isRetry;

                if (isContentScriptMissing) {
                  bgLogger.warn('Content script not loaded, attempting to inject', { tabId });

                  // Inject both JS and CSS files as specified in manifest
                  Promise.all([
                    chrome.scripting.executeScript({
                      target: { tabId },
                      files: ['content-ui/idexx.iife.js'],
                    }),
                    chrome.scripting
                      .insertCSS({
                        target: { tabId },
                        files: ['content-ui/idexx.css'],
                      })
                      .catch(err => {
                        // CSS injection failure is non-critical, log but continue
                        bgLogger.warn('Failed to inject CSS (non-critical)', { error: err, tabId });
                      }),
                  ])
                    .then(() => {
                      bgLogger.info('Content script injected successfully, retrying sync message', { tabId });
                      // Wait for script initialization before retrying
                      setTimeout(() => {
                        sendSyncMessage(true);
                      }, 1000); // Increased timeout for script initialization
                    })
                    .catch(error => {
                      bgLogger.error('Failed to inject content script', {
                        error: formatErrorMessage(error, 'Unknown injection error'),
                        tabId,
                      });
                      safeSendResponse({
                        success: false,
                        error: formatErrorMessage(
                          error,
                          'Content script not loaded. Please reload the IDEXX Neo page and try again.',
                        ),
                      });
                    });
                  return;
                }

                // Other errors or retry failed
                bgLogger.error('Error sending message to IDEXX tab', {
                  error: errorMsg,
                  tabId,
                  isRetry,
                });
                safeSendResponse({
                  success: false,
                  error: formatErrorMessage(
                    errorMsg,
                    "Failed to sync schedule. Make sure you're on an IDEXX Neo page.",
                  ),
                });
                return;
              }

              // Handle successful response
              if (response) {
                safeSendResponse(response);
              } else {
                safeSendResponse({
                  success: false,
                  error: 'No response from IDEXX content script',
                });
              }
            },
          );
        };

        // Initial attempt to send the message
        sendSyncMessage();
      },
    );

    // Return true to indicate async response
    return true;
  }

  // Handle notes reconciliation request
  if (message.type === 'RECONCILE_NOTES') {
    const { startDate, endDate } = message;

    bgLogger.info('Received notes reconciliation request, forwarding to IDEXX tab', { startDate, endDate });

    // Find IDEXX tabs
    chrome.tabs.query(
      {
        url: [
          'https://*.idexxneo.com/*',
          'https://*.idexxneocloud.com/*',
          'https://neo.vet/*',
          'https://*.neosuite.com/*',
        ],
      },
      tabs => {
        if (chrome.runtime.lastError) {
          bgLogger.error('Error querying IDEXX tabs', { error: chrome.runtime.lastError.message });
          sendResponse({
            success: false,
            error: `Failed to find IDEXX tab: ${chrome.runtime.lastError.message}`,
          });
          return;
        }

        if (!tabs || tabs.length === 0) {
          bgLogger.warn('No IDEXX tabs found');
          sendResponse({
            success: false,
            error: 'No IDEXX tab found. Please open an IDEXX Neo page and try again.',
          });
          return;
        }

        // Use the first IDEXX tab
        const idexxTab = tabs[0];
        const tabId = idexxTab.id;
        if (!tabId) {
          sendResponse({ success: false, error: 'Invalid IDEXX tab' });
          return;
        }

        bgLogger.info('Sending reconciliation request to IDEXX content script', { tabId });

        // Send message to content script
        chrome.tabs.sendMessage(
          tabId,
          {
            type: 'RECONCILE_NOTES',
            startDate,
            endDate,
          },
          response => {
            if (chrome.runtime.lastError) {
              const errorMsg = chrome.runtime.lastError.message || 'Unknown error';
              bgLogger.error('Error sending reconciliation message to IDEXX tab', {
                error: errorMsg,
                tabId,
              });
              sendResponse({
                success: false,
                error: formatErrorMessage(
                  errorMsg,
                  "Failed to reconcile notes. Make sure you're on an IDEXX Neo page.",
                ),
              });
              return;
            }

            // Handle response
            if (response) {
              sendResponse(response);
            } else {
              sendResponse({
                success: false,
                error: 'No response from IDEXX content script',
              });
            }
          },
        );
      },
    );

    // Return true to indicate async response
    return true;
  }

  // Unhandled message type - return false for synchronous response
  return false;
});
