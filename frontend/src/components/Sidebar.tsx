import { useState } from "react";
import { Search, Plus, LogOut, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useRef } from "react";

interface Conversation {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread?: number;
  online?: boolean;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  const { user, logout } = useAuth();
  const [q, setQ] = useState("");
  const filtered = conversations.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()),
  );

  const searchRef = useRef<HTMLInputElement>(null);
  const displayName = user?.username ?? user?.email ?? "You";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="flex h-full w-full flex-col bg-sidebar">
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <span className="font-serif text-sm text-primary-foreground">P</span>
          </div>
          <span className="font-serif text-lg text-foreground">Pulse</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => searchRef.current?.focus()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New Chat (Search)</TooltipContent>
        </Tooltip>
      </div>

      <div className="px-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search conversations"
            className="h-9 pl-9"
          />
        </div>
      </div>

      <nav className="mt-4 flex-1 overflow-y-auto px-2 pb-4">
        {filtered.map((c) => {
          const active = c.id === activeId;
          return (
            <button
              key={c.id}
              onClick={() => onSelect(c.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                active
                  ? "bg-sidebar-accent"
                  : "hover:bg-sidebar-accent/60",
              )}
            >
              <div className="relative">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-medium text-accent-foreground">
                  {c.initials}
                </div>
                {c.online && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar bg-primary" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {c.name}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {c.time}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-muted-foreground">
                    {c.lastMessage}
                  </span>
                  {c.unread ? (
                    <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                      {c.unread}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-medium text-primary">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-foreground">
              {displayName}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              End-to-end secured
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Settings (Coming Soon)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sign out</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </aside>
    </TooltipProvider>
  );
}
