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
  
  // Filter entries based on search query and active tab
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = searchQuery === "" || 
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.tags && entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    
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
    
    return matchesSearch && matchesTab;
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
    
    return { total, bullish, bearish, neutral };
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
  
  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>
      
      {/* Search, Filter, and Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search entries..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="hidden sm:flex"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="this-week">This Week</TabsTrigger>
              <TabsTrigger value="this-month">This Month</TabsTrigger>
              <TabsTrigger value="bullish">Bullish</TabsTrigger>
              <TabsTrigger value="bearish">Bearish</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex justify-between sm:justify-end gap-2">
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as "newest" | "oldest" | "sentiment")}
          >
            <SelectTrigger className="w-[160px]">
              <SortDesc className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="sentiment">By Sentiment</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" /> New Entry
          </Button>
        </div>
      </div>
      
      {/* Mobile Tabs */}
      <div className="sm:hidden">
        <ScrollArea className="w-full" orientation="horizontal">
          <div className="flex gap-2 w-max p-1">
            <Button 
              variant={activeTab === "all" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveTab("all")}
            >
              All
            </Button>
            <Button 
              variant={activeTab === "this-week" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveTab("this-week")}
            >
              This Week
            </Button>
            <Button 
              variant={activeTab === "this-month" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveTab("this-month")}
            >
              This Month
            </Button>
            <Button 
              variant={activeTab === "bullish" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveTab("bullish")}
            >
              Bullish
            </Button>
            <Button 
              variant={activeTab === "bearish" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setActiveTab("bearish")}
            >
              Bearish
            </Button>
          </div>
        </ScrollArea>
      </div>
      
      {/* Journal Entries List */}
      {sortedEntries.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No journal entries found</h3>
          <p className="text-muted-foreground mt-1">
            {entries.length === 0
              ? "Start by creating your first journal entry"
              : "No entries match your current filters"}
          </p>
          {entries.length === 0 && (
            <Button onClick={handleCreate} className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> New Entry
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* List View */}
          <div className="space-y-3">
            {sortedEntries.map((entry) => (
              <Card key={entry.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg font-medium">{entry.title}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(parseISO(entry.date), "PPP")}
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
                      Edit
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
      )}
      
      {/* Entry dialog */}
      <JournalEntryDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        entry={currentEntry}
        onSave={handleSaveEntry}
      />
    </div>
  );
} 