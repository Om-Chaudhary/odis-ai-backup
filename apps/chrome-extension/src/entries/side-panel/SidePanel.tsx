import '@src/SidePanel.css';
import { PROJECT_URL_OBJECT, withErrorBoundary, withSuspense } from '@odis-ai/extension/shared';
import { cn, ErrorDisplay, LoadingSpinner } from '@odis-ai/shared/ui/extension';

const SidePanel = () => {
  const logo = 'side-panel/logo_vertical.svg'; // Always use light logo

  const goGithubSite = () => chrome.tabs.create(PROJECT_URL_OBJECT);

  return (
    <div className={cn('App bg-background')}>
      <header className="App-header text-foreground">
        <button onClick={goGithubSite}>
          <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />
        </button>
        <p className="text-muted-foreground">
          Edit <code className="bg-muted rounded px-2 py-1">pages/side-panel/src/SidePanel.tsx</code>
        </p>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(SidePanel, <LoadingSpinner />), ErrorDisplay);
