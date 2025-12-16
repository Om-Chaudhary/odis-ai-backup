"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <h2>Something went wrong!</h2>
            <button
              onClick={() => reset()}
              style={{
                marginTop: "16px",
                padding: "8px 16px",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
