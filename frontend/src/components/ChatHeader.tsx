import { Phone, Video, Info, ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export default function ChatHeader({
  name,
  initials,
  online,
  onSummarize,
  onBack
}: {
  name: string;
  initials: string;
  online?: boolean;
  onSummarize?: () => void;
  onBack?: () => void;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-background/80 px-3 md:px-6 py-3 md:py-4 backdrop-blur">
      <div className="flex items-center gap-2 md:gap-3">
        {onBack && (
          <Button onClick={onBack} size="icon" variant="ghost" className="h-9 w-9 md:hidden text-muted-foreground flex-shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="relative flex-shrink-0">
          <div className="flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
            {initials}
          </div>
          {online && (
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary" />
          )}
        </div>
        <div>
          <div className="font-serif text-lg leading-tight text-foreground">{name}</div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            {online ? "Active now · Encrypted" : "Encrypted"}
          </div>
        </div>
      </div>

      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-0 md:gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onSummarize} size="icon" variant="ghost" className="h-8 w-8 md:h-9 md:w-9 text-primary hover:bg-primary/10 hover:text-primary flex-shrink-0">
                <Sparkles className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Smart Catch-Up</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-foreground hidden sm:flex flex-shrink-0">
                <Phone className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voice call (Coming Soon)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-foreground hidden sm:flex flex-shrink-0">
                <Video className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Video call (Coming Soon)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 md:h-9 md:w-9 text-muted-foreground hover:text-foreground flex-shrink-0">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Conversation details (Coming Soon)</TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </header>
  );
}
