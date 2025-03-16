"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

export function TradeCalendar() {
  const [trades, setTrades] = useState<Record<string, Trade>>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { selectedAccounts } = useAccounts();
  const [forceUpdate, setForceUpdate] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Load trades
  useEffect(() => {
    const storedTrades = localStorage.getItem('tradingJournalTrades');
    if (storedTrades) {
      try {
        const parsedTrades = JSON.parse(storedTrades);
        setTrades(parsedTrades);
      } catch (error) {
        console.error("Error parsing trades from localStorage:", error);
      }
    }
  }, []);
  
  // Listen for account selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      // Force re-render when account selection changes
      setForceUpdate(prev => prev + 1);
      console.log("Account selection changed! Selected accounts:", selectedAccounts);
    };
    
    // Add both event listener and storage change listener for redundancy
    window.addEventListener(ACCOUNT_SELECTION_CHANGE, handleSelectionChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'tradingJournalSelectedAccounts') {
        handleSelectionChange();
        
        // Also log the direct value from localStorage
        try {
          const storedAccounts = localStorage.getItem('tradingJournalSelectedAccounts');
          console.log("Storage event - stored accounts:", storedAccounts);
        } catch (err) {
          console.error("Error reading from localStorage:", err);
        }
      }
    });
    
    // Log on initial mount
    console.log("Initial selected accounts:", selectedAccounts);
    
    return () => {
      window.removeEventListener(ACCOUNT_SELECTION_CHANGE, handleSelectionChange);
      window.removeEventListener('storage', (e) => {
        if (e.key === 'tradingJournalSelectedAccounts') {
          handleSelectionChange();
        }
      });
    };
  }, [selectedAccounts]);
  
  // Alert message
  const alertMessage = "No accounts selected. No trades will be shown. Use the account filter to select specific accounts.";

  // Update the helper function to ensure it's properly memoized with all dependencies
  const getFilteredTrades = useCallback(() => {
    const tradesArray = Object.values(trades);
    console.log("getFilteredTrades called, selectedAccounts:", selectedAccounts);
    
    // When no accounts are selected, don't show any trades
    if (!selectedAccounts.length) {
      console.log("No accounts selected, returning empty array");
      return [];
    }
    
    const filtered = tradesArray.filter(trade => 
      trade.accountId && selectedAccounts.includes(trade.accountId)
    );
    console.log(`Filtered ${tradesArray.length} trades down to ${filtered.length} trades`);
    return filtered;
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
    const filteredTrades = getFilteredTrades();
    console.log(`Getting trades for ${date.toDateString()}, working with ${filteredTrades.length} filtered trades`);
    
    const dateTrades = filteredTrades.filter(trade => {
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
    
    if (dateTrades.length > 0) {
      console.log(`Found ${dateTrades.length} trades for ${date.toDateString()}`);
    }
    
    return dateTrades;
  }, [getFilteredTrades]);
  
  // Calculate P&L for a specific date
  const getPnLForDate = useCallback((date: Date) => {
    const dateTrades = getTradesForDate(date);
    return dateTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  }, [getTradesForDate]);
  
  const selectedDayTrades = selectedDate ? getTradesForDate(selectedDate) : [];

  // Handle day click
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    
    // Don't even try to look for trades if no accounts are selected
    if (selectedAccounts.length === 0) {
      setDialogOpen(false);
      return;
    }
    
    // Only open dialog if there are trades for this day
    const tradesForDay = getTradesForDate(date);
    
    if (tradesForDay.length > 0) {
      setDialogOpen(true);
    } else {
      setDialogOpen(false);
    }
  };
  
  // Format month for display
  const monthYearDisplay = currentDate.toLocaleString('default', { 
    month: 'long', 
    year: 'numeric' 
  });
  
  // Before rendering, log the current state
  console.log("RENDER: Calendar with", selectedAccounts.length, "selected accounts");
  
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
      <CardContent className="space-y-4">
        {selectedAccounts.length === 0 && (
          <Alert>
            <Filter className="h-4 w-4" />
            <AlertDescription>
              {alertMessage}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              size="icon"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">{monthYearDisplay}</span>
            <Button 
              variant="outline"
              size="icon"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={goToCurrentMonth}>Today</Button>
            <Button 
              variant="outline" 
              onClick={() => {
                console.log("DEBUG button pressed");
                console.log("Selected accounts:", selectedAccounts);
                console.log("Filtered trades:", getFilteredTrades().length);
                const allTrades = Object.values(trades);
                console.log("All trades:", allTrades.length);
                
                // Check if the account IDs in trades match any selected accounts
                const accountsInTrades = Array.from(new Set(allTrades.map(t => t.accountId).filter(Boolean))) as string[];
                console.log("Account IDs in trades:", accountsInTrades);
                console.log("Overlap with selected:", accountsInTrades.filter(id => selectedAccounts.includes(id)));
              }}
            >
              Debug
            </Button>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-px bg-muted text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 font-medium">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-px bg-muted">
          {calendarDays.map(({ date, isCurrentMonth }, index) => {
            // Only get trades and calculate PnL if accounts are selected
            const trades = selectedAccounts.length > 0 ? getTradesForDate(date) : [];
            const pnl = selectedAccounts.length > 0 ? getPnLForDate(date) : 0;
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
                {selectedAccounts.length > 0 && trades.length > 0 && (
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
      
      {/* Day trades dialog - only show if accounts are selected */}
      {selectedDate && selectedAccounts.length > 0 && (
        <DayTradesDialog
          isOpen={dialogOpen}
          onClose={() => setDialogOpen(false)}
          date={selectedDate}
          trades={selectedDayTrades}
        />
      )}
    </Card>
  );
} 