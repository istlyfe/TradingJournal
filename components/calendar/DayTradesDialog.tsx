"use client";

import { useState, useEffect } from "react";
import { Trade } from "@/types/trade";
import { formatCurrency } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

interface DayTradesDialogProps {
  date: Date | null;
  trades: Trade[];
  isOpen: boolean;
  onClose: () => void;
}

export function DayTradesDialog({ date, trades, isOpen, onClose }: DayTradesDialogProps) {
  const router = useRouter();

  // Debug logs to help identify issues
  useEffect(() => {
    if (isOpen) {
      console.log("Dialog opened with date:", date?.toDateString());
      console.log("Trades in dialog:", trades.length, trades);
    }
  }, [isOpen, date, trades]);

  // If we don't have date data, or the dialog shouldn't be open, don't render anything
  if (!date || !isOpen) return null;

  // Calculate simple metrics
  const totalPnl = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winCount = trades.filter(trade => (trade.pnl || 0) > 0).length;
  const lossCount = trades.filter(trade => (trade.pnl || 0) < 0).length;
  
  // Handle trade click
  const handleTradeClick = (tradeId: string) => {
    router.push(`/trades/${tradeId}`);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader className="flex flex-row items-center justify-between pb-2">
          <DialogTitle className="flex items-center gap-3">
            {date.toDateString()} • 
            <span className={totalPnl >= 0 ? "text-green-500" : "text-red-500"}>
              {formatCurrency(totalPnl)}
            </span>
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Simple metrics */}
          <div className="grid grid-cols-3 gap-4 py-3 border-y">
            <div>
              <p className="text-sm text-muted-foreground">Total Trades</p>
              <p className="text-xl font-medium">{trades.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Winners</p>
              <p className="text-xl font-medium">{winCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Losers</p>
              <p className="text-xl font-medium">{lossCount}</p>
            </div>
          </div>

          {/* Trades list */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {trades.map(trade => (
              <div 
                key={trade.id}
                className="p-3 border rounded-md hover:bg-accent cursor-pointer"
                onClick={() => handleTradeClick(trade.id)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{trade.symbol}</span>
                    <span className={`px-2 py-0.5 text-xs rounded ${
                      trade.direction === 'LONG' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {trade.direction}
                    </span>
                  </div>
                  <span className={`font-medium ${(trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(trade.pnl || 0)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Entry:</span>{" "}
                    {new Date(trade.entryDate).toLocaleString()}
                  </div>
                  {trade.exitDate && (
                    <div>
                      <span className="text-muted-foreground">Exit:</span>{" "}
                      {new Date(trade.exitDate).toLocaleString()}
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Quantity:</span>{" "}
                    {trade.quantity}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price:</span>{" "}
                    {trade.entryPrice}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 