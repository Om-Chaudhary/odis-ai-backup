"use client";

import React, { useCallback, type ComponentProps } from "react";
import { ArrowDownIcon, type LucideIcon, MessageSquare } from "lucide-react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import { cn } from "@odis-ai/utils";
import { Button } from "./button";

export type ConversationProps = ComponentProps<typeof StickToBottom>;

export const Conversation = ({ className, ...props }: ConversationProps) => (
  <StickToBottom
    className={cn("relative flex-1 overflow-y-auto", className)}
    initial="smooth"
    resize="smooth"
    role="log"
    {...props}
  />
);

export type ConversationContentProps = ComponentProps<
  typeof StickToBottom.Content
>;

export const ConversationContent = ({
  className,
  ...props
}: ConversationContentProps) => (
  <StickToBottom.Content className={cn("p-4", className)} {...props} />
);

export type ConversationEmptyStateProps = Omit<
  ComponentProps<"div">,
  "title"
> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode | LucideIcon;
};

export const ConversationEmptyState = ({
  className,
  title = "No messages yet",
  description = "Start a conversation to see messages here",
  icon,
  children,
  ...props
}: ConversationEmptyStateProps) => {
  // If children are provided, use them directly (for custom empty states)
  if (children) {
    return (
      <div
        className={cn(
          "flex size-full flex-col items-center justify-center gap-3 p-8 text-center",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  // Determine the icon to use
  const IconComponent =
    typeof icon === "function" ? icon : icon ? undefined : MessageSquare;

  const renderIcon = () => {
    if (!icon && !IconComponent) return null;
    if (typeof icon === "function") {
      const Icon = icon;
      return <Icon className="text-muted-foreground size-6" aria-hidden />;
    }
    if (icon) return icon;
    if (IconComponent)
      return (
        <IconComponent className="text-muted-foreground size-6" aria-hidden />
      );
    return null;
  };

  return (
    <div
      className={cn(
        "border-border bg-background text-foreground flex size-full flex-col items-center justify-center gap-3 rounded-lg border p-6 text-center shadow-sm",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col items-center gap-2">
        {renderIcon()}
        <div className="space-y-1">
          <h3 className="text-base font-semibold">
            {title ?? "No messages yet"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {description ?? "Start a conversation to see messages here"}
          </p>
        </div>
      </div>
    </div>
  );
};

export type ConversationScrollButtonProps = ComponentProps<typeof Button>;

export const ConversationScrollButton = ({
  className,
  ...props
}: ConversationScrollButtonProps) => {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  const handleScrollToBottom = useCallback(() => {
    void scrollToBottom();
  }, [scrollToBottom]);

  return (
    !isAtBottom && (
      <Button
        className={cn(
          "bg-background dark:bg-background absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full shadow-md",
          className,
        )}
        onClick={handleScrollToBottom}
        size="icon"
        type="button"
        variant="outline"
        {...props}
      >
        <ArrowDownIcon className="size-4" />
      </Button>
    )
  );
};
