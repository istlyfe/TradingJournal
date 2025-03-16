"use client";

import { useState } from "react";
import { Plus, X, ArrowUp, ArrowDown, Trash2 } from "lucide-react";

// Mock data for the watchlist
const initialWatchlist = [
  { id: 1, symbol: "AAPL", price: 182.52, change: 1.23, changePercent: 0.68 },
  { id: 2, symbol: "MSFT", price: 418.32, change: -2.14, changePercent: -0.51 },
  { id: 3, symbol: "NVDA", price: 925.17, change: 15.43, changePercent: 1.70 },
  { id: 4, symbol: "TSLA", price: 177.83, change: -5.29, changePercent: -2.89 },
  { id: 5, symbol: "AMZN", price: 178.12, change: 0.87, changePercent: 0.49 },
];

export function WatchlistManager() {
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const [newSymbol, setNewSymbol] = useState("");

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSymbol.trim()) return;

    // In a real app, you would fetch real-time price data
    const mockPrice = parseFloat((Math.random() * 200 + 100).toFixed(2));
    const mockChange = parseFloat((Math.random() * 10 - 5).toFixed(2));
    const mockChangePercent = parseFloat(((mockChange / mockPrice) * 100).toFixed(2));

    setWatchlist(prev => [
      ...prev, 
      { 
        id: Date.now(), 
        symbol: newSymbol.toUpperCase(),
        price: mockPrice,
        change: mockChange,
        changePercent: mockChangePercent
      }
    ]);
    setNewSymbol("");
  };

  const handleRemoveSymbol = (id: number) => {
    setWatchlist(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddSymbol} className="flex gap-2">
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          placeholder="Add symbol (e.g. AAPL)"
          className="flex-1 px-3 py-2 border rounded-md border-input bg-transparent text-sm placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          <span>Add</span>
        </button>
      </form>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4">Symbol</th>
              <th className="text-right py-3 px-4">Price</th>
              <th className="text-right py-3 px-4">Change</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-muted-foreground">
                  Your watchlist is empty. Add symbols to track them.
                </td>
              </tr>
            ) : (
              watchlist.map((item) => (
                <tr key={item.id} className="border-b hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium">{item.symbol}</td>
                  <td className="text-right py-3 px-4">${item.price.toFixed(2)}</td>
                  <td className="text-right py-3 px-4">
                    <div className={`flex items-center justify-end gap-2 ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {item.change >= 0 ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                      <span>${Math.abs(item.change).toFixed(2)} ({item.changePercent.toFixed(2)}%)</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4">
                    <button
                      onClick={() => handleRemoveSymbol(item.id)}
                      className="p-1 text-muted-foreground hover:text-destructive rounded-md"
                      title="Remove from watchlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 