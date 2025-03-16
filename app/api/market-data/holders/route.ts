import { NextRequest, NextResponse } from "next/server";
import { ApiClient } from "@/lib/api-client";

// Mark this route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    
    if (!symbol) {
      return NextResponse.json({ error: "Symbol is required" }, { status: 400 });
    }
    
    const apiClient = new ApiClient();
    
    const holdersData = await apiClient.getStockHolders({
      symbol
    });
    
    return NextResponse.json(holdersData);
  } catch (error) {
    console.error("Error fetching stock holders:", error);
    return NextResponse.json({ error: "Failed to fetch stock holders" }, { status: 500 });
  }
}
