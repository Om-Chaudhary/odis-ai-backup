/**
 * useCurrentTab Hook
 *
 * Provides information about the currently active browser tab.
 * Useful for contextual UI features in the popup.
 */

import { useState, useEffect } from 'react';

export interface CurrentTab {
  url: string;
  title: string;
  id?: number;
}

/**
 * Hook to get the current active tab information
 */
export const useCurrentTab = () => {
  const [currentTab, setCurrentTab] = useState<CurrentTab | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentTab = async () => {
      try {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]) {
          setCurrentTab({
            url: tabs[0].url || '',
            title: tabs[0].title || '',
            id: tabs[0].id,
          });
        }
      } catch (error) {
        console.error('Failed to fetch current tab:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCurrentTab();

    // Listen for tab updates
    const handleTabUpdate = (tabId: number, changeInfo: { url?: string; status?: string }) => {
      if (changeInfo.url || changeInfo.status === 'complete') {
        chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
          if (tabs[0]) {
            setCurrentTab({
              url: tabs[0].url || '',
              title: tabs[0].title || '',
              id: tabs[0].id,
            });
          }
        });
      }
    };

    chrome.tabs.onUpdated.addListener(handleTabUpdate);

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdate);
    };
  }, []);

  return { currentTab, isLoading };
};

/**
 * Check if a URL is an IDEXX Neo domain
 */
export const isIdexxNeoDomain = (url: string): boolean => {
  const idexxPatterns = [
    /^https:\/\/.*\.idexxneo\.com/,
    /^https:\/\/.*\.idexxneocloud\.com/,
    /^https:\/\/neo\.vet/,
    /^https:\/\/.*\.neosuite\.com/,
  ];

  return idexxPatterns.some(pattern => pattern.test(url));
};

/**
 * Check if a URL is an IDEXX Neo schedule page
 */
export const isIdexxSchedulePage = (url: string, title: string): boolean => {
  if (!isIdexxNeoDomain(url)) {
    return false;
  }

  // Check URL path
  const pathnameMatch = url.includes('/schedule') || url.includes('/calendar') || url.includes('/appointment');

  // Check page title
  const titleLower = title.toLowerCase();
  const titleMatch =
    titleLower.includes('schedule') || titleLower.includes('calendar') || titleLower.includes('appointment');

  return pathnameMatch || titleMatch;
};
