import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TradeCalendar } from "@/components/calendar/TradeCalendar";

export const metadata: Metadata = {
  title: "Calendar | Trading Journal",
  description: "View your trading activity in a calendar format",
};

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Trade Calendar</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Trade Activity Calendar</CardTitle>
          <CardDescription>
            View your trading activity and performance by date
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TradeCalendar />
        </CardContent>
      </Card>
    </div>
  );
} 