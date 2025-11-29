"use client";

import type { ComponentProps } from "react";
import { useCallback } from "react";
import { ArrowDownIcon, type LucideIcon, MessageSquare } from "lucide-react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import { EmptyState } from "~/components/dashboard/empty-state";

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

  // Convert ReactNode title/description to string if needed
  const titleText =
    typeof title === "string"
      ? title
      : title && typeof title === "object"
        ? "No messages yet" // React element or object, use default
        : title != null
          ? String(title)
          : "No messages yet";
  const descriptionText =
    typeof description === "string"
      ? description
      : description && typeof description === "object"
        ? "Start a conversation to see messages here" // React element or object, use default
        : description != null
          ? String(description)
          : "Start a conversation to see messages here";

  return (
    <EmptyState
      icon={IconComponent}
      title={titleText}
      description={descriptionText}
      size="md"
      className={cn("size-full", className)}
      {...props}
    />
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
