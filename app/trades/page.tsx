"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TradeList } from "@/components/trades/TradeList";
import { CsvImport } from "@/components/trades/CsvImport";
import { useTrades } from "@/hooks/useTrades";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileX, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TradesPage() {
  const { trades, isLoading, refetchTrades } = useTrades();
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleTradesDeleted = () => {
    try {
      refetchTrades();
      setRefreshKey(prev => prev + 1);
      setError(null);
    } catch (err) {
      setError("Error refreshing trades. Please try again.");
      console.error("Error refreshing trades:", err);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trades</h1>
        <CsvImport />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Trade History</CardTitle>
          <CardDescription>
            View, filter, and analyze your trading history
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Loading trades...
            </div>
          ) : trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-4">
              <div className="flex items-center text-muted-foreground">
                <FileX className="h-6 w-6 mr-2" />
                <span>No trades found. Import trades using the CSV import tool.</span>
              </div>
              <Button onClick={() => document.getElementById('csv-import-button')?.click()}>
                Import Trades
              </Button>
            </div>
          ) : (
            <TradeList 
              key={refreshKey} 
              trades={trades} 
              onTradesDeleted={handleTradesDeleted} 
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
