import '@src/Panel.css';
import { PROJECT_URL_OBJECT, withErrorBoundary, withSuspense } from '@odis-ai/extension-shared';
import { cn, ErrorDisplay, LoadingSpinner } from '@odis-ai/ui/extension';

const Panel = () => {
  const logo = 'devtools-panel/logo_horizontal.svg'; // Always use light logo

  const goGithubSite = () => chrome.tabs.create(PROJECT_URL_OBJECT);

  return (
    <div className={cn('App bg-background')}>
      <header className="App-header text-foreground">
        <button onClick={goGithubSite}>
          <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />
        </button>
        <p className="text-muted-foreground">
          Edit <code className="bg-muted rounded px-2 py-1">pages/devtools-panel/src/Panel.tsx</code>
        </p>
      </header>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Panel, <LoadingSpinner />), ErrorDisplay);
