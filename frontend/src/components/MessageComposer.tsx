import { useState, type KeyboardEvent, useRef } from "react";
import { Clock, Languages, Paperclip, Send, Smile, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

export default function MessageComposer({
  onSendMessage,
  onSendFile,
  isTranslating,
  setIsTranslating,
  targetLanguage,
  setTargetLanguage
}: {
  onSendMessage: (text: string, language: string, scheduledFor?: Date) => void,
  onSendFile: (file: File) => void,
  isTranslating: boolean,
  setIsTranslating: (v: boolean) => void,
  targetLanguage: string,
  setTargetLanguage: (v: string) => void
}) {
  const [value, setValue] = useState("");
  const [scheduledFor, setScheduledFor] = useState<Date | undefined>(undefined);
  const [customTime, setCustomTime] = useState("12:00");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const send = () => {
    if (!value.trim()) return;
    onSendMessage(value, targetLanguage, scheduledFor);
    setValue("");
    setScheduledFor(undefined);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="border-t border-border bg-background px-6 py-4 md:px-12">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-border bg-card shadow-soft transition-colors focus-within:border-primary/40">
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            rows={2}
            placeholder="Write a message… (Enter to send, Shift + Enter for newline)"
            className="block w-full resize-none rounded-t-2xl bg-transparent px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onSendFile(e.target.files[0]);
                e.target.value = ''; 
              }
            }} 
          />

          <div className="flex items-center justify-between gap-2 px-2 pb-2">
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Attach file</TooltipContent>
              </Tooltip>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  >
                    <Smile className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  side="top" 
                  align="start" 
                  className="w-auto p-0 border-none bg-transparent shadow-none mb-4"
                >
                  <EmojiPicker onEmojiClick={(e) => setValue(v => v + e.emoji)} theme={Theme.AUTO} />
                </PopoverContent>
              </Popover>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsTranslating(!isTranslating)}
                    className={cn(
                      "h-8 gap-1.5 rounded-full px-3 text-xs transition-colors",
                      isTranslating
                        ? "bg-primary/10 text-primary hover:bg-primary/15"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Languages className="h-3.5 w-3.5" />
                    Translate
                    <span
                      className={cn(
                        "ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                        isTranslating
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isTranslating ? "ON" : "OFF"}
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Auto-translate incoming and outgoing messages</TooltipContent>
              </Tooltip>

              {isTranslating && (
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger className="h-8 w-[100px] text-xs bg-transparent border-border">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Spanish">Spanish</SelectItem>
                    <SelectItem value="French">French</SelectItem>
                    <SelectItem value="German">German</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Japanese">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <Popover>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className={cn(
                          "h-8 gap-1.5 rounded-full px-3 text-xs transition-colors",
                          scheduledFor 
                            ? "bg-primary/10 text-primary hover:bg-primary/15" 
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Clock className="h-3.5 w-3.5" />
                        {scheduledFor ? "Scheduled" : "Schedule"}
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent>Schedule message delivery</TooltipContent>
                </Tooltip>
                <PopoverContent side="top" align="center" className="w-[280px] p-4 border-border shadow-soft mb-2">
                  <div className="space-y-4">
                    <div className="pb-3 border-b border-border">
                      <h4 className="font-medium text-sm text-foreground mb-1">Schedule Message</h4>
                      <p className="text-xs text-muted-foreground">Pick a time to send this message.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" size="sm" className="h-8 justify-start text-[10px] font-normal" onClick={() => {
                        const d = new Date(); d.setMinutes(d.getMinutes() + 5);
                        setScheduledFor(d);
                      }}>
                        <Clock className="mr-1.5 h-3 w-3" /> In 5 mins
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 justify-start text-[10px] font-normal" onClick={() => {
                        const d = new Date(); d.setHours(d.getHours() + 1);
                        setScheduledFor(d);
                      }}>
                        <Clock className="mr-1.5 h-3 w-3" /> In 1 hour
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 justify-start text-[10px] font-normal" onClick={() => {
                        const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
                        setScheduledFor(d);
                      }}>
                        <Calendar className="mr-1.5 h-3 w-3" /> Tomorrow 9am
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 justify-start text-[10px] font-normal" onClick={() => {
                        const d = new Date(); d.setDate(d.getDate() + 2); d.setHours(9, 0, 0, 0);
                        setScheduledFor(d);
                      }}>
                        <Calendar className="mr-1.5 h-3 w-3" /> In 2 days
                      </Button>
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Custom Time</p>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-muted/30 border-border h-9 text-xs",
                              !scheduledFor && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {scheduledFor ? format(scheduledFor, "PPP at p") : <span>Pick a date & time</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-border shadow-soft" align="start">
                          <div className="p-3">
                            <CalendarComponent
                              mode="single"
                              selected={scheduledFor || undefined}
                              onSelect={(date) => {
                                if (date) {
                                  const [hours, minutes] = customTime.split(':');
                                  date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
                                  setScheduledFor(date);
                                }
                              }}
                              initialFocus
                            />
                            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                              <span className="text-xs font-medium">Time</span>
                              <input 
                                type="time"
                                value={customTime}
                                onChange={(e) => {
                                  setCustomTime(e.target.value);
                                  if (scheduledFor) {
                                    const d = new Date(scheduledFor);
                                    const [h, m] = e.target.value.split(':');
                                    d.setHours(parseInt(h, 10), parseInt(m, 10));
                                    setScheduledFor(new Date(d));
                                  }
                                }}
                                className="bg-background border border-border rounded px-2 py-1 text-xs focus:ring-1 focus:ring-primary outline-none"
                              />
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>

                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-border mt-2">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setScheduledFor(undefined)}>Clear</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={send}
              disabled={!value.trim()}
              className="h-8 gap-1.5 rounded-full px-4"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </Button>
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          Messages are end-to-end encrypted. Only you and your contact can read them.
        </p>
      </div>
    </div>
  );
}
