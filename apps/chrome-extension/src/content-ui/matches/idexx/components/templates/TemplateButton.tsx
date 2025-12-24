import { TemplateDropdown } from "./TemplateDropdown";
import { useState } from "react";
import type { CKEditorInfo } from "../../utils/dom/ckeditor-detector";

interface TemplateButtonProps {
  ckeditorInfo: CKEditorInfo;
}

export const TemplateButton = ({ ckeditorInfo }: TemplateButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        id="odis_template_button"
        type="button"
        className="cke_button cke_button__odis_templates cke_button_off"
        title="ODIS AI Templates - Insert SOAP note templates"
        tabIndex={-1}
        aria-labelledby="odis_template_button_label"
        aria-haspopup="listbox"
        aria-disabled="false"
        onClick={handleToggle}
        style={{
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          padding: "4px 6px",
          borderRadius: "2px",
          transition: "background-color 0.2s",
          backgroundColor: isOpen ? "rgba(0, 128, 128, 0.1)" : "transparent",
        }}
        onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = "rgba(0, 0, 0, 0.05)";
          }
        }}
        onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = "transparent";
          }
        }}
      >
        <span
          className="cke_button_icon"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "16px",
            height: "16px",
          }}
        >
          {/* ODIS AI Icon - colored paw print */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ flexShrink: 0 }}
          >
            {/* Paw print icon */}
            <path
              d="M8.5 5C8.5 6.38 7.38 7.5 6 7.5C4.62 7.5 3.5 6.38 3.5 5C3.5 3.62 4.62 2.5 6 2.5C7.38 2.5 8.5 3.62 8.5 5Z"
              fill="#14b8a6"
            />
            <path
              d="M14.5 5C14.5 6.38 13.38 7.5 12 7.5C10.62 7.5 9.5 6.38 9.5 5C9.5 3.62 10.62 2.5 12 2.5C13.38 2.5 14.5 3.62 14.5 5Z"
              fill="#14b8a6"
            />
            <path
              d="M20.5 5C20.5 6.38 19.38 7.5 18 7.5C16.62 7.5 15.5 6.38 15.5 5C15.5 3.62 16.62 2.5 18 2.5C19.38 2.5 20.5 3.62 20.5 5Z"
              fill="#14b8a6"
            />
            <path
              d="M18 11.5C18 12.88 16.88 14 15.5 14C14.12 14 13 12.88 13 11.5C13 10.12 14.12 9 15.5 9C16.88 9 18 10.12 18 11.5Z"
              fill="#0d9488"
            />
            <path
              d="M11 11.5C11 12.88 9.88 14 8.5 14C7.12 14 6 12.88 6 11.5C6 10.12 7.12 9 8.5 9C9.88 9 11 10.12 11 11.5Z"
              fill="#0d9488"
            />
            <path
              d="M15.89 14.5C14.23 13.67 9.77 13.67 8.11 14.5C6.84 15.13 6 16.57 6 18.09V19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V18.09C18 16.57 17.16 15.13 15.89 14.5Z"
              fill="#14b8a6"
            />
          </svg>
        </span>
        <span
          id="odis_template_button_label"
          className="cke_button_label"
          style={{
            fontSize: "11px",
            fontFamily: "Arial, sans-serif",
            color: "#333",
            whiteSpace: "nowrap",
          }}
        >
          Templates
        </span>
        {/* Down arrow indicator */}
        <span
          style={{
            display: "inline-flex",
            width: "8px",
            height: "8px",
            marginLeft: "2px",
          }}
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M1 2L4 5L7 2"
              stroke="#666"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <TemplateDropdown
          ckeditorInfo={ckeditorInfo}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
