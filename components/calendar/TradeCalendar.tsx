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
import { DayTradesDialog } from "./DayTradesDialog";
import { SimpleDayDialog } from "./SimpleDayDialog";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export function TradeCalendar() {
  const [trades, setTrades] = useState<Record<string, Trade>>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { selectedAccounts } = useAccounts();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Load trades
  useEffect(() => {
    console.log("Loading trades from localStorage");
    const storedTrades = localStorage.getItem('tradingJournalTrades');
    if (storedTrades) {
      try {
        const parsedTrades = JSON.parse(storedTrades);
        console.log("Trades loaded:", Object.keys(parsedTrades).length);
        setTrades(parsedTrades);
      } catch (error) {
        console.error("Error parsing trades from localStorage:", error);
      }
    } else {
      console.log("No trades found in localStorage");
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
      window.removeEventListener('storage', (e) => {
        if (e.key === 'tradingJournalSelectedAccounts') {
          handleSelectionChange();
        }
      });
    };
  }, []);
  
  // Track dialog state changes
  useEffect(() => {
    console.log("Dialog state updated:", dialogOpen, selectedDate?.toDateString());
  }, [dialogOpen, selectedDate]);
  
  // Helper to filter trades by selected accounts
  const getFilteredTrades = useCallback(() => {
    const tradesArray = Object.values(trades);
    if (!selectedAccounts.length) return tradesArray;
    
    return tradesArray.filter(trade => 
      selectedAccounts.includes(trade.accountId)
    );
  }, [trades, selectedAccounts, forceUpdate]);
  
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
      try {
        const tradeDate = parseISO(trade.exitDate || trade.entryDate);
        return (
          tradeDate.getFullYear() === date.getFullYear() &&
          tradeDate.getMonth() === date.getMonth() &&
          tradeDate.getDate() === date.getDate()
        );
      } catch (error) {
        console.error("Error parsing date for trade:", trade.id, error);
        return false;
      }
    });
  }, [getFilteredTrades]);
  
  // Calculate P&L for a specific date
  const getPnLForDate = useCallback((date: Date) => {
    const dateTrades = getTradesForDate(date);
    return dateTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  }, [getTradesForDate]);
  
  const selectedDayTrades = selectedDate ? getTradesForDate(selectedDate) : [];

  // Handle day click
  const handleDayClick = (date: Date) => {
    console.log("===== DAY CLICKED =====");
    console.log("Date clicked:", date.toDateString());
    setSelectedDate(date);
    
    // Only open dialog if there are trades for this day
    const tradesForDay = getTradesForDate(date);
    console.log("Trades for selected date:", tradesForDay.length);
    console.log("Trade IDs:", tradesForDay.map(t => t.id));
    
    if (tradesForDay.length > 0) {
      console.log("Opening dialog with", tradesForDay.length, "trades");
      setDialogOpen(true);
    } else {
      console.log("No trades for this date, not opening dialog");
      setDialogOpen(false);
    }
  };
  
  // Format month for display
  const monthYearDisplay = currentDate.toLocaleString('default', { 
    month: 'long', 
    year: 'numeric' 
  });

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{monthYearDisplay}</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToPreviousMonth}
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={goToCurrentMonth}
              aria-label="Current Month"
            >
              Today
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={goToNextMonth}
              aria-label="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px bg-muted text-center">
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
                  onClick={() => handleDayClick(date)}
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

      {/* Testing button to open dialog */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium">
            Selected Date: {selectedDate ? selectedDate.toDateString() : "None"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedDayTrades.length} trades for this date
          </p>
        </div>
        <Button
          onClick={() => {
            console.log("Test button clicked");
            setDialogOpen(true);
          }}
        >
          Test Open Dialog
        </Button>
      </div>

      {/* Use the simple dialog */}
      <SimpleDayDialog 
        date={selectedDate}
        trades={selectedDayTrades}
        isOpen={dialogOpen}
        onClose={() => {
          console.log("Dialog closed");
          setDialogOpen(false);
        }}
      />
    </div>
  );
} 