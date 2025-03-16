"use client";

import { useState, useEffect } from "react";
import { Upload, AlertTriangle, Check, FileText, HelpCircle, Info, ArrowRight, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { parse } from "papaparse";
import { parseTradeDate, formatDateTime, formatCurrency, getFuturesContractMultiplier, isFuturesContract } from "@/lib/utils";
import { Account } from "@/components/accounts/AccountManager";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAccounts } from "@/hooks/useAccounts";
import { useBrokers } from "@/hooks/useBrokers";
import { Trade } from "@/types/trade";
import { Input } from "@/components/ui/input";

export interface TradeData {
  id: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  pnl?: number;
  fees?: number;
  strategy?: string;
  notes?: string;
  emotionalState?: string;
  tags?: string[];
  source: string;
  importSource?: string;
  contractMultiplier?: number;
  accountId: string;
}

interface PlatformConfig {
  name: string;
  requiredHeaders: string[];
  symbolField: string;
  directionField: string;
  entryDateField: string;
  entryPriceField: string;
  exitDateField?: string;
  exitPriceField?: string;
  quantityField: string;
  pnlField?: string;
  feesField?: string;
  strategyField?: string;
  directionMapping: Record<string, "LONG" | "SHORT">;
}

// Platform configurations with required headers and field mappings
const platformConfigs: PlatformConfig[] = [
  {
    name: "Tradovate",
    requiredHeaders: ["Contract", "B/S", "Status", "Timestamp", "avgPrice", "filledQty"],
    symbolField: "Contract",
    directionField: "B/S",
    entryDateField: "Fill Time",
    entryPriceField: "avgPrice",
    quantityField: "filledQty",
    directionMapping: {
      "B": "LONG",
      "Buy": "LONG",
      "S": "SHORT",
      "Sell": "SHORT"
    }
  },
  {
    name: "TradingView",
    requiredHeaders: ["Symbol", "Side", "Entry Time", "Entry Price", "Volume"],
    symbolField: "Symbol",
    directionField: "Side",
    entryDateField: "Entry Time",
    entryPriceField: "Entry Price",
    exitDateField: "Exit Time",
    exitPriceField: "Exit Price",
    quantityField: "Volume",
    pnlField: "Profit",
    feesField: "Commission",
    directionMapping: {
      "buy": "LONG",
      "sell": "SHORT",
      "Buy": "LONG",
      "Sell": "SHORT"
    }
  },
  {
    name: "Interactive Brokers",
    requiredHeaders: ["Symbol", "Buy/Sell", "Date/Time", "Price", "Quantity"],
    symbolField: "Symbol",
    directionField: "Buy/Sell",
    entryDateField: "Date/Time",
    entryPriceField: "Price",
    quantityField: "Quantity",
    pnlField: "Realized P/L",
    feesField: "Commission",
    directionMapping: {
      "BUY": "LONG",
      "SELL": "SHORT",
      "B": "LONG",
      "S": "SHORT"
    }
  },
  {
    name: "ThinkorSwim",
    requiredHeaders: ["Symbol", "Side", "Trade Date", "Price", "Qty"],
    symbolField: "Symbol",
    directionField: "Side",
    entryDateField: "Trade Date",
    entryPriceField: "Price",
    quantityField: "Qty",
    pnlField: "P/L",
    feesField: "Commissions",
    directionMapping: {
      "BUY": "LONG",
      "SELL": "SHORT",
      "BOT": "LONG",
      "SLD": "SHORT"
    }
  },
  {
    name: "Webull",
    requiredHeaders: ["Symbol", "Side", "Time", "Price", "Qty"],
    symbolField: "Symbol",
    directionField: "Side",
    entryDateField: "Time",
    entryPriceField: "Price",
    quantityField: "Qty",
    feesField: "Commission",
    directionMapping: {
      "BUY": "LONG",
      "SELL": "SHORT",
      "Buy": "LONG",
      "Sell": "SHORT"
    }
  }
];

const SUPPORTED_PLATFORMS = [
  "Tradovate",
  "TradingView",
  "Interactive Brokers",
  "ThinkorSwim",
  "Webull"
] as const;

export function CsvImport({ onImportSuccess }: { onImportSuccess?: (trades: TradeData[]) => void }) {
  const [platform, setPlatform] = useState<string>();
  const [selectedFile, setSelectedFile] = useState<File>();
  const { accounts, createAccount, toggleAccount } = useAccounts();
  const [selectedAccount, setSelectedAccountId] = useState<string>("new-account");
  const [step, setStep] = useState(1);
  const [parsedTrades, setParsedTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const router = useRouter();
  const [newAccountName, setNewAccountName] = useState<string>("");
  const { brokers } = useBrokers();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(undefined);
    }
  };

  const parseCSV = () => {
    if (!selectedFile || !platform || !selectedAccount) return;
    setIsLoading(true);
    setError(undefined);

    // Get the platform configuration
    const platformConfig = platformConfigs.find(p => p.name === platform);
    if (!platformConfig) {
      setError("Invalid platform selected");
      setIsLoading(false);
      return;
    }

    parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Enhanced debugging output
          console.log("CSV Parse Results:", {
            headers: results.meta.fields,
            firstRow: results.data[0],
            totalRows: results.data.length,
            platform: platform,
            dateField: platformConfig?.entryDateField
          });

          // Validate required headers
          const headers = results.meta.fields || [];
          const missingHeaders = platformConfig.requiredHeaders.filter(
            header => !headers.includes(header)
          );

          if (missingHeaders.length > 0) {
            setError(`Missing required columns: ${missingHeaders.join(", ")}\n\nFound columns: ${headers.join(", ")}`);
            setIsLoading(false);
            return;
          }

          const errors: string[] = [];
          const validTrades: Trade[] = [];

          if (platform === "Tradovate") {
            console.log("PROCESSING TRADOVATE CSV");
            
            // Group orders by symbol
            const ordersBySymbol = new Map<string, any[]>();
            const csvRows = results.data as any[];
            
            // Only use filled orders
            const filledOrders = csvRows.filter(order => order.Status === " Filled");
            
            // First few orders for debugging
            console.log("FIRST 5 ORDERS:", filledOrders.slice(0, 5).map(order => ({
              id: order.orderId,
              action: order["B/S"],
              symbol: order.Contract,
              price: order["Avg Fill Price"],
              timestamp: order.Timestamp
            })));
            
            // Group by symbol
            filledOrders.forEach(order => {
              const symbol = order.Contract?.trim();
              if (!symbol) return;
              
              if (!ordersBySymbol.has(symbol)) {
                ordersBySymbol.set(symbol, []);
              }
              ordersBySymbol.get(symbol)!.push(order);
            });
            
            // Process each symbol's orders
            ordersBySymbol.forEach((orders, symbol) => {
              // Sort orders chronologically
              orders.sort((a, b) => new Date(a.Timestamp).getTime() - new Date(b.Timestamp).getTime());
              
              console.log(`Processing ${orders.length} orders for ${symbol}`);
              
              // Track positions - we'll have separate long and short position trackers
              let longPositionSize = 0;
              let longEntryTotal = 0;
              let longEntryTime: Date | null = null;
              
              let shortPositionSize = 0;
              let shortEntryTotal = 0;
              let shortEntryTime: Date | null = null;
              
              orders.forEach(order => {
                try {
                  const qty = parseFloat(order["Filled Qty"]?.replace(/[,]/g, "") || "0");
                  const price = parseFloat(order["Avg Fill Price"]?.replace(/[$,]/g, "") || "0");
                  const isBuy = order["B/S"].trim() === " Buy" || order["B/S"].trim() === "Buy";
                  const multiplier = getCorrectMultiplier(symbol);
                  console.log(`Processing ${symbol} with multiplier: ${multiplier}`);
                  const timestamp = new Date(order.Timestamp);
                  
                  if (!qty || !price) {
                    console.log("Skipping order with invalid price/quantity", { price, qty });
                    return;
                  }
                  
                  console.log(`Processing order: ${isBuy ? "BUY" : "SELL"} ${qty} ${symbol} @ ${price}`);
                  
                  // Buy order handling
                  if (isBuy) {
                    // First, check if we're closing a short position
                    if (shortPositionSize > 0) {
                      const closeQty = Math.min(shortPositionSize, qty);
                      const avgShortEntry = shortEntryTotal / shortPositionSize;
                      const pnl = (avgShortEntry - price) * closeQty * multiplier;
                      
                      console.log(`Closing SHORT position: ${closeQty} @ ${price}, entry was ${avgShortEntry}, PNL: ${pnl}`);
                      
                      validTrades.push({
                        id: crypto.randomUUID(),
                        symbol,
                        direction: "SHORT",
                        entryDate: shortEntryTime!.toISOString(),
                        entryPrice: avgShortEntry,
                        exitDate: timestamp.toISOString(),
                        exitPrice: price,
                        quantity: closeQty,
                        pnl,
                        notes: "",
                        tags: [],
                        accountId: selectedAccount
                      });
                      
                      shortPositionSize -= closeQty;
                      shortEntryTotal = shortPositionSize > 0 ? avgShortEntry * shortPositionSize : 0;
                      
                      // If we still have quantity remaining after closing short, open a long position
                      const remainingQty = qty - closeQty;
                      if (remainingQty > 0) {
                        if (longPositionSize === 0) {
                          longEntryTime = timestamp;
                        }
                        longEntryTotal += price * remainingQty;
                        longPositionSize += remainingQty;
                        console.log(`Opening LONG position: ${remainingQty} @ ${price}`);
                      }
                    } 
                    // Otherwise just add to long position
                    else {
                      if (longPositionSize === 0) {
                        longEntryTime = timestamp;
                      }
                      longEntryTotal += price * qty;
                      longPositionSize += qty;
                      console.log(`Opening/adding to LONG position: ${qty} @ ${price}`);
                    }
                  } 
                  // Sell order handling
                  else {
                    // First, check if we're closing a long position
                    if (longPositionSize > 0) {
                      const closeQty = Math.min(longPositionSize, qty);
                      const avgLongEntry = longEntryTotal / longPositionSize;
                      const pnl = (price - avgLongEntry) * closeQty * multiplier;
                      
                      console.log(`Closing LONG position: ${closeQty} @ ${price}, entry was ${avgLongEntry}, PNL: ${pnl}`);
                      
                      validTrades.push({
                        id: crypto.randomUUID(),
                        symbol,
                        direction: "LONG",
                        entryDate: longEntryTime!.toISOString(),
                        entryPrice: avgLongEntry,
                        exitDate: timestamp.toISOString(),
                        exitPrice: price,
                        quantity: closeQty,
                        pnl,
                        notes: "",
                        tags: [],
                        accountId: selectedAccount
                      });
                      
                      longPositionSize -= closeQty;
                      longEntryTotal = longPositionSize > 0 ? avgLongEntry * longPositionSize : 0;
                      
                      // If we still have quantity remaining after closing long, open a short position
                      const remainingQty = qty - closeQty;
                      if (remainingQty > 0) {
                        if (shortPositionSize === 0) {
                          shortEntryTime = timestamp;
                        }
                        shortEntryTotal += price * remainingQty;
                        shortPositionSize += remainingQty;
                        console.log(`Opening SHORT position: ${remainingQty} @ ${price}`);
                      }
                    } 
                    // Otherwise just add to short position
                    else {
                      if (shortPositionSize === 0) {
                        shortEntryTime = timestamp;
                      }
                      shortEntryTotal += price * qty;
                      shortPositionSize += qty;
                      console.log(`Opening/adding to SHORT position: ${qty} @ ${price}`);
                    }
                  }
                } catch (error) {
                  console.error("Error processing order:", error);
                  errors.push(`Error processing order: ${error instanceof Error ? error.message : String(error)}`);
                }
              });
              
              // Handle remaining open positions
              if (longPositionSize > 0) {
                const avgEntry = longEntryTotal / longPositionSize;
                console.log(`Adding open LONG position: ${longPositionSize} @ ${avgEntry}`);
                
                validTrades.push({
                  id: crypto.randomUUID(),
                  symbol,
                  direction: "LONG",
                  entryDate: longEntryTime!.toISOString(),
                  entryPrice: avgEntry,
                  quantity: longPositionSize,
                  notes: "",
                  tags: [],
                  accountId: selectedAccount
                });
              }
              
              if (shortPositionSize > 0) {
                const avgEntry = shortEntryTotal / shortPositionSize;
                console.log(`Adding open SHORT position: ${shortPositionSize} @ ${avgEntry}`);
                
                validTrades.push({
                  id: crypto.randomUUID(),
                  symbol,
                  direction: "SHORT",
                  entryDate: shortEntryTime!.toISOString(),
                  entryPrice: avgEntry,
                  quantity: shortPositionSize,
                  notes: "",
                  tags: [],
                  accountId: selectedAccount
                });
              }
            });
          } else {
            // Original parsing logic for other platforms
            results.data
              .filter((row: any) => {
                return Object.keys(row).length > 0 && 
                       Object.values(row).some(val => val !== null && val !== "");
              })
              .forEach((row: any, index: number) => {
                try {
                  // Enhanced row debugging
                  console.log(`Processing row ${index + 1}:`, {
                    row,
                    filledQty: row["Filled Qty"],
                    avgFillPrice: row["Avg Fill Price"],
                    timestamp: row.Timestamp,
                    symbol: row[platformConfig.symbolField],
                    direction: row[platformConfig.directionField]
                  });

                  // Check required fields
                  const symbol = row[platformConfig.symbolField]?.trim();
                  if (!symbol) {
                    errors.push(`Row ${index + 1}: Missing symbol`);
                    return;
                  }

                  const directionRaw = row[platformConfig.directionField]?.trim();
                  if (!directionRaw) {
                    errors.push(`Row ${index + 1}: Missing direction`);
                    return;
                  }

                  const direction = platformConfig.directionMapping[directionRaw] || 
                    (directionRaw.toLowerCase().includes("buy") ? "LONG" : "SHORT");
                  
                  // For Tradovate: use Timestamp for entry date
                  let dateStr = platform === "Tradovate" ? row.Timestamp?.trim() : row[platformConfig.entryDateField]?.trim();

                  if (!dateStr) {
                    const rowData = Object.entries(row)
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(", ");
                    errors.push(`Row ${index + 1}: Missing entry date. Row data: ${rowData}`);
                    return;
                  }

                  const entryDate = parseTradeDate(dateStr);
                  if (!entryDate) {
                    errors.push(`Row ${index + 1}: Invalid entry date format: "${dateStr}"`);
                    return;
                  }

                  // For Tradovate: use Avg Fill Price
                  let entryPriceRaw = platform === "Tradovate" ? 
                    row["Avg Fill Price"]?.trim() : 
                    row[platformConfig.entryPriceField]?.trim();

                  if (!entryPriceRaw) {
                    errors.push(`Row ${index + 1}: Missing entry price`);
                    return;
                  }
                  
                  const entryPrice = parseFloat(entryPriceRaw.replace(/[$,]/g, ""));
                  if (isNaN(entryPrice)) {
                    errors.push(`Row ${index + 1}: Invalid entry price: "${entryPriceRaw}"`);
                    return;
                  }

                  // For Tradovate: use Filled Qty
                  let quantityRaw = platform === "Tradovate" ? 
                    row["Filled Qty"]?.trim() : 
                    row[platformConfig.quantityField]?.trim();

                  if (!quantityRaw) {
                    errors.push(`Row ${index + 1}: Missing quantity`);
                    return;
                  }
                  
                  const quantity = parseFloat(quantityRaw.replace(/[,]/g, ""));
                  if (isNaN(quantity)) {
                    errors.push(`Row ${index + 1}: Invalid quantity: "${quantityRaw}"`);
                    return;
                  }

                  // Optional fields
                  let exitDate = undefined;
                  let exitPrice = undefined;
                  let pnl = undefined;
                  let fees = undefined;

                  if (platformConfig.exitDateField && row[platformConfig.exitDateField]?.trim()) {
                    const parsedExitDate = parseTradeDate(row[platformConfig.exitDateField]);
                    if (parsedExitDate) {
                      exitDate = parsedExitDate.toISOString();
                    }
                  }

                  if (platformConfig.exitPriceField && row[platformConfig.exitPriceField]?.trim()) {
                    exitPrice = parseFloat(row[platformConfig.exitPriceField].replace(/[$,]/g, ""));
                  }

                  if (platformConfig.pnlField && row[platformConfig.pnlField]?.trim()) {
                    pnl = parseFloat(row[platformConfig.pnlField].replace(/[$,]/g, ""));
                  }

                  if (platformConfig.feesField && row[platformConfig.feesField]?.trim()) {
                    fees = parseFloat(row[platformConfig.feesField].replace(/[$,]/g, ""));
                  }

                  // Calculate contract multiplier for futures
                  const contractMultiplier = isFuturesContract(symbol) ? getCorrectMultiplier(symbol) : 1;

                  validTrades.push({
                    id: crypto.randomUUID(),
                    accountId: selectedAccount,
                    symbol,
                    direction,
                    quantity,
                    entryPrice,
                    entryDate: entryDate.toISOString(),
                    exitDate,
                    exitPrice,
                    pnl,
                    fees,
                    contractMultiplier,
                    source: "import",
                    importSource: platform
                  } as Trade);
                } catch (rowError: any) {
                  console.error(`Error processing row ${index + 1}:`, rowError);
                  errors.push(`Row ${index + 1}: ${rowError.message}`);
                }
              });
          }

          if (errors.length > 0) {
            setError(`Found ${errors.length} issues:\n\n${errors.slice(0, 5).join("\n")}`);
            setIsLoading(false);
            return;
          }

          setParsedTrades(validTrades);
          setStep(2);
        } catch (e) {
          console.error("Parse error:", e);
          setError(e instanceof Error ? e.message : "Failed to parse CSV file. Please check the format and try again.");
        }
        setIsLoading(false);
      },
      error: (error) => {
        console.error("CSV read error:", error);
        setError("Failed to read CSV file. Please check the file and try again.");
        setIsLoading(false);
      }
    });
  };

  const handleImport = () => {
    if (!selectedAccount || parsedTrades.length === 0) return;

    // Get existing trades
    const existingTradesStr = localStorage.getItem('tradingJournalTrades');
    const existingTrades = existingTradesStr ? JSON.parse(existingTradesStr) : {};

    // Find the selected account
    const account = accounts.find(acc => acc.id === selectedAccount);
    
    // Find associated broker if any
    const associatedBroker = brokers.find(b => b.accountId === selectedAccount);
    const importSource = associatedBroker 
      ? `${associatedBroker.name} (${platform})`
      : platform;

    // Add new trades
    const updatedTrades = {
      ...existingTrades,
      ...Object.fromEntries(parsedTrades.map(trade => [trade.id, {
        ...trade,
        importSource,
        importDate: new Date().toISOString()
      }]))
    };

    // Save to localStorage
    localStorage.setItem('tradingJournalTrades', JSON.stringify(updatedTrades));

    // Call the onImportSuccess callback if provided
    if (onImportSuccess) {
      onImportSuccess(parsedTrades as unknown as TradeData[]);
    } else {
      // Reset form and close dialog
      setPlatform(undefined);
      setSelectedFile(undefined);
      setSelectedAccountId("new-account");
      setParsedTrades([]);
      setStep(1);

      // Update selected account
      toggleAccount(selectedAccount);

      // Redirect to trades page
      router.push("/trades");
    }
  };

  const handleDeleteImport = () => {
    if (!selectedAccount) return;

    // Get existing trades
    const existingTradesStr = localStorage.getItem('tradingJournalTrades');
    if (!existingTradesStr) return;

    const existingTrades = JSON.parse(existingTradesStr);
    
    // Filter out trades for the selected account
    const updatedTrades = Object.fromEntries(
      Object.entries(existingTrades).filter(([_, trade]: [string, any]) => 
        trade.accountId !== selectedAccount
      )
    );

    // Save back to localStorage
    localStorage.setItem('tradingJournalTrades', JSON.stringify(updatedTrades));

    // Reset form and close dialog
    setPlatform(undefined);
    setSelectedFile(undefined);
    setSelectedAccountId("new-account");
    setParsedTrades([]);
    setStep(1);
  };

  const getCorrectMultiplier = (symbol: string): number => {
    // Special handling for NQ futures
    if (symbol.includes('NQ') || symbol.includes('nq') || symbol.toUpperCase().includes('NASDAQ')) {
      return 20; // E-mini Nasdaq 100 is $20 per point
    }
    return getFuturesContractMultiplier(symbol);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button id="csv-import-button" variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Import Trades</DialogTitle>
          <DialogDescription>
            Import your trades from a CSV file exported from your trading platform.
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <h4 className="font-medium">Select Trading Platform</h4>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform..." />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose your trading platform to import trades from
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Select Account</h4>
              <Select value={selectedAccount} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an account..." />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                  <SelectItem key="new-account" value="new-account">
                    + Add New Account
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose which account to import trades into
              </p>
            </div>

            {selectedAccount === "new-account" && (
              <div className="space-y-2 border rounded-lg p-4">
                <h4 className="font-medium">Create New Account</h4>
                <div className="space-y-2">
                  <Input 
                    placeholder="Account Name"
                    value={newAccountName || ""}
                    onChange={(e) => setNewAccountName(e.target.value)}
                  />
                  <Button 
                    onClick={() => {
                      if (newAccountName.trim()) {
                        const newAccount = createAccount(newAccountName);
                        setSelectedAccountId(newAccount.id);
                        setNewAccountName("");
                      }
                    }}
                    disabled={!newAccountName?.trim()}
                    className="w-full"
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Upload CSV File</h4>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload a CSV file from a supported trading platform
                </p>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload">
                  <Button variant="secondary" asChild>
                    <span>Select CSV File</span>
                  </Button>
                </label>
                {selectedFile && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end">
              <Button
                onClick={parseCSV}
                disabled={!platform || !selectedAccount || !selectedFile || isLoading}
              >
                {isLoading ? "Processing..." : "Continue"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Preview Trades</h4>
              <p className="text-sm text-muted-foreground">
                Found {parsedTrades.length} trades
              </p>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">Symbol</th>
                    <th className="text-left p-2 font-medium">Direction</th>
                    <th className="text-right p-2 font-medium">Entry Date</th>
                    <th className="text-right p-2 font-medium">Entry Price</th>
                    <th className="text-right p-2 font-medium">Exit Date</th>
                    <th className="text-right p-2 font-medium">Exit Price</th>
                    <th className="text-right p-2 font-medium">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedTrades.slice(0, 5).map((trade) => (
                    <tr key={trade.id} className="border-b">
                      <td className="p-2">{trade.symbol}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          trade.direction === "LONG" 
                            ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
                        }`}>
                          {trade.direction}
                        </span>
                      </td>
                      <td className="p-2 text-right">{formatDateTime(trade.entryDate)}</td>
                      <td className="p-2 text-right">{formatCurrency(trade.entryPrice)}</td>
                      <td className="p-2 text-right">{trade.exitDate ? formatDateTime(trade.exitDate) : "-"}</td>
                      <td className="p-2 text-right">{trade.exitPrice ? formatCurrency(trade.exitPrice) : "-"}</td>
                      <td className={`p-2 text-right font-medium ${
                        (trade.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {trade.pnl ? formatCurrency(trade.pnl) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedTrades.length > 5 && (
                <div className="p-2 text-center text-sm text-muted-foreground border-t">
                  ... and {parsedTrades.length - 5} more trades
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={parsedTrades.length === 0}
              >
                Import {parsedTrades.length} Trades
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 