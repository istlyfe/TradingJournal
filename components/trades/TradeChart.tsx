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

export function TradeChart({ trade, isOpen, setIsOpen }: TradeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !trade || !containerRef.current) return;

    setIsLoading(true);
    setError(null);

    // Clear any existing widgets
    containerRef.current.innerHTML = "";

    // Create container div for TradingView widget
    const widgetContainer = document.createElement("div");
    widgetContainer.id = "tradingview-widget";
    widgetContainer.style.width = "100%";
    widgetContainer.style.height = "100%";
    containerRef.current.appendChild(widgetContainer);

    const loadTradingViewScript = () => {
      return new Promise<void>((resolve, reject) => {
        // Check if TradingView script is already loaded
        if (window.TradingView) {
          resolve();
          return;
        }

        // Load TradingView script if not already loaded
        const script = document.createElement("script");
        script.id = "tradingview-widget-script";
        script.src = "https://s3.tradingview.com/tv.js";
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load TradingView script"));
        document.head.appendChild(script);
      });
    };

    const initializeWidget = () => {
      // Format dates for the chart range
      const entryDate = new Date(trade.entryDate);
      const exitDate = trade.exitDate ? new Date(trade.exitDate) : new Date();
      
      // Calculate a range that extends a bit before entry and after exit
      const startDate = new Date(entryDate);
      startDate.setHours(startDate.getHours() - 24); // 24 hours before
      
      const endDate = new Date(exitDate);
      endDate.setHours(endDate.getHours() + 24); // 24 hours after
      
      // Format dates for TradingView
      const dateFrom = format(startDate, "yyyy-MM-dd");
      const dateTo = format(endDate, "yyyy-MM-dd");

      try {
        // Create the TradingView widget
        new window.TradingView.widget({
          width: "100%",
          height: "100%",
          symbol: trade.symbol,
          interval: "15",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#f1f3f6",
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: true,
          save_image: true,
          container_id: "tradingview-widget",
          studies: ["MASimple@tv-basicstudies"],
          time_frames: [
            { text: "1D", resolution: "15" },
            { text: "1W", resolution: "60" },
            { text: "1M", resolution: "D" }
          ],
          range: dateFrom + "/" + dateTo,
          overrides: {
            "mainSeriesProperties.candleStyle.upColor": "#26a69a",
            "mainSeriesProperties.candleStyle.downColor": "#ef5350",
            "mainSeriesProperties.candleStyle.wickUpColor": "#26a69a",
            "mainSeriesProperties.candleStyle.wickDownColor": "#ef5350"
          }
        });
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error initializing TradingView widget:", err);
        setError("Failed to initialize chart. Please try again.");
        setIsLoading(false);
      }
    };

    // Load script then initialize widget
    loadTradingViewScript()
      .then(initializeWidget)
      .catch(err => {
        console.error("Error loading TradingView:", err);
        setError("Failed to load TradingView. Please check your internet connection.");
        setIsLoading(false);
      });

    // Cleanup
    return () => {
      setIsLoading(false);
      setError(null);
    };
  }, [isOpen, trade]);

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
            
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
                <p className="text-red-500">{error}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Make sure you're connected to the internet and try again.
                </p>
              </div>
            )}
            
            <div ref={containerRef} className="w-full h-full"></div>
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