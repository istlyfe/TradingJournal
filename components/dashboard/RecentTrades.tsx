"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Edit, Eye, ArrowUp, ArrowDown, Clock, Tag, Filter } from "lucide-react";
import { Trade } from "@/types/trade";
import { formatCurrency } from "@/lib/utils";
import { useAccounts } from "@/hooks/useAccounts";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function RecentTrades() {
  const router = useRouter();
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const { selectedAccounts } = useAccounts();
  
  // Load trades from localStorage
  useEffect(() => {
    const storedTrades = localStorage.getItem('tradingJournalTrades');
    if (storedTrades) {
      // Convert from Record<string, Trade> to Trade[]
      const tradesRecord = JSON.parse(storedTrades);
      const tradesArray = Object.values(tradesRecord) as Trade[];
      setTrades(tradesArray);
    } else {
      setTrades([]);
    }
  }, []);
  
  // Listen for account selection changes
  useEffect(() => {
    // Force re-render when selected accounts change
  }, [selectedAccounts]);
  
  // Filter trades by selected accounts
  const filteredTrades = selectedAccounts.length > 0
    ? trades.filter(trade => trade.accountId && selectedAccounts.includes(trade.accountId))
    : trades; // Show all trades if no accounts are selected
  
  // Get recent trades (most recent 5)
  const recentTrades = [...filteredTrades]
    .sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
    .slice(0, 5);
  
  // Navigate to trade details
  const viewTradeDetails = (tradeId: string) => {
    router.push(`/trades/${tradeId}`);
  };
  
  // Navigate to edit trade
  const editTrade = (tradeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    router.push(`/trades/${tradeId}/edit`);
  };
  
  // Toggle expanded view for a trade
  const toggleExpand = (tradeId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    setExpandedTrade(expandedTrade === tradeId ? null : tradeId);
  };
  
  // View all trades
  const viewAllTrades = () => {
    router.push("/trades");
  };
  
  return (
    <div className="space-y-3">
      {selectedAccounts.length === 0 && (
        <Alert>
          <Filter className="h-4 w-4" />
          <AlertDescription>
            No accounts selected. Showing all trades. Use the account filter to select specific accounts.
          </AlertDescription>
        </Alert>
      )}
      
      {recentTrades.length > 0 ? (
        <>
          <div className="space-y-3">
            {recentTrades.map((trade) => (
              <div 
                key={trade.id}
                className="border rounded-md hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => viewTradeDetails(trade.id)}
              >
                <div className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                        (trade.pnl || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="font-medium">{trade.symbol}</span>
                      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        trade.direction === 'LONG' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {trade.direction}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${(trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(trade.pnl || 0)}
                      </span>
                      <button 
                        onClick={(e) => toggleExpand(trade.id, e)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {expandedTrade === trade.id ? 
                          <ArrowUp className="h-4 w-4" /> : 
                          <ArrowDown className="h-4 w-4" />
                        }
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-xs text-muted-foreground mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>
                      {new Date(trade.entryDate).toLocaleDateString()} {new Date(trade.entryDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                    {trade.strategy && (
                      <span className="ml-2 bg-muted px-1.5 py-0.5 rounded">
                        {trade.strategy}
                      </span>
                    )}
                  </div>
                  
                  {expandedTrade === trade.id && (
                    <div className="mt-3 pt-3 border-t text-sm">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        <div>
                          <span className="text-xs text-muted-foreground">Entry Price</span>
                          <p>${trade.entryPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Exit Price</span>
                          <p>{trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : "Open"}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Quantity</span>
                          <p>{trade.quantity}</p>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Fees</span>
                          <p>{trade.fees ? formatCurrency(trade.fees) : "-"}</p>
                        </div>
                      </div>
                      
                      {trade.tags && trade.tags.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-muted-foreground flex items-center mb-1">
                            <Tag className="h-3 w-3 mr-1" />
                            Tags
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {trade.tags.map((tag, index) => (
                              <span key={index} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={(e) => viewTradeDetails(trade.id)}
                          className="text-xs flex items-center text-primary"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </button>
                        <button
                          onClick={(e) => editTrade(trade.id, e)}
                          className="text-xs flex items-center text-primary"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <button
            onClick={viewAllTrades}
            className="w-full text-center text-sm text-primary py-2 border rounded-md hover:bg-muted/30"
          >
            View All Trades
          </button>
        </>
      ) : (
        <div className="text-center py-6">
          <p className="text-muted-foreground mb-2">No trades found</p>
          <button
            onClick={() => router.push("/trades/new")}
            className="text-sm text-primary hover:underline"
          >
            Add your first trade
          </button>
        </div>
      )}
    </div>
  );
} 