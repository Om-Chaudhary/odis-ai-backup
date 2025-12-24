import "./Popup.css";
import {
  SupabaseAuthProvider,
  useAuth,
  withErrorBoundary,
  withSuspense,
} from "@odis-ai/extension/shared";
import { ErrorDisplay, LoadingSpinner } from "@odis-ai/shared/ui/extension";

const Header = () => (
  <div
    className="popup-header"
    style={{
      background: "linear-gradient(135deg, #31aba3 0%, #3bbfb7 100%)",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <div
        style={{
          width: "24px",
          height: "24px",
          backgroundColor: "white",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#31aba3",
          fontWeight: "bold",
          fontSize: "12px",
        }}
      >
        O
      </div>
      <span style={{ color: "white", fontWeight: "bold", fontSize: "16px" }}>
        ODIS
      </span>
      <span
        style={{
          backgroundColor: "rgba(255,255,255,0.2)",
          color: "white",
          padding: "2px 8px",
          borderRadius: "12px",
          fontSize: "11px",
          fontWeight: "bold",
        }}
      >
        Neo
      </span>
    </div>
  </div>
);

const PopupContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div
      style={{ minHeight: "400px", display: "flex", flexDirection: "column" }}
    >
      <Header />
      <div style={{ flex: 1, padding: "1rem" }}>
        {user ? (
          <div>
            <p style={{ marginBottom: "1rem", color: "#666" }}>
              Signed in as {user.email}
            </p>
            <a
              href="https://odisai.net/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                padding: "0.75rem 1rem",
                backgroundColor: "#31aba3",
                color: "white",
                textAlign: "center",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Open Dashboard
            </a>
          </div>
        ) : (
          <div>
            <p style={{ marginBottom: "1rem", color: "#666" }}>
              Sign in to access ODIS features.
            </p>
            <a
              href="https://odisai.net/login"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                padding: "0.75rem 1rem",
                backgroundColor: "#3b82f6",
                color: "white",
                textAlign: "center",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: "500",
              }}
            >
              Sign In
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const Popup = () => (
  <SupabaseAuthProvider>
    <PopupContent />
  </SupabaseAuthProvider>
);

export default withErrorBoundary(
  withSuspense(Popup, <LoadingSpinner />),
  ErrorDisplay,
);
