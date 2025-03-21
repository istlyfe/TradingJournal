"use client";

import { TradeCalendar } from "@/components/calendar/TradeCalendar";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-4 w-full max-w-none">
      <h1 className="text-3xl font-bold">Calendar</h1>
      <p className="text-muted-foreground">
        Track your trades and performance over time
      </p>
      
      <div className="mt-4 w-full">
        <ErrorBoundary fallback={<div>Something went wrong with the calendar. Please try again later.</div>}>
          <TradeCalendar />
        </ErrorBoundary>
      </div>
    </div>
  );
} 