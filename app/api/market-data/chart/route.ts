import { NextRequest, NextResponse } from "next/server";
import { ApiClient } from "@/lib/api-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const interval = searchParams.get("interval") || "1d";
    const range = searchParams.get("range") || "1mo";
    
    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }
    
    const apiClient = new ApiClient();
    
    const chartData = await apiClient.getStockChart({
      symbol,
      interval,
      range,
      includePrePost: false,
      includeAdjustedClose: true
    });
    
    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Error fetching stock chart data:", error);
    return NextResponse.json({ error: "Failed to fetch stock chart data" }, { status: 500 });
  }
}
