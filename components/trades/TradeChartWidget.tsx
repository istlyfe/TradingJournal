"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trade } from "@/types/trade";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import TradingViewWidget from 'react-tradingview-widget';

interface TradeChartProps {
  trade: Trade | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function TradeChartWidget({ trade, isOpen, setIsOpen }: TradeChartProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!trade) return null;

  // Format the symbol properly for exchange prefixing
  let formattedSymbol = trade.symbol;
  if (!formattedSymbol.includes(":")) {
    formattedSymbol = `NASDAQ:${formattedSymbol}`;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {trade.symbol} - {trade.direction === "LONG" ? "Long" : "Short"} Trade
            <span className="ml-4 text-sm font-normal text-muted-foreground">
              {format(new Date(trade.entryDate), "MMM dd, yyyy HH:mm")}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          {/* Trade details summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-md">
            <div>
              <p className="text-sm text-muted-foreground">Entry</p>
              <p className="font-medium">${trade.entryPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Exit</p>
              <p className="font-medium">${trade.exitPrice?.toFixed(2) || "-"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">P&L</p>
              <p className={`font-medium ${trade.profitLoss && trade.profitLoss > 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${trade.profitLoss?.toFixed(2) || "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Shares</p>
              <p className="font-medium">{trade.quantity}</p>
            </div>
          </div>
          
          {/* Entry/Exit Points Legend */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full ${trade.direction === "LONG" ? "bg-green-500" : "bg-red-500"}`}></div>
              <span>Entry: ${trade.entryPrice.toFixed(2)}</span>
            </div>
            {trade.exitPrice && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span>Exit: ${trade.exitPrice.toFixed(2)}</span>
              </div>
            )}
          </div>
          
          {/* TradingView Chart */}
          <div className="rounded-md border overflow-hidden h-[500px] relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading chart...</span>
              </div>
            )}
            
            <TradingViewWidget
              symbol={formattedSymbol}
              theme="Dark"
              autosize
              interval="15"
              timezone="Etc/UTC"
              style="1"
              locale="en"
              toolbar_bg="#f1f3f6"
              enable_publishing={false}
              hide_side_toolbar={false}
              allow_symbol_change={true}
              save_image={true}
              container_id="tradingview_chart"
              onLoadingComplete={() => setIsLoading(false)}
            />
          </div>
          
          {/* Notes */}
          {trade.notes && (
            <div className="p-4 bg-muted/30 rounded-md">
              <p className="text-sm font-medium mb-2">Notes</p>
              <p className="text-sm">{trade.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 