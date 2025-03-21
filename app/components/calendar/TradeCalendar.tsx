"use client";

import { useState } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { format, parseISO, isSameDay, isValid } from 'date-fns';
import { TradeType } from '@/types/trade';
import { cn } from '@/lib/utils';

interface TradeCalendarProps {
  trades: Record<string, TradeType>;
}

export default function TradeCalendar({ trades }: TradeCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showDialog, setShowDialog] = useState(false);
  
  // Safely parse ISO date string
  const safeParseISO = (dateString: string): Date | null => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? date : null;
    } catch (e) {
      console.error("Invalid date format:", dateString);
      return null;
    }
  };
  
  // Get trades for selected date
  const getTradesForDate = (date: Date | undefined) => {
    // Return empty array if date is undefined or invalid
    if (!date || !isValid(date)) return [];
    
    try {
      return Object.values(trades).filter(trade => {
        if (!trade.entryDate) return false;
        
        const tradeDate = safeParseISO(trade.entryDate);
        return tradeDate ? isSameDay(tradeDate, date) : false;
      }).sort((a, b) => {
        const dateA = safeParseISO(a.entryDate);
        const dateB = safeParseISO(b.entryDate);
        
        if (!dateA || !dateB) return 0;
        return dateA.getTime() - dateB.getTime();
      });
    } catch (error) {
      console.error("Error getting trades for date:", error, date);
      return [];
    }
  };
  
  // Get daily P&L for a specific date
  const getDailyPnL = (date: Date | undefined) => {
    // Return 0 if date is undefined or invalid
    if (!date || !isValid(date)) return 0;
    
    try {
      const tradesOnDate = getTradesForDate(date);
      return tradesOnDate.reduce((total, trade) => total + (trade.pnl || 0), 0);
    } catch (error) {
      console.error("Error calculating daily P&L:", error, date);
      return 0;
    }
  };
  
  // Handle date selection
  const handleSelect = (day: Date | undefined) => {
    if (!day || !isValid(day)) {
      console.warn("Invalid date selected");
      return;
    }
    
    try {
      setSelectedDate(day);
      const tradesOnSelected = getTradesForDate(day);
      
      if (tradesOnSelected.length > 0) {
        setShowDialog(true);
      } else {
        setShowDialog(false);
      }
    } catch (error) {
      console.error("Error handling date selection:", error);
      // Safely reset the state even if an error occurs
      setSelectedDate(undefined);
      setShowDialog(false);
    }
  };
  
  const selectedDateTrades = getTradesForDate(selectedDate);
  
  // Day component used in Calendar
  const Day = ({ date, selectedDate }: { date: Date | undefined; selectedDate?: Date | undefined }) => {
    if (!date || !isValid(date)) {
      return <div className="h-14 w-14 p-0" />;
    }

    try {
      const tradesOnDate = getTradesForDate(date);
      const dailyPnL = getDailyPnL(date);
      
      // Determine the indicator class based on PnL
      let indicatorClass = "bg-gray-300 dark:bg-gray-600";
      if (tradesOnDate.length > 0) {
        indicatorClass = dailyPnL > 0 
          ? "bg-green-500 dark:bg-green-400" 
          : dailyPnL < 0 
            ? "bg-red-500 dark:bg-red-400" 
            : "bg-gray-300 dark:bg-gray-600";
      }

      return (
        <div className="relative h-14 w-14 p-0">
          <div className="h-full w-full flex items-center justify-center text-base">
            {date.getDate()}
          </div>
          {tradesOnDate.length > 0 && (
            <div
              className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 h-2 w-2 rounded-full ${indicatorClass}`}
            />
          )}
        </div>
      );
    } catch (error) {
      console.error("Error rendering day:", error, date);
      // Return a simple day display without indicators if we encounter an error
      return (
        <div className="h-14 w-14 p-0 flex items-center justify-center text-base">
          {date.getDate()}
        </div>
      );
    }
  };
  
  return (
    <div className="w-full p-6 bg-background dark:bg-gray-800 rounded-lg border dark:border-gray-700 shadow-lg">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={handleSelect}
        className="w-full p-4 bg-background dark:bg-gray-800"
        classNames={{
          day_today: "bg-green-100 dark:bg-green-900/20 font-semibold text-green-600 dark:text-green-400",
          day_selected: "bg-primary dark:bg-primary/80 text-primary-foreground",
          day_outside: "text-muted-foreground opacity-50",
          cell: "relative p-0 focus-within:relative focus-within:z-20 h-14 w-14",
          button: "h-14 w-14 p-0 font-normal text-base",
          head_cell: "text-muted-foreground rounded-md w-14 font-medium text-sm",
          table: "w-full border-collapse space-y-1",
          caption: "flex justify-center py-4 relative items-center text-xl font-medium"
        }}
        components={{
          Day: Day
        }}
      />
      
      {/* Dialog for displaying trades */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedDate && isValid(selectedDate) ? format(selectedDate, 'MMMM d, yyyy') : 'Trades'}
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedDate && isValid(selectedDate) && (
                <>Trades for {format(selectedDate, 'MMMM d, yyyy')}</>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {selectedDate && isValid(selectedDate) && getTradesForDate(selectedDate).map((trade) => (
              <div 
                key={trade.id} 
                className={cn(
                  "p-4 rounded-md border transition-colors",
                  trade.pnl && trade.pnl > 0 
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" 
                    : trade.pnl && trade.pnl < 0
                      ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                      : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50"
                )}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold">{trade.symbol}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={trade.direction === 'long' ? 'default' : 'destructive'}>
                        {trade.direction === 'long' ? 'Long' : 'Short'}
                      </Badge>
                      {trade.strategy && (
                        <Badge variant="outline">{trade.strategy}</Badge>
                      )}
                    </div>
                  </div>
                  <div className={cn(
                    "text-xl font-bold",
                    trade.pnl && trade.pnl > 0 ? "text-green-500" : 
                    trade.pnl && trade.pnl < 0 ? "text-red-500" : "text-gray-500"
                  )}>
                    ${trade.pnl ? trade.pnl.toFixed(2) : '0.00'}
                  </div>
                </div>
                
                {trade.notes && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Notes</p>
                    <p className="mt-1">{trade.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 