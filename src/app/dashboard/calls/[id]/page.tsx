"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Download,
  Clock,
  Calendar,
  Phone,
  User,
  Tag,
  RefreshCw,
  MessageSquare,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Slider } from "~/components/ui/slider";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "~/components/ui/conversation";
import {
  Message,
  MessageContent,
  MessageAvatar,
} from "~/components/ui/message";
import { Orb } from "~/components/ui/orb";
import {
  fetchCall,
  refreshCallStatus,
  type CallDetailResponse,
  type TranscriptTurn,
} from "~/server/actions/retell";

export default function CallDetailPage() {
  const params = useParams();
  const router = useRouter();
  const callId = params.id as string;

  const [callData, setCallData] = useState<CallDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isPolling, setIsPolling] = useState(false);

  // Audio player state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [audioLoading, setAudioLoading] = useState(false);

  // Find active message based on audio current time
  const activeMessageIndex = useMemo(() => {
    if (!callData?.transcript_object || currentTime === 0) return -1;

    // Find the message that contains the current playback time
    for (let i = 0; i < callData.transcript_object.length; i++) {
      const turn = callData.transcript_object[i];
      if (!turn?.words || turn.words.length === 0) continue;

      const firstWord = turn.words[0];
      const lastWord = turn.words[turn.words.length - 1];
      if (!firstWord || !lastWord) continue;

      const startTime = firstWord.start;
      const endTime = lastWord.end;

      if (currentTime >= startTime && currentTime <= endTime) {
        return i;
      }
    }
    return -1;
  }, [callData?.transcript_object, currentTime]);

  // Fetch call data
  useEffect(() => {
    async function loadCall() {
      try {
        setLoading(true);
        const result = await fetchCall(callId);

        if (result.success && result.data) {
          setCallData(result.data);
          setLastUpdated(new Date());
        } else {
          setError(result.error ?? "Failed to load call");
        }
      } catch (err) {
        setError("An unexpected error occurred");
        console.error("Error loading call:", err);
      } finally {
        setLoading(false);
      }
    }

    void loadCall();
  }, [callId]);

  // Status polling for in-progress calls
  useEffect(() => {
    if (!callData) return;

    const shouldPoll = ["in_progress", "ringing"].includes(callData.status);
    setIsPolling(shouldPoll);

    if (!shouldPoll) return;

    const pollInterval = setInterval(() => {
      void (async () => {
        try {
          const result = await refreshCallStatus(callId);

          if (result.success && result.data) {
            setCallData((prev) =>
              prev
                ? {
                    ...prev,
                    status: result.data.status,
                    duration_seconds: result.data.duration_seconds,
                  }
                : null,
            );
            setLastUpdated(new Date());

            // Stop polling if status changed to terminal state
            if (!["in_progress", "ringing"].includes(result.data.status)) {
              setIsPolling(false);
            }
          }
        } catch (err) {
          console.error("Error polling status:", err);
        }
      })();
    }, 5000);

    return () => clearInterval(pollInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callData?.status, callId]);

  // Audio player controls
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadStart = () => setAudioLoading(true);
    const handleCanPlay = () => setAudioLoading(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
        setIsPlaying(false);
      });
    }
    // Note: isPlaying state will be updated by the play/pause event listeners
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    const seekTime = value[0];
    if (!audio || seekTime === undefined) return;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    const newVolume = value[0];
    if (!audio || newVolume === undefined) return;
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume ?? 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const changePlaybackRate = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const rates = [1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length] ?? 1;

    audio.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const seekToMessage = (turn: TranscriptTurn) => {
    const audio = audioRef.current;
    if (!audio || !turn.words || turn.words.length === 0) return;

    const firstWord = turn.words[0];
    if (!firstWord) return;

    // Seek to the start of this message
    audio.currentTime = firstWord.start;
    setCurrentTime(firstWord.start);

    // Auto-play if not already playing
    if (!isPlaying) {
      audio.play().catch((err) => {
        console.error("Error playing audio:", err);
      });
      // Note: isPlaying state will be updated by the play event listener
    }
  };

  const downloadRecording = () => {
    if (!callData?.recording_url) return;

    const link = document.createElement("a");
    link.href = callData.recording_url;
    link.download = `call-${callData.retell_call_id}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: "bg-emerald-100 text-emerald-800 border-emerald-300",
      in_progress: "bg-blue-100 text-blue-800 border-blue-300",
      ringing: "bg-yellow-100 text-yellow-800 border-yellow-300",
      failed: "bg-red-100 text-red-800 border-red-300",
      cancelled: "bg-gray-100 text-gray-800 border-gray-300",
      initiated: "bg-gray-100 text-gray-800 border-gray-300",
    };
    return colors[status] ?? "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getSentimentColor = (sentiment: string) => {
    const colors: Record<string, string> = {
      positive: "text-emerald-600",
      neutral: "text-gray-600",
      negative: "text-red-600",
    };
    return colors[sentiment.toLowerCase()] ?? "text-gray-600";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-1/4 rounded bg-gray-200"></div>
            <div className="h-64 rounded bg-gray-200"></div>
            <div className="h-96 rounded bg-gray-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !callData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="mx-auto max-w-6xl">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="text-red-800">Error Loading Call</CardTitle>
              <CardDescription className="text-red-600">
                {error}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="hover:bg-gray-200"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="bg-gradient-to-r from-[#31aba3] to-[#10b981] bg-clip-text text-3xl font-bold text-transparent">
                Call Details
              </h1>
              <p className="mt-1 text-gray-600">
                {callData.phone_number_pretty ?? callData.phone_number}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isPolling && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Updating...
              </div>
            )}
            <Badge
              className={`${getStatusColor(callData.status)} border px-3 py-1`}
            >
              {callData.status.replace("_", " ").toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Last Updated */}
        <div className="text-right text-xs text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>

        {/* Call Information */}
        <Card className="border-gray-200 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-[#31aba3]/10 to-[#10b981]/10">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-[#31aba3]" />
              Call Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 pt-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    Phone Number
                  </p>
                  <p className="text-lg font-semibold">
                    {callData.phone_number_pretty ?? callData.phone_number}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="text-lg font-semibold">
                    {formatDuration(callData.duration_seconds)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Call Time</p>
                  <p className="text-lg font-semibold">
                    {formatDate(callData.created_at)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Call ID</p>
                  <p className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
                    {callData.retell_call_id}
                  </p>
                </div>
              </div>

              {callData.call_variables &&
                Object.keys(callData.call_variables).length > 0 && (
                  <div className="flex items-start gap-3">
                    <Tag className="mt-0.5 h-5 w-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="mb-2 text-sm font-medium text-gray-500">
                        Variables
                      </p>
                      <div className="space-y-1">
                        {Object.entries(callData.call_variables).map(
                          ([key, value]) => (
                            <div
                              key={key}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-600">{key}:</span>
                              <span className="font-medium">{value}</span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>

        {/* Audio Player */}
        {callData.recording_url ? (
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-[#31aba3]/10 to-[#10b981]/10">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-[#31aba3]" />
                  Call Recording
                </span>
                <Button
                  onClick={downloadRecording}
                  variant="outline"
                  size="sm"
                  className="border-[#31aba3] text-[#31aba3] hover:bg-[#31aba3]/10"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <audio
                ref={audioRef}
                src={callData.recording_url}
                preload="metadata"
              />

              {audioLoading && (
                <div className="py-8 text-center text-gray-500">
                  Loading audio...
                </div>
              )}

              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="space-y-2">
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Play/Pause */}
                    <Button
                      onClick={togglePlayPause}
                      size="lg"
                      className="h-14 w-14 rounded-full bg-gradient-to-r from-[#31aba3] to-[#10b981] text-white hover:from-[#2a948d] hover:to-[#0ea370]"
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6" fill="currentColor" />
                      ) : (
                        <Play className="ml-1 h-6 w-6" fill="currentColor" />
                      )}
                    </Button>

                    {/* Volume */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={toggleMute}
                        variant="ghost"
                        size="icon"
                        className="hover:bg-gray-200"
                      >
                        {isMuted ? (
                          <VolumeX className="h-5 w-5" />
                        ) : (
                          <Volume2 className="h-5 w-5" />
                        )}
                      </Button>
                      <Slider
                        value={[isMuted ? 0 : volume]}
                        max={1}
                        step={0.01}
                        onValueChange={handleVolumeChange}
                        className="w-24"
                      />
                    </div>
                  </div>

                  {/* Playback Speed */}
                  <Button
                    onClick={changePlaybackRate}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 font-mono hover:bg-gray-100"
                  >
                    {playbackRate}x
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-gray-400" />
                Call Recording
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center text-gray-500">
                {callData.status === "in_progress" ||
                callData.status === "ringing" ? (
                  <p>Recording will be available after the call ends</p>
                ) : (
                  <p>No recording available for this call</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interactive Conversation Timeline */}
        {callData.transcript_object && callData.transcript_object.length > 0 ? (
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-[#31aba3]/10 to-[#10b981]/10">
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-[#31aba3]" />
                Conversation Timeline
              </CardTitle>
              <CardDescription>
                Click on any message to jump to that point in the recording
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Conversation className="h-[600px]">
                <ConversationContent>
                  {callData.transcript_object.length === 0 ? (
                    <ConversationEmptyState
                      icon={<MessageSquare className="h-12 w-12" />}
                      title="No conversation recorded"
                      description="The transcript will appear here once the call is processed"
                    />
                  ) : (
                    callData.transcript_object.map((turn, index) => {
                      const isAgent = turn.role === "agent";
                      const isActive = index === activeMessageIndex;

                      return (
                        <Message
                          key={index}
                          from={isAgent ? "assistant" : "user"}
                          className={`cursor-pointer transition-all duration-200 ${
                            isActive
                              ? "bg-emerald-50/30 ring-2 ring-emerald-500 ring-offset-2"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={() => seekToMessage(turn)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              seekToMessage(turn);
                            }
                          }}
                          aria-label={`${isAgent ? "Agent" : "User"} message: ${turn.content}`}
                        >
                          <MessageAvatar
                            src={
                              isAgent
                                ? "/odis-logo.png"
                                : "https://api.dicebear.com/7.x/avataaars/svg?seed=user"
                            }
                            name={isAgent ? "AI" : "User"}
                          />
                          <MessageContent
                            variant="contained"
                            className="relative"
                          >
                            {/* Show animated orb for agent messages when active */}
                            {isAgent && isActive && isPlaying && (
                              <div className="mb-2 flex justify-center">
                                <Orb
                                  className="h-16 w-16"
                                  agentState="talking"
                                  colors={["#31aba3", "#10b981"]}
                                  volumeMode="manual"
                                  manualOutput={isMuted ? 0 : 0.5}
                                />
                              </div>
                            )}
                            <p className="text-sm leading-relaxed">
                              {turn.content}
                            </p>
                            {/* Show timestamp if available */}
                            {turn.words && turn.words.length > 0 && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {formatTime(turn.words[0]?.start ?? 0)}
                                </span>
                              </div>
                            )}
                          </MessageContent>
                        </Message>
                      );
                    })
                  )}
                </ConversationContent>
                <ConversationScrollButton />
              </Conversation>
            </CardContent>
          </Card>
        ) : (
          callData.transcript && (
            <Card className="border-gray-200 shadow-lg">
              <CardHeader className="border-b bg-gradient-to-r from-[#31aba3]/10 to-[#10b981]/10">
                <CardTitle>Call Transcript</CardTitle>
                <CardDescription>
                  Structured conversation timeline not available
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose max-w-none">
                  <div className="rounded-lg bg-gray-50 p-6 font-mono text-sm whitespace-pre-wrap">
                    {callData.transcript}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        )}

        {/* Call Analysis */}
        {callData.call_analysis && (
          <Card className="border-gray-200 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-[#31aba3]/10 to-[#10b981]/10">
              <CardTitle>Call Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              {callData.call_analysis.call_summary && (
                <div>
                  <h3 className="mb-2 text-lg font-semibold">Summary</h3>
                  <p className="leading-relaxed text-gray-700">
                    {callData.call_analysis.call_summary}
                  </p>
                </div>
              )}

              <div className="grid gap-4 border-t pt-4 md:grid-cols-2">
                {callData.call_analysis.user_sentiment && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-500">
                      User Sentiment
                    </p>
                    <p
                      className={`text-lg font-semibold capitalize ${getSentimentColor(callData.call_analysis.user_sentiment)}`}
                    >
                      {callData.call_analysis.user_sentiment}
                    </p>
                  </div>
                )}

                {callData.call_analysis.in_voicemail !== undefined && (
                  <div>
                    <p className="mb-1 text-sm font-medium text-gray-500">
                      Voicemail
                    </p>
                    <p className="text-lg font-semibold">
                      {callData.call_analysis.in_voicemail ? "Yes" : "No"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
