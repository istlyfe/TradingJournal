"use client";

import { useState, useEffect } from "react";
import { Plus, Calendar, Search, Filter, SortDesc, Tag, Activity, BarChart2, Bookmark, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { JournalEntryDialog } from "./JournalEntryDialog";
import { JournalEntry } from "@/types/journal";
import { format, parseISO, isSameMonth } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function JournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "sentiment">("newest");
  const [moodFilter, setMoodFilter] = useState<string>("none");
  
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
  const handleCreate = () => {
    setCurrentEntry(null);
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
  
  // Filter entries based on search query, active tab, and mood filter
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchQuery === "" || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesMood = moodFilter === "none" || entry.mood === moodFilter;
    
    let matchesTab = true;
    if (activeTab === "this-week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      matchesTab = new Date(entry.date) >= oneWeekAgo;
    } else if (activeTab === "this-month") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      matchesTab = new Date(entry.date) >= oneMonthAgo;
    } else if (activeTab === "bullish") {
      matchesTab = entry.sentiment === "bullish";
    } else if (activeTab === "bearish") {
      matchesTab = entry.sentiment === "bearish";
    } else if (activeTab === "neutral") {
      matchesTab = entry.sentiment === "neutral";
    }
    
    return matchesSearch && matchesTab && matchesMood;
  });
  
  // Sort entries based on selected sort method
  const sortedEntries = [...filteredEntries].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    } else if (sortBy === "oldest") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    } else if (sortBy === "sentiment") {
      const sentimentOrder = { bullish: 0, neutral: 1, bearish: 2 };
      return (sentimentOrder[a.sentiment || "neutral"] || 1) - (sentimentOrder[b.sentiment || "neutral"] || 1);
    }
    return 0;
  });
  
  // Group entries by month for timeline view
  const entriesByMonth: Record<string, JournalEntry[]> = {};
  sortedEntries.forEach(entry => {
    const monthYear = format(parseISO(entry.date), "MMMM yyyy");
    if (!entriesByMonth[monthYear]) {
      entriesByMonth[monthYear] = [];
    }
    entriesByMonth[monthYear].push(entry);
  });
  
  // Calculate statistics
  const calculateStats = () => {
    const total = entries.length;
    const bullish = entries.filter(e => e.sentiment === "bullish").length;
    const bearish = entries.filter(e => e.sentiment === "bearish").length;
    const neutral = entries.filter(e => e.sentiment === "neutral").length;
    
    const moodCounts: Record<string, number> = {};
    entries.forEach(entry => {
      if (entry.mood) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
      }
    });
    
    const topMoods = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([mood, count]) => ({ mood, count }));
    
    return { total, bullish, bearish, neutral, topMoods };
  };
  
  const stats = calculateStats();
  
  // Get all unique mood values for filtering
  const uniqueMoods = Array.from(new Set(entries.filter(e => e.mood).map(e => e.mood))) as string[];
  
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
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/30 dark:to-indigo-900/20 border-indigo-200 dark:border-indigo-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <BookOpen className="h-4 w-4 mr-2 text-indigo-500" />
              Journal Entries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total entries in your journal</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2 text-green-500" />
              Market Sentiment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
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
        
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Bookmark className="h-4 w-4 mr-2 text-amber-500" />
              Common Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              {topTags.map(({ tag, count }) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag} ({count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <BarChart2 className="h-4 w-4 mr-2 text-purple-500" />
              Trading Mood
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {stats.topMoods.map(({ mood, count }) => (
                <div key={mood} className="flex items-center gap-2">
                  <div className="h-2 bg-purple-400 rounded-full" style={{ width: `${(count / Math.max(stats.total, 1)) * 100}%` }} />
                  <span className="text-xs capitalize">{mood}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search journal entries..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-44">
              <SortDesc className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="sentiment">Sentiment</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={moodFilter} onValueChange={setMoodFilter}>
            <SelectTrigger className="w-44">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by mood..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">All Moods</SelectItem>
              {uniqueMoods.map(mood => (
                <SelectItem key={mood} value={mood}>
                  {mood.charAt(0).toUpperCase() + mood.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleCreate} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Entries</TabsTrigger>
          <TabsTrigger value="this-week">This Week</TabsTrigger>
          <TabsTrigger value="this-month">This Month</TabsTrigger>
          <TabsTrigger value="bullish">Bullish</TabsTrigger>
          <TabsTrigger value="bearish">Bearish</TabsTrigger>
          <TabsTrigger value="neutral">Neutral</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-0">
          {sortedEntries.length > 0 ? (
            <div className="space-y-10">
              {Object.entries(entriesByMonth).map(([month, monthEntries]) => (
                <div key={month} className="space-y-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold tracking-tight">{month}</h3>
                    <div className="h-px bg-border flex-1" />
                    <span className="text-sm text-muted-foreground">{monthEntries.length} entries</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {monthEntries.map((entry) => (
                      <Card 
                        key={entry.id} 
                        className={`overflow-hidden hover:shadow-md transition-all ${
                          entry.sentiment === "bullish" 
                            ? "border-l-4 border-l-green-500" 
                            : entry.sentiment === "bearish"
                              ? "border-l-4 border-l-red-500"
                              : "border-l-4 border-l-gray-300 dark:border-l-gray-600"
                        }`}
                      >
                        <CardHeader className="p-4 pb-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="mr-1 h-3 w-3" />
                              {format(parseISO(entry.date), "EEEE, MMM d, yyyy")}
                            </div>
                            
                            {entry.sentiment && (
                              <Badge variant={
                                entry.sentiment === "bullish" ? "default" :
                                entry.sentiment === "bearish" ? "destructive" : "outline"
                              } className="text-xs">
                                {entry.sentiment.charAt(0).toUpperCase() + entry.sentiment.slice(1)}
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="line-clamp-1 text-lg mt-2">{entry.title}</CardTitle>
                        </CardHeader>
                        
                        <CardContent className="p-4 pt-2">
                          <p className="line-clamp-3 text-sm text-muted-foreground">
                            {entry.content}
                          </p>
                          
                          {entry.tags && entry.tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {entry.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          
                          {entry.mood && (
                            <div className="mt-3 flex items-center text-xs text-muted-foreground">
                              <span className="mr-1">Mood:</span>
                              <Badge variant="outline" className="text-xs">
                                {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                              </Badge>
                            </div>
                          )}
                        </CardContent>
                        
                        <CardFooter className="p-4 pt-2 flex justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(entry)}
                          >
                            View & Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => handleDelete(entry.id)}
                          >
                            Delete
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-60 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
              <div className="text-muted-foreground">No journal entries found</div>
              <Button
                variant="link"
                size="sm"
                className="mt-2"
                onClick={handleCreate}
              >
                Create your first entry
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <JournalEntryDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        entry={currentEntry}
        onSave={handleSaveEntry}
      />
    </div>
  );
} 