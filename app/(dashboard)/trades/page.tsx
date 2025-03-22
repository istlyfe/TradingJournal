"use client";

import { TradesTable } from "@/components/trades/TradesTable";
import { TradesHeader } from "@/components/trades/TradesHeader";
import { useState, useEffect, useRef } from "react";
import { Trade } from "@/types/trade";
import { useSearchParams } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileX, Info, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCOUNT_SELECTION_CHANGE } from "@/components/accounts/AccountFilter";
import { CsvImport } from "@/components/trades/CsvImport";

export default function TradesPage() {
  const [trades, setTrades] = useState<Record<string, Trade>>({});
  const [forceUpdate, setForceUpdate] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadTrades = () => {
      try {
        const storedTrades = localStorage.getItem('tradingJournalTrades') || '{}';
        setTrades(JSON.parse(storedTrades));
      } catch (error) {
        console.error("Error loading trades:", error);
      }
    };
    
    // Initial load
    loadTrades();
    
    // Handle trade updates
    const handleTradesUpdated = () => {
      console.log("Trades updated event received, refreshing trades table");
      loadTrades();
      setForceUpdate(prev => prev + 1);
    };
    
    // Handle storage events (from other tabs)
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'tradingJournalTrades' || e.key === 'tradingJournalSelectedAccounts') {
        console.log("Storage updated, refreshing trades");
        loadTrades();
        setForceUpdate(prev => prev + 1);
      }
    };
    
    // Handle account selection changes
    const handleAccountSelectionChange = () => {
      console.log("Account selection changed, refreshing trades");
      setForceUpdate(prev => prev + 1);
    };
    
    // Add event listeners
    window.addEventListener('trades-updated', handleTradesUpdated);
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener(ACCOUNT_SELECTION_CHANGE, handleAccountSelectionChange as EventListener);
    
    return () => {
      window.removeEventListener('trades-updated', handleTradesUpdated);
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener(ACCOUNT_SELECTION_CHANGE, handleAccountSelectionChange as EventListener);
    };
  }, []);
  
  // Force refresh when URL contains refresh parameter (used by CSV Import)
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam) {
      setForceUpdate(prev => prev + 1);
    }
  }, [searchParams]);

  const handleTradesDeleted = () => {
    try {
      localStorage.removeItem('tradingJournalTrades');
      setTrades({});
      setForceUpdate(prev => prev + 1);
      setError(null);
    } catch (err) {
      setError("Error refreshing trades. Please try again.");
      console.error("Error refreshing trades:", err);
    }
  };

  const handleImportClose = () => {
    setShowImport(false);
    // Force refresh the page with a timestamp query param
    window.location.href = `/trades?refresh=${Date.now()}`;
  };

  return (
    <div className="flex flex-col gap-4">
      <div ref={headerRef}>
        <TradesHeader onImportRequested={() => setShowImport(true)} isImportOpen={showImport} onImportClosed={() => setShowImport(false)} />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {Object.keys(trades).length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 bg-muted/20 rounded-lg border border-dashed">
          <div className="flex items-center text-muted-foreground">
            <FileX className="h-6 w-6 mr-2" />
            <span>No trades found. Import trades using the CSV import tool.</span>
          </div>
          <div className="flex gap-2">
            <Button variant="default" onClick={() => setShowImport(true)}>
              <FileUp className="mr-2 h-4 w-4" />
              Import Trades
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <TradesTable 
            trades={trades} 
            key={`trades-table-${forceUpdate}`} 
          />
        </div>
      )}
      
      {showImport && (
        <CsvImport 
          isOpen={showImport} 
          onClose={handleImportClose}
        />
      )}
    </div>
  );
} 