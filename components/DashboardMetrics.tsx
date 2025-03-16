import { Card } from "@/components/ui/card";
import { Trade } from "@/types/trade";
import { formatCurrency } from "@/lib/utils";

interface DashboardMetricsProps {
  trades: Trade[];
}

export function DashboardMetrics({ trades }: DashboardMetricsProps) {
  // Calculate metrics
  const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnl || 0), 0);
  const winningTrades = trades.filter((trade) => (trade.pnl || 0) > 0);
  const losingTrades = trades.filter((trade) => (trade.pnl || 0) < 0);
  const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;
  
  // Calculate average trade duration
  const tradeDurations = trades
    .filter(trade => trade.entryDate && trade.exitDate)
    .map(trade => {
      const entry = new Date(trade.entryDate);
      const exit = new Date(trade.exitDate!);
      return (exit.getTime() - entry.getTime()) / 1000; // Duration in seconds
    });
  
  const averageDuration = tradeDurations.length > 0 
    ? tradeDurations.reduce((sum, duration) => sum + duration, 0) / tradeDurations.length
    : 0;

  // Format duration
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <Card className="p-4">
        <h3 className="text-sm font-medium">Net P&L</h3>
        <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {formatCurrency(totalPnL)}
        </p>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-sm font-medium">Win Rate</h3>
        <p className="text-2xl font-bold">
          {winRate.toFixed(1)}%
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium">Total Trades</h3>
        <p className="text-2xl font-bold">
          {trades.length}
        </p>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-medium">Avg Duration</h3>
        <p className="text-2xl font-bold">
          {formatDuration(averageDuration)}
        </p>
      </Card>
    </div>
  );
} 