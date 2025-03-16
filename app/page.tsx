import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, BookOpen, List, LineChart, Settings } from "lucide-react";

export default function HomePage() {
  // Alternatively, we can provide links to all main pages
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
      <h1 className="text-4xl font-bold mb-8">Trading Journal</h1>
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="h-5 w-5 mr-2" />
              Dashboard
            </CardTitle>
            <CardDescription>View your trading performance at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Get insights into your trade performance with key metrics and charts.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <List className="h-5 w-5 mr-2" />
              Trades
            </CardTitle>
            <CardDescription>Manage your trade history</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View, add, edit, and analyze your trading activity.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/trades">View Trades</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="h-5 w-5 mr-2" />
              Journal
            </CardTitle>
            <CardDescription>Record your trading thoughts</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Keep a journal of your trading journey, market observations, and lessons learned.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/journal">Open Journal</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LineChart className="h-5 w-5 mr-2" />
              Analytics
            </CardTitle>
            <CardDescription>Analyze your trading performance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Dive deep into your trading data with advanced analytics and reports.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/analytics">View Analytics</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
