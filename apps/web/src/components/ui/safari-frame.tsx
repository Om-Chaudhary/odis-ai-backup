"use client";

import { cn } from "~/lib/utils";
import { forwardRef } from "react";

interface SafariFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  url?: string;
  showUrl?: boolean;
  children: React.ReactNode;
}

export const SafariFrame = forwardRef<HTMLDivElement, SafariFrameProps>(
  (
    { className, url = "app.odis.ai", showUrl = true, children, ...props },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-900/10",
          "ring-1 ring-slate-900/5",
          className,
        )}
        {...props}
      >
        {/* Safari-style title bar */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-slate-100/80 px-4 py-3">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[#FF5F57] shadow-inner" />
            <div className="h-3 w-3 rounded-full bg-[#FEBC2E] shadow-inner" />
            <div className="h-3 w-3 rounded-full bg-[#28C840] shadow-inner" />
          </div>

          {/* URL bar */}
          {showUrl && (
            <div className="mx-auto flex max-w-md flex-1 items-center justify-center">
              <div className="flex items-center gap-2 rounded-md bg-white/80 px-3 py-1 text-xs text-slate-500 shadow-sm ring-1 ring-slate-200/60">
                <svg
                  className="h-3 w-3 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                <span className="font-medium">{url}</span>
              </div>
            </div>
          )}

          {/* Spacer to balance the layout */}
          <div className="w-[52px]" />
        </div>

        {/* Content area */}
        <div className="relative">{children}</div>
      </div>
    );
  },
);

SafariFrame.displayName = "SafariFrame";

// App Window variant - looks like a native macOS app
interface AppWindowFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
}

export const AppWindowFrame = forwardRef<HTMLDivElement, AppWindowFrameProps>(
  ({ className, title = "Odis AI", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-2xl shadow-slate-900/10",
          "ring-1 ring-slate-900/5",
          className,
        )}
        {...props}
      >
        {/* macOS-style title bar */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-b from-slate-50 to-slate-100/80 px-4 py-2.5">
          {/* Traffic lights */}
          <div className="flex items-center gap-1.5">
            <div className="group relative h-3 w-3 rounded-full bg-[#FF5F57] shadow-inner transition-colors hover:bg-[#FF4136]">
              <svg
                className="absolute inset-0 h-3 w-3 opacity-0 group-hover:opacity-100"
                viewBox="0 0 12 12"
              >
                <path
                  d="M3.5 3.5l5 5M8.5 3.5l-5 5"
                  stroke="#4a0002"
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>
            </div>
            <div className="group relative h-3 w-3 rounded-full bg-[#FEBC2E] shadow-inner transition-colors hover:bg-[#FFDC00]">
              <svg
                className="absolute inset-0 h-3 w-3 opacity-0 group-hover:opacity-100"
                viewBox="0 0 12 12"
              >
                <path
                  d="M2.5 6h7"
                  stroke="#985700"
                  strokeWidth="1.5"
                  fill="none"
                />
              </svg>
            </div>
            <div className="group relative h-3 w-3 rounded-full bg-[#28C840] shadow-inner transition-colors hover:bg-[#2ECC40]">
              <svg
                className="absolute inset-0 h-3 w-3 opacity-0 group-hover:opacity-100"
                viewBox="0 0 12 12"
              >
                <path
                  d="M3 3l6 6M9 3l-6 6"
                  stroke="#006500"
                  strokeWidth="0"
                  fill="none"
                />
                <path d="M3.5 6L6 3.5 8.5 6 6 8.5z" fill="#006500" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="flex-1 text-center">
            <span className="text-xs font-medium text-slate-500">{title}</span>
          </div>

          {/* Spacer */}
          <div className="w-[52px]" />
        </div>

        {/* Content area */}
        <div className="relative">{children}</div>
      </div>
    );
  },
);

AppWindowFrame.displayName = "AppWindowFrame";
