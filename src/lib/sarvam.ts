const SARVAM_API_KEY = import.meta.env.VITE_SARVAM_API_KEY;
const CHAT_URL = "https://api.sarvam.ai/v1/chat/completions";
const TRANSLATE_URL = "https://api.sarvam.ai/translate";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const requireApiKey = () => {
  if (!SARVAM_API_KEY) {
    throw new Error("Missing VITE_SARVAM_API_KEY in your environment.");
  }
};

export const translateText = async (
  input: string,
  sourceLanguageCode: string,
  targetLanguageCode: string,
) => {
  requireApiKey();

  const response = await fetch(TRANSLATE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": SARVAM_API_KEY,
    },
    body: JSON.stringify({
      input,
      source_language_code: sourceLanguageCode,
      target_language_code: targetLanguageCode,
      model: "mayura:v1",
      mode: "formal",
      numerals_format: "international",
    }),
  });

  if (!response.ok) {
    throw new Error(`Translate API error: ${response.status}`);
  }

  const data = await response.json();
  return (
    data.translated_text ||
    data.translatedText ||
    data.translation ||
    data.translated ||
    data.output?.translated_text ||
    data.output?.translatedText ||
    data.output?.translation ||
    ""
  );
};

const getLastUserMessage = (messages: ChatMessage[]) =>
  [...messages].reverse().find((message) => message.role === "user")?.content.trim() || "";

const normalizeQuestion = (question: string) =>
  question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const hasAnyTerm = (text: string, terms: string[]) => terms.some((term) => text.includes(term));

const getLocalAssistantReply = (question: string) => {
  const q = normalizeQuestion(question);

  if (
    hasAnyTerm(q, [
      "what is this project",
      "about this project",
      "about project",
      "captionai",
      "captonai",
      "captnai",
      "project overview",
      "overview",
      "project",
    ])
  ) {
    return "This project is a real-time captioning and translation system with a support chatbot. It is built as a final year project focused on accessibility and multilingual communication.";
  }

  if (
    hasAnyTerm(q, [
      "caption",
      "captions",
      "captioning",
      "captoin",
      "capshun",
      "speech recognition",
      "speech recogniton",
      "live text",
      "live caption",
      "caption flow",
      "captions flow",
    ])
  ) {
    return "The captioning module uses browser speech recognition for long continuous live captions. It shows the current speech in the live caption area and stores finalized lines in the transcript log.";
  }

  if (
    hasAnyTerm(q, [
      "translator",
      "translater",
      "translation",
      "translate",
      "traslate",
      "transaltion",
      "translation flow",
    ])
  ) {
    return "The translator module supports typed input and voice input. It uses source and target language selection and sends the text to the Sarvam translation API to produce the translated output.";
  }

  if (
    hasAnyTerm(q, [
      "chatbot",
      "chat bot",
      "chat",
      "assistant",
      "assisstant",
      "bot",
      "popup",
    ])
  ) {
    return "The chatbot is a popup project assistant on the right side of the screen. It is meant to help with demo guidance, feature explanation, and common project questions.";
  }

  if (
    hasAnyTerm(q, [
      "language",
      "languages",
      "langauge",
      "multilingual",
      "multi language",
      "hindi",
      "english",
      "supported languages",
    ])
  ) {
    return "The system supports multiple Indian languages through the shared language configuration. Captioning uses the selected recognition language, while translation uses source and target language choices.";
  }

  if (
    hasAnyTerm(q, [
      "api",
      "apis",
      "sarvam",
      "backend",
      "service",
      "integration",
    ])
  ) {
    return "Sarvam is used for translation and assistant responses. For long live captioning, browser speech recognition is used because it is more stable for continuous sessions in this project.";
  }

  if (
    hasAnyTerm(q, [
      "team",
      "work division",
      "wrk division",
      "contribution",
      "role",
      "roles",
      "who did what",
      "members",
    ])
  ) {
    return "The project work can be divided into AI pipeline and system design, API integration and implementation, UI and research support, and documentation and UX planning.";
  }

  if (
    hasAnyTerm(q, [
      "novelty",
      "defend",
      "defence",
      "presentation",
      "presentaion",
      "viva",
      "faculty",
      "future work",
    ])
  ) {
    return "A safe way to defend the project is to present it as an applied AI system. The contribution is in workflow design, multilingual feature integration, usability, and turning separate AI services into one working product.";
  }

  if (
    hasAnyTerm(q, [
      "tech stack",
      "stack",
      "react",
      "frontend",
      "front end",
      "typescript",
      "vite",
      "technical structure",
      "structure",
      "architecture",
      "workflow",
      "modules",
    ])
  ) {
    return "The frontend is built with React, TypeScript, Vite, Tailwind-style utility classes, and modular components. Features are split into captioning, translator, chatbot, sidebar, and shared utility modules.";
  }

  if (
    hasAnyTerm(q, [
      "report",
      "documentation",
      "paper",
      "research paper",
      "literature review",
    ])
  ) {
    return "The documentation side includes the project report, research paper, literature review, problem statement, and explanation of the system workflow and design choices.";
  }

  if (
    hasAnyTerm(q, [
      "ux",
      "user flow",
      "ui",
      "interface",
      "design",
    ])
  ) {
    return "The UI is designed to stay minimal and focused. Captioning and translation are separated in the sidebar, the chatbot is a popup support feature, and the main controls are kept close to the active workflow.";
  }

  if (
    hasAnyTerm(q, [
      "what can you do",
      "can you do",
      "help",
      "features",
      "modules",
    ])
  ) {
    return "I can explain the project overview, captioning, translator, chatbot, supported languages, APIs, technical structure, team contributions, and presentation defense.";
  }

  if (
    hasAnyTerm(q, [
      "hello",
      "helo",
      "hii",
      "hi",
      "hlo",
      "hey",
    ])
  ) {
    return "Hello. I can help you explain the captioning system, translator, chatbot, presentation answers, and team contributions.";
  }

  if (hasAnyTerm(q, ["thanks", "thank you", "thnks"])) {
    return "You are welcome. Ask me anything about the project, features, or presentation.";
  }

  if (hasAnyTerm(q, ["bye", "goodbye", "ok", "okay"])) {
    return "Alright. I am here if you want another quick project-related answer.";
  }

  return "I can help with the project overview, captioning flow, translator, chatbot, team contributions, presentation defense, and technical structure. Ask me something specific about the project.";
};

const normalizeAssistantContent = (data: any) => {
  const choice = data?.choices?.[0];
  const message = choice?.message;
  const content = message?.content;

  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  return "";
};

export const chatWithAssistant = async (messages: ChatMessage[]) => {
  requireApiKey();
  const lastUserMessage = getLastUserMessage(messages);
  const localReply = getLocalAssistantReply(lastUserMessage);

  try {
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY,
      },
      body: JSON.stringify({
        model: "sarvam-105b",
        temperature: 0.2,
        max_tokens: 256,
        messages,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantText = normalizeAssistantContent(data);

    if (assistantText) {
      return assistantText;
    }
  } catch (error) {
    console.error("Assistant API fallback triggered:", error);
  }

  return localReply;
};
