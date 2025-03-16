"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CsvImport, TradeData } from "@/components/trades/CsvImport";
import { TradovateSample } from "@/components/trades/TradovateSample";
import { CheckCircle2 } from "lucide-react";

export default function ImportTradesPage() {
  const router = useRouter();
  const [isImportComplete, setIsImportComplete] = useState(false);
  const [importedTradesCount, setImportedTradesCount] = useState(0);

  const handleImportSuccess = (trades: TradeData[]) => {
    // In a real application, you would save these trades to your database
    console.log("Imported trades:", trades);
    
    // For demo purposes, we'll just set the success state
    setImportedTradesCount(trades.length);
    setIsImportComplete(true);
    
    // Redirect to the trades list after a delay
    setTimeout(() => {
      router.push("/trades");
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Import Trades</h1>
      
      {!isImportComplete ? (
        <Card>
          <CardHeader>
            <CardTitle>Import from CSV</CardTitle>
            <CardDescription>
              Upload trades from your trading platform or other CSV sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CsvImport onImportSuccess={handleImportSuccess} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Import Successful!</h2>
              <p className="text-muted-foreground mb-4">
                Successfully imported {importedTradesCount} trades into your journal
              </p>
              <p className="text-sm">
                Redirecting to trades page...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Import Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">Supported Platforms</h3>
              <p className="text-sm text-muted-foreground">
                We support CSV files from Tradovate, TradingView, Interactive Brokers, ThinkorSwim, and Webull. The importer will automatically detect your platform's format.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">File Format</h3>
              <p className="text-sm text-muted-foreground">
                Make sure your CSV file has headers in the first row. If your file doesn't match one of our supported formats, it will be rejected.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-1">Required Fields</h3>
              <p className="text-sm text-muted-foreground">
                At minimum, we need Symbol, Direction (Buy/Sell), Entry Date, Entry Price, and Quantity. Other fields like Exit Date, Exit Price, P&L, and Fees will be imported if available.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tradovate Sample File */}
      <Card>
        <CardHeader>
          <CardTitle>Test with Sample Data</CardTitle>
          <CardDescription>
            Download a sample CSV file to test the import functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TradovateSample />
        </CardContent>
      </Card>
    </div>
  );
} 