"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAccounts } from "@/hooks/useAccounts";
import { Trade } from "@/types/trade";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CsvImport } from "@/components/trades/CsvImport";
import { 
  ArrowDownUp, 
  ArrowUpDown,
  BarChart,
  Bookmark,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  Dices,
  Download,
  Filter,
  Grid,
  LayoutDashboard,
  List,
  MoreHorizontal,
  PieChart,
  Plus,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Table2,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/trades/columns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function TradesPage() {
  // State for trading data
  const [trades, setTrades] = useState<Record<string, Trade>>({});
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [isTradeDetailOpen, setIsTradeDetailOpen] = useState(false);
  
  // UI state
  const [viewMode, setViewMode] = useState<"table" | "cards" | "timeline">("table");
  const [activeTab, setActiveTab] = useState("all");
  const [forceUpdate, setForceUpdate] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [timeRange, setTimeRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Hooks
  const searchParams = useSearchParams();
  const { selectedAccounts } = useAccounts();
  const router = useRouter();

  // Load trades from localStorage
  useEffect(() => {
    const loadTrades = () => {
      try {
        const storedTrades = localStorage.getItem('tradingJournalTrades') || '{}';
        const parsedTrades = JSON.parse(storedTrades);
        setTrades(parsedTrades);
      } catch (error) {
        console.error("Error loading trades:", error);
      }
    };
    
    // Initial load
    loadTrades();
    
    // Set up event listeners
    const handleTradesUpdated = () => loadTrades();
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'tradingJournalTrades' || e.key === 'tradingJournalSelectedAccounts') {
        loadTrades();
        setForceUpdate(prev => prev + 1);
      }
    };
    
    window.addEventListener('trades-updated', handleTradesUpdated);
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      window.removeEventListener('trades-updated', handleTradesUpdated);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Check for import query parameter
  useEffect(() => {
    const shouldShowImport = searchParams.get('import') === 'true';
    if (shouldShowImport) {
      setShowImport(true);
      
      // Clear the URL parameter without refreshing
      const url = new URL(window.location.href);
      url.searchParams.delete('import');
      window.history.replaceState({}, '', url);
    }
    
    // Check for account parameter to be selected
    const accountId = searchParams.get('account');
    if (accountId && !selectedAccounts.includes(accountId)) {
      // Select this account
      const newSelection = [...selectedAccounts, accountId];
      localStorage.setItem('tradingJournalSelectedAccounts', JSON.stringify(newSelection));
      window.dispatchEvent(new Event('storage'));
    }
  }, [searchParams, selectedAccounts]);

  // Handle the import dialog close
  const handleImportClose = useCallback(() => {
    setShowImport(false);
  }, []);

  // Filter and sort trades
  useEffect(() => {
    // Convert object to array
    const allTrades = Object.values(trades);
    
    // Apply account filter
    let filtered = allTrades.filter(trade => 
      !trade.accountId || selectedAccounts.includes(trade.accountId)
    );
    
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(trade => 
        trade.symbol?.toLowerCase().includes(searchLower) ||
        trade.importSource?.toLowerCase().includes(searchLower) ||
        trade.notes?.toLowerCase().includes(searchLower) ||
        trade.strategy?.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply view filter
    switch(activeTab) {
      case "open":
        filtered = filtered.filter(trade => !trade.exitDate);
        break;
      case "closed":
        filtered = filtered.filter(trade => !!trade.exitDate);
        break;
      case "winning":
        filtered = filtered.filter(trade => (trade.pnl ?? 0) > 0);
        break;
      case "losing":
        filtered = filtered.filter(trade => (trade.pnl ?? 0) < 0);
        break;
    }
    
    // Apply time range filter
    const now = new Date();
    switch(timeRange) {
      case "today":
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = filtered.filter(trade => new Date(trade.entryDate) >= today);
        break;
      case "week":
        const oneWeekAgo = new Date(now);
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        filtered = filtered.filter(trade => new Date(trade.entryDate) >= oneWeekAgo);
        break;
      case "month":
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        filtered = filtered.filter(trade => new Date(trade.entryDate) >= oneMonthAgo);
        break;
      case "year":
        const oneYearAgo = new Date(now);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        filtered = filtered.filter(trade => new Date(trade.entryDate) >= oneYearAgo);
        break;
    }
    
    // Apply sorting
    switch(sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
        break;
      case "symbol":
        filtered.sort((a, b) => a.symbol.localeCompare(b.symbol));
        break;
      case "pnl-high":
        filtered.sort((a, b) => (b.pnl ?? 0) - (a.pnl ?? 0));
        break;
      case "pnl-low":
        filtered.sort((a, b) => (a.pnl ?? 0) - (b.pnl ?? 0));
        break;
    }
    
    setFilteredTrades(filtered);
  }, [trades, selectedAccounts, forceUpdate, searchText, activeTab, sortBy, timeRange]);

  // Calculate statistics
  const totalTrades = filteredTrades.length;
  const openTrades = filteredTrades.filter(trade => !trade.exitDate).length;
  const closedTrades = filteredTrades.filter(trade => !!trade.exitDate).length;
  const winningTrades = filteredTrades.filter(trade => (trade.pnl ?? 0) > 0).length;
  const losingTrades = filteredTrades.filter(trade => (trade.pnl ?? 0) < 0).length;
  const totalPnL = filteredTrades.reduce((sum, trade) => sum + (trade.pnl ?? 0), 0);
  const winRate = closedTrades > 0 ? (winningTrades / closedTrades * 100).toFixed(1) : "0.0";

  // Delete selected rows
  const handleDeleteRows = useCallback((rowIds: string[]) => {
    try {
      const currentTrades = JSON.parse(localStorage.getItem('tradingJournalTrades') || '{}');
      
      rowIds.forEach(id => {
        delete currentTrades[id];
      });
      
      localStorage.setItem('tradingJournalTrades', JSON.stringify(currentTrades));
      window.dispatchEvent(new Event('trades-updated'));
      setForceUpdate(prev => prev + 1);
      setTrades(currentTrades);
    } catch (error) {
      console.error("Error deleting trades:", error);
    }
  }, []);

  // Delete all trades
  const handleDeleteAll = () => {
    try {
      localStorage.removeItem('tradingJournalTrades');
      setTrades({});
      setForceUpdate(prev => prev + 1);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting all trades:", error);
    }
  };

  // Toggle view mode
  const toggleViewMode = (mode: "table" | "cards" | "timeline") => {
    setViewMode(mode);
  };

  // Toggle search focus
  const focusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + F for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        focusSearch();
      }
      
      // Esc to clear search
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchText('');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col space-y-6" ref={containerRef}>
      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Trade Journal</h1>
            <p className="text-muted-foreground">
              View, analyze and manage your trading history
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline"
                    size="icon"
                    onClick={() => setForceUpdate(prev => prev + 1)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Button
              variant="default"
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Trades</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Options</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setShowImport(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Trades
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export Trades
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-red-500">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All Trades
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-background/40 backdrop-blur-sm border-primary/20 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Total Trades</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{totalTrades}</span>
                  <BarChart className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-background/40 backdrop-blur-sm border-primary/20 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Open Positions</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{openTrades}</span>
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-background/40 backdrop-blur-sm border-primary/20 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Closed Trades</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{closedTrades}</span>
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-background/40 backdrop-blur-sm border-green-500/20 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Win Rate</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{winRate}%</span>
                  <PieChart className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-background/40 backdrop-blur-sm border-primary/20 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">W/L Ratio</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-2xl font-bold">{winningTrades}/{losingTrades}</span>
                  <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className={cn(
            "bg-background/40 backdrop-blur-sm shadow-sm",
            totalPnL > 0 ? "border-green-500/20" : "border-red-500/20"
          )}>
            <CardContent className="p-4">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Total P&L</span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className={cn(
                    "text-2xl font-bold",
                    totalPnL > 0 ? "text-green-500" : 
                    totalPnL < 0 ? "text-red-500" : ""
                  )}>
                    {formatCurrency(totalPnL)}
                  </span>
                  {totalPnL > 0 ? 
                    <TrendingUp className="h-4 w-4 text-green-500" /> : 
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  }
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Filters Section */}
      <div className="flex flex-col space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search by symbol, strategy, notes... (Ctrl+F)"
              className="pl-10 pr-10"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchText('')}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {/* Time Period */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <SelectValue placeholder="Time period" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Time Period</SelectLabel>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px]">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4" />
                <SelectValue placeholder="Sort by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Sort By</SelectLabel>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="symbol">By Symbol</SelectItem>
                <SelectItem value="pnl-high">P&L (High to Low)</SelectItem>
                <SelectItem value="pnl-low">P&L (Low to High)</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          
          {/* View Mode */}
          <div className="bg-muted rounded-md p-1 flex">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "table" ? "default" : "ghost"}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => toggleViewMode("table")}
                  >
                    <Table2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Table View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "cards" ? "default" : "ghost"}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => toggleViewMode("cards")}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Card View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={viewMode === "timeline" ? "default" : "ghost"}
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => toggleViewMode("timeline")}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Timeline View</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                  className={cn(isFilterPanelOpen && "bg-accent")}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Advanced Filters</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* Advanced Filters Panel - will be implemented later */}
      </div>
      
      {/* Tabs and Content Section */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 grid w-full grid-cols-5 bg-gradient-to-r from-background/80 to-muted/30 backdrop-blur-sm rounded-lg">
          <TabsTrigger value="all" className="flex items-center gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Tag className="h-4 w-4" />
            <span>All Trades</span>
            <Badge variant="outline" className="ml-1 bg-muted px-1.5 py-0.5 text-xs">
              {totalTrades}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="open" className="flex items-center gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>Open</span>
            <Badge variant="outline" className="ml-1 bg-muted px-1.5 py-0.5 text-xs">
              {openTrades}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex items-center gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Bookmark className="h-4 w-4" />
            <span>Closed</span>
            <Badge variant="outline" className="ml-1 bg-muted px-1.5 py-0.5 text-xs">
              {closedTrades}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="winning" className="flex items-center gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm group">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="group-data-[state=active]:text-green-500">Winning</span>
            <Badge variant="outline" className="ml-1 bg-muted px-1.5 py-0.5 text-xs">
              {winningTrades}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="losing" className="flex items-center gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm group">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <span className="group-data-[state=active]:text-red-500">Losing</span>
            <Badge variant="outline" className="ml-1 bg-muted px-1.5 py-0.5 text-xs">
              {losingTrades}
            </Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="outline-none p-0">
          {filteredTrades.length === 0 ? (
            <EmptyTradesState 
              showImportButton={totalTrades === 0}
              onImportClick={() => setShowImport(true)}
            />
          ) : viewMode === "table" ? (
            <TableView 
              trades={filteredTrades} 
              onDeleteRows={handleDeleteRows}
            />
          ) : viewMode === "cards" ? (
            <CardView 
              trades={filteredTrades} 
              onTradeClick={(id) => {
                setSelectedTradeId(id);
                setIsTradeDetailOpen(true);
              }}
              onDeleteTrade={(id) => handleDeleteRows([id])}
            />
          ) : (
            <TimelineView
              trades={filteredTrades}
              onTradeClick={(id) => {
                setSelectedTradeId(id);
                setIsTradeDetailOpen(true);
              }}
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Trade Import Dialog */}
      <CsvImport 
        isOpen={showImport}
        onClose={handleImportClose}
      />
      
      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Trades</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all trades? This action cannot be undone and will remove all of your trading history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground">
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Trade Detail Dialog */}
      {/* Will be implemented if needed */}
    </div>
  );
}

