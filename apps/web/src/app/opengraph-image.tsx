import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "OdisAI - AI Voice Agents for Veterinary Clinics";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 64,
        background:
          "linear-gradient(135deg, #f8fafb 0%, #e0f2fe 50%, #ccfbf1 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
      }}
    >
      {/* Decorative circles */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 60,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
          opacity: 0.15,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 80,
          right: 100,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)",
          opacity: 0.1,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 200,
          right: 200,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
          opacity: 0.12,
        }}
      />

      {/* Logo and brand */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 8px 32px rgba(13, 148, 136, 0.3)",
          }}
        >
          <span style={{ fontSize: 44, color: "white", fontWeight: 800 }}>
            O
          </span>
        </div>
        <span
          style={{
            fontWeight: 800,
            color: "#0f172a",
            fontSize: 56,
            letterSpacing: "-0.02em",
          }}
        >
          OdisAI
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          fontSize: 36,
          color: "#0d9488",
          fontWeight: 600,
          marginBottom: 20,
          letterSpacing: "-0.01em",
        }}
      >
        AI Voice Agents for Veterinary Clinics
      </div>

      {/* Value proposition */}
      <div
        style={{
          fontSize: 24,
          color: "#64748b",
          maxWidth: 800,
          textAlign: "center",
          lineHeight: 1.5,
        }}
      >
        Never miss another call. 24/7 AI that books appointments
        <br />
        and follows up with pet parents.
      </div>

      {/* Feature pills */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 40,
        }}
      >
        {["24/7 Availability", "IDEXX Integration", "Discharge Calls"].map(
          (feature) => (
            <div
              key={feature}
              style={{
                background: "rgba(20, 184, 166, 0.1)",
                border: "1px solid rgba(20, 184, 166, 0.2)",
                borderRadius: 100,
                padding: "12px 24px",
                fontSize: 18,
                color: "#0d9488",
                fontWeight: 500,
              }}
            >
              {feature}
            </div>
          ),
        )}
      </div>
    </div>,
    { ...size },
  );
}
