import { SyncScheduleButton } from './schedule/SyncScheduleButton';
import { getAuthSession, logger } from '@odis-ai/extension-shared';
import { trackEvent } from '@odis-ai/extension-shared/lib/analytics/event-tracker';
import { Button } from '@odis-ai/ui/extension';
import { useCurrentTab, isIdexxSchedulePage } from '../hooks/useCurrentTab';
import { LayoutDashboard, Loader2 } from 'lucide-react';
import { useState } from 'react';

export const PopupMenuBar = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { currentTab } = useCurrentTab();

  const openDashboard = async () => {
    setIsLoading(true);
    let wasAuthenticated = false;
    let errorMessage: string | undefined;

    try {
      // Get extension version for debugging
      const extensionVersion = chrome.runtime.getManifest()?.version || 'unknown';

      // Check if user is authenticated in the extension
      const session = await getAuthSession();

      let dashboardUrl: string;

      if (session && session.access_token) {
        wasAuthenticated = true;

        // User is authenticated - pass tokens to auto-login
        const params = new URLSearchParams({
          auth_token: session.access_token,
          return_url: '/dashboard',
          extension_version: extensionVersion,
        });

        // Add refresh_token if available
        if (session.refresh_token) {
          params.append('refresh_token', session.refresh_token);
        }

        // Add expires_at timestamp for token validation
        if (session.expires_at) {
          params.append('expires_at', session.expires_at.toString());
        }

        dashboardUrl = `https://odisai.net/dashboard?${params.toString()}`;
      } else {
        // User is not authenticated - send to login with return URL
        const returnUrl = encodeURIComponent('/dashboard');
        dashboardUrl = `https://odisai.net/login?return_url=${returnUrl}`;
      }

      // Track analytics event
      try {
        await trackEvent({
          event_type: 'dashboard_open',
          event_category: 'dashboard',
          event_action: 'view',
          source: 'chrome_extension',
          metadata: {
            authenticated: wasAuthenticated,
            extension_version: extensionVersion,
          },
          success: true,
        });
      } catch (trackError) {
        // Don't fail the dashboard open if analytics fails
        logger.warn('Failed to track dashboard open event', { error: trackError });
      }

      chrome.tabs.create({ url: dashboardUrl });
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error opening dashboard', { error });

      // Track error event
      try {
        await trackEvent({
          event_type: 'dashboard_open',
          event_category: 'dashboard',
          event_action: 'view',
          source: 'chrome_extension',
          metadata: {
            authenticated: wasAuthenticated,
          },
          success: false,
          error_message: errorMessage,
        });
      } catch (trackError) {
        logger.warn('Failed to track dashboard open error', { error: trackError });
      }

      // Fallback to basic dashboard URL
      chrome.tabs.create({ url: 'https://odisai.net/dashboard' });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if we're on an IDEXX schedule page
  const isOnSchedulePage = currentTab && isIdexxSchedulePage(currentTab.url, currentTab.title);

  return (
    <>
      <div className="border-border bg-card border-b px-4 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => void openDashboard()}
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className="text-foreground hover:bg-muted flex items-center gap-2 text-sm font-medium">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutDashboard className="h-4 w-4" />}
            <span>{isLoading ? 'Opening...' : 'Dashboard'}</span>
          </Button>
        </div>
      </div>

      {/* Show sync schedule button when on IDEXX schedule page */}
      {isOnSchedulePage && <SyncScheduleButton />}
    </>
  );
};
