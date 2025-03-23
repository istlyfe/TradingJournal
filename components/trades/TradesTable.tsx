"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { Trade } from "@/types/trade";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCOUNT_SELECTION_CHANGE } from "@/components/accounts/AccountFilter";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Filter } from "lucide-react";

interface TradesTableProps {
  trades: Record<string, Trade>;
}

export function TradesTable({ trades = {} }: TradesTableProps) {
  const { selectedAccounts } = useAccounts();
  const [localSelectedAccounts, setLocalSelectedAccounts] = useState<string[]>([]);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Keep local accounts in sync with the hook and events
  useEffect(() => {
    console.log("TradesTable: selectedAccounts updated:", selectedAccounts);
    
    // Only update local state if it's different from the current selectedAccounts
    if (JSON.stringify(localSelectedAccounts) !== JSON.stringify(selectedAccounts)) {
      setLocalSelectedAccounts(selectedAccounts);
    }
    
    const handleAccountSelectionChange = (e: CustomEvent) => {
      console.log("TradesTable: account selection changed event received");
      if (e.detail?.selectedAccounts) {
        const newAccounts = e.detail.selectedAccounts;
        if (JSON.stringify(localSelectedAccounts) !== JSON.stringify(newAccounts)) {
          setLocalSelectedAccounts(newAccounts);
          setForceUpdate(prev => prev + 1);
        }
      } else {
        // If no detail, just force update with current selected accounts
        setForceUpdate(prev => prev + 1);
      }
    };
    
    const handleTradesUpdatedEvent = () => {
      console.log("TradesTable: trades-updated event received");
      setForceUpdate(prev => prev + 1);
    };
    
    const handleStorageEvent = () => {
      console.log("TradesTable: storage event received");
      setForceUpdate(prev => prev + 1);
    };
    
    // Add event listeners with proper type casting
    window.addEventListener(ACCOUNT_SELECTION_CHANGE, handleAccountSelectionChange as EventListener);
    window.addEventListener('account-selection-change', handleAccountSelectionChange as EventListener);
    window.addEventListener('trades-updated', handleTradesUpdatedEvent);
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      // Remove event listeners with proper type casting
      window.removeEventListener(ACCOUNT_SELECTION_CHANGE, handleAccountSelectionChange as EventListener);
      window.removeEventListener('account-selection-change', handleAccountSelectionChange as EventListener);
      window.removeEventListener('trades-updated', handleTradesUpdatedEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [selectedAccounts, localSelectedAccounts]); // Include localSelectedAccounts to fix loop issue
  
  // Filter trades by selected accounts, or show no trades if none selected
  const filteredTrades = useMemo(() => {
    console.log("Filtering trades with accounts:", localSelectedAccounts);
    
    if (localSelectedAccounts.length === 0) return [];
    
    return Object.values(trades).filter(trade => {
      // Include all trades that either:
      // 1. Have matching accountId with one of the selected accounts
      // 2. Don't have an accountId at all (legacy trades)
      return !trade.accountId || localSelectedAccounts.includes(trade.accountId);
    });
  }, [trades, localSelectedAccounts, forceUpdate]);

  const handleDeleteRows = (rowIds: string[]) => {
    try {
      // Get current trades from localStorage
      const currentTrades = JSON.parse(localStorage.getItem('tradingJournalTrades') || '{}');
      
      // Remove the selected trades
      rowIds.forEach(id => {
        delete currentTrades[id];
      });
      
      // Save back to localStorage
      localStorage.setItem('tradingJournalTrades', JSON.stringify(currentTrades));
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('trades-updated'));
      
      toast({
        title: "Trades deleted",
        description: `Successfully deleted ${rowIds.length} trade${rowIds.length === 1 ? '' : 's'}.`,
      });
      
      // Force a refresh in the current component
      setForceUpdate(prev => prev + 1);
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
    <Card>
      <CardHeader>
        <CardTitle>Trades Table</CardTitle>
        <CardDescription>
          Advanced table view with column sorting and filtering
        </CardDescription>
      </CardHeader>
      <CardContent>
        {localSelectedAccounts.length === 0 ? (
          <Alert>
            <Filter className="h-4 w-4" />
            <AlertDescription>
              No accounts selected. Use the account filter in the top bar to select specific accounts to view trades.
            </AlertDescription>
          </Alert>
        ) : (
          <DataTable 
            columns={columns} 
            data={filteredTrades} 
            enableRowSelection={true}
            onRowSelectionChange={setSelectedRows}
            onDeleteRows={handleDeleteRows}
            getRowId={(row: Trade) => row.id}
          />
        )}
      </CardContent>
    </Card>
  );
} 