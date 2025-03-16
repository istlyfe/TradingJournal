"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Trade } from "@/types/trade";
import { formatCurrency } from "@/lib/utils";
import { useAccounts } from "@/hooks/useAccounts";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Filter } from "lucide-react";

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  trades: Trade[];
  dayPnl: number;
  winRate: number;
  tradeCount: number;
}

interface WeekSummary {
  weekNumber: number;
  totalPnl: number;
  tradingDays: number;
}

export function MiniCalendar() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const { selectedAccounts } = useAccounts();
  
  // Load trades from localStorage
  useEffect(() => {
    const storedTrades = localStorage.getItem('tradingJournalTrades');
    if (storedTrades) {
      // Convert from Record<string, Trade> to Trade[]
      const tradesRecord = JSON.parse(storedTrades);
      const tradesArray = Object.values(tradesRecord);
      setTrades(tradesArray);
    } else {
      setTrades([]);
    }
  }, []);
  
  // Listen for account selection changes
  useEffect(() => {
    // Force re-render when selected accounts change
    // This is needed because the calendar data depends on filteredTrades
  }, [selectedAccounts]);
  
  // Filter trades by selected accounts
  const filteredTrades = selectedAccounts.length > 0
    ? trades.filter(trade => selectedAccounts.includes(trade.accountId))
    : trades; // Show all trades if no accounts are selected
  
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
  
  // Generate calendar data for current month
  const generateCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const today = new Date();
    
    // Get the day of week for the first day of the month (0 = Sunday, 6 = Saturday)
    const firstDayOfMonth = new Date(year, month, 1);
    const dayOfWeek = firstDayOfMonth.getDay();
    
    // Get the total days in the current month
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Get the total days in the previous month
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate();
    
    // Calculate days from previous month to include
    const daysFromPrevMonth = dayOfWeek;
    
    // Generate days from previous month
    const prevMonthDays = Array.from({ length: daysFromPrevMonth }, (_, i) => {
      const dayNumber = totalDaysInPrevMonth - daysFromPrevMonth + i + 1;
      const date = new Date(year, month - 1, dayNumber);
      
      // Find trades for this day
      const dayTrades = filteredTrades.filter(trade => {
        const tradeDate = new Date(trade.entryDate);
        return (
          tradeDate.getDate() === date.getDate() &&
          tradeDate.getMonth() === date.getMonth() &&
          tradeDate.getFullYear() === date.getFullYear()
        );
      });
      
      // Calculate day P&L
      const dayPnl = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      
      // Calculate win rate
      const winningTrades = dayTrades.filter(trade => (trade.pnl || 0) > 0).length;
      const winRate = dayTrades.length > 0 ? (winningTrades / dayTrades.length) * 100 : 0;
      
      return {
        date,
        isCurrentMonth: false,
        isToday: false,
        trades: dayTrades,
        dayPnl,
        winRate,
        tradeCount: dayTrades.length
      };
    });
    
    // Generate days for current month
    const currentMonthDays = Array.from({ length: totalDays }, (_, i) => {
      const date = new Date(year, month, i + 1);
      const isToday = 
        date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear();
      
      // Find trades for this day
      const dayTrades = filteredTrades.filter(trade => {
        const tradeDate = new Date(trade.entryDate);
        return (
          tradeDate.getDate() === date.getDate() &&
          tradeDate.getMonth() === date.getMonth() &&
          tradeDate.getFullYear() === date.getFullYear()
        );
      });
      
      // Calculate day P&L
      const dayPnl = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      
      // Calculate win rate
      const winningTrades = dayTrades.filter(trade => (trade.pnl || 0) > 0).length;
      const winRate = dayTrades.length > 0 ? (winningTrades / dayTrades.length) * 100 : 0;
      
      return {
        date,
        isCurrentMonth: true,
        isToday,
        trades: dayTrades,
        dayPnl,
        winRate,
        tradeCount: dayTrades.length
      };
    });
    
    // Calculate how many days we need from next month to complete the grid
    const totalCells = 35; // 5 rows of 7 days (we'll hide the 6th row if not needed)
    const remainingCells = totalCells - (prevMonthDays.length + currentMonthDays.length);
    
    // Generate days from next month
    const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => {
      const date = new Date(year, month + 1, i + 1);
      
      // Find trades for this day
      const dayTrades = filteredTrades.filter(trade => {
        const tradeDate = new Date(trade.entryDate);
        return (
          tradeDate.getDate() === date.getDate() &&
          tradeDate.getMonth() === date.getMonth() &&
          tradeDate.getFullYear() === date.getFullYear()
        );
      });
      
      // Calculate day P&L
      const dayPnl = dayTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
      
      // Calculate win rate
      const winningTrades = dayTrades.filter(trade => (trade.pnl || 0) > 0).length;
      const winRate = dayTrades.length > 0 ? (winningTrades / dayTrades.length) * 100 : 0;
      
      return {
        date,
        isCurrentMonth: false,
        isToday: false,
        trades: dayTrades,
        dayPnl,
        winRate,
        tradeCount: dayTrades.length
      };
    });
    
    // Create an array with all days
    const calendarDays = [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    
    // Group days into weeks for weekly summary calculation
    const weeks: CalendarDay[][] = [];
    
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7));
    }
    
    // Calculate weekly summaries
    const weekSummaries = weeks.map((week, index) => {
      const weekNumber = index + 1;
      const daysWithTrades = week.filter(day => day.trades.length > 0);
      const totalPnl = week.reduce((sum, day) => sum + day.dayPnl, 0);
      const tradingDays = daysWithTrades.length;
      const totalTrades = week.reduce((sum, day) => sum + day.trades.length, 0);
      
      return {
        weekNumber,
        totalPnl,
        tradingDays,
        totalTrades
      };
    });
    
    return { calendarDays, weekSummaries };
  };
  
  const { calendarDays, weekSummaries } = generateCalendarData();
  
  // Selected day's trades
  const selectedDayTrades = selectedDate
    ? filteredTrades.filter(trade => {
        const tradeDate = new Date(trade.entryDate);
        return (
          tradeDate.getDate() === selectedDate.getDate() &&
          tradeDate.getMonth() === selectedDate.getMonth() &&
          tradeDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : [];
  
  // Navigate to the calendar page with the selected date
  const viewFullCalendar = () => {
    router.push("/calendar");
  };
  
  // Navigate to the trade details page
  const viewTradeDetails = (tradeId: string) => {
    router.push(`/trades/${tradeId}`);
  };
  
  // Day of week headers
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="space-y-3">
      {selectedAccounts.length === 0 && (
        <Alert>
          <Filter className="h-4 w-4" />
          <AlertDescription>
            No accounts selected. Showing all trades. Use the account filter to select specific accounts.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button 
            onClick={goToPreviousMonth}
            className="p-1 rounded-md hover:bg-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-medium">
            {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
          </h2>
          <button 
            onClick={goToNextMonth}
            className="p-1 rounded-md hover:bg-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button 
          onClick={goToCurrentMonth}
          className="text-xs text-primary"
        >
          Today
        </button>
      </div>
      
      {/* Header area for labels */}
      <div className="flex">
        {/* Calendar days header */}
        <div className="flex-1">
          <div className="grid grid-cols-7 bg-muted/50 border rounded-t-md border-b">
            {weekDays.map((day, index) => (
              <div 
                key={index} 
                className="py-1 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
        </div>
        
        {/* Summary header */}
        <div className="w-1/5 ml-2">
          <div className="bg-muted/50 border rounded-t-md py-1 text-center text-xs font-medium text-muted-foreground">
            Summary
          </div>
        </div>
      </div>
      
      {/* Calendar Grid with Week Summaries */}
      <div className="flex -mt-3">
        {/* Main Calendar Grid */}
        <div className="flex-1 border rounded-b-md overflow-hidden">
          {/* Calendar Cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              const hasTrades = day.tradeCount > 0;
              const isProfit = day.dayPnl > 0;
              const isLoss = day.dayPnl < 0;
              
              // Calculate cell background color based on profit/loss
              let cellBgColor = "bg-transparent";
              if (day.isCurrentMonth) {
                if (isProfit) {
                  cellBgColor = "bg-green-950"; // Dark green for profits
                } else if (isLoss) {
                  cellBgColor = "bg-red-950"; // Dark red for losses
                }
              }
              
              return (
                <div 
                  key={index} 
                  className={`min-h-[80px] border-t border-r p-1 cursor-pointer hover:bg-muted/20 ${
                    !day.isCurrentMonth ? 'opacity-40' : ''
                  } ${day.isToday ? 'bg-blue-950/30' : cellBgColor} ${
                    selectedDate && 
                    selectedDate.getDate() === day.date.getDate() && 
                    selectedDate.getMonth() === day.date.getMonth() && 
                    selectedDate.getFullYear() === day.date.getFullYear()
                      ? 'ring-2 ring-primary ring-inset'
                      : ''
                  }`}
                  onClick={() => setSelectedDate(day.date)}
                >
                  <div className="flex flex-col h-full">
                    {/* Date number */}
                    <div className="text-right p-1 text-xs font-medium">
                      {day.date.getDate()}
                    </div>
                    
                    {/* Trade information */}
                    {hasTrades && (
                      <div className="mt-1 flex flex-col items-center text-center space-y-0.5">
                        {/* P&L amount */}
                        <div className={`text-sm font-semibold ${
                          day.dayPnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatCurrency(day.dayPnl)}
                        </div>
                        
                        {/* Trade count */}
                        <div className="text-xs text-gray-300">
                          {day.tradeCount} trade{day.tradeCount !== 1 ? 's' : ''}
                        </div>
                        
                        {/* Win rate */}
                        <div className="text-xs text-gray-300">
                          {day.winRate.toFixed(1)}%
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Weekly Summaries */}
        <div className="w-1/5 ml-2 flex flex-col border rounded-b-md overflow-hidden">
          {/* Render each week summary aligned with its week */}
          {Array.from({ length: 5 }).map((_, weekIndex) => {
            const weekSummary = weekSummaries.find(summary => summary.weekNumber === weekIndex + 1);
            const daysInWeek = calendarDays.slice(weekIndex * 7, (weekIndex + 1) * 7);
            
            // Check if this week is visible in the calendar
            const hasVisibleDays = daysInWeek.some(day => day.isCurrentMonth);
            
            if (!hasVisibleDays) return null;
            
            // Use min-height to match the height of calendar rows
            const minHeight = "min-h-[80px]";
            
            return (
              <div 
                key={weekIndex} 
                className={`${minHeight} flex-1 flex flex-col justify-center items-center border-b last:border-b-0 p-2`}
              >
                {weekSummary ? (
                  <>
                    <div className="text-xs text-gray-300 mb-1">Week {weekSummary.weekNumber}</div>
                    <div className={`text-sm font-semibold ${
                      weekSummary.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(weekSummary.totalPnl)}
                    </div>
                    <div className="text-xs text-gray-300 mt-1">
                      {weekSummary.tradingDays} day{weekSummary.tradingDays !== 1 ? 's' : ''}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-gray-500">No data</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Selected Day Details */}
      {selectedDate && selectedDayTrades.length > 0 && (
        <div className="border rounded-md p-3 mt-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">
              {selectedDate.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })}
            </h3>
            <span className="text-xs text-muted-foreground">
              {selectedDayTrades.length} trade{selectedDayTrades.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {selectedDayTrades.map((trade) => (
              <div 
                key={trade.id} 
                className="text-xs border rounded-md p-2 hover:bg-muted/50 cursor-pointer"
                onClick={() => viewTradeDetails(trade.id)}
              >
                <div className="flex justify-between">
                  <span className="font-medium">{trade.symbol}</span>
                  <span className={`font-medium ${(trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(trade.pnl || 0)}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className={`px-1 rounded text-[10px] ${
                    trade.direction === 'LONG' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {trade.direction}
                  </span>
                  <span className="text-muted-foreground">
                    {new Date(trade.entryDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={viewFullCalendar}
            className="w-full text-xs text-primary mt-2 py-1 text-center hover:underline"
          >
            View in calendar
          </button>
        </div>
      )}
      
      {selectedDate && selectedDayTrades.length === 0 && (
        <div className="border rounded-md p-3 mt-3 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            No trades on {selectedDate.toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <button 
            className="text-xs text-primary hover:underline"
            onClick={() => router.push("/trades/new")}
          >
            Add a trade
          </button>
        </div>
      )}
    </div>
  );
} 