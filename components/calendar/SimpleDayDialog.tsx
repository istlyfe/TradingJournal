"use client";

import { useEffect, useState } from "react";
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

interface SimpleDayDialogProps {
  date: Date | null;
  trades: Trade[];
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleDayDialog({ date, trades, isOpen, onClose }: SimpleDayDialogProps) {
  // Local state as backup in case parent state has issues
  const [localIsOpen, setLocalIsOpen] = useState(false);
  
  // Sync with parent state
  useEffect(() => {
    console.log("SimpleDayDialog isOpen changed:", isOpen);
    setLocalIsOpen(isOpen);
  }, [isOpen]);
  
  // Debug logs
  useEffect(() => {
    console.log("SimpleDayDialog render:", { 
      parentOpen: isOpen, 
      localOpen: localIsOpen,
      date: date?.toDateString(), 
      tradeCount: trades.length 
    });
  });

  if (!isOpen) {
    return null;
  }

  // Function to handle closing the dialog
  const handleClose = () => {
    console.log("SimpleDayDialog: handleClose called");
    setLocalIsOpen(false);
    onClose();
  };

  return (
    // Regular UI dialog component
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center ${!localIsOpen && 'hidden'}`}
      onClick={(e) => {
        // Close when clicking backdrop (outside dialog)
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Dialog content */}
      <div className="relative bg-background p-6 rounded-lg shadow-lg w-[500px] max-w-[90vw] z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {date ? date.toDateString() : "No date"} - {trades.length} trades
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Body */}
        <div className="py-2">
          <h3 className="text-lg font-semibold mb-4">Trades for this day:</h3>
          
          {trades.length > 0 ? (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {trades.map(trade => (
                <div key={trade.id} className="p-3 border rounded-md">
                  <div><strong>Symbol:</strong> {trade.symbol}</div>
                  <div><strong>Direction:</strong> {trade.direction}</div>
                  <div><strong>P&L:</strong> {formatCurrency(trade.pnl || 0)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No trades available for this date.</p>
          )}
        </div>
      </div>
    </div>
  );
} 