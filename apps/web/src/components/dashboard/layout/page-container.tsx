"use client";

import { type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

interface PageBreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
  }>;
  className?: string;
}

interface PageHeaderProps {
  children: ReactNode;
  className?: string;
}

interface PageToolbarProps {
  children: ReactNode;
  className?: string;
}

interface PageContentProps {
  children: ReactNode;
  className?: string;
}

interface PageFooterProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
}

/**
 * Page Container - Layout Component
 *
 * Provides a consistent layout structure for dashboard pages with:
 * - Proper flex layout for header, toolbar, content, and footer
 * - Overflow handling for scrollable content areas
 *
 * Note: Glassmorphism styling is now applied at the split layout level
 *
 * Usage:
 * ```tsx
 * <PageContainer>
 *   <PageHeader>Title + Actions</PageHeader>
 *   <PageToolbar>Filters + Search</PageToolbar>
 *   <PageContent>Table or Main Content</PageContent>
 *   <PageFooter>Pagination</PageFooter>
 * </PageContainer>
 * ```
 */
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("flex h-full flex-col overflow-hidden", className)}>
      {children}
    </div>
  );
}

/**
 * Page Breadcrumb - Navigation breadcrumb trail
 *
 * Usage:
 * ```tsx
 * <PageBreadcrumb items={[
 *   { label: "After Hours" },
 *   { label: "All Calls" }
 * ]} />
 * ```
 */
export function PageBreadcrumb({ items, className }: PageBreadcrumbProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center",
        "border-b border-slate-200/60",
        "bg-white",
        "px-4 py-2",
        className,
      )}
    >
      <nav className="flex items-center gap-1.5">
        {items.map((item, index) => (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && (
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            )}
            <span
              className={cn(
                "text-sm font-medium",
                index === items.length - 1
                  ? "text-slate-800"
                  : "text-slate-500",
              )}
            >
              {item.label}
            </span>
          </span>
        ))}
      </nav>
    </div>
  );
}

/**
 * Page Header - Top section for page title and primary actions
 */
export function PageHeader({ children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between",
        "border-b border-slate-200/60",
        "bg-white/70 backdrop-blur-sm",
        "px-5 py-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Page Toolbar - Section for filters, search, and secondary controls
 */
export function PageToolbar({ children, className }: PageToolbarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-3",
        "border-b border-slate-200/40",
        "bg-white/50 backdrop-blur-sm",
        "px-5 py-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Page Content - Main scrollable content area
 */
export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn("min-h-0 min-w-0 flex-1 overflow-auto", className)}>
      {children}
    </div>
  );
}

/**
 * Page Footer - Bottom section for pagination and summary info
 */
export function PageFooter({
  children,
  className,
  fullWidth = false,
}: PageFooterProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between",
        "border-t border-slate-200/60",
        "bg-white/70 backdrop-blur-sm",
        fullWidth ? "px-0 py-2" : "px-5 py-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
