"use client";

import { type ReactNode } from "react";
import { cn } from "@odis-ai/utils";

interface PageContainerProps {
  children: ReactNode;
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
}

/**
 * Page Container - Glassmorphism Layout Component
 *
 * Provides a consistent layout structure for dashboard pages with:
 * - Glassmorphism card styling matching the dashboard theme
 * - Proper flex layout for header, toolbar, content, and footer
 * - Overflow handling for scrollable content areas
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
    <div
      className={cn(
        "flex h-full flex-col overflow-hidden",
        "rounded-xl border border-teal-200/40",
        "bg-gradient-to-br from-white/70 via-teal-50/20 to-white/70",
        "shadow-lg shadow-teal-500/5 backdrop-blur-md",
        "transition-all duration-200",
        className,
      )}
    >
      {children}
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
        "border-b border-teal-100/50",
        "bg-gradient-to-r from-white/50 to-teal-50/30",
        "px-4 py-3",
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
        "border-b border-teal-100/30",
        "bg-white/40 backdrop-blur-sm",
        "px-4 py-3",
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
    <div className={cn("min-h-0 flex-1 overflow-auto", className)}>
      {children}
    </div>
  );
}

/**
 * Page Footer - Bottom section for pagination and summary info
 */
export function PageFooter({ children, className }: PageFooterProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between",
        "border-t border-teal-100/50",
        "bg-gradient-to-r from-teal-50/30 to-white/50",
        "px-4 py-2",
        className,
      )}
    >
      {children}
    </div>
  );
}
