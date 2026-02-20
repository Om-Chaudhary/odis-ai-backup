"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown, Clock } from "lucide-react";
import type { BlogPost } from "./data";

interface BlogCategorySectionProps {
  category: string;
  posts: BlogPost[];
  colors: { bg: string; text: string; border: string; iconBg: string };
  defaultOpen?: boolean;
}

export function BlogCategorySection({
  category,
  posts,
  colors,
  defaultOpen = false,
}: BlogCategorySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-slate-100">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-slate-50/50"
      >
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${colors.bg} ${colors.text}`}
          >
            {category}
          </span>
          <span className="text-sm text-slate-400">
            {posts.length} {posts.length === 1 ? "article" : "articles"}
          </span>
        </div>
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className={`group flex flex-col rounded-xl border bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${colors.border}`}
            >
              <h3 className="text-sm font-semibold leading-snug text-slate-900 group-hover:text-teal-700">
                {post.title}
              </h3>
              <p className="mt-2 line-clamp-2 flex-1 text-xs leading-relaxed text-slate-500">
                {post.metaDescription}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readTime}
                </div>
                <span className="flex items-center gap-1 font-medium text-teal-600 group-hover:text-teal-700">
                  Read
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
