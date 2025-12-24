/**
 * Dashboard Link Icon
 *
 * External link icon that opens the discharge detail page on the web dashboard
 * Uses inline styles for reliable rendering in content scripts.
 */

// Default colors - white for visibility on teal background (BrandedMenuBar)
const DEFAULT_COLOR = "#ffffff"; // white

// Dark colors - for light backgrounds (schedule popup)
const DARK_COLOR = "#14b8a6"; // teal-500

interface DashboardLinkIconProps {
  caseId: string;
  className?: string;
  size?: number;
  variant?: "light" | "dark"; // light = white icons (for dark/teal bg), dark = teal/gray icons (for light bg)
}

/**
 * Dashboard Link Icon - Opens discharge detail in web dashboard
 */
export const DashboardLinkIcon = ({
  caseId,
  className = "",
  size = 16,
  variant = "light",
}: DashboardLinkIconProps) => {
  const color = variant === "dark" ? DARK_COLOR : DEFAULT_COLOR;
  const baseUrl = "https://odisai.net";
  const dashboardUrl = `${baseUrl}/dashboard/discharges/${caseId}`;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Use Chrome API to open in new tab
    chrome.tabs.create({ url: dashboardUrl });
  };

  return (
    <button
      title="View discharge in dashboard"
      onClick={handleClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        cursor: "pointer",
        transition: "opacity 0.2s",
        background: "none",
        border: "none",
        padding: 0,
        margin: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = "0.8";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = "1";
      }}
      type="button"
    >
      <svg
        className={className}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: size, height: size, minWidth: size }}
      >
        {/* External link icon */}
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </button>
  );
};
