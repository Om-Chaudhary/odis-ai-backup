import '@src/Options.css';
import { PROJECT_URL_OBJECT, withErrorBoundary, withSuspense } from '@odis-ai/extension/shared';
import { cn, ErrorDisplay, LoadingSpinner } from '@odis-ai/shared/ui/extension';

const Options = () => {
  const logo = 'options/logo_horizontal.svg'; // Always use light logo

  const goGithubSite = () => chrome.tabs.create(PROJECT_URL_OBJECT);

  return (
    <div className={cn('App bg-background text-foreground min-h-screen p-8')}>
      <div className="mx-auto max-w-4xl">
        <button onClick={goGithubSite} className="mb-8">
          <img src={chrome.runtime.getURL(logo)} className="App-logo" alt="logo" />
        </button>
      </div>
    </div>
  );
};

export default withErrorBoundary(withSuspense(Options, <LoadingSpinner />), ErrorDisplay);
