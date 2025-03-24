"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, Tag, Activity, Bookmark, BookOpen, Lightbulb, SmilePlus, Pencil, FilterX, FileText, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JournalEntryDialog } from "./JournalEntryDialog";
import { JournalEntry } from "@/types/journal";
import { format, parseISO, isSameMonth, isToday, isYesterday, startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Journal entry templates
const JOURNAL_TEMPLATES = [
  {
    id: "pre-market",
    name: "Pre-Market Plan",
    icon: <FileText className="h-5 w-5" />,
    description: "Plan your trading day before the market opens",
    content: "# Today's Trading Plan\n\n## Market Analysis\n- Overall market sentiment: \n- Key levels to watch: \n- Major news events: \n\n## Watchlist\n- Symbol 1: \n- Symbol 2: \n\n## Trading Goals\n- Focus areas for today: \n- Risk management plan: \n- Maximum loss limit: "
  },
  {
    id: "post-trade",
    name: "Trade Analysis",
    icon: <Activity className="h-5 w-5" />,
    description: "Analyze a specific trade",
    content: "# Trade Analysis\n\n## Trade Details\n- Symbol: \n- Direction: \n- Entry Price: \n- Exit Price: \n- P&L: \n\n## Analysis\n- What worked well: \n- What could have been better: \n- Emotional state during trade: \n\n## Lessons Learned\n- Key takeaways: \n- Action items for next time: "
  },
  {
    id: "reflection",
    name: "Daily Reflection",
    icon: <Lightbulb className="h-5 w-5" />,
    description: "End of day trading reflection",
    content: "# Daily Trading Reflection\n\n## Market Review\n- Overall market action: \n- Sector performance: \n\n## My Performance\n- What went well today: \n- What challenges I faced: \n- Emotional state throughout the day: \n\n## Tomorrow's Preparation\n- Areas to focus on: \n- Trading opportunities: \n- Adjustments to make: "
  },
  {
    id: "weekly",
    name: "Weekly Review",
    icon: <CalendarCheck className="h-5 w-5" />,
    description: "Comprehensive weekly trading review",
    content: "# Weekly Trading Review\n\n## Performance Summary\n- Total P&L: \n- Win rate: \n- Best trade: \n- Worst trade: \n\n## Pattern Recognition\n- What setups worked best: \n- What setups performed poorly: \n- Market conditions that affected my trades: \n\n## Psychological Analysis\n- Overall trading mindset this week: \n- Emotional challenges faced: \n- Mental strengths demonstrated: \n\n## Next Week's Plan\n- Areas to improve: \n- Specific goals: \n- Risk management adjustments: "
  }
];

// Mood tracking options
const MOOD_OPTIONS = [
  { value: "confident", label: "Confident", emoji: "😎" },
  { value: "focused", label: "Focused", emoji: "🧐" },
  { value: "calm", label: "Calm", emoji: "😌" },
  { value: "excited", label: "Excited", emoji: "😃" },
  { value: "anxious", label: "Anxious", emoji: "😰" },
  { value: "frustrated", label: "Frustrated", emoji: "😤" },
  { value: "overwhelmed", label: "Overwhelmed", emoji: "😵" },
  { value: "distracted", label: "Distracted", emoji: "🤔" }
];

export function JournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  // Load journal entries from localStorage
  useEffect(() => {
    const storedEntries = localStorage.getItem('tradingJournalEntries');
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries));
    }
  }, []);
  
  // Save entries to localStorage whenever they change
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('tradingJournalEntries', JSON.stringify(entries));
    }
  }, [entries]);
  
  // Handle creating a new entry
  const handleCreate = (template = null) => {
    setCurrentEntry(null);
    if (template) {
      setSelectedTemplate(template);
    }
    setIsDialogOpen(true);
  };
  
  // Handle editing an existing entry
  const handleEdit = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setIsDialogOpen(true);
  };
  
  // Handle saving an entry
  const handleSaveEntry = (entry: JournalEntry) => {
    const now = new Date().toISOString();
    
    if (currentEntry) {
      // Editing existing entry
      const updatedEntries = entries.map(e => 
        e.id === entry.id ? { ...entry, updatedAt: now } : e
      );
      setEntries(updatedEntries);
    } else {
      // Creating new entry
      const newEntry = {
        ...entry,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      setEntries([newEntry, ...entries]);
    }
    
    setIsDialogOpen(false);
  };
  
  // Handle deleting an entry
  const handleDelete = (id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
  };
  
  // Filter entries based on active tab
  const filteredEntries = entries.filter(entry => {
    let matchesTab = true;
    
    if (activeTab === "today") {
      matchesTab = isToday(new Date(entry.date));
    } else if (activeTab === "yesterday") {
      matchesTab = isYesterday(new Date(entry.date));
    } else if (activeTab === "this-week") {
      const today = new Date();
      const start = startOfWeek(today);
      const end = endOfWeek(today);
      matchesTab = isWithinInterval(new Date(entry.date), { start, end });
    } else if (activeTab === "bullish") {
      matchesTab = entry.sentiment === "bullish";
    } else if (activeTab === "bearish") {
      matchesTab = entry.sentiment === "bearish";
    }
    
    return matchesTab;
  });
  
  // Sort entries by date (newest first)
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // Group entries by date in a user-friendly format
  const groupedEntries: Record<string, JournalEntry[]> = {};
  sortedEntries.forEach(entry => {
    const entryDate = new Date(entry.date);
    let dateLabel;
    
    if (isToday(entryDate)) {
      dateLabel = "Today";
    } else if (isYesterday(entryDate)) {
      dateLabel = "Yesterday";
    } else {
      dateLabel = format(entryDate, "EEEE, MMMM d, yyyy");
    }
    
    if (!groupedEntries[dateLabel]) {
      groupedEntries[dateLabel] = [];
    }
    
    groupedEntries[dateLabel].push(entry);
  });
  
  // Calculate statistics
  const calculateStats = () => {
    const total = entries.length;
    const bullish = entries.filter(e => e.sentiment === "bullish").length;
    const bearish = entries.filter(e => e.sentiment === "bearish").length;
    const neutral = entries.filter(e => e.sentiment === "neutral").length;
    
    // Calculate streak (consecutive days with entries)
    let streakCount = 0;
    const now = new Date();
    let currentDate = new Date(now);
    currentDate.setHours(0, 0, 0, 0);
    
    while (true) {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const hasEntryOnDate = entries.some(entry => {
        const entryDate = new Date(entry.date);
        return format(entryDate, "yyyy-MM-dd") === dateStr;
      });
      
      if (hasEntryOnDate) {
        streakCount++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return { total, bullish, bearish, neutral, streakCount };
  };
  
  const stats = calculateStats();
  
  // Get unique tags for tag cloud
  const tagCounts: Record<string, number> = {};
  entries.forEach(entry => {
    if (entry.tags) {
      entry.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));
  
  // Get mood statistics if available
  const moodStats: Record<string, number> = {};
  entries.forEach(entry => {
    if (entry.mood && entry.mood !== "none") {
      moodStats[entry.mood] = (moodStats[entry.mood] || 0) + 1;
    }
  });
  
  const getMoodEmoji = (mood: string) => {
    if (!mood || mood === "none") return null;
    const option = MOOD_OPTIONS.find(m => m.value === mood);
    return option ? option.emoji : "😐";
  };
  
  // Get day streak emoji based on streak count
  const getStreakEmoji = (count: number) => {
    if (count === 0) return "🔥";
    if (count < 3) return "🔥";
    if (count < 7) return "🔥🔥";
    if (count < 14) return "🔥🔥🔥";
    return "🔥🔥🔥🔥";
  };
  
  return (
    <div className="space-y-6">
      {/* Journal Insights & Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Journal Entries Count */}
        <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-950/30 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-indigo-800 dark:text-indigo-300">Journal Entries</h3>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-indigo-900 dark:text-indigo-200">{stats.total}</span>
                  <span className="text-xs text-indigo-700 dark:text-indigo-400">total</span>
                </div>
              </div>
              <div className="p-2 rounded-full bg-indigo-100 dark:bg-indigo-800/40">
                <BookOpen className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <Separator className="my-3 bg-indigo-200 dark:bg-indigo-800/40" />
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <Calendar className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-xs text-indigo-700 dark:text-indigo-400">
                {stats.streakCount > 0 ? `${stats.streakCount} day streak ${getStreakEmoji(stats.streakCount)}` : 'Start your streak today!'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* Market Sentiment Card */}
        <Card className="bg-gradient-to-r from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-green-800 dark:text-green-300">Market Sentiment</h3>
                <div className="mt-1 flex items-center gap-1.5">
                  {stats.bullish > stats.bearish ? (
                    <span className="text-green-600 dark:text-green-400 text-sm">Mostly Bullish</span>
                  ) : stats.bearish > stats.bullish ? (
                    <span className="text-red-600 dark:text-red-400 text-sm">Mostly Bearish</span>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-400 text-sm">Neutral</span>
                  )}
                </div>
              </div>
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-800/40">
                <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex gap-2 items-center mt-3">
              <div className="h-2 bg-green-500 rounded-full" style={{ width: `${(stats.bullish / Math.max(stats.total, 1)) * 100}%` }} />
              <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full" style={{ width: `${(stats.neutral / Math.max(stats.total, 1)) * 100}%` }} />
              <div className="h-2 bg-red-500 rounded-full" style={{ width: `${(stats.bearish / Math.max(stats.total, 1)) * 100}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-green-600 dark:text-green-400">{Math.round((stats.bullish / Math.max(stats.total, 1)) * 100)}% Bullish</span>
              <span className="text-red-600 dark:text-red-400">{Math.round((stats.bearish / Math.max(stats.total, 1)) * 100)}% Bearish</span>
            </div>
          </CardContent>
        </Card>
        
        {/* Trading Mood Tracker */}
        <Card className="bg-gradient-to-r from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/20 border-violet-200 dark:border-violet-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-violet-800 dark:text-violet-300">Trading Mood</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {Object.entries(moodStats).length > 0 ? (
                    Object.entries(moodStats)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 3)
                      .map(([mood, count]) => (
                        <Badge key={mood} className="bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300 hover:bg-violet-200">
                          {getMoodEmoji(mood)} {mood}
                        </Badge>
                      ))
                  ) : (
                    <span className="text-slate-600 dark:text-slate-400 text-sm">No mood data yet</span>
                  )}
                </div>
              </div>
              <div className="p-2 rounded-full bg-violet-100 dark:bg-violet-800/40">
                <SmilePlus className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
            </div>
            <Separator className="my-3 bg-violet-200 dark:bg-violet-800/40" />
            <div className="text-xs text-center text-violet-700 dark:text-violet-400 mt-1">
              Tracking your trading emotions helps identify patterns
            </div>
          </CardContent>
        </Card>
        
        {/* Common Tags */}
        <Card className="bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-300">Common Tags</h3>
              </div>
              <div className="p-2 rounded-full bg-amber-100 dark:bg-amber-800/40">
                <Bookmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {topTags.length > 0 ? (
                topTags.map(({ tag, count }) => (
                  <Badge key={tag} variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 hover:bg-amber-200">
                    {tag} ({count})
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-muted-foreground">No tags yet</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Action Buttons Row */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        {/* Template Selection */}
        <div className="flex gap-4 flex-col sm:flex-row">
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> New Entry
          </Button>
          
          {/* Desktop Templates */}
          <div className="hidden sm:flex items-center gap-2">
            <Separator orientation="vertical" className="h-8" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">Templates:</span>
            <TooltipProvider>
              <div className="flex gap-1.5">
                {JOURNAL_TEMPLATES.map(template => {
                  // Define background classes based on template ID
                  const bgColor = 
                    template.id === 'pre-market' ? 'bg-blue-50 dark:bg-blue-900/20' : 
                    template.id === 'post-trade' ? 'bg-green-50 dark:bg-green-900/20' : 
                    template.id === 'reflection' ? 'bg-amber-50 dark:bg-amber-900/20' : 
                    'bg-violet-50 dark:bg-violet-900/20';
                    
                  const hoverBg = 
                    template.id === 'pre-market' ? 'hover:bg-blue-50 dark:hover:bg-blue-900/10' : 
                    template.id === 'post-trade' ? 'hover:bg-green-50 dark:hover:bg-green-900/10' : 
                    template.id === 'reflection' ? 'hover:bg-amber-50 dark:hover:bg-amber-900/10' : 
                    'hover:bg-violet-50 dark:hover:bg-violet-900/10';
                    
                  return (
                    <Tooltip key={template.id}>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCreate(template)}
                          className={`h-9 px-3 py-2 flex items-center gap-1.5 border-dashed relative ${hoverBg}`}
                        >
                          <div className="absolute -top-1.5 -right-1.5">
                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 rounded-sm bg-card">
                              Template
                            </Badge>
                          </div>
                          <div className={`p-1 rounded-sm ${bgColor}`}>
                            {template.icon}
                          </div>
                          <span className="text-xs hidden lg:inline">{template.name}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>
          
          {/* Mobile Templates */}
          <div className="grid grid-cols-4 gap-2 sm:hidden">
            {JOURNAL_TEMPLATES.map(template => {
              const bgColor = 
                template.id === 'pre-market' ? 'bg-blue-50 dark:bg-blue-900/20' : 
                template.id === 'post-trade' ? 'bg-green-50 dark:bg-green-900/20' : 
                template.id === 'reflection' ? 'bg-amber-50 dark:bg-amber-900/20' : 
                'bg-violet-50 dark:bg-violet-900/20';
                
              return (
                <Button 
                  key={template.id}
                  variant="outline" 
                  size="sm"
                  onClick={() => handleCreate(template)}
                  className="flex flex-col items-center justify-center py-2 h-auto border-dashed relative"
                >
                  <div className="absolute -top-1.5 -right-1.5">
                    <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 rounded-sm bg-card">
                      Template
                    </Badge>
                  </div>
                  <div className={`p-1 rounded-sm ${bgColor}`}>
                    {template.icon}
                  </div>
                  <span className="text-[10px] mt-1">{template.name.split(' ')[0]}</span>
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Time Filter Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-5 sm:w-[450px]">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="this-week">This Week</TabsTrigger>
            <TabsTrigger value="bullish">Bullish</TabsTrigger>
            <TabsTrigger value="bearish">Bearish</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Journal Entries List */}
      <div className="min-h-[300px] border rounded-lg bg-card">
        {sortedEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
            <div className="max-w-sm">
              <h3 className="text-lg font-semibold text-card-foreground">No journal entries found</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                {entries.length === 0
                  ? "Start by creating your first journal entry"
                  : "No entries match your current filters"}
              </p>
              {entries.length === 0 && (
                <Button onClick={handleCreate} className="mt-2">
                  <Plus className="mr-2 h-4 w-4" /> New Entry
                </Button>
              )}
              {entries.length > 0 && sortedEntries.length === 0 && (
                <Button variant="outline" onClick={() => setActiveTab("all")} className="mt-2">
                  <FilterX className="mr-2 h-4 w-4" /> Clear Filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Entries Grouped By Date */}
            {Object.entries(groupedEntries).map(([dateLabel, dateEntries]) => (
              <div key={dateLabel} className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5" />
                  {dateLabel}
                </h3>
                <div className="space-y-3">
                  {dateEntries.map((entry) => (
                    <Card key={entry.id} className="overflow-hidden">
                      <CardHeader className="p-4 pb-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg font-medium">{entry.title}</CardTitle>
                              {entry.mood && entry.mood !== "none" && (
                                <span className="text-lg" title={entry.mood}>
                                  {getMoodEmoji(entry.mood)}
                                </span>
                              )}
                            </div>
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(parseISO(entry.date), "h:mm a")}
                              
                              {entry.template && entry.template !== "none" && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {entry.template}
                                </Badge>
                              )}
                            </CardDescription>
                          </div>
                          <div className="flex space-x-1">
                            {entry.sentiment && (
                              <Badge variant={
                                entry.sentiment === "bullish" ? "success" : 
                                entry.sentiment === "bearish" ? "destructive" : 
                                "outline"
                              }>
                                {entry.sentiment}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="p-4 pt-2">
                        <p className="text-sm text-card-foreground whitespace-pre-line line-clamp-3">
                          {entry.content}
                        </p>
                        
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {entry.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      
                      <CardFooter className="p-4 pt-0 flex justify-end">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this entry?")) {
                                handleDelete(entry.id);
                              }
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Entry dialog */}
      <JournalEntryDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        entry={currentEntry}
        onSave={handleSaveEntry}
        template={selectedTemplate}
        moodOptions={MOOD_OPTIONS}
      />
    </div>
  );
}

// Custom CalendarCheck icon
function CalendarCheck(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" x2="16" y1="2" y2="6" />
      <line x1="8" x2="8" y1="2" y2="6" />
      <line x1="3" x2="21" y1="10" y2="10" />
      <path d="m9 16 2 2 4-4" />
    </svg>
  );
} 