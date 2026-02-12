"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@odis-ai/shared/util";

export interface TocItem {
  id: string;
  title: string;
}

export interface ArticleTableOfContentsProps {
  items: TocItem[];
  className?: string;
}

export function ArticleTableOfContents({
  items,
  className,
}: ArticleTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);
  const headingElementsRef = useRef<Record<string, IntersectionObserverEntry>>(
    {},
  );

  const getIndexFromId = useCallback(
    (id: string) => items.findIndex((item) => item.id === id),
    [items],
  );

  useEffect(() => {
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        headingElementsRef.current[entry.target.id] = entry;
      });

      const visibleHeadings: IntersectionObserverEntry[] = [];
      Object.keys(headingElementsRef.current).forEach((key) => {
        const entry = headingElementsRef.current[key];
        if (entry?.isIntersecting) {
          visibleHeadings.push(entry);
        }
      });

      if (visibleHeadings.length > 0) {
        // Pick the one closest to the top
        const sorted = visibleHeadings.sort(
          (a, b) => getIndexFromId(a.target.id) - getIndexFromId(b.target.id),
        );
        setActiveId(sorted[0]?.target.id ?? "");
      }
    };

    observerRef.current = new IntersectionObserver(handleObserver, {
      rootMargin: "-80px 0px -60% 0px",
      threshold: 0,
    });

    const elements = items
      .map((item) => document.getElementById(item.id))
      .filter(Boolean) as HTMLElement[];

    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [items, getIndexFromId]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  return (
    <nav
      className={cn("hidden lg:block", className)}
      aria-label="Table of contents"
    >
      <div className="sticky top-24">
        <p className="mb-4 text-xs font-semibold tracking-widest text-slate-400 uppercase">
          In this article
        </p>

        <ul className="relative space-y-0.5">
          {/* Track line */}
          <div className="absolute inset-y-0 left-0 w-px bg-slate-200" />

          {items.map((item) => {
            const isActive = activeId === item.id;

            return (
              <li key={item.id} className="relative">
                {/* Active indicator */}
                <div
                  className={cn(
                    "absolute top-0 left-0 h-full w-0.5 rounded-full transition-all duration-300",
                    isActive
                      ? "bg-teal-500 opacity-100"
                      : "bg-transparent opacity-0",
                  )}
                />

                <button
                  onClick={() => handleClick(item.id)}
                  className={cn(
                    "w-full cursor-pointer py-2 pr-2 pl-4 text-left text-sm leading-snug transition-colors duration-200",
                    isActive
                      ? "font-medium text-teal-600"
                      : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  {item.title}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
