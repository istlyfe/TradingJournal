"use client";

import { useState, useEffect } from "react";
import { 
  Upload, 
  AlertTriangle, 
  Check, 
  FileText, 
  HelpCircle, 
  Info, 
  ArrowRight, 
  Trash2,
  BarChart4,
  LineChart,
  PieChart,
  TrendingUp,
  Building2,
  Banknote
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { parse } from "papaparse";
import { parseTradeDate, formatDateTime, formatCurrency } from "@/lib/utils";
import { calculatePnL, getContractMultiplier, isFutures } from "@/lib/tradeService";
import { Account } from "@/components/accounts/AccountManager";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { useAccounts } from "@/hooks/useAccounts";
import { useBrokers } from "@/hooks/useBrokers";
import { Trade } from "@/types/trade";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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

// Organize platforms by category for better UI
const PLATFORM_CATEGORIES = [
  {
    name: "Retail Brokers",
    platforms: ["Interactive Brokers", "Webull", "ThinkorSwim"]
  },
  {
    name: "Trading Platforms",
    platforms: ["Tradovate", "TradingView"]
  }
];

// Platform icons/logos map
const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  "Tradovate": <BarChart4 className="h-5 w-5 text-blue-500" />,
  "TradingView": <LineChart className="h-5 w-5 text-green-500" />,
  "Interactive Brokers": <Building2 className="h-5 w-5 text-purple-500" />,
  "ThinkorSwim": <TrendingUp className="h-5 w-5 text-orange-500" />,
  "Webull": <Banknote className="h-5 w-5 text-red-500" />
};

// Alphabetically sorted platform names for dropdown
const SUPPORTED_PLATFORMS = platformConfigs.map(config => config.name).sort() as readonly string[];

// Pre-defined account colors (same as in AccountsPanel)
const ACCOUNT_COLORS = [
  '#7C3AED', // Purple
  '#2563EB', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#EC4899', // Pink
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#6B7280', // Gray
];

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
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);
  const { brokers } = useBrokers();
  const [platformTab, setPlatformTab] = useState<string>("retail");

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
            const filledOrders = csvRows.filter(order => order.Status === " Filled" || order.Status === "Filled");
            
            // First few orders for debugging
            console.log("FIRST 5 ORDERS:", filledOrders.slice(0, 5).map(order => ({
              id: order.orderId,
              action: order["B/S"],
              symbol: order.Contract,
              price: order["avgPrice"] || order["Avg Fill Price"],
              quantity: order["filledQty"] || order["Filled Qty"],
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
                  // Handle different column formats
                  const filledQtyField = order["Filled Qty"] !== undefined ? "Filled Qty" : "filledQty";
                  const priceField = order["Avg Fill Price"] !== undefined ? "Avg Fill Price" : "avgPrice";
                  const actionField = order["B/S"] !== undefined ? "B/S" : "Side";
                  
                  let qty = parseFloat(String(order[filledQtyField]).replace(/[,]/g, "") || "0");
                  let price = parseFloat(String(order[priceField]).replace(/[$,]/g, "") || "0");
                  
                  // Handle action field variations
                  const action = String(order[actionField]).trim();
                  const isBuy = action === " Buy" || action === "Buy" || action === "BUY" || action === "B";
                  
                  const multiplier = getContractMultiplier(symbol);
                  // Force NQ multiplier to always be 20
                  const effectiveMultiplier = symbol.toUpperCase().includes('NQ') ? 20 : multiplier;
                  
                  console.log(`Processing ${symbol} with multiplier: ${effectiveMultiplier}`);
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
                      const pnl = calculatePnL(symbol, "SHORT", avgShortEntry, price, closeQty);
                      
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
                      const pnl = calculatePnL(symbol, "LONG", avgLongEntry, price, closeQty);
                      
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
                  const isNQ = symbol.toUpperCase().includes('NQ');
                  const contractMultiplier = isNQ ? 20 : (isFutures(symbol) ? getContractMultiplier(symbol) : 1);
                  
                  console.log(`Using multiplier ${contractMultiplier} for ${symbol}`);

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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button id="csv-import-button" variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Import Trades</DialogTitle>
          <DialogDescription>
            Import your trades from a CSV file exported from your trading platform.
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <h4 className="font-medium text-base">Select Trading Platform</h4>
              
              <Tabs defaultValue="retail" value={platformTab} onValueChange={setPlatformTab} className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="retail">Retail Brokers</TabsTrigger>
                  <TabsTrigger value="platforms">Trading Platforms</TabsTrigger>
                </TabsList>
                
                <TabsContent value="retail" className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {PLATFORM_CATEGORIES[0].platforms.map(p => (
                      <Card 
                        key={p}
                        className={`cursor-pointer hover:border-primary transition-all ${platform === p ? 'border-2 border-primary ring-2 ring-primary/20' : ''}`}
                        onClick={() => setPlatform(p)}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {PLATFORM_ICONS[p]}
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-medium">{p}</h4>
                          </div>
                          {platform === p && (
                            <div className="flex-shrink-0">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="platforms" className="pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {PLATFORM_CATEGORIES[1].platforms.map(p => (
                      <Card 
                        key={p}
                        className={`cursor-pointer hover:border-primary transition-all ${platform === p ? 'border-2 border-primary ring-2 ring-primary/20' : ''}`}
                        onClick={() => setPlatform(p)}
                      >
                        <CardContent className="p-4 flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {PLATFORM_ICONS[p]}
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-medium">{p}</h4>
                          </div>
                          {platform === p && (
                            <div className="flex-shrink-0">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
              
              {platform && (
                <Badge variant="outline" className="mt-1 py-1 px-2">
                  Selected: <span className="font-medium ml-1">{platform}</span>
                </Badge>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <h4 className="font-medium text-base">Choose Account</h4>
              <Select value={selectedAccount} onValueChange={setSelectedAccountId}>
                <SelectTrigger className="w-full">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {selectedAccount === "new-account" ? (
                      <span>Add New Account</span>
                    ) : selectedAccount ? (
                      <>
                        {accounts?.find(acc => acc.id === selectedAccount)?.color && (
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: accounts?.find(acc => acc.id === selectedAccount)?.color }} 
                          />
                        )}
                        <span className="truncate">
                          {accounts?.find(acc => acc.id === selectedAccount)?.name || "Select an account..."}
                        </span>
                      </>
                    ) : (
                      <span>Select an account...</span>
                    )}
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  <SelectItem key="new-account" value="new-account">
                    <div className="flex items-center">
                      <span className="font-medium text-primary">+ Add New Account</span>
                    </div>
                  </SelectItem>
                  
                  <SelectSeparator />
                  
                  {accounts?.length > 0 && accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        {account.color && (
                          <div 
                            className="w-3 h-3 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: account.color }} 
                          />
                        )}
                        <span className="truncate">{account.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAccount === "new-account" && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                <h4 className="font-medium">Create New Account</h4>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="account-name" className="text-sm font-medium mb-1 block">
                      Account Name
                    </label>
                    <Input 
                      id="account-name"
                      placeholder="Account Name"
                      value={newAccountName || ""}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      autoFocus
                      className="bg-background"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Account Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {ACCOUNT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`relative w-8 h-8 rounded-full transition-all ${
                            selectedColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          title={`Select ${color} as account color`}
                        >
                          {selectedColor === color && (
                            <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      if (newAccountName.trim()) {
                        const newAccount = createAccount(newAccountName, selectedColor);
                        setSelectedAccountId(newAccount.id);
                        setNewAccountName("");
                        setSelectedColor(ACCOUNT_COLORS[0]);
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

            <div className="space-y-2 pt-2">
              <h4 className="font-medium text-base">Upload CSV File</h4>
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-6 bg-muted/10 hover:bg-muted/20 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  Upload a CSV file from {platform ? platform : 'a supported trading platform'}
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
                  <p className="mt-2 text-sm font-medium">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end pt-2">
              <Button
                onClick={parseCSV}
                disabled={!platform || !selectedAccount || !selectedFile || isLoading}
                className="w-auto px-5"
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
                Found {parsedTrades.length} trade{parsedTrades.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium w-[15%]">Symbol</th>
                    <th className="text-left p-2 font-medium w-[10%]">Direction</th>
                    <th className="text-right p-2 font-medium w-[15%]">Entry Date</th>
                    <th className="text-right p-2 font-medium w-[12%]">Entry Price</th>
                    <th className="text-right p-2 font-medium w-[15%]">Exit Date</th>
                    <th className="text-right p-2 font-medium w-[12%]">Exit Price</th>
                    <th className="text-right p-2 font-medium w-[8%]">Qty</th>
                    <th className="text-right p-2 font-medium w-[13%]">P&L</th>
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
                      <td className="p-2 text-right whitespace-nowrap">{formatDateTime(trade.entryDate)}</td>
                      <td className="p-2 text-right whitespace-nowrap">{formatCurrency(trade.entryPrice)}</td>
                      <td className="p-2 text-right whitespace-nowrap">{trade.exitDate ? formatDateTime(trade.exitDate) : "-"}</td>
                      <td className="p-2 text-right whitespace-nowrap">{trade.exitPrice ? formatCurrency(trade.exitPrice) : "-"}</td>
                      <td className="p-2 text-right whitespace-nowrap">{trade.quantity}</td>
                      <td className={`p-2 text-right font-medium whitespace-nowrap ${
                        (trade.pnl || 0) >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {trade.pnl ? formatCurrency(trade.pnl) : calculateAndFormatPnL(trade)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedTrades.length > 5 && (
                <div className="p-2 text-center text-sm text-muted-foreground border-t">
                  ... and {parsedTrades.length - 5} more trade{parsedTrades.length - 5 !== 1 ? 's' : ''}
                  <Button 
                    variant="link" 
                    className="p-0 ml-2 text-sm" 
                    onClick={() => window.alert(`All ${parsedTrades.length} trades will be imported when you click the Import button.`)}
                  >
                    <Info className="h-4 w-4 inline-block mr-1" />
                    See details
                  </Button>
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
                Import {parsedTrades.length} Trade{parsedTrades.length !== 1 ? 's' : ''} 
                {selectedAccount !== "new-account" && accounts.find(a => a.id === selectedAccount) && 
                  ` to ${accounts.find(a => a.id === selectedAccount)?.name}`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function calculateAndFormatPnL(trade: any): string {
  if (!trade.exitPrice) return "-";
  
  // Calculate PnL if not already calculated
  const pnl = calculatePnL(
    trade.symbol,
    trade.direction,
    trade.entryPrice,
    trade.exitPrice,
    trade.quantity
  );
  
  return formatCurrency(pnl);
} 