"use client";

export function DarkModeWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="dark"
      style={{
        minHeight: "100vh",
        backgroundColor: "hsl(0 0% 4%)",
        color: "hsl(0 0% 93%)",
      }}
    >
      {children}
    </div>
  );
}