// Empty state component
function EmptyTradesState({ showImportButton, onImportClick }: { showImportButton: boolean; onImportClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed rounded-lg bg-muted/20">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="p-4 rounded-full bg-muted/50 mb-4">
          <BarChart className="h-8 w-8 text-muted-foreground/60" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No trades found</h3>
        <p className="text-muted-foreground mb-6">
          {showImportButton
            ? "Get started by importing your trades from a CSV file or connecting to your trading platform."
            : "No trades match your current filters. Try adjusting your search criteria or time period."}
        </p>
        {showImportButton && (
          <Button onClick={onImportClick} className="gap-2">
            <Plus className="h-4 w-4" />
            <span>Add Trades</span>
          </Button>
        )}
      </div>
    </div>
  );
}

// Table view component
function TableView({ trades, onDeleteRows }: { trades: Trade[]; onDeleteRows: (ids: string[]) => void }) {
  return (
    <Card>
      <CardContent className="p-0 rounded-lg overflow-hidden">
        <DataTable 
          columns={columns} 
          data={trades} 
          enableRowSelection={true}
          onDeleteRows={onDeleteRows}
          getRowId={(row: Trade) => row.id}
        />
      </CardContent>
    </Card>
  );
}

// Card view component
function CardView({ 
  trades, 
  onTradeClick,
  onDeleteTrade
}: { 
  trades: Trade[]; 
  onTradeClick: (id: string) => void;
  onDeleteTrade: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {trades.map(trade => (
        <TradeCard 
          key={trade.id} 
          trade={trade} 
          onClick={() => onTradeClick(trade.id)}
          onDelete={() => onDeleteTrade(trade.id)}
        />
      ))}
    </div>
  );
}

// Trade card component
function TradeCard({ 
  trade, 
  onClick,
  onDelete
}: { 
  trade: Trade; 
  onClick: () => void;
  onDelete: () => void;
}) {
  const isWinning = (trade.pnl ?? 0) > 0;
  const isOpen = !trade.exitDate;
  
  return (
    <Card 
      className="relative group overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <div className={cn(
        "absolute h-1 top-0 left-0 right-0",
        isOpen ? "bg-blue-500" : isWinning ? "bg-green-500" : "bg-red-500"
      )} />
      
      <CardHeader className="p-4 pb-2 bg-muted/20">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base mb-1 flex items-center">
              {trade.symbol}
              {trade.strategy && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {trade.strategy}
                </Badge>
              )}
            </CardTitle>
            <Badge 
              variant={trade.direction === "long" ? "default" : "destructive"}
              className="capitalize"
            >
              {trade.direction}
            </Badge>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Trade</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-3">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-muted-foreground">Entry Date:</div>
          <div className="text-right font-medium">{formatDateTime(trade.entryDate)}</div>
          
          <div className="text-muted-foreground">Entry Price:</div>
          <div className="text-right font-medium">{formatCurrency(trade.entryPrice)}</div>
          
          <div className="text-muted-foreground">Quantity:</div>
          <div className="text-right font-medium">{trade.quantity}</div>
          
          {!isOpen && (
            <>
              <div className="text-muted-foreground">Exit Date:</div>
              <div className="text-right font-medium">{formatDateTime(trade.exitDate!)}</div>
              
              <div className="text-muted-foreground">Exit Price:</div>
              <div className="text-right font-medium">{formatCurrency(trade.exitPrice!)}</div>
            </>
          )}
          
          <div className="text-muted-foreground">P&L:</div>
          <div className={cn(
            "text-right font-medium",
            isOpen ? "text-muted-foreground" : 
              isWinning ? "text-green-500" : "text-red-500"
          )}>
            {isOpen ? "Open" : formatCurrency(trade.pnl ?? 0)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Timeline view component
function TimelineView({ 
  trades,
  onTradeClick
}: { 
  trades: Trade[];
  onTradeClick: (id: string) => void;
}) {
  // Group trades by date
  const tradesByDate = trades.reduce((groups, trade) => {
    const date = new Date(trade.entryDate).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(trade);
    return groups;
  }, {} as Record<string, Trade[]>);
  
  // Sort dates in descending order
  const sortedDates = Object.keys(tradesByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  return (
    <div className="space-y-8">
      {sortedDates.map(date => (
        <div key={date} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="font-medium">{date}</h3>
            <Badge variant="outline" className="ml-1">
              {tradesByDate[date].length} trades
            </Badge>
            <div className="flex-grow h-[1px] bg-border ml-2"></div>
          </div>
          
          <div className="pl-4 ml-4 border-l border-dashed space-y-3">
            {tradesByDate[date].map(trade => (
              <Card 
                key={trade.id}
                className="overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer"
                onClick={() => onTradeClick(trade.id)}
              >
                <div className="flex flex-col md:flex-row">
                  <div className={cn(
                    "w-full md:w-1.5 md:h-auto",
                    !trade.exitDate ? "bg-blue-500" : 
                    (trade.pnl ?? 0) > 0 ? "bg-green-500" : "bg-red-500"
                  )}></div>
                  
                  <div className="flex-grow p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{trade.symbol}</span>
                        <Badge 
                          variant={trade.direction === "long" ? "default" : "destructive"}
                          className="capitalize"
                        >
                          {trade.direction}
                        </Badge>
                        {trade.strategy && (
                          <Badge variant="outline" className="text-xs">
                            {trade.strategy}
                          </Badge>
                        )}
                      </div>
                      
                      <div className={cn(
                        "font-medium",
                        !trade.exitDate ? "text-blue-500" : 
                        (trade.pnl ?? 0) > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {!trade.exitDate ? "Open" : formatCurrency(trade.pnl ?? 0)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-sm">
                      <div className="text-muted-foreground">Entry Time:</div>
                      <div>{new Date(trade.entryDate).toLocaleTimeString()}</div>
                      
                      <div className="text-muted-foreground">Entry Price:</div>
                      <div>{formatCurrency(trade.entryPrice)}</div>
                      
                      <div className="text-muted-foreground">Quantity:</div>
                      <div>{trade.quantity}</div>
                      
                      <div className="text-muted-foreground">
                        {!trade.exitDate ? "Status:" : "Exit Price:"}
                      </div>
                      <div>
                        {!trade.exitDate ? "Open" : formatCurrency(trade.exitPrice!)}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 