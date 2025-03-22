"use client";

import { useState, useEffect } from "react";
import { useAccounts } from "@/hooks/useAccounts";
import { Trade } from "@/types/trade";
import { columns } from "./columns";
import { DataTable } from "@/components/ui/data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCOUNT_SELECTION_CHANGE } from "@/components/accounts/AccountFilter";
import { useToast } from "@/components/ui/use-toast";

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
    setLocalSelectedAccounts(selectedAccounts);
    
    const handleAccountSelectionChange = (e: CustomEvent) => {
      if (e.detail?.selectedAccounts) {
        setLocalSelectedAccounts(e.detail.selectedAccounts);
        setForceUpdate(prev => prev + 1);
      }
    };
    
    window.addEventListener(ACCOUNT_SELECTION_CHANGE, handleAccountSelectionChange as EventListener);
    
    return () => {
      window.removeEventListener(ACCOUNT_SELECTION_CHANGE, handleAccountSelectionChange as EventListener);
    };
  }, [selectedAccounts]);
  
  // Filter trades by selected accounts, or show all if none selected
  const filteredTrades = localSelectedAccounts.length > 0
    ? Object.values(trades).filter(trade => 
        trade.accountId !== undefined && localSelectedAccounts.includes(trade.accountId)
      )
    : Object.values(trades);

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
        <DataTable 
          columns={columns} 
          data={filteredTrades} 
          enableRowSelection={true}
          onRowSelectionChange={setSelectedRows}
          onDeleteRows={handleDeleteRows}
          getRowId={(row: Trade) => row.id}
        />
      </CardContent>
    </Card>
  );
} 