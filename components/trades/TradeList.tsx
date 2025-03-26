"use client";

import { useState, useEffect } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { Trade } from "@/types/trade";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface TradeListProps {
  trades?: Trade[];
  onTradesDeleted?: () => void;
}

export function TradeList({ trades = [], onTradesDeleted }: TradeListProps) {
  const { selectedAccounts } = useAccounts();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [localTrades, setLocalTrades] = useState<Trade[]>([]);
  
  // Store all trades to manage both filtered and unfiltered states
  useEffect(() => {
    try {
      // If trades are passed as props, use them
      if (trades && trades.length > 0) {
        setLocalTrades(trades);
        setLoading(false);
        return;
      }
      
      // Otherwise, load from localStorage
      const storedTrades = localStorage.getItem('trades');
      if (storedTrades) {
        const parsedTrades = JSON.parse(storedTrades);
        console.log("Loaded trades from localStorage:", parsedTrades.length);
        setLocalTrades(parsedTrades);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading trades:', error);
      toast({
        variant: "destructive",
        title: "Error loading trades",
        description: "Failed to load trades from storage."
      });
      setLoading(false);
    }
  }, [trades, toast]);
  
  // Filter trades by selected accounts
  const filteredTrades = selectedAccounts.length > 0
    ? localTrades.filter(trade => trade.accountId && selectedAccounts.includes(trade.accountId))
    : localTrades;
  
  // Handle deleting trades with a direct ID-based approach
  const handleDeleteTrades = (selectedIndices: number[]) => {
    try {
      if (selectedIndices.length === 0) {
        toast({
          variant: "destructive",
          title: "No trades selected",
          description: "Please select trades to delete."
        });
        return;
      }
      
      console.log("DELETE HANDLER CALLED with indices:", selectedIndices);
      
      // Get the IDs of selected trades from the filtered list
      const tradeIdsToDelete = selectedIndices.map(index => {
        if (index < filteredTrades.length) {
          return filteredTrades[index]?.id;
        }
        return null;
      }).filter(Boolean) as string[];
      
      console.log("Trade IDs to delete:", tradeIdsToDelete);
      
      if (tradeIdsToDelete.length === 0) {
        toast({
          variant: "destructive",
          title: "No valid trades selected",
          description: "Could not identify trades to delete."
        });
        return;
      }
      
      // Remove selected trades from the full list
      const updatedTrades = localTrades.filter(trade => !tradeIdsToDelete.includes(trade.id));
      
      console.log("Before deletion:", localTrades.length, "After deletion:", updatedTrades.length);
      console.log(`Removing ${localTrades.length - updatedTrades.length} trades`);
      
      // Update localStorage directly
      localStorage.setItem('trades', JSON.stringify(updatedTrades));
      
      // Update state
      setLocalTrades(updatedTrades);
      
      toast({
        title: `Deleted ${tradeIdsToDelete.length} trade${tradeIdsToDelete.length !== 1 ? 's' : ''}`,
        description: "Selected trades have been removed."
      });
      
      // Show a more visible confirmation
      alert(`Successfully deleted ${tradeIdsToDelete.length} trade${tradeIdsToDelete.length !== 1 ? 's' : ''}`);
      
      // Call callback if provided
      if (onTradesDeleted) {
        onTradesDeleted();
      }
    } catch (error) {
      console.error('Error deleting trades:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete trades",
        description: "An error occurred while deleting trades."
      });
    }
  };
  
  if (loading) {
    return <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Your Trades</h1>
      
      {selectedAccounts.length === 0 && (
        <Alert className="mb-4">
          <Filter className="h-4 w-4" />
          <AlertDescription>
            No accounts selected. Select at least one account to see trades.
          </AlertDescription>
        </Alert>
      )}
      
      {filteredTrades.length === 0 ? (
        <div className="text-center p-8">
          <p className="mb-4">You haven't added any trades yet.</p>
          <Button asChild>
            <Link href="/add-trade">Add Your First Trade</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-muted-foreground">
            <p>Select trades by clicking the checkbox in each row you want to delete, then click "Delete Selected".</p>
            <p className="mt-1">{filteredTrades.length} trades displayed.</p>
          </div>
          <DataTable 
            columns={columns}
            data={filteredTrades}
            onDeleteRows={handleDeleteTrades}
          />
        </>
      )}
    </div>
  );
} 