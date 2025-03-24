"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { JournalEntry } from "@/types/journal";
import { useTrades } from "@/hooks/useTrades";
import { Trade } from "@/types/trade";

interface JournalEntryDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  entry: JournalEntry | null;
  onSave: (entry: JournalEntry) => void;
  template?: any;
  moodOptions?: Array<{value: string, label: string, emoji: string}>;
}

export function JournalEntryDialog({ isOpen, setIsOpen, entry, onSave, template, moodOptions = [] }: JournalEntryDialogProps) {
  const { trades } = useTrades();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [content, setContent] = useState("");
  const [marketConditions, setMarketConditions] = useState("");
  const [sentiment, setSentiment] = useState<"bullish" | "bearish" | "neutral">("neutral");
  const [lessons, setLessons] = useState("");
  const [relatedTradeIds, setRelatedTradeIds] = useState<string[]>([]);
  const [tags, setTags] = useState<string>("");
  const [mood, setMood] = useState<string>("none");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");
  
  // Reset form when entry changes
  useEffect(() => {
    if (entry) {
      setTitle(entry.title);
      setDate(new Date(entry.date));
      setContent(entry.content);
      setMarketConditions(entry.marketConditions || "");
      setSentiment(entry.sentiment || "neutral");
      setLessons(entry.lessons || "");
      setRelatedTradeIds(entry.relatedTradeIds || []);
      setTags((entry.tags || []).join(", "));
      setMood(entry.mood || "none");
      setSelectedTemplate(entry.template || "none");
    } else {
      // Default values for new entry
      setTitle("");
      setDate(new Date());
      setContent(template ? template.content : "");
      setMarketConditions("");
      setSentiment("neutral");
      setLessons("");
      setRelatedTradeIds([]);
      setTags("");
      setMood("none");
      setSelectedTemplate(template ? template.id : "none");
    }
  }, [entry, isOpen, template]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedTags = tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
    
    const journalEntry: JournalEntry = {
      id: entry?.id || "",
      date: date.toISOString(),
      title,
      content,
      marketConditions: marketConditions || undefined,
      sentiment: sentiment as "bullish" | "bearish" | "neutral",
      lessons: lessons || undefined,
      relatedTradeIds: relatedTradeIds.length > 0 ? relatedTradeIds : undefined,
      tags: formattedTags.length > 0 ? formattedTags : undefined,
      mood: mood !== "none" ? mood : undefined,
      template: selectedTemplate !== "none" ? selectedTemplate : undefined,
      createdAt: entry?.createdAt || "",
      updatedAt: entry?.updatedAt || "",
    };
    
    onSave(journalEntry);
  };
  
  // Find trades that occurred on the selected date
  const tradesOnSelectedDate = trades.filter(trade => {
    const tradeDate = new Date(trade.entryDate);
    return (
      tradeDate.getFullYear() === date.getFullYear() &&
      tradeDate.getMonth() === date.getMonth() &&
      tradeDate.getDate() === date.getDate()
    );
  });
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit Journal Entry" : "New Journal Entry"}</DialogTitle>
          <DialogDescription>
            Record your thoughts, market conditions, and lessons learned.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry title"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 z-[100000]">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(date) => date && setDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Journal Entry</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your thoughts, observations, and reflections..."
              className="min-h-32 font-mono text-sm"
              required
            />
          </div>
          
          {/* Mood and Sentiment Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mood Selection */}
            <div className="space-y-2">
              <Label>Trading Mood</Label>
              <Select value={mood} onValueChange={setMood}>
                <SelectTrigger>
                  <SelectValue placeholder="How did you feel while trading?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not specified</SelectItem>
                  {moodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span>{option.emoji}</span>
                        <span>{option.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Market Sentiment */}
            <div className="space-y-2">
              <Label>Market Sentiment</Label>
              <RadioGroup 
                value={sentiment} 
                onValueChange={(value) => setSentiment(value as "bullish" | "bearish" | "neutral")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bullish" id="bullish" />
                  <Label htmlFor="bullish" className="cursor-pointer">Bullish</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bearish" id="bearish" />
                  <Label htmlFor="bearish" className="cursor-pointer">Bearish</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="neutral" id="neutral" />
                  <Label htmlFor="neutral" className="cursor-pointer">Neutral</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Journal Template</Label>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
                <SelectItem value="pre-market">Pre-Market Plan</SelectItem>
                <SelectItem value="post-trade">Trade Analysis</SelectItem>
                <SelectItem value="reflection">Daily Reflection</SelectItem>
                <SelectItem value="weekly">Weekly Review</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Templates help structure your journal entries
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="marketConditions">Market Conditions</Label>
            <Textarea
              id="marketConditions"
              value={marketConditions}
              onChange={(e) => setMarketConditions(e.target.value)}
              placeholder="Describe overall market conditions, trends, or important events..."
              className="min-h-20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="lessons">Lessons Learned</Label>
            <Textarea
              id="lessons"
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              placeholder="What did you learn today? What would you do differently next time?"
              className="min-h-20"
            />
          </div>
          
          {tradesOnSelectedDate.length > 0 && (
            <div className="space-y-2">
              <Label>Related Trades on {format(date, "MMM d, yyyy")}</Label>
              <div className="max-h-40 overflow-y-auto rounded-md border p-2">
                {tradesOnSelectedDate.map((trade) => (
                  <div key={trade.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`trade-${trade.id}`}
                      checked={relatedTradeIds.includes(trade.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setRelatedTradeIds([...relatedTradeIds, trade.id]);
                        } else {
                          setRelatedTradeIds(relatedTradeIds.filter(id => id !== trade.id));
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor={`trade-${trade.id}`} className="cursor-pointer text-sm">
                      {trade.symbol} ({trade.direction}) - {trade.quantity} shares at ${trade.entryPrice.toFixed(2)}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas"
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas (e.g., "morning, gap, breakout")
            </p>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Entry</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 