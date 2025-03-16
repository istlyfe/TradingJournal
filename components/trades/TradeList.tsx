"use client";

import { useState, useEffect, useRef } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { Trade } from "@/types/trade";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { useToast } from "@/components/providers/toast-provider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Filter } from "lucide-react";

interface TradeListProps {
  trades?: Trade[];
  onTradesDeleted?: () => void;
}

export function TradeList({ trades = [], onTradesDeleted }: TradeListProps) {
  const { selectedAccounts } = useAccounts();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTradeIds, setSelectedTradeIds] = useState<string[]>([]);
  
  // Filter trades by selected accounts, or show all if none selected
  const filteredTrades = selectedAccounts.length > 0
    ? trades.filter(trade => trade.accountId !== undefined && selectedAccounts.includes(trade.accountId))
    : trades; // Show all trades if no accounts are selected

  // Track row selection
  const onRowSelectionChange = (rowIds: string[]) => {
    setSelectedTradeIds(rowIds);
  };

  // Add keyboard shortcut for deleting selected trades
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete key pressed when there are selected trades
      if (e.key === 'Delete' && selectedTradeIds.length > 0) {
        setDeleteDialogOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedTradeIds]);

  const handleDeleteTrades = (tradeIds: string[]) => {
    if (tradeIds.length === 0) return;

    try {
      // Get trades from localStorage
      const storedTrades = localStorage.getItem('tradingJournalTrades');
      if (!storedTrades) return;
      
      const tradesObj = JSON.parse(storedTrades);
      
      // Delete selected trades
      const updatedTrades = { ...tradesObj };
      let deletedCount = 0;
      
      tradeIds.forEach(id => {
        if (updatedTrades[id]) {
          delete updatedTrades[id];
          deletedCount++;
        }
      });
      
      // Save updated trades to localStorage
      localStorage.setItem('tradingJournalTrades', JSON.stringify(updatedTrades));
      
      // Show success toast
      toast({
        title: "Trades deleted",
        description: `Successfully deleted ${deletedCount} ${deletedCount === 1 ? 'trade' : 'trades'}.`,
      });
      
      // Reset selected trade IDs
      setSelectedTradeIds([]);
      
      // Call callback to refresh trades if provided
      if (onTradesDeleted) {
        onTradesDeleted();
      }
    } catch (error) {
      console.error("Error deleting trades:", error);
      toast({
        title: "Error",
        description: "Failed to delete trades. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {selectedAccounts.length === 0 && (
        <Alert>
          <Filter className="h-4 w-4" />
          <AlertDescription>
            No accounts selected. Showing all trades. Use the account filter to select specific accounts.
          </AlertDescription>
        </Alert>
      )}
      
      <DataTable
        columns={columns}
        data={filteredTrades}
        enableRowSelection
        onRowSelectionChange={onRowSelectionChange}
        onDeleteRows={handleDeleteTrades}
      />
      
      {selectedTradeIds.length > 0 && (
        <div className="text-xs text-right text-muted-foreground">
          {selectedTradeIds.length} {selectedTradeIds.length === 1 ? 'trade' : 'trades'} selected. 
          Press <kbd className="px-1 py-0.5 text-xs bg-muted rounded border">Delete</kbd> to remove.
        </div>
      )}
    </div>
  );
} 