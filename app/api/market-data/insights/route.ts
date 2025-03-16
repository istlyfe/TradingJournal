import { NextRequest, NextResponse } from "next/server";
import { ApiClient } from "@/lib/api-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    
    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }
    
    const apiClient = new ApiClient();
    
    const insightsData = await apiClient.getStockInsights({
      symbol
    });
    
    return NextResponse.json(insightsData);
  } catch (error) {
    console.error("Error fetching stock insights:", error);
    return NextResponse.json({ error: "Failed to fetch stock insights" }, { status: 500 });
  }
}
