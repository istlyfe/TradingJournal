import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";

export const metadata: Metadata = {
  title: "Dashboard | Trading Journal",
  description: "Your trading performance at a glance",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      {/* Performance metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
            <CardDescription>
              Your key trading metrics and performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardMetrics />
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Trades and Calendar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Trades</CardTitle>
            <CardDescription>
              Your most recent trading activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentTrades />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Trading Calendar</CardTitle>
            <CardDescription>
              Your trading activity by date
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-6">
            <MiniCalendar />
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 