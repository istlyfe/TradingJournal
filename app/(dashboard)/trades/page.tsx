"use client";

import React, { useState, useEffect } from "react";
import { Trade } from "@/types/trade";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";
import { CsvImport } from "@/components/trades/CsvImport";
import { useAccounts } from "@/hooks/useAccounts";
import { 
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Plus,
  Download,
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "@/components/trades/columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function TradesPage() {
  // State for trading data
  const [trades, setTrades] = useState<Record<string, Trade>>({});
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  const [showImport, setShowImport] = useState(false);
  const { selectedAccounts } = useAccounts();
  
  // Load and filter trades based on selectedAccounts
  useEffect(() => {
    const loadTrades = () => {
      try {
        const storedTrades = localStorage.getItem('tradingJournalTrades') || '{}';
        const parsedTrades = JSON.parse(storedTrades);
        setTrades(parsedTrades);
        
        // Convert object to array
        const tradesArray = Object.values(parsedTrades);
        
        // Filter trades by selected accounts
        const filteredArray = selectedAccounts.length > 0 
          ? tradesArray.filter((trade: Trade) => 
              !trade.accountId || selectedAccounts.includes(trade.accountId))
          : tradesArray;
        
        // Sort by newest first
        filteredArray.sort((a: Trade, b: Trade) => 
          new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
        );
        
        setFilteredTrades(filteredArray);
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
      }
    };
    
    const handleAccountSelectionChange = () => loadTrades();
    
    window.addEventListener('trades-updated', handleTradesUpdated);
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('account-selection-change', handleAccountSelectionChange);
    
    return () => {
      window.removeEventListener('trades-updated', handleTradesUpdated);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('account-selection-change', handleAccountSelectionChange);
    };
  }, [selectedAccounts]); // Re-run when selectedAccounts changes

  // Handle the import dialog
  const handleImportClose = () => {
    setShowImport(false);
  };

  // Calculate quick stats
  const totalTrades = filteredTrades.length;
  const winningTrades = filteredTrades.filter(t => (t.pnl || 0) > 0).length;
  const losingTrades = filteredTrades.filter(t => (t.pnl || 0) < 0).length;
  
  const totalPnL = filteredTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Trades</h2>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowImport(true)} className="gap-2">
            <Download className="h-4 w-4" />
            Import Trades
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrades}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "text-2xl font-bold",
              totalPnL > 0 ? "text-green-500" : totalPnL < 0 ? "text-red-500" : ""
            )}>
              {formatCurrency(totalPnL)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Win/Loss</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <TrendingUp className="h-4 w-4 text-green-500" />
              {winningTrades}
              <span className="text-muted-foreground">/</span>
              <TrendingDown className="h-4 w-4 text-red-500" />
              {losingTrades}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trades Table */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle>All Trades</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="rounded-full bg-muted p-3">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No trades found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {selectedAccounts.length === 0 
                  ? "No accounts selected. Please select at least one account to view trades."
                  : "No trades found for the selected accounts. Import trades or add them manually."}
              </p>
              <Button
                onClick={() => setShowImport(true)}
                className="mt-4"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Import Trades
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <DataTable columns={columns} data={filteredTrades} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <AlertDialog open={showImport} onOpenChange={setShowImport}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Import Trades</AlertDialogTitle>
            <AlertDialogDescription>
              Import your trading history from a CSV file or connect to your trading platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <CsvImport onClose={handleImportClose} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 