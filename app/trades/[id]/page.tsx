"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "@/components/trades/TradeList";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { 
  Edit, 
  Trash2, 
  Calendar, 
  FileBarChart, 
  ArrowLeftRight, 
  DollarSign,
  Tag,
  Clock,
  AlertCircle
} from "lucide-react";

// Sample trade data - in a real app, you would fetch this from an API
const sampleTrades: Record<string, Trade> = {
  "1": {
    id: "1",
    symbol: "AAPL",
    direction: "LONG",
    entryDate: "2025-03-14T09:30:00",
    entryPrice: 182.45,
    exitDate: "2025-03-14T15:30:00",
    exitPrice: 185.30,
    quantity: 100,
    pnl: 285.00,
    fees: 5.99,
    strategy: "Momentum",
    emotionalState: "Calm",
    notes: "Strong market open, followed trend on good volume. iPhone sales data came in positive.",
    tags: ["Tech", "Post-Earnings"],
    source: "manual"
  },
  "2": {
    id: "2",
    symbol: "MSFT",
    direction: "LONG",
    entryDate: "2025-03-14T10:15:00",
    entryPrice: 415.20,
    exitDate: "2025-03-14T14:30:00",
    exitPrice: 418.75,
    quantity: 50,
    pnl: 177.50,
    fees: 4.99,
    strategy: "Breakout",
    emotionalState: "Confident",
    notes: "Clear breakout above resistance, strong sector move across tech.",
    tags: ["Tech"],
    source: "manual"
  },
  "3": {
    id: "3",
    symbol: "NVDA",
    direction: "SHORT",
    entryDate: "2025-03-13T11:00:00",
    entryPrice: 925.40,
    exitDate: "2025-03-13T15:45:00",
    exitPrice: 918.25,
    quantity: 20,
    pnl: 143.00,
    fees: 3.99,
    strategy: "Reversal",
    emotionalState: "Neutral",
    notes: "Overextended on daily chart, bearish divergence on RSI.",
    tags: ["Tech", "Overbought"],
    source: "manual"
  },
  "4": {
    id: "4",
    symbol: "TSLA",
    direction: "LONG",
    entryDate: "2025-03-13T09:45:00",
    entryPrice: 178.30,
    exitDate: "2025-03-13T13:30:00",
    exitPrice: 175.45,
    quantity: 100,
    pnl: -285.00,
    fees: 5.99,
    strategy: "Support",
    emotionalState: "Fearful",
    notes: "Thought we had support, but broke down. Failed to follow my stop loss plan.",
    tags: ["Auto", "Reversal-Failure"],
    source: "manual"
  },
  "import-1": {
    id: "import-1",
    symbol: "ESM4",
    direction: "LONG",
    entryDate: "2025-03-11T09:30:00",
    entryPrice: 5275.25,
    exitDate: "2025-03-11T12:30:00",
    exitPrice: 5295.50,
    quantity: 1,
    pnl: 1012.50,
    fees: 4.25,
    strategy: "Breakout",
    source: "import",
    importSource: "Tradovate"
  }
};

export default function TradeDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [trade, setTrade] = useState<Trade | null>(null);
  
  // Fetch the trade data
  useEffect(() => {
    // In a real app, you would fetch this from an API
    // For now, we'll use localStorage to simulate persistent data
    const storedTrades = localStorage.getItem('tradingJournalTrades');
    let allTrades: Record<string, Trade> = {};
    
    if (storedTrades) {
      allTrades = JSON.parse(storedTrades);
    } else {
      // Initialize with sample data if nothing in storage
      allTrades = sampleTrades;
      localStorage.setItem('tradingJournalTrades', JSON.stringify(allTrades));
    }
    
    const foundTrade = allTrades[params.id];
    setTrade(foundTrade || null);
  }, [params.id]);
  
  if (!trade) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Trade Not Found</h2>
        <p className="text-muted-foreground mb-4">The trade you're looking for doesn't exist or has been deleted.</p>
        <button 
          onClick={() => router.push("/trades")}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90"
        >
          Back to Trades
        </button>
      </div>
    );
  }
  
  const editTrade = () => {
    router.push(`/trades/${params.id}/edit`);
  };
  
  const deleteTrade = () => {
    setIsDeleting(true);
    
    // In a real app, you would call an API to delete the trade
    // For now, we'll use localStorage to simulate persistent data
    try {
      const storedTrades = localStorage.getItem('tradingJournalTrades');
      if (storedTrades) {
        const allTrades = JSON.parse(storedTrades);
        delete allTrades[params.id]; // Remove the trade
        localStorage.setItem('tradingJournalTrades', JSON.stringify(allTrades));
      }
      
      // Simulate API call delay
      setTimeout(() => {
        setIsDeleting(false);
        router.push("/trades");
      }, 500);
    } catch (error) {
      console.error("Error deleting trade:", error);
      setIsDeleting(false);
    }
  };
  
  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => router.push("/trades")}
            className="px-3 py-1 border rounded-md border-input bg-transparent text-sm hover:bg-muted/50"
          >
            Back
          </button>
          <h1 className="text-2xl font-bold">{trade.symbol} Trade Details</h1>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={editTrade}
            className="px-3 py-2 border rounded-md border-input bg-transparent text-sm hover:bg-muted/50 flex items-center gap-1"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </button>
          
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 text-sm flex items-center gap-1"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      </div>
      
      {/* Trade Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Trade Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                    <ArrowLeftRight className="h-4 w-4 mr-1" />
                    Direction
                  </h3>
                  <div className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${
                    trade.direction === "LONG" 
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" 
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  }`}>
                    {trade.direction}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    Entry Date & Time
                  </h3>
                  <p className="text-lg">{formatDateTime(trade.entryDate)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Entry Price</h3>
                  <p className="text-lg">${trade.entryPrice.toFixed(2)}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Quantity</h3>
                  <p className="text-lg">{trade.quantity}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    P&L
                  </h3>
                  <p className={`text-xl font-bold ${(trade.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {formatCurrency(trade.pnl || 0)}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    Exit Date & Time
                  </h3>
                  <p className="text-lg">{trade.exitDate ? formatDateTime(trade.exitDate) : "Open"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Exit Price</h3>
                  <p className="text-lg">{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "Open"}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Fees</h3>
                  <p className="text-lg">{trade.fees ? formatCurrency(trade.fees) : "-"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Strategy</h3>
                <p className="text-lg">{trade.strategy || "N/A"}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Emotional State</h3>
                <p className="text-lg">{trade.emotionalState || "N/A"}</p>
              </div>
              
              {trade.contractMultiplier && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Contract Multiplier
                  </h3>
                  <p className="text-lg">{trade.contractMultiplier}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                  <Tag className="h-4 w-4 mr-1" />
                  Tags
                </h3>
                {trade.tags && trade.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {trade.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 rounded-md bg-muted text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No tags</p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1 flex items-center">
                  <FileBarChart className="h-4 w-4 mr-1" />
                  Source
                </h3>
                <div className="flex items-center">
                  {trade.source === "import" ? (
                    <span className="flex items-center text-sm">
                      <FileBarChart className="h-4 w-4 mr-1" />
                      Imported from {trade.importSource || "file"}
                    </span>
                  ) : (
                    <span className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-1" />
                      Manual entry
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Notes */}
      {trade.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line">{trade.notes}</p>
          </CardContent>
        </Card>
      )}
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 w-full max-w-md shadow-lg">
            <h2 className="text-xl font-bold mb-4">Delete Trade</h2>
            <p className="mb-6">Are you sure you want to delete this trade? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={cancelDelete}
                className="px-4 py-2 border rounded-md hover:bg-muted"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                onClick={deleteTrade}
                className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:opacity-90 flex items-center"
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete Trade"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 