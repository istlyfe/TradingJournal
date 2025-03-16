"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Trade } from "@/types/trade";
import { formatCurrency } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addDays, isWithinInterval, parseISO, subMonths, addMonths } from "date-fns";
import { useAccounts } from "@/hooks/useAccounts";
import { ACCOUNT_SELECTION_CHANGE } from "@/components/accounts/AccountFilter";

export function TradeCalendar() {
  const [trades, setTrades] = useState<Record<string, Trade>>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { selectedAccounts } = useAccounts();
  const [forceUpdate, setForceUpdate] = useState(0);
  
  // Load trades
  useEffect(() => {
    const storedTrades = localStorage.getItem('tradingJournalTrades');
    if (storedTrades) {
      setTrades(JSON.parse(storedTrades));
    }
  }, []);
  
  // Replace the current useEffect for listening to account changes with this one
  useEffect(() => {
    const handleSelectionChange = () => {
      // Force re-render when account selection changes
      setForceUpdate(prev => prev + 1);
      
      // Also get the latest selected accounts directly from localStorage
      const storedAccounts = localStorage.getItem('tradingJournalSelectedAccounts');
      if (storedAccounts) {
        console.log("Calendar detected account change:", storedAccounts);
      }
    };
    
    // Add both event listener and storage change listener for redundancy
    window.addEventListener(ACCOUNT_SELECTION_CHANGE, handleSelectionChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'tradingJournalSelectedAccounts') {
        handleSelectionChange();
      }
    });
    
    return () => {
      window.removeEventListener(ACCOUNT_SELECTION_CHANGE, handleSelectionChange);
      window.removeEventListener('storage', handleSelectionChange as any);
    };
  }, []);
  
  // Modify the getFilteredTrades dependency array to include forceUpdate
  const getFilteredTrades = useCallback(() => {
    console.log("Calendar filtering trades, selected accounts:", selectedAccounts);
    
    // If no accounts are selected, return empty array
    if (!selectedAccounts || selectedAccounts.length === 0) {
      console.log("No accounts selected, returning empty array");
      return [];
    }
    
    return Object.values(trades).filter(trade => 
      selectedAccounts.includes(trade.accountId)
    );
  }, [trades, selectedAccounts, forceUpdate]);
  
  // Calculate week summary for filtered trades
  const calculateWeekSummary = useCallback((weekStart: Date) => {
    const weekEnd = addDays(weekStart, 6);
    const weekTrades = getFilteredTrades().filter(trade => {
      const tradeDate = parseISO(trade.exitDate || trade.entryDate);
      return isWithinInterval(tradeDate, { start: weekStart, end: weekEnd });
    });

    const totalPnL = weekTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
    const winCount = weekTrades.filter(trade => (trade.pnl || 0) > 0).length;
    const lossCount = weekTrades.filter(trade => (trade.pnl || 0) < 0).length;
    const winRate = weekTrades.length > 0 ? (winCount / weekTrades.length) * 100 : 0;

    return {
      trades: weekTrades,
      totalPnL,
      winCount,
      lossCount,
      winRate,
    };
  }, [getFilteredTrades]);
  
  // Navigation methods
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
    setSelectedDate(null);
  };
  
  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
    setSelectedDate(null);
  };
  
  // Reset to current month
  const goToCurrentMonth = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };
  
  // Get calendar data
  const getCalendarData = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Get first day of month
    const firstDay = new Date(year, month, 1);
    const startingDay = firstDay.getDay(); // 0 = Sunday
    
    // Get last day of month
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    
    // Get days from previous month to fill first week
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = Array.from({ length: startingDay }, (_, i) => ({
      date: new Date(year, month - 1, prevMonthLastDay - startingDay + i + 1),
      isCurrentMonth: false
    }));
    
    // Get days of current month
    const currentMonthDays = Array.from({ length: totalDays }, (_, i) => ({
      date: new Date(year, month, i + 1),
      isCurrentMonth: true
    }));
    
    // Get days from next month to fill last week
    const remainingDays = (7 - ((startingDay + totalDays) % 7)) % 7;
    const nextMonthDays = Array.from({ length: remainingDays }, (_, i) => ({
      date: new Date(year, month + 1, i + 1),
      isCurrentMonth: false
    }));
    
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentDate]);
  
  const calendarDays = getCalendarData();
  
  // Get trades for a specific date
  const getTradesForDate = useCallback((date: Date) => {
    return getFilteredTrades().filter(trade => {
      const tradeDate = parseISO(trade.exitDate || trade.entryDate);
      return (
        tradeDate.getFullYear() === date.getFullYear() &&
        tradeDate.getMonth() === date.getMonth() &&
        tradeDate.getDate() === date.getDate()
      );
    });
  }, [getFilteredTrades]);
  
  // Calculate P&L for a specific date
  const getPnLForDate = useCallback((date: Date) => {
    const dateTrades = getTradesForDate(date);
    return dateTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  }, [getTradesForDate]);
  
  // Get selected day trades
  const selectedDayTrades = selectedDate ? getTradesForDate(selectedDate) : [];
  
  // If no accounts are selected, we should show an empty state
  if (selectedAccounts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Trading Calendar</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground">No accounts selected. Please select at least one account to view trades.</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Calendar Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Trading Calendar</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={goToCurrentMonth}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px bg-muted text-center text-sm">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 font-medium">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-muted">
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const trades = getTradesForDate(date);
              const pnl = getPnLForDate(date);
              const isSelected = selectedDate && 
                date.getFullYear() === selectedDate.getFullYear() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getDate() === selectedDate.getDate();
              
              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`min-h-[100px] bg-background p-2 text-left transition-colors hover:bg-accent ${
                    !isCurrentMonth && 'text-muted-foreground'
                  } ${isSelected && 'ring-2 ring-ring'}`}
                >
                  <span className="text-sm">{date.getDate()}</span>
                  {trades.length > 0 && (
                    <div className="mt-1">
                      <span className={`text-xs font-medium ${
                        pnl >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(pnl)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({trades.length} trade{trades.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day details */}
      {selectedDate && selectedDayTrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Trades for {selectedDate.toLocaleDateString()}
            </CardTitle>
            <CardDescription>
              {selectedDayTrades.length} trade{selectedDayTrades.length !== 1 ? 's' : ''} • Total P&L: {
                formatCurrency(selectedDayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0))
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto">
              {selectedDayTrades.map((trade) => (
                <div 
                  key={trade.id} 
                  className="border rounded-md p-3 hover:bg-muted/30"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium">{trade.symbol}</span>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                        trade.direction === 'LONG' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                      }`}>
                        {trade.direction}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${
                      (trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(trade.pnl || 0)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-sm">
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
                      <span className="text-muted-foreground">Qty:</span>{" "}
                      {trade.quantity}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Account:</span>{" "}
                      {trade.accountId}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 