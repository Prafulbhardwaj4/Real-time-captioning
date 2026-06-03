import { Languages, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  activeView: "captioning" | "translator";
  onChange: (view: "captioning" | "translator") => void;
};

const items = [
  { id: "captioning" as const, label: "Captioning", icon: Mic },
  { id: "translator" as const, label: "Translator", icon: Languages },
];

const AppSidebar = ({ activeView, onChange }: AppSidebarProps) => (
  <aside className="glass flex h-[calc(100vh-2rem)] w-64 shrink-0 flex-col rounded-2xl p-4">
    <div className="border-b border-border/50 px-2 pb-4">
      <p className="text-xs uppercase tracking-[0.22em] text-secondary">Workspace</p>
      <h2 className="mt-3 text-2xl font-display font-bold text-foreground">CaptionAI</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Real-time captioning and translation.
      </p>
    </div>

    <nav className="mt-4 flex flex-col gap-2">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all",
              activeView === item.id
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                activeView === item.id ? "bg-primary/15 text-primary" : "bg-muted/30 text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  </aside>
);

export default AppSidebar;
