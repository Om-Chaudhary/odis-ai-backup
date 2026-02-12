import Link from "next/link";
import { ArrowLeftRight, Lightbulb, ArrowRight, BookOpen } from "lucide-react";
import { cn } from "@odis-ai/shared/util";

export interface CrossLinkItem {
  slug: string;
  label: string;
  description?: string;
  type: "solution" | "comparison" | "resource";
}

export interface CrossLinkSectionProps {
  title?: string;
  links: CrossLinkItem[];
  className?: string;
}

const typeConfig = {
  solution: { prefix: "/solutions", Icon: Lightbulb },
  comparison: { prefix: "/compare", Icon: ArrowLeftRight },
  resource: { prefix: "/resources", Icon: BookOpen },
} as const;

export function CrossLinkSection({
  title = "Related Pages",
  links,
  className,
}: CrossLinkSectionProps) {
  if (links.length === 0) return null;

  return (
    <div className={cn("space-y-6", className)}>
      <h3 className="font-display text-lg font-semibold text-slate-900">
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {links.map((link) => {
          const config = typeConfig[link.type];
          const href = `${config.prefix}/${link.slug}`;
          const Icon = config.Icon;

          return (
            <Link
              key={`${link.type}-${link.slug}`}
              href={href}
              className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-teal-200 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 transition-colors group-hover:bg-teal-100">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900 group-hover:text-teal-700">
                  {link.label}
                </p>
                {link.description && (
                  <p className="mt-1 text-sm text-slate-500">
                    {link.description}
                  </p>
                )}
              </div>
              <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-teal-600" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
