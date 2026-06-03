import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRightLeft, Languages, Loader2, Mic, MicOff, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLanguageLabel, LANGUAGE_OPTIONS } from "@/lib/languages";
import { translateText } from "@/lib/sarvam";

type TranslationHistoryItem = {
  id: number;
  sourceText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
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
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
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

const TranslatorView = () => {
  const [sourceLanguage, setSourceLanguage] = useState("en-IN");
  const [targetLanguage, setTargetLanguage] = useState("hi-IN");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState("");
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const selectedSummary = useMemo(
    () => `${getLanguageLabel(sourceLanguage)} to ${getLanguageLabel(targetLanguage)}`,
    [sourceLanguage, targetLanguage],
  );

  useEffect(
    () => () => {
      recognitionRef.current?.stop();
    },
    [],
  );

  const handleTranslate = useCallback(async () => {
    if (!sourceText.trim()) {
      return;
    }

    setIsTranslating(true);
    setError("");

    try {
      const translated = await translateText(sourceText.trim(), sourceLanguage, targetLanguage);
      setTranslatedText(translated);
      setHistory((prev) => [
        {
          id: Date.now(),
          sourceText: sourceText.trim(),
          translatedText: translated,
          sourceLanguage,
          targetLanguage,
        },
        ...prev,
      ]);
    } catch (translationError) {
      console.error("Translation error:", translationError);
      setError("Translation failed. Check the API key and try again.");
    } finally {
      setIsTranslating(false);
    }
  }, [sourceLanguage, sourceText, targetLanguage]);

  const handleVoiceInput = useCallback(() => {
    const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!RecognitionCtor) {
      setError("This browser does not support voice input for translation. Use Google Chrome on desktop.");
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new RecognitionCtor();
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let finalText = "";
        let liveText = "";

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result[0]?.transcript?.trim() || "";

          if (!transcript) {
            continue;
          }

          if (result.isFinal) {
            finalText += `${transcript} `;
          } else {
            liveText += `${transcript} `;
          }
        }

        if (finalText.trim()) {
          setSourceText((prev) => `${prev} ${finalText}`.trim());
        }

        setInterimText(liveText.trim());
      };

      recognition.onerror = () => {
        setError("Voice input failed. Please try again.");
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText("");
      };

      recognitionRef.current = recognition;
    }

    recognitionRef.current.lang = sourceLanguage;
    setError("");
    setIsListening(true);

    try {
      recognitionRef.current.start();
    } catch (startError) {
      console.error("Voice input start failed:", startError);
      setError("Voice input is already starting. Wait a moment and try again.");
      setIsListening(false);
    }
  }, [sourceLanguage]);

  const stopVoiceInput = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceText(translatedText || sourceText);
    setTranslatedText("");
    setError("");
  };

  const clearAll = () => {
    setSourceText("");
    setTranslatedText("");
    setInterimText("");
    setError("");
    setHistory([]);
    stopVoiceInput();
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <section className="glass rounded-2xl p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-secondary">
                Final Year Project
              </p>
              <h1 className="text-3xl font-display font-bold md:text-5xl">Live Translator</h1>
              <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                Translate text or voice input across the supported Indian languages.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3 md:justify-end">
              <label className="min-w-44">
                <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Source Language
                </span>
                <select
                  value={sourceLanguage}
                  onChange={(event) => setSourceLanguage(event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground outline-none transition focus:ring-1 focus:ring-primary/50"
                >
                  {LANGUAGE_OPTIONS.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>

              <Button variant="outline" size="icon" onClick={swapLanguages} className="h-10 w-10 self-end">
                <ArrowRightLeft />
              </Button>

              <label className="min-w-44">
                <span className="mb-2 block text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  Target Language
                </span>
                <select
                  value={targetLanguage}
                  onChange={(event) => setTargetLanguage(event.target.value)}
                  className="h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground outline-none transition focus:ring-1 focus:ring-primary/50"
                >
                  {LANGUAGE_OPTIONS.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mode</p>
              <p className="mt-2 text-lg font-semibold">Text and Voice</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Language Pair</p>
              <p className="mt-2 text-lg font-semibold">{selectedSummary}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">History</p>
              <p className="mt-2 text-lg font-semibold">{history.length} items</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-display font-semibold">Input</h2>
                <p className="text-sm text-muted-foreground">
                  Speak or type the text you want to translate.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={isListening ? "destructive" : "outline"}
                  size="icon"
                  onClick={isListening ? stopVoiceInput : handleVoiceInput}
                  className="h-10 w-10"
                >
                  {isListening ? <MicOff /> : <Mic />}
                </Button>
                <Button variant="outline" onClick={clearAll} className="h-10">
                  <RotateCcw />
                  Clear
                </Button>
              </div>
            </div>

            <textarea
              value={sourceText}
              onChange={(event) => setSourceText(event.target.value)}
              placeholder="Enter text here or use the microphone..."
              className="mt-4 min-h-[220px] w-full rounded-xl border border-border/60 bg-black/20 px-4 py-4 text-base text-foreground outline-none transition focus:ring-1 focus:ring-primary/50"
            />

            {interimText && (
              <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                Listening: {interimText}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive-foreground">
                {error}
              </div>
            )}

            <Button
              variant="hero"
              onClick={handleTranslate}
              disabled={!sourceText.trim() || isTranslating}
              className="mt-4 h-10 min-w-40"
            >
              {isTranslating ? (
                <>
                  <Loader2 className="animate-spin" />
                  Translating
                </>
              ) : (
                <>
                  <Languages />
                  Translate
                </>
              )}
            </Button>
          </div>

          <div className="flex flex-col gap-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-display font-semibold">Output</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The translated text appears here.
              </p>
              <div className="mt-4 min-h-[220px] rounded-xl border border-border/60 bg-black/20 p-4 text-base leading-7 text-foreground">
                {translatedText || "Translate any text to see the result here."}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-display font-semibold">Recent Translations</h2>
              <div className="mt-4 max-h-[220px] space-y-3 overflow-y-auto pr-1">
                {history.length ? (
                  history.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSourceLanguage(item.sourceLanguage);
                        setTargetLanguage(item.targetLanguage);
                        setSourceText(item.sourceText);
                        setTranslatedText(item.translatedText);
                      }}
                      className="w-full rounded-xl border border-border/60 bg-muted/20 p-4 text-left transition hover:bg-muted/30"
                    >
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {getLanguageLabel(item.sourceLanguage)} to {getLanguageLabel(item.targetLanguage)}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm text-foreground">{item.sourceText}</p>
                      <p className="mt-2 line-clamp-2 text-sm text-secondary">{item.translatedText}</p>
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                    No translation history yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default TranslatorView;
