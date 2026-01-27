import { useEffect, useState } from "react";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/chrome-extension";
import {
  getClerkPublishableKey,
  getDashboardUrl,
  sendMessage,
  getSettings,
  updateSettings,
  type ExtensionSettings,
} from "@odis-ai/extension/shared";

const CLERK_PUBLISHABLE_KEY = getClerkPublishableKey();

function SettingsToggle() {
  const [settings, setSettings] = useState<ExtensionSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  const handleToggle = async () => {
    if (!settings) return;
    const updated = await updateSettings({ enabled: !settings.enabled });
    setSettings(updated);
  };

  if (loading || !settings) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="settings-section">
      <label className="toggle-label">
        <span>Extension enabled</span>
        <button
          className={`toggle-button ${settings.enabled ? "active" : ""}`}
          onClick={handleToggle}
          aria-pressed={settings.enabled}
        >
          <span className="toggle-thumb" />
        </button>
      </label>
    </div>
  );
}

function DashboardLink() {
  const handleOpenDashboard = () => {
    sendMessage("OPEN_DASHBOARD");
  };

  return (
    <button className="dashboard-link" onClick={handleOpenDashboard}>
      Open Dashboard
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15,3 21,3 21,9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </button>
  );
}

function AppContent() {
  return (
    <div className="popup-container">
      <header className="popup-header">
        <div className="logo">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
          <h1>ODIS AI</h1>
        </div>
        <SignedIn>
          <UserButton
            appearance={{
              elements: {
                avatarBox: { width: 28, height: 28 },
              },
            }}
          />
        </SignedIn>
      </header>

      <main className="popup-content">
        <SignedIn>
          <SettingsToggle />
          <DashboardLink />
          <p className="help-text">
            IDEXX Neo integration is {" "}
            <strong>active</strong>. Patient data will be detected automatically.
          </p>
        </SignedIn>

        <SignedOut>
          <div className="sign-in-section">
            <p>Sign in to enable IDEXX Neo integration</p>
            <SignInButton mode="modal">
              <button className="sign-in-button">Sign In</button>
            </SignInButton>
          </div>
        </SignedOut>
      </main>

      <footer className="popup-footer">
        <span className="version">v{chrome.runtime.getManifest().version}</span>
        <a
          href={getDashboardUrl() + "/help"}
          target="_blank"
          rel="noopener noreferrer"
        >
          Help
        </a>
      </footer>
    </div>
  );
}

export default function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="popup-container">
        <header className="popup-header">
          <h1>ODIS AI</h1>
        </header>
        <main className="popup-content">
          <p className="error-text">
            Extension not configured. Please set VITE_CLERK_PUBLISHABLE_KEY.
          </p>
        </main>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AppContent />
    </ClerkProvider>
  );
}
