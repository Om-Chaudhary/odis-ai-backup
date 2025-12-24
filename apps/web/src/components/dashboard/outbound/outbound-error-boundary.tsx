"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@odis-ai/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@odis-ai/shared/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary for Outbound Discharges
 *
 * Catches errors in the outbound discharge component tree
 * and displays a friendly error message with retry option.
 */
export class OutboundErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // TODO: Log error to monitoring service
    console.error("OutboundErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className="mx-auto mt-8 max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="mx-auto mb-2 h-12 w-12 text-red-500" />
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground text-sm">
              We encountered an error loading the outbound discharges. Please
              try again.
            </p>
            {this.state.error && (
              <p className="text-muted-foreground bg-muted rounded p-2 font-mono text-xs">
                {this.state.error.message}
              </p>
            )}
            <Button onClick={this.handleRetry} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
