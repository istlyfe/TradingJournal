"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TradeList } from "@/components/trades/TradeList";
import { CsvImport } from "@/components/trades/CsvImport";
import { useTrades } from "@/hooks/useTrades";

export default function TradesPage() {
  const { trades, isLoading, refetchTrades } = useTrades();
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTradesDeleted = () => {
    refetchTrades();
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Trades</h1>
        <CsvImport />
      </div>
      
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
