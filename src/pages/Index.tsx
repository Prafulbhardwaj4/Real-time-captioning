import { useState } from "react";
import AppSidebar from "@/components/AppSidebar";
import CaptionView from "@/components/CaptionView";
import ChatbotWidget from "@/components/ChatbotWidget";
import TranslatorView from "@/components/TranslatorView";

const Index = () => {
  const [activeView, setActiveView] = useState<"captioning" | "translator">("captioning");

  return (
    <div className="min-h-screen bg-background p-4 text-foreground">
      <div className="mx-auto flex max-w-[1600px] gap-4">
        <AppSidebar activeView={activeView} onChange={setActiveView} />
        <div className="min-w-0 flex-1">
          {activeView === "captioning" ? <CaptionView /> : <TranslatorView />}
        </div>
      </div>
      <ChatbotWidget />
    </div>
  );
};

export default Index;
