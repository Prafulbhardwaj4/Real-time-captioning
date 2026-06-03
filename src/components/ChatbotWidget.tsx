import { FormEvent, useMemo, useState } from "react";
import { Bot, Loader2, MessageSquare, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatWithAssistant } from "@/lib/sarvam";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

const SYSTEM_PROMPT =
  "You are a helpful assistant for a final year project called CaptionAI. Keep replies concise, clear, and focused on captioning, translation, accessibility, and demo help.";

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hi, I am your project assistant. Ask me about the captioning system, translator, demo flow, or presentation.",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!canSend) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const assistantReply = await chatWithAssistant([
        { role: "system", content: SYSTEM_PROMPT },
        ...nextMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ]);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: assistantReply,
        },
      ]);
    } catch (chatError) {
      console.error("Chatbot error:", chatError);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          role: "assistant",
          content: "I could not respond right now. Please check the API key and try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-lg transition hover:opacity-90"
        aria-label="Toggle chatbot"
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[540px] w-[380px] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-border/60 bg-card/95 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-foreground">AI Assistant</p>
                <p className="text-sm text-muted-foreground">Project help on demand</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-9 w-9">
              <X />
            </Button>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
                  message.role === "assistant"
                    ? "mr-8 bg-muted/40 text-foreground"
                    : "ml-8 bg-primary/15 text-foreground"
                }`}
              >
                {message.content}
              </div>
            ))}

            {isLoading && (
              <div className="mr-8 flex items-center gap-2 rounded-2xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Thinking...
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="mt-4 flex items-center gap-2 border-t border-border/50 pt-4">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about the project..."
              className="h-11 flex-1 rounded-xl border border-border bg-muted/30 px-4 text-sm text-foreground outline-none transition focus:ring-1 focus:ring-primary/50"
            />
            <Button type="submit" variant="hero" size="icon" className="h-11 w-11" disabled={!canSend}>
              <Send />
            </Button>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatbotWidget;
