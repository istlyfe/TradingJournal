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
  const [localSelectedAccounts, setLocalSelectedAccounts] = useState<string[]>([]);
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
  
  // Keep a local copy of selected accounts synchronized with localStorage
  useEffect(() => {
    // Initialize from localStorage first
    try {
      const storedAccounts = localStorage.getItem('tradingJournalSelectedAccounts');
      if (storedAccounts) {
        const parsedAccounts = JSON.parse(storedAccounts);
        setLocalSelectedAccounts(parsedAccounts);
        
        // Close the dialog if it was open (prevents stale data)
        setDialogOpen(false);
      } else {
        // If nothing in localStorage yet, use the value from useAccounts
        setLocalSelectedAccounts(selectedAccounts);
      }
    } catch (error) {
      console.error("Error parsing selected accounts from localStorage:", error);
      setLocalSelectedAccounts(selectedAccounts);
    }
    
    // Define handler functions
    const handleSelectionChangeEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail && customEvent.detail.selectedAccounts) {
        setLocalSelectedAccounts(customEvent.detail.selectedAccounts);
        setForceUpdate(prev => prev + 1);
        
        // Close the dialog when account selection changes
        setDialogOpen(false);
      }
    };
    
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'tradingJournalSelectedAccounts') {
        try {
          if (e.newValue) {
            const parsedAccounts = JSON.parse(e.newValue);
            setLocalSelectedAccounts(parsedAccounts);
            setForceUpdate(prev => prev + 1);
            
            // Close the dialog when account selection changes
            setDialogOpen(false);
          }
        } catch (err) {
          console.error("Error reading from localStorage:", err);
        }
      }
    };
    
    // Add both event listeners
    window.addEventListener(ACCOUNT_SELECTION_CHANGE, handleSelectionChangeEvent);
    window.addEventListener('storage', handleStorageEvent);
    
    return () => {
      window.removeEventListener(ACCOUNT_SELECTION_CHANGE, handleSelectionChangeEvent);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [selectedAccounts]);
  
  // Also update when the selectedAccounts prop changes
  useEffect(() => {
    if (JSON.stringify(selectedAccounts) !== JSON.stringify(localSelectedAccounts)) {
      setLocalSelectedAccounts(selectedAccounts);
      setForceUpdate(prev => prev + 1);
      
      // Close dialog when account selection changes directly via prop
      setDialogOpen(false);
    }
  }, [selectedAccounts, localSelectedAccounts]);
  
  // Alert message
  const alertMessage = "No accounts selected. No trades will be shown. Use the account filter to select specific accounts.";

  // Update the helper function to use localSelectedAccounts instead
  const getFilteredTrades = useCallback(() => {
    const tradesArray = Object.values(trades);
    
    // When no accounts are selected, don't show any trades
    if (!localSelectedAccounts.length) {
      return [];
    }
    
    const filtered = tradesArray.filter(trade => 
      trade.accountId && localSelectedAccounts.includes(trade.accountId)
    );
    
    return filtered;
  }, [trades, localSelectedAccounts, forceUpdate]);
  
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
    if (localSelectedAccounts.length === 0) {
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
  console.log("RENDER: Calendar with", localSelectedAccounts.length, "selected accounts");
  
  // Calculate monthly P&L
  const getMonthlyPnL = useCallback(() => {
    const filteredTrades = getFilteredTrades();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    return filteredTrades.reduce((sum, trade) => {
      try {
        const tradeDate = parseISO(trade.exitDate || trade.entryDate);
        if (
          tradeDate.getFullYear() === currentYear &&
          tradeDate.getMonth() === currentMonth
        ) {
          return sum + (trade.pnl || 0);
        }
        return sum;
      } catch (error) {
        console.error("Error parsing date for trade:", trade.id, error);
        return sum;
      }
    }, 0);
  }, [currentDate, getFilteredTrades]);

  // Get number of trading days in the month
  const getMonthlyTradingDays = useCallback(() => {
    const filteredTrades = getFilteredTrades();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    const tradeDates = new Set();
    
    filteredTrades.forEach(trade => {
      try {
        const tradeDate = parseISO(trade.exitDate || trade.entryDate);
        if (
          tradeDate.getFullYear() === currentYear &&
          tradeDate.getMonth() === currentMonth
        ) {
          tradeDates.add(tradeDate.toDateString());
        }
      } catch (error) {
        console.error("Error parsing date for trade:", trade.id, error);
      }
    });
    
    return tradeDates.size;
  }, [currentDate, getFilteredTrades]);

  // Get weekly summaries in a row-aligned format
  const getWeekRows = useCallback(() => {
    // Get number of weeks in the calendar view
    const numWeeks = Math.ceil(calendarDays.length / 7);
    
    // Create an array of weeks
    return Array.from({ length: numWeeks }).map((_, weekIndex) => {
      // Get the days for this week
      const weekDays = calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map(day => day.date);
      
      // Calculate total P&L and trading days for this week
      let totalPnL = 0;
      const tradingDays = new Set();
      
      weekDays.forEach(day => {
        const trades = localSelectedAccounts.length > 0 ? getTradesForDate(day) : [];
        if (trades.length > 0) {
          totalPnL += getPnLForDate(day);
          tradingDays.add(day.toDateString());
        }
      });
      
      // Calculate week number based on first day of the week
      const firstDayOfWeek = weekDays[0];
      const weekNumber = Math.ceil((firstDayOfWeek.getDate() + (new Date(firstDayOfWeek.getFullYear(), firstDayOfWeek.getMonth(), 1).getDay())) / 7);
      
      return {
        weekNumber,
        totalPnL,
        tradingDays: tradingDays.size
      };
    });
  }, [calendarDays, getTradesForDate, getPnLForDate, localSelectedAccounts]);
  
  return (
    <Card className="border shadow-md rounded-xl overflow-hidden w-full max-w-none">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            <CardTitle>Trading Calendar</CardTitle>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Selected accounts: {localSelectedAccounts.length ? localSelectedAccounts.length : 'None'}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        {localSelectedAccounts.length === 0 && (
          <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <Filter className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-300">
              {alertMessage}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="w-full">
          <div className="space-y-6 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousMonth}
                  className="rounded-full h-8 w-8 p-0 border-primary/20 hover:bg-primary/5"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-base font-semibold">{monthYearDisplay}</span>
                <Button 
                  variant="outline"
                  size="icon"
                  onClick={goToNextMonth}
                  className="rounded-full h-8 w-8 p-0 border-primary/20 hover:bg-primary/5"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="text-muted-foreground mr-1">Monthly stats:</span>
                  <span className={`font-medium ${getMonthlyPnL() > 0 ? 'text-green-500' : getMonthlyPnL() < 0 ? 'text-red-500' : ''}`}>${getMonthlyPnL().toFixed(2)}</span>
                  <span className="text-muted-foreground ml-4 mr-1">{getMonthlyTradingDays()} days</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={goToCurrentMonth}
                  className="rounded-full text-sm px-4 border-primary/20 hover:bg-primary/5"
                >
                  This month
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-[1fr_160px] gap-0 w-full">
              {/* Calendar Grid */}
              <div>
                <div className="grid grid-cols-7 gap-0 bg-background/90 text-center">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="py-2 font-medium text-sm border-b">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0">
                  {calendarDays.map(({ date, isCurrentMonth }, index) => {
                    // Calculate week row for styling first day of week
                    const isFirstDayOfWeek = index % 7 === 0;
                    
                    // Only get trades and calculate PnL if accounts are selected
                    const trades = localSelectedAccounts.length > 0 ? getTradesForDate(date) : [];
                    const pnl = localSelectedAccounts.length > 0 ? getPnLForDate(date) : 0;
                    const isSelected = selectedDate && 
                      date.getFullYear() === selectedDate.getFullYear() &&
                      date.getMonth() === selectedDate.getMonth() &&
                      date.getDate() === selectedDate.getDate();
                    
                    // Check if today
                    const isToday = date.toDateString() === new Date().toDateString();
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleDayClick(date)}
                        className={`relative h-[100px] p-2 text-left transition-colors flex flex-col ${
                          !isCurrentMonth ? 'opacity-40' : ''
                        } ${isSelected ? 'ring-2 ring-primary shadow-sm' : 'hover:bg-accent/50'}
                        ${isToday ? 'after:absolute after:top-2 after:right-2 after:w-2 after:h-2 after:rounded-full after:bg-primary/80' : ''}
                        ${index >= 28 ? 'border-b' : ''} border-r`}
                      >
                        <span className={`text-sm font-medium ${isToday ? 'text-primary' : ''}`}>
                          {date.getDate()}
                        </span>
                        <div className="flex-1 flex flex-col justify-end">
                          {localSelectedAccounts.length > 0 && trades.length > 0 && (
                            <div className="mt-auto">
                              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                pnl > 0 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                                pnl < 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 
                                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                              }`}>
                                {formatCurrency(pnl)}
                              </span>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {trades.length} trade{trades.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Weekly Summaries Sidebar */}
              <div className="flex flex-col justify-start">
                {/* Header spacer to align with calendar header */}
                <div className="py-2 font-medium text-center text-sm border-b">
                  Week
                </div>
                
                {/* Weekly summaries that align with rows */}
                <div className="grid auto-rows-[100px] gap-0">
                  {getWeekRows().map((week, index) => (
                    <div 
                      key={index}
                      className={`flex flex-col justify-center px-4 h-[100px] border-r ${index >= getWeekRows().length - 1 ? 'border-b' : ''}`}
                    >
                      <div className="text-sm font-medium">Week {week.weekNumber}</div>
                      <div className={`text-xl font-semibold ${week.totalPnL > 0 ? 'text-green-500' : week.totalPnL < 0 ? 'text-red-500' : ''}`}>
                        ${week.totalPnL.toFixed(2)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5">
                          {week.tradingDays} {week.tradingDays === 1 ? 'day' : 'days'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Day trades dialog - only show if accounts are selected */}
      {selectedDate && localSelectedAccounts.length > 0 && (
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