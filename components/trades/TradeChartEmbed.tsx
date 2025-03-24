"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trade } from "@/types/trade";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface TradeChartProps {
  trade: Trade | null;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function TradeChartEmbed({ trade, isOpen, setIsOpen }: TradeChartProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Create HTML string for direct embed
  const getChartHTML = (symbol: string) => {
    // Format the symbol properly for exchange prefixing
    let formattedSymbol = symbol;
    if (!formattedSymbol.includes(":")) {
      formattedSymbol = `NASDAQ:${formattedSymbol}`;
    }
    
    return `
      <!-- TradingView Widget BEGIN -->
      <div class="tradingview-widget-container" style="width: 100%; height: 100%;">
        <div id="tradingview_chart" style="width: 100%; height: 500px;"></div>
        <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
        <script type="text/javascript">
        setTimeout(function() {
          try {
            new TradingView.widget({
              "width": "100%",
              "height": 500,
              "symbol": "${formattedSymbol}",
              "interval": "15",
              "timezone": "Etc/UTC",
              "theme": "dark",
              "style": "1",
              "locale": "en",
              "toolbar_bg": "#f1f3f6",
              "enable_publishing": false,
              "allow_symbol_change": true,
              "container_id": "tradingview_chart"
            });
            // Let the parent component know we're done loading
            document.dispatchEvent(new CustomEvent('tradingViewLoaded'));
          } catch(e) {
            console.error('TradingView widget error:', e);
            document.dispatchEvent(new CustomEvent('tradingViewError'));
          }
        }, 0);
        </script>
      </div>
      <!-- TradingView Widget END -->
    `;
  };
  
  useEffect(() => {
    // Set up event listeners for the embedded chart
    const handleLoaded = () => {
      setIsLoading(false);
    };
    
    const handleError = () => {
      setIsLoading(false);
    };
    
    document.addEventListener('tradingViewLoaded', handleLoaded);
    document.addEventListener('tradingViewError', handleError);
    
    // Cleanup
    return () => {
      document.removeEventListener('tradingViewLoaded', handleLoaded);
      document.removeEventListener('tradingViewError', handleError);
    };
  }, []);

  // Reset loading state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      
      // Add a backup timeout to hide the loading state if events don't fire
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!trade) return null;

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
            
            <div 
              className="w-full h-full" 
              dangerouslySetInnerHTML={{ __html: getChartHTML(trade.symbol) }} 
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