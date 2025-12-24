import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/shared/ui/card";
import type { ReactNode } from "react";

interface InfoCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
}

/**
 * Generic info card pattern used across dashboard components
 */
export function InfoCard({
  title,
  icon,
  children,
  className,
  headerClassName,
}: InfoCardProps) {
  return (
    <Card className={className}>
      <CardHeader className={`pb-2 ${headerClassName}`}>
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
