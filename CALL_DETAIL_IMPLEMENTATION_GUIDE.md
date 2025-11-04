# Call Detail Page - Implementation Guide

**Project**: Odis AI - Retell AI Call Management System
**Technology**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
**Purpose**: Step-by-step implementation guidance for developers

---

## Table of Contents

1. [Project Setup](#project-setup)
2. [Component Architecture](#component-architecture)
3. [Server Actions](#server-actions)
4. [Component Specifications](#component-specifications)
5. [State Management](#state-management)
6. [Styling Guide](#styling-guide)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Checklist](#deployment-checklist)

---

## Project Setup

### 1.1 File Structure

Create the following directory structure:

```
src/
├── app/
│   └── dashboard/
│       └── calls/
│           ├── layout.tsx           (existing)
│           ├── page.tsx             (existing - calls list)
│           ├── [callId]/
│           │   ├── page.tsx         (NEW - call detail page)
│           │   └── loading.tsx      (NEW - loading skeleton)
│           └── send/
│               └── page.tsx         (existing)
│
├── components/
│   ├── call-detail/
│   │   ├── CallDetailPage.tsx       (Container component)
│   │   ├── CallDetailHeader.tsx     (Header with back button)
│   │   ├── CallInfoCard.tsx         (Call metadata card)
│   │   ├── AudioPlayer.tsx          (Custom audio player)
│   │   ├── TranscriptDisplay.tsx    (Transcript with search)
│   │   ├── CallAnalysisCard.tsx     (Analysis metrics)
│   │   ├── StatusIndicator.tsx      (Live polling indicator)
│   │   └── index.ts                 (Barrel export)
│   │
│   └── ui/
│       └── (existing shadcn components)
│
├── server/
│   └── actions/
│       ├── retell.ts               (existing - updated with getCallDetails)
│       └── call-polling.ts         (NEW - polling logic)
│
├── lib/
│   ├── formatting.ts               (NEW - format helpers)
│   ├── audio-utils.ts              (NEW - audio helpers)
│   └── call-types.ts               (NEW - type definitions)
│
└── hooks/
    ├── useCallDetail.ts            (NEW - custom hook for call data)
    ├── useAudioPlayer.ts           (NEW - audio player logic)
    └── useCallPolling.ts           (NEW - polling logic)
```

### 1.2 Dependencies Check

Verify these are already installed (check package.json):

```
✓ next@^15.2.3
✓ react@^19.0.0
✓ typescript@^5.8.2
✓ tailwindcss@^4.0.15
✓ @radix-ui/* (various)
✓ shadcn@^3.4.2
✓ lucide-react@^0.545.0
✓ sonner@^2.0.7
✓ date-fns@^4.1.0
✓ retell-sdk@^4.56.0
✓ zod@^3.25.76
```

No additional dependencies needed. Use built-in APIs for audio handling.

### 1.3 TypeScript Configuration

Ensure tsconfig.json has strict mode enabled (already enabled):

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "moduleResolution": "Bundler"
  }
}
```

---

## Component Architecture

### 2.1 Component Hierarchy

```
CallDetailPage (Server Component)
├── CallDetailHeader (Client Component)
│   ├── Back Button
│   ├── Status Badge
│   ├── Phone Display
│   └── Timestamp + Live Indicator
│
├── Main Content Container (2-column on desktop)
│   │
│   ├── LEFT COLUMN (60%)
│   │   ├── CallInfoCard (Client Component)
│   │   │   ├── Duration
│   │   │   ├── Agent Info
│   │   │   ├── Call Direction
│   │   │   ├── From/To Numbers
│   │   │   ├── Expandable Variables
│   │   │   └── Expandable Metadata
│   │   │
│   │   └── TranscriptDisplay (Client Component)
│   │       ├── Search Bar
│   │       ├── Message List
│   │       └── Copy/Download Actions
│   │
│   └── RIGHT COLUMN (40%)
│       ├── AudioPlayer (Client Component)
│       │   ├── Play/Pause Button
│       │   ├── Progress Bar
│       │   ├── Time Display
│       │   ├── Volume Control
│       │   ├── Speed Control
│       │   └── Download Button
│       │
│       ├── CallAnalysisCard (Client Component)
│       │   ├── Summary
│       │   ├── Sentiment Badge
│       │   ├── Success Indicator
│       │   ├── Voicemail Indicator
│       │   └── Custom Metrics
│       │
│       └── Metadata Panel (Client Component)
│           ├── Agent Details
│           ├── Cost Info
│           └── Latency Metrics
│
└── StatusIndicator (Client Component - Polling)
    ├── Loading State
    ├── Refresh Button
    └── Last Updated Time
```

### 2.2 Server vs Client Components

**Server Component** (`page.tsx`):

- Initial data fetching from Retell API
- Page structure and metadata
- No interactive state
- Can access environment variables

**Client Components** (all in `components/call-detail/`):

- Audio player (HTML5 audio element)
- Real-time polling
- Search/filter functionality
- Interactive buttons and controls
- Form inputs
- Toast notifications

Use "use client" directive on all interactive components.

---

## Server Actions

### 3.1 Get Call Details Action

**File**: `src/server/actions/retell.ts` (update existing)

```typescript
"use server";

import Retell from "retell-sdk";
import { cache } from "react";

const getRetellClient = () => {
  if (!process.env.RETELL_API_KEY) {
    throw new Error("RETELL_API_KEY is not configured");
  }
  return new Retell({ apiKey: process.env.RETELL_API_KEY });
};

// Server component initial load
// Cached for the same call within same request
export const getCallDetails = cache(async (callId: string) => {
  try {
    const client = getRetellClient();
    const call = await client.call.retrieve(callId);

    return {
      success: true,
      call,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching call details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      call: null,
    };
  }
});

// For polling - fresh data without cache
export const pollCallDetails = async (callId: string) => {
  try {
    const client = getRetellClient();
    const call = await client.call.retrieve(callId);

    return {
      success: true,
      call,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error polling call details:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      call: null,
    };
  }
};
```

### 3.2 Export Call Action (Optional)

```typescript
"use server";

export const exportCallTranscript = async (
  callId: string,
  format: "txt" | "pdf" | "json",
) => {
  try {
    const client = getRetellClient();
    const call = await client.call.retrieve(callId);

    if (!call.transcript) {
      return {
        success: false,
        error: "No transcript available for export",
      };
    }

    // Format based on requested type
    let content = "";
    let filename = `call-${callId}`;

    switch (format) {
      case "txt":
        content = formatTranscriptAsText(call);
        filename += ".txt";
        break;
      case "json":
        content = JSON.stringify(call, null, 2);
        filename += ".json";
        break;
      case "pdf":
        // Would require PDF library - consider adding later
        return {
          success: false,
          error: "PDF export not yet implemented",
        };
    }

    return {
      success: true,
      content,
      filename,
    };
  } catch (error) {
    console.error("Error exporting transcript:", error);
    return {
      success: false,
      error: "Failed to export transcript",
    };
  }
};

const formatTranscriptAsText = (call: any): string => {
  let text = `Call Transcript\n`;
  text += `Call ID: ${call.call_id}\n`;
  text += `Date: ${new Date(call.start_timestamp).toLocaleString()}\n`;
  text += `Duration: ${formatDuration(call.duration_ms)}\n`;
  text += `=====================================\n\n`;

  if (call.transcript_object) {
    call.transcript_object.forEach((item: any) => {
      const speaker = item.role === "agent" ? "Agent" : "User";
      text += `[${speaker}]\n`;
      text += `${item.content}\n\n`;
    });
  } else if (call.transcript) {
    text += call.transcript;
  }

  return text;
};
```

---

## Component Specifications

### 4.1 Call Detail Page (Server Component)

**File**: `src/app/dashboard/calls/[callId]/page.tsx`

```typescript
// Server component structure
import { notFound } from 'next/navigation';
import { getCallDetails } from '~/server/actions/retell';
import CallDetailPage from '~/components/call-detail/CallDetailPage';

interface Params {
  params: Promise<{ callId: string }>;
}

export async function generateMetadata({ params }: Params) {
  const { callId } = await params;

  return {
    title: `Call ${callId} | Odis AI`,
    description: 'View detailed call information and transcript',
  };
}

export default async function Page({ params }: Params) {
  const { callId } = await params;

  // Validate call ID format
  if (!callId || callId.length < 5) {
    notFound();
  }

  // Initial data fetch
  const result = await getCallDetails(callId);

  if (!result.success || !result.call) {
    notFound();
  }

  // Pass data to client component
  return <CallDetailPage initialCall={result.call} />;
}
```

### 4.2 Call Detail Page Container (Client Component)

**File**: `src/components/call-detail/CallDetailPage.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { CallDetail } from '~/lib/call-types';
import { useCallPolling } from '~/hooks/useCallPolling';
import CallDetailHeader from './CallDetailHeader';
import CallInfoCard from './CallInfoCard';
import AudioPlayer from './AudioPlayer';
import TranscriptDisplay from './TranscriptDisplay';
import CallAnalysisCard from './CallAnalysisCard';

interface CallDetailPageProps {
  initialCall: CallDetail;
}

export default function CallDetailPage({ initialCall }: CallDetailPageProps) {
  const [call, setCall] = useState<CallDetail>(initialCall);
  const [isPolling, setIsPolling] = useState(false);

  // Setup polling for ongoing calls
  const { data: polledData, isLoading: isPollingLoading } = useCallPolling(
    initialCall.call_id,
    initialCall.call_status === 'ongoing'
  );

  // Update call data when polling returns new data
  useEffect(() => {
    if (polledData) {
      setCall(polledData);
    }
  }, [polledData]);

  useEffect(() => {
    setIsPolling(isPollingLoading);
  }, [isPollingLoading]);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <CallDetailHeader
        call={call}
        isPolling={isPolling}
      />

      {/* Main Content - 2 Column Layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Call Info Card */}
          <CallInfoCard call={call} />

          {/* Transcript Section */}
          <TranscriptDisplay
            transcript={call.transcript_object}
            plainTranscript={call.transcript}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Audio Player */}
          <AudioPlayer
            recordingUrl={call.recording_url}
            callDuration={call.duration_ms}
            isLoading={call.call_status === 'ongoing' && !call.recording_url}
          />

          {/* Analysis Card */}
          <CallAnalysisCard analysis={call.call_analysis} />

          {/* Metadata Panel */}
          <MetadataPanel call={call} />
        </div>
      </div>
    </div>
  );
}

// Metadata Panel Component
function MetadataPanel({ call }: { call: CallDetail }) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white/90 p-4 shadow-xl backdrop-blur-md">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Metadata</h3>

      <div className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-slate-700">Agent</p>
          <p className="font-mono text-slate-600">{call.agent_name}</p>
        </div>

        <div>
          <p className="font-medium text-slate-700">Call ID</p>
          <p className="truncate font-mono text-slate-600">{call.call_id}</p>
        </div>

        {call.call_cost && (
          <div>
            <p className="font-medium text-slate-700">Cost</p>
            <p className="text-slate-600">
              ${(call.call_cost.combined! / 100).toFixed(2)}
            </p>
          </div>
        )}

        {call.latency?.e2e?.p95 && (
          <div>
            <p className="font-medium text-slate-700">Latency (p95)</p>
            <p className="text-slate-600">{call.latency.e2e.p95}ms</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

### 4.3 Call Detail Header Component

**File**: `src/components/call-detail/CallDetailHeader.tsx`

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Calendar, Clock } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { CallDetail } from '~/lib/call-types';
import { formatPhoneNumber, formatDate } from '~/lib/formatting';
import { getStatusColor } from '~/lib/formatting';

interface CallDetailHeaderProps {
  call: CallDetail;
  isPolling?: boolean;
}

export default function CallDetailHeader({
  call,
  isPolling,
}: CallDetailHeaderProps) {
  const router = useRouter();

  const handleCopyPhone = async () => {
    await navigator.clipboard.writeText(call.to_number);
    // Show toast notification
  };

  return (
    <div className="space-y-4">
      {/* Back Button Row */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="gap-2 hover:bg-emerald-50"
          aria-label="Return to calls list"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Info Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          {/* Status Badge */}
          <Badge
            variant="outline"
            className={getStatusColor(call.call_status)}
          >
            {call.call_status.replace('_', ' ')}
          </Badge>

          {/* Phone Number */}
          <div
            className="flex cursor-pointer items-center gap-2 font-mono text-lg font-semibold text-slate-900 hover:text-emerald-600"
            onClick={handleCopyPhone}
            role="button"
            tabIndex={0}
          >
            {formatPhoneNumber(call.to_number)}
          </div>
        </div>

        {/* Right Side - Timestamp & Live Indicator */}
        <div className="flex flex-col items-start gap-1 text-sm sm:items-end">
          <div className="flex items-center gap-1 text-slate-600">
            <Calendar className="h-4 w-4" />
            {formatDate(new Date(call.start_timestamp).toISOString())}
          </div>

          {call.call_status === 'ongoing' && isPolling && (
            <div className="flex items-center gap-2 text-emerald-600">
              <div className="relative h-2 w-2 rounded-full bg-emerald-600">
                <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-600" />
              </div>
              <span className="text-xs font-medium">Live</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 4.4 Audio Player Component

**File**: `src/components/call-detail/AudioPlayer.tsx`

```typescript
'use client';

import { useRef, useState, useEffect } from 'react';
import { Play, Pause, Download, Volume2, Zap, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { useAudioPlayer } from '~/hooks/useAudioPlayer';
import { formatDuration } from '~/lib/formatting';

interface AudioPlayerProps {
  recordingUrl?: string;
  callDuration?: number;
  isLoading?: boolean;
}

export default function AudioPlayer({
  recordingUrl,
  callDuration,
  isLoading,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackSpeed,
    handlePlay,
    handlePause,
    handleSeek,
    handleVolumeChange,
    handleSpeedChange,
    handleDownload,
  } = useAudioPlayer(audioRef, recordingUrl);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-6 min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        <p className="text-center text-sm text-slate-600">
          Recording in progress... Check back shortly
        </p>
      </div>
    );
  }

  // Not available state
  if (!recordingUrl) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-orange-200 bg-orange-50/50 p-6 min-h-[200px]">
        <AlertCircle className="h-6 w-6 text-orange-500" />
        <p className="text-center text-sm text-orange-700">
          Recording not yet available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200/60 bg-white/90 p-4 shadow-xl backdrop-blur-md">
      <h3 className="text-lg font-semibold text-slate-900">Audio Recording</h3>

      <audio
        ref={audioRef}
        src={recordingUrl}
        preload="metadata"
        crossOrigin="anonymous"
        onEnded={() => handlePause()}
      />

      {/* Play/Pause + Progress Bar */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={isPlaying ? handlePause : handlePlay}
          className="h-12 w-12 rounded-full bg-gradient-to-r from-[#31aba3] to-[#10b981] p-0 text-white hover:scale-110 hover:from-[#2a9a92] hover:to-[#0d9488]"
          aria-label={isPlaying ? 'Pause recording' : 'Play recording'}
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 ml-1" />
          )}
        </Button>

        {/* Progress Bar */}
        <div className="flex flex-1 items-center gap-2">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="h-1.5 flex-1 appearance-none rounded-full bg-slate-300/50"
            style={{
              background: `linear-gradient(to right, #31aba3 0%, #10b981 100%) 0 / ${
                duration ? (currentTime / duration) * 100 : 0
              }% 100% no-repeat, #cbd5e1`,
            }}
            aria-label="Seek to time"
          />
        </div>
      </div>

      {/* Time Display + Controls */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-slate-600">
          {formatDuration(currentTime)} / {formatDuration(duration || 0)}
        </span>

        <div className="flex items-center gap-2">
          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-slate-600" />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="h-1 w-16 appearance-none rounded-full bg-slate-300/50"
              aria-label="Volume"
            />
          </div>

          {/* Speed Control */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-xs"
            onClick={() =>
              handleSpeedChange(
                playbackSpeed === 1 ? 1.5 : playbackSpeed === 1.5 ? 2 : 1
              )
            }
            aria-label="Playback speed"
          >
            <Zap className="h-4 w-4" />
            {playbackSpeed}x
          </Button>

          {/* Download Button */}
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={handleDownload}
            aria-label="Download recording"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 4.5 Transcript Display Component

**File**: `src/components/call-detail/TranscriptDisplay.tsx`

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, X, Copy, Download } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Badge } from '~/components/ui/badge';
import { toast } from 'sonner';

interface TranscriptUtterance {
  role: 'agent' | 'user';
  content: string;
  timestamp?: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
  }>;
}

interface TranscriptDisplayProps {
  transcript?: TranscriptUtterance[];
  plainTranscript?: string;
}

export default function TranscriptDisplay({
  transcript,
  plainTranscript,
}: TranscriptDisplayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredTranscript, setFilteredTranscript] = useState<TranscriptUtterance[]>(
    transcript || []
  );
  const [activeFilterRole, setActiveFilterRole] = useState<'all' | 'agent' | 'user'>('all');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Update filtered transcript when search or filter changes
  useEffect(() => {
    let filtered = transcript || [];

    // Filter by role
    if (activeFilterRole !== 'all') {
      filtered = filtered.filter((item) => item.role === activeFilterRole);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((item) =>
        item.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTranscript(filtered);
  }, [searchQuery, activeFilterRole, transcript]);

  const handleCopyTranscript = async () => {
    const text = plainTranscript || filteredTranscript
      .map((item) => `[${item.role.toUpperCase()}] ${item.content}`)
      .join('\n');

    await navigator.clipboard.writeText(text);
    toast.success('Transcript copied to clipboard');
  };

  const handleDownloadTranscript = async () => {
    const text = plainTranscript || filteredTranscript
      .map((item) => `[${item.role.toUpperCase()}] ${item.content}`)
      .join('\n');

    const element = document.createElement('a');
    element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
    element.setAttribute('download', 'transcript.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success('Transcript downloaded');
  };

  if (!transcript && !plainTranscript) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Transcript
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-center">
            <p className="mb-2 text-lg font-semibold text-slate-700">
              No transcript available
            </p>
            <p className="text-slate-500">
              Transcript will appear once call is complete
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          <CardTitle>Transcript</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyTranscript}
              aria-label="Copy transcript"
            >
              <Copy className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:inline">Copy</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadTranscript}
              aria-label="Download transcript"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:ml-2 sm:inline">Download</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search transcript..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex gap-2">
          {(['all', 'agent', 'user'] as const).map((role) => (
            <Badge
              key={role}
              variant={activeFilterRole === role ? 'default' : 'outline'}
              onClick={() => setActiveFilterRole(role)}
              className="cursor-pointer"
            >
              {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
          ))}
        </div>

        {/* Transcript Messages */}
        <div
          ref={scrollContainerRef}
          className="max-h-[500px] space-y-4 overflow-y-auto"
        >
          {filteredTranscript.length === 0 ? (
            <p className="text-center text-slate-500">No messages found</p>
          ) : (
            filteredTranscript.map((item, index) => (
              <TranscriptMessage key={index} message={item} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function TranscriptMessage({
  message,
}: {
  message: TranscriptUtterance;
}) {
  const isAgent = message.role === 'agent';

  return (
    <div
      className={`rounded-lg border-l-4 p-3 ${
        isAgent
          ? 'border-emerald-500 bg-emerald-50/50'
          : 'border-slate-500 bg-slate-50/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-1 flex-shrink-0 rounded-md p-2 ${
            isAgent ? 'bg-emerald-100' : 'bg-slate-100'
          }`}
        >
          {isAgent ? (
            <span className="text-xs font-semibold text-emerald-700">Agent</span>
          ) : (
            <span className="text-xs font-semibold text-slate-700">User</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="break-words text-sm text-slate-800">
            {message.content}
          </p>
          {message.timestamp && (
            <p className="mt-1 text-xs text-slate-500">
              {formatTimestamp(message.timestamp)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimestamp(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
```

---

## State Management

### 5.1 Custom Hooks

**File**: `src/hooks/useAudioPlayer.ts`

```typescript
import { useRef, useState, useCallback, useEffect } from "react";

export const useAudioPlayer = (
  audioRef: React.RefObject<HTMLAudioElement>,
  src?: string,
) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 1.5 | 2>(1);

  const handlePlay = useCallback(() => {
    audioRef.current?.play();
    setIsPlaying(true);
  }, [audioRef]);

  const handlePause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, [audioRef]);

  const handleSeek = useCallback(
    (time: number) => {
      if (audioRef.current) {
        audioRef.current.currentTime = time;
        setCurrentTime(time);
      }
    },
    [audioRef],
  );

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      if (audioRef.current) {
        audioRef.current.volume = newVolume / 100;
        setVolume(newVolume);
      }
    },
    [audioRef],
  );

  const handleSpeedChange = useCallback(
    (speed: 1 | 1.5 | 2) => {
      if (audioRef.current) {
        audioRef.current.playbackRate = speed;
        setPlaybackSpeed(speed);
      }
    },
    [audioRef],
  );

  const handleDownload = useCallback(() => {
    if (src) {
      const a = document.createElement("a");
      a.href = src;
      a.download = `recording.mp3`;
      a.click();
    }
  }, [src]);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", () => setIsPlaying(true));
    audio.addEventListener("pause", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioRef]);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackSpeed,
    handlePlay,
    handlePause,
    handleSeek,
    handleVolumeChange,
    handleSpeedChange,
    handleDownload,
  };
};
```

**File**: `src/hooks/useCallPolling.ts`

```typescript
import { useEffect, useState, useCallback } from "react";
import { pollCallDetails } from "~/server/actions/retell";
import { CallDetail } from "~/lib/call-types";

export const useCallPolling = (
  callId: string,
  shouldPoll: boolean,
  interval: number = 3000,
) => {
  const [data, setData] = useState<CallDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await pollCallDetails(callId);

      if (result.success && result.call) {
        setData(result.call);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [callId]);

  useEffect(() => {
    if (!shouldPoll) return;

    // Initial fetch
    void fetchData();

    // Setup polling interval
    const timer = setInterval(() => {
      void fetchData();
    }, interval);

    return () => clearInterval(timer);
  }, [shouldPoll, callId, interval, fetchData]);

  return { data, isLoading, error };
};
```

---

## Styling Guide

### 6.1 Tailwind Classes Reference

Key classes used throughout components:

```
Colors:
  text-slate-900, text-slate-700, text-slate-600, text-slate-500
  bg-white/90, bg-emerald-50, bg-slate-50/50
  border-slate-200/60, border-emerald-200, border-emerald-500

Spacing:
  gap-2, gap-3, gap-4, gap-6
  p-3, p-4, p-6
  px-4, py-3
  mb-2, mb-4, mb-6

Layout:
  flex, flex-col, flex-row
  grid, grid-cols-1, lg:grid-cols-[1fr_400px]
  rounded-lg, rounded-xl
  w-full, h-full, min-h-[...]

Shadows & Borders:
  shadow-xl, shadow-md, shadow-sm
  border, border-l-4
  rounded-xl, rounded-lg

Typography:
  font-mono, font-medium, font-semibold
  text-sm, text-base, text-lg, text-xl
  leading-relaxed, leading-tight
```

### 6.2 Custom Gradient Button

```tailwind
class="bg-gradient-to-r from-[#31aba3] to-[#10b981] text-white hover:scale-105 hover:from-[#2a9a92] hover:to-[#0d9488] transition-all duration-200"
```

### 6.3 Glass Morphism Cards

```tailwind
class="border-slate-200/60 bg-white/90 shadow-xl backdrop-blur-md rounded-xl"
```

---

## Testing Strategy

### 7.1 Unit Test Examples

**Test AudioPlayer Hook**:

```typescript
import { renderHook, act } from "@testing-library/react";
import { useAudioPlayer } from "~/hooks/useAudioPlayer";

describe("useAudioPlayer", () => {
  let audioRef: React.RefObject<HTMLAudioElement>;

  beforeEach(() => {
    audioRef = { current: new Audio() };
  });

  it("should handle play/pause", () => {
    const { result } = renderHook(() =>
      useAudioPlayer(audioRef, "https://example.com/audio.mp3"),
    );

    expect(result.current.isPlaying).toBe(false);

    act(() => {
      result.current.handlePlay();
    });

    expect(result.current.isPlaying).toBe(true);
  });

  it("should update volume", () => {
    const { result } = renderHook(() =>
      useAudioPlayer(audioRef, "https://example.com/audio.mp3"),
    );

    act(() => {
      result.current.handleVolumeChange(50);
    });

    expect(result.current.volume).toBe(50);
    expect(audioRef.current?.volume).toBe(0.5);
  });
});
```

### 7.2 Component Test Examples

**Test TranscriptDisplay**:

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TranscriptDisplay from '~/components/call-detail/TranscriptDisplay';

describe('TranscriptDisplay', () => {
  const mockTranscript = [
    {
      role: 'agent' as const,
      content: 'Hello, how can I help?',
    },
    {
      role: 'user' as const,
      content: 'I need to check my order status',
    },
  ];

  it('should render transcript messages', () => {
    render(<TranscriptDisplay transcript={mockTranscript} />);

    expect(screen.getByText('Hello, how can I help?')).toBeInTheDocument();
    expect(screen.getByText('I need to check my order status')).toBeInTheDocument();
  });

  it('should filter by search query', async () => {
    const user = userEvent.setup();
    render(<TranscriptDisplay transcript={mockTranscript} />);

    const input = screen.getByPlaceholderText('Search transcript...');
    await user.type(input, 'order');

    expect(screen.getByText('I need to check my order status')).toBeInTheDocument();
    expect(screen.queryByText('Hello, how can I help?')).not.toBeInTheDocument();
  });
});
```

### 7.3 Integration Tests

```typescript
// Test full page flow
import { render, screen, waitFor } from '@testing-library/react';
import CallDetailPage from '~/components/call-detail/CallDetailPage';

describe('Call Detail Page', () => {
  const mockCall = {
    call_id: 'call_123',
    call_status: 'ended' as const,
    to_number: '+14157774444',
    duration_ms: 154000,
    transcript_object: [...],
    recording_url: 'https://example.com/recording.mp3',
    // ... other required fields
  };

  it('should render all sections', () => {
    render(<CallDetailPage initialCall={mockCall} />);

    expect(screen.getByText('Audio Recording')).toBeInTheDocument();
    expect(screen.getByText('Transcript')).toBeInTheDocument();
    expect(screen.getByText('Call Analysis')).toBeInTheDocument();
  });

  it('should poll for updates when call is ongoing', async () => {
    const ongoingCall = { ...mockCall, call_status: 'ongoing' as const };

    render(<CallDetailPage initialCall={ongoingCall} />);

    await waitFor(
      () => {
        expect(screen.getByText('Live')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});
```

---

## Deployment Checklist

### 8.1 Pre-Deployment

- [ ] All components created and tested
- [ ] TypeScript compilation passes (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)
- [ ] No console errors or warnings
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] Mobile responsiveness tested on multiple devices
- [ ] Audio playback tested with multiple browsers
- [ ] Polling logic tested with network throttling
- [ ] Error states tested and displaying correctly
- [ ] Toast notifications working
- [ ] Server actions tested
- [ ] Environment variables configured

### 8.2 Performance Checklist

- [ ] Lighthouse score > 90 on mobile
- [ ] LCP < 2.5 seconds
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Audio loaded via preload="metadata"
- [ ] Polling interval optimized (3 seconds)
- [ ] No layout shifts during loading
- [ ] Images/assets optimized
- [ ] Code splitting applied where needed
- [ ] Database queries optimized

### 8.3 Security Checklist

- [ ] API key not exposed in client code
- [ ] Server actions used for sensitive operations
- [ ] CORS headers configured for audio streaming
- [ ] Input validation on search/filter
- [ ] XSS prevention (React built-in)
- [ ] CSRF protection (Next.js default)
- [ ] Rate limiting on polling
- [ ] Error messages don't leak sensitive info

### 8.4 Documentation

- [ ] Component documentation complete
- [ ] API integration documented
- [ ] Polling behavior documented
- [ ] State management documented
- [ ] Testing strategy documented
- [ ] Known limitations documented
- [ ] Future enhancements listed

### 8.5 Monitoring

- [ ] Error logging configured
- [ ] User analytics tracking
- [ ] Performance monitoring (Web Vitals)
- [ ] API call tracking
- [ ] Audio playback failures monitored
- [ ] Polling failures monitored
- [ ] Toast notifications logged

---

## Summary

This implementation guide provides:

1. **Complete file structure** for organizing code
2. **Detailed component specifications** with code examples
3. **Server actions** for data fetching and polling
4. **Custom hooks** for reusable logic
5. **Styling guidelines** with Tailwind classes
6. **Testing strategies** with code examples
7. **Deployment checklist** to ensure quality

Follow this guide sequentially to build a robust, accessible, and performant Call Detail Page for the Retell AI system.

**Estimated Development Time**:

- Phase 1 (Structure & Layout): 4-6 hours
- Phase 2 (Core Components): 6-8 hours
- Phase 3 (Analysis & Polling): 4-6 hours
- Phase 4 (Testing & Polish): 4-6 hours
- **Total**: 18-26 hours (2-3 days)

**Key Success Criteria**:

- ✓ All components render correctly
- ✓ Audio playback works smoothly
- ✓ Polling updates call data in real-time
- ✓ Transcript search and filter functional
- ✓ Accessibility audit passes WCAG 2.1 AA
- ✓ Mobile responsive on all devices
- ✓ Error states handled gracefully
- ✓ Performance targets met
