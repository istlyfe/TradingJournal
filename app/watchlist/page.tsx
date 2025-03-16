import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WatchlistManager } from "@/components/watchlist/WatchlistManager";

export const metadata: Metadata = {
  title: "Watchlist | Trading Journal",
  description: "Track and monitor stocks and assets of interest",
};

export default function WatchlistPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Watchlist</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Stock Watchlist</CardTitle>
          <CardDescription>
            Track stocks and assets you're interested in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WatchlistManager />
        </CardContent>
      </Card>
    </div>
  );
}
