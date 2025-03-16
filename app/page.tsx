import { redirect } from "next/navigation";
import { DashboardMetrics } from "@/components/DashboardMetrics";
import { TradeList } from "@/components/trades/TradeList";
import { CsvImport } from "@/components/trades/CsvImport";
import { useTrades } from "@/hooks/useTrades";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <CsvImport />
      </div>
      
      <DashboardMetrics />
      <TradeList />
    </div>
  );
}
