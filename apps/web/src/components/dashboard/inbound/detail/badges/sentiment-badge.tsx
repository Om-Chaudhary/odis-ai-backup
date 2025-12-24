import { Badge } from "@odis-ai/shared/ui/badge";

interface SentimentBadgeProps {
  sentiment: string;
}

export function SentimentBadge({ sentiment }: SentimentBadgeProps) {
  const variants: Record<string, { label: string; className: string }> = {
    positive: { label: "Positive", className: "bg-green-100 text-green-700" },
    neutral: { label: "Neutral", className: "bg-slate-100 text-slate-600" },
    negative: { label: "Negative", className: "bg-red-100 text-red-700" },
  };

  const variant = variants[sentiment];
  if (!variant) return null;

  return <Badge className={variant.className}>{variant.label}</Badge>;
}
