"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from "date-fns";
import { JournalEntry, JournalImage } from "@/types/journal";
import { useTrades } from "@/hooks/useTrades";
import { Trade } from "@/types/trade";
import { DatePicker } from "./DatePicker";
import { TrendingUp, TrendingDown, Minus, LineChart, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TradeChartWidget } from "../trades/TradeChartWidget";
import { ImageUpload } from "./ImageUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DialogSafeSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/dialog-safe-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type TradingMood = "confident" | "frustrated" | "anxious" | "neutral" | "excited" | "disappointed" | "tilting";

const moodEmojis: Record<TradingMood, string> = {
  confident: "😎",
  frustrated: "😤",
  anxious: "😰",
  neutral: "😐",
  excited: "🤩",
  disappointed: "😔",
  tilting: "😫"
};

const moodLabels: Record<TradingMood, string> = {
  confident: "Confident",
  frustrated: "Frustrated",
  anxious: "Anxious",
  neutral: "Neutral",
  excited: "Excited",
  disappointed: "Disappointed",
  tilting: "Tilting"
};

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
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [images, setImages] = useState<JournalImage[]>([]);
  const [activeTab, setActiveTab] = useState<string>("content");
  
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
      setImages(entry.images || []);
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
      setImages([]);
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
      images: images.length > 0 ? images : undefined,
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
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-4 md:p-6">
        <DialogHeader>
          <DialogTitle className="text-xl">{entry ? "Edit Journal Entry" : "New Journal Entry"}</DialogTitle>
          <DialogDescription>
            Record your thoughts, market conditions, and lessons learned.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entry title"
                required
                className="h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Date</Label>
              <DatePicker date={date} setDate={setDate} />
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="content">Journal Content</TabsTrigger>
              <TabsTrigger value="images">Chart Images</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="space-y-4">
              <div className="space-y-3">
                <Label htmlFor="content">Journal Entry</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your thoughts, observations, and reflections..."
                  className="min-h-52 font-mono text-sm"
                  required
                />
              </div>
              
              {/* Mood and Sentiment Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Mood Selection */}
                <div className="space-y-3">
                  <Label>Trading Mood</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(moodEmojis).map(([key, emoji]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setMood(key)}
                        className={cn(
                          "flex flex-col items-center justify-center h-20 rounded-md border-2 transition-all",
                          mood === key
                            ? "bg-primary/10 border-primary dark:bg-primary/20"
                            : "border-muted hover:border-primary/50 hover:bg-primary/5 dark:hover:bg-primary/10"
                        )}
                      >
                        <span className="text-2xl mb-1">{emoji}</span>
                        <span className={cn(
                          "font-medium text-sm",
                          mood === key ? "text-primary" : "text-muted-foreground"
                        )}>
                          {moodLabels[key as TradingMood]}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Market Sentiment */}
                <div className="space-y-3">
                  <Label>Market Sentiment</Label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setSentiment("bullish")}
                      className={cn(
                        "flex flex-col items-center justify-center h-20 rounded-md border-2 transition-all",
                        sentiment === "bullish"
                          ? "bg-green-50 border-green-600 dark:bg-green-950/30 dark:border-green-500"
                          : "border-muted hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950/20"
                      )}
                    >
                      <TrendingUp className={cn(
                        "h-8 w-8 mb-1",
                        sentiment === "bullish" ? "text-green-600" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "font-medium",
                        sentiment === "bullish" ? "text-green-600" : "text-muted-foreground"
                      )}>
                        Bullish
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSentiment("neutral")}
                      className={cn(
                        "flex flex-col items-center justify-center h-20 rounded-md border-2 transition-all", 
                        sentiment === "neutral"
                          ? "bg-amber-50 border-amber-600 dark:bg-amber-950/30 dark:border-amber-500"
                          : "border-muted hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                      )}
                    >
                      <Minus className={cn(
                        "h-8 w-8 mb-1",
                        sentiment === "neutral" ? "text-amber-600" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "font-medium",
                        sentiment === "neutral" ? "text-amber-600" : "text-muted-foreground"
                      )}>
                        Neutral
                      </span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setSentiment("bearish")}
                      className={cn(
                        "flex flex-col items-center justify-center h-20 rounded-md border-2 transition-all",
                        sentiment === "bearish"
                          ? "bg-red-50 border-red-600 dark:bg-red-950/30 dark:border-red-500"
                          : "border-muted hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-950/20"
                      )}
                    >
                      <TrendingDown className={cn(
                        "h-8 w-8 mb-1",
                        sentiment === "bearish" ? "text-red-600" : "text-muted-foreground"
                      )} />
                      <span className={cn(
                        "font-medium",
                        sentiment === "bearish" ? "text-red-600" : "text-muted-foreground"
                      )}>
                        Bearish
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="images" className="space-y-4">
              <ImageUpload 
                images={images} 
                onChange={setImages} 
              />
            </TabsContent>
          </Tabs>
          
          {/* Template Selection */}
          <div className="space-y-3">
            <Label htmlFor="template">Journal Template</Label>
            <DialogSafeSelect
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
                <SelectItem value="pre-market">Pre-Market Plan</SelectItem>
                <SelectItem value="post-trade">Trade Analysis</SelectItem>
                <SelectItem value="reflection">Daily Reflection</SelectItem>
                <SelectItem value="weekly">Weekly Review</SelectItem>
              </SelectContent>
            </DialogSafeSelect>
          </div>
          
          {/* Tags Input */}
          <div className="space-y-3">
            <Label htmlFor="tags">Tags</Label>
            <Input 
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas (e.g. breakout, long, psychology)"
              className="h-10"
            />
            <p className="text-xs text-muted-foreground">
              Tags help you categorize and find related journal entries later.
            </p>
          </div>
          
          {/* Related Trades */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Related Trades</Label>
              
              {tradesOnSelectedDate.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Found {tradesOnSelectedDate.length} trades on {format(date, "MMM d, yyyy")}
                </p>
              )}
            </div>
            
            <div className="max-h-40 overflow-y-auto border rounded-md p-1">
              {tradesOnSelectedDate.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No trades found for the selected date
                </p>
              ) : (
                <div className="space-y-1">
                  {tradesOnSelectedDate.map(trade => (
                    <div 
                      key={trade.id} 
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => {
                        // Toggle the selection of this trade
                        if (relatedTradeIds.includes(trade.id)) {
                          setRelatedTradeIds(relatedTradeIds.filter(id => id !== trade.id));
                        } else {
                          setRelatedTradeIds([...relatedTradeIds, trade.id]);
                        }
                      }}
                    >
                      <input 
                        type="checkbox" 
                        checked={relatedTradeIds.includes(trade.id)}
                        onChange={(e) => {
                          e.stopPropagation(); // Stop event from bubbling to parent div
                          // Toggle the selection directly
                          if (e.target.checked) {
                            setRelatedTradeIds([...relatedTradeIds, trade.id]);
                          } else {
                            setRelatedTradeIds(relatedTradeIds.filter(id => id !== trade.id));
                          }
                        }}
                        className="h-4 w-4 cursor-pointer"
                      />
                      <div className="flex-grow truncate">
                        <span className={cn(
                          "font-medium",
                          trade.direction === "long" ? "text-green-600" : "text-red-600"
                        )}>
                          {trade.direction === "long" ? "LONG" : "SHORT"}
                        </span>{" "}
                        <span className="font-mono">{trade.symbol}</span>{" "}
                        <span className="text-muted-foreground">
                          @ {trade.entryPrice}
                        </span>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTrade(trade);
                          setIsChartOpen(true);
                        }}
                      >
                        <LineChart className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Lessons Learned */}
          <div className="space-y-3">
            <Label htmlFor="lessons">Key Lessons & Takeaways</Label>
            <Textarea
              id="lessons"
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              placeholder="What did you learn from this trading session? What would you do differently next time?"
              className="h-24"
            />
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Save Entry</Button>
          </DialogFooter>
        </form>
      </DialogContent>
      
      {/* TradeChart Dialog */}
      <TradeChartWidget
        trade={selectedTrade}
        isOpen={isChartOpen}
        setIsOpen={setIsChartOpen}
      />
    </Dialog>
  );
} 