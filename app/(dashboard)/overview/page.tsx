"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDown, ArrowUp, ChevronDown, DollarSign, LineChart, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OverviewPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Demo data for the dashboard
  const metrics = [
    {
      title: "Total P&L",
      value: "$2,345.67",
      change: "+12.5%",
      trend: "up",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      title: "Win Rate",
      value: "68%",
      change: "+4.3%",
      trend: "up",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      title: "Total Trades",
      value: "237",
      change: "-",
      trend: "neutral",
      icon: <LineChart className="h-4 w-4" />,
    },
    {
      title: "Active Accounts",
      value: "2",
      change: "-",
      trend: "neutral",
      icon: <Users className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            This Week <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="default" size="sm">
            Create Trade
          </Button>
        </div>
      </div>

      <>
        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {metric.title}
                </CardTitle>
                <div className="p-1 bg-primary/10 rounded-full">
                  {metric.icon}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground flex items-center">
                  {metric.trend === "up" ? (
                    <ArrowUp className="mr-1 h-4 w-4 text-green-500" />
                  ) : metric.trend === "down" ? (
                    <ArrowDown className="mr-1 h-4 w-4 text-red-500" />
                  ) : null}
                  {metric.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts and Tables */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md border-dashed">
                <p className="text-sm text-muted-foreground">Performance Chart (Coming Soon)</p>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Trades</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center border rounded-md border-dashed">
                <p className="text-sm text-muted-foreground">Recent Trades (Coming Soon)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    </div>
  );
} 