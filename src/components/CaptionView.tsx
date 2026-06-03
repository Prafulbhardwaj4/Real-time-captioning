import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Mic, MicOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLanguageLabel, LANGUAGE_OPTIONS } from "@/lib/languages";

type CaptionEntry = {
  id: number;
  text: string;
  createdAt: string;
};

type SpeechRecognitionResultLike = {
  isFinal: boolean;
  0: {
    transcript: string;
  };
};

type SpeechRecognitionEventLike = Event & {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
};

type SpeechRecognitionErrorEventLike = Event & {
  error: string;
  message?: string;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

const RESTART_DELAY_MS = 250;

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const getRecognitionErrorMessage = (error: string) => {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Microphone permission was denied. Allow microphone access and try again.";
  }

  if (error === "no-speech") {
    return "No speech detected. Keep the mic close and continue speaking.";
  }

  if (error === "audio-capture") {
    return "No microphone was detected. Check your input device.";
  }

  if (error === "network") {
    return "Speech recognition lost connection for a moment. It will try to continue.";
  }

  return "Speech recognition stopped unexpectedly. It will try to continue.";
};

const CaptionView = () => {
  const [isListening, setIsListening] = useState(false);
  const [liveCaption, setLiveCaption] = useState("");
  const [captionHistory, setCaptionHistory] = useState<CaptionEntry[]>([]);
  const [error, setError] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldContinueRef = useRef(false);
  const manuallyStoppedRef = useRef(false);

  const fullTranscript = useMemo(
    () => captionHistory.map((entry) => entry.text).join("\n"),
    [captionHistory],
  );

  const stopRecognition = useCallback(() => {
    shouldContinueRef.current = false;
    manuallyStoppedRef.current = true;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => stopRecognition, [stopRecognition]);

  const appendFinalCaption = useCallback((text: string) => {
    const cleaned = text.trim();
    if (!cleaned) {
      return;
    }

    setCaptionHistory((prev) => {
      if (prev[prev.length - 1]?.text === cleaned) {
        return prev;
      }

      return [
        ...prev,
        {
          id: Date.now() + Math.floor(Math.random() * 1000),
          text: cleaned,
          createdAt: new Date().toISOString(),
        },
      ];
    });
  }, []);

  const startRecognition = useCallback(() => {
    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!RecognitionCtor) {
      setIsSupported(false);
      setError("This browser does not support live speech recognition. Use Google Chrome on desktop.");
      return;
    }

    setIsSupported(true);

    if (!recognitionRef.current) {
      const recognition = new RecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;

      recognition.onstart = () => {
        setIsListening(true);
        setError("");
      };

      recognition.onresult = (event) => {
        let interimTranscript = "";

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result[0]?.transcript?.trim() || "";

          if (!transcript) {
            continue;
          }

          if (result.isFinal) {
            appendFinalCaption(transcript);
          } else {
            interimTranscript += `${transcript} `;
          }
        }

        setLiveCaption(interimTranscript.trim());
      };

      recognition.onerror = (event) => {
        setError(getRecognitionErrorMessage(event.error));

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          shouldContinueRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (shouldContinueRef.current && !manuallyStoppedRef.current) {
          window.setTimeout(() => {
            try {
              recognition.start();
            } catch (restartError) {
              console.error("Recognition restart failed:", restartError);
              setError("Speech recognition paused. Press start again to continue.");
              setIsListening(false);
              shouldContinueRef.current = false;
            }
          }, RESTART_DELAY_MS);
          return;
        }

        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    manuallyStoppedRef.current = false;
    shouldContinueRef.current = true;
    setLiveCaption("");
    setError("");
    recognitionRef.current.lang = selectedLanguage;

    try {
      recognitionRef.current.start();
    } catch (startError) {
      console.error("Recognition start failed:", startError);
      setError("Speech recognition is already starting. Wait a moment and try again.");
    }
  }, [appendFinalCaption, selectedLanguage]);

  const clearCaptions = useCallback(() => {
    setLiveCaption("");
    setCaptionHistory([]);
    setError("");
  }, []);

  const copyTranscript = useCallback(async () => {
    if (!fullTranscript.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(fullTranscript);
      setError("");
    } catch (copyError) {
      console.error("Copy error:", copyError);
      setError("Copy failed in this browser. You can still download the transcript.");
    }
  }, [fullTranscript]);

  const downloadTranscript = useCallback(() => {
    if (!fullTranscript.trim()) {
      return;
    }

    const blob = new Blob([fullTranscript], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "captions.txt";
    link.click();
    URL.revokeObjectURL(url);
  }, [fullTranscript]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="glass rounded-2xl p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-secondary">
                Final Year Project
              </p>
              <h1 className="text-3xl font-display font-bold md:text-5xl">
                Real-Time Captioning System
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                Continuous live captioning with a minimal interface built for long-form speaking.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3 md:justify-end">
              <label className="min-w-44">
                <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Language
                </span>
                <select
                  value={selectedLanguage}
                  onChange={(event) => setSelectedLanguage(event.target.value)}
                  disabled={isListening}
                  className="h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground outline-none transition focus:ring-1 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {LANGUAGE_OPTIONS.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>
              <Button
                variant={isListening ? "destructive" : "hero"}
                onClick={isListening ? stopRecognition : startRecognition}
                className="h-10 min-w-40 self-end"
              >
                {isListening ? <MicOff /> : <Mic />}
                {isListening ? "Stop Captioning" : "Start Captioning"}
              </Button>
              <Button
                variant="outline"
                onClick={clearCaptions}
                disabled={!captionHistory.length && !liveCaption}
                className="h-10 self-end"
              >
                <RotateCcw />
                Clear
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Status</p>
              <p className="mt-2 text-lg font-semibold">{isListening ? "Listening" : "Ready"}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Caption Lines</p>
              <p className="mt-2 text-lg font-semibold">{captionHistory.length}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Engine</p>
              <p className="mt-2 text-lg font-semibold">{isSupported ? "Browser Speech" : "Unsupported"}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 md:col-span-3">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Selected Language</p>
              <p className="mt-2 text-lg font-semibold">{getLanguageLabel(selectedLanguage)}</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-display font-semibold">Live Caption</h2>
                <p className="text-sm text-muted-foreground">
                  Final caption lines are saved on the right. The current in-progress speech appears here.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${isListening ? "bg-secondary pulse-glow" : "bg-muted"}`} />
                <span className="text-xs font-medium text-muted-foreground">
                  {isListening ? "Capturing audio" : "Idle"}
                </span>
              </div>
            </div>

            <div className="mt-4 min-h-[320px] rounded-xl border border-border/60 bg-black/20 p-6">
              {liveCaption ? (
                <p className="text-2xl font-medium leading-relaxed md:text-3xl">{liveCaption}</p>
              ) : (
                <div className="flex min-h-[272px] items-center justify-center text-center text-muted-foreground">
                  Press start and begin speaking to see live captions here.
                </div>
              )}
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                {error}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-display font-semibold">Transcript Log</h2>
                <p className="text-sm text-muted-foreground">
                  Finalized caption lines from the full session.
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={copyTranscript} disabled={!fullTranscript.trim()}>
                  <Copy />
                </Button>
                <Button variant="ghost" size="icon" onClick={downloadTranscript} disabled={!fullTranscript.trim()}>
                  <Download />
                </Button>
              </div>
            </div>

            <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {captionHistory.length ? (
                captionHistory
                  .slice()
                  .reverse()
                  .map((entry) => (
                    <div key={entry.id} className="rounded-xl border border-border/60 bg-muted/20 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {formatTime(entry.createdAt)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-foreground">{entry.text}</p>
                    </div>
                  ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  No captions recorded yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default CaptionView;
