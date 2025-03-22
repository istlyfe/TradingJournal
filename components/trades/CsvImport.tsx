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
  Banknote,
  ChevronUp,
  ChevronDown,
  PlusCircle,
  ChevronsUpDown
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { parse } from "papaparse";
import { parseTradeDate, formatDateTime, formatCurrency, cn } from "@/lib/utils";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

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

interface CsvImportProps {
  onImportSuccess?: (trades: TradeData[]) => void;
  isOpen?: boolean;
  onClose?: () => void;
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
    name: "TopstepX",
    requiredHeaders: ["Id", "ContractName", "EnteredAt", "ExitedAt", "EntryPrice", "ExitPrice", "Fees", "PnL", "Size", "Type"],
    symbolField: "ContractName",
    directionField: "Type",
    entryDateField: "EnteredAt",
    entryPriceField: "EntryPrice",
    exitDateField: "ExitedAt",
    exitPriceField: "ExitPrice",
    quantityField: "Size",
    pnlField: "PnL",
    feesField: "Fees",
    directionMapping: {
      "Long": "LONG",
      "Short": "SHORT"
    }
  },
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
    name: "All Platforms",
    platforms: ["TopstepX", "Tradovate", "TradingView", "Interactive Brokers", "Webull", "ThinkorSwim"]
  }
];

// Platform icons/logos map
const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  "TopstepX": <PieChart className="h-5 w-5 text-blue-700" />,
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

// Platform-specific instructions
const PLATFORM_INSTRUCTIONS: Record<string, string[]> = {
  "TopstepX": [
    "Log in to your TopstepX account",
    "Go to the Reports section in the dashboard",
    "Select the date range for your trades",
    "Click on 'Export' to download the CSV file",
    "Import the downloaded CSV file here"
  ],
  // Add instructions for other platforms as needed
};

// Instructions component
function PlatformInstructions({ platformName }: { platformName: string }) {
  const [expanded, setExpanded] = useState(false);
  const instructions = PLATFORM_INSTRUCTIONS[platformName] || [];
  
  if (!instructions.length) return null;
  
  return (
    <div className="text-sm border rounded-md p-3 mb-3 bg-muted/10 w-full">
      <button 
        className="flex items-center justify-between w-full text-left" 
        onClick={() => setExpanded(!expanded)}
      >
        <h5 className="font-medium flex items-center">
          <Info className="h-4 w-4 mr-2 text-primary" />
          How to export from {platformName}
        </h5>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      
      {expanded && (
        <div className="mt-2 pt-2 border-t">
          <ol className="list-decimal pl-5 space-y-1">
            {instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export function CsvImport({ onImportSuccess, isOpen, onClose }: CsvImportProps) {
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
  const [autoSelectInFilter, setAutoSelectInFilter] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Use the isOpen prop if provided, otherwise use internal state
  const showDialog = isOpen !== undefined ? isOpen : dialogOpen;

  const handleOpenChange = (open: boolean) => {
    if (onClose && !open) {
      onClose();
    } else {
      setDialogOpen(open);
    }

    // Reset state when dialog is closed
    if (!open) {
      setPlatform(undefined);
      setSelectedFile(undefined);
      setSelectedAccountId("new-account");
      setParsedTrades([]);
      setStep(1);
      setError(undefined);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input change event triggered");
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      console.log("File selected:", file.name, "size:", file.size);
      setSelectedFile(file);
      setError(undefined);
    } else {
      console.log("No file selected or file selection canceled");
    }
  };

  const parseCSV = () => {
    if (!selectedFile || !platform || !selectedAccount) {
      console.error("Cannot parse CSV: missing file, platform, or account", { 
        hasFile: !!selectedFile, 
        platform, 
        selectedAccount 
      });
      return;
    }
    
    console.log("Starting CSV parsing for file:", selectedFile.name);
    setIsLoading(true);
    setError(undefined);

    // Get the platform configuration
    const platformConfig = platformConfigs.find(p => p.name === platform);
    if (!platformConfig) {
      setError("Invalid platform selected");
      setIsLoading(false);
      return;
    }

    // Create a direct parse with PapaParse which handles the file reading internally
    parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Enhanced debugging output
          console.log("CSV Parse Results:", {
            headers: results.meta.fields,
            firstRow: results.data && results.data.length > 0 ? results.data[0] : null,
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

          // Process the CSV based on the platform
          results.data.forEach((row: any, index: number) => {
            try {
              // Create trade object based on the platform
              if (platform === "TopstepX") {
                processTopstepXRow(row, index, platformConfig, validTrades, errors);
              } else if (platform === "Tradovate") {
                // Tradovate is processed differently due to its format
                // But we don't process individual rows here
              } else {
                // Generic processing for other platforms
                processGenericRow(row, index, platformConfig, validTrades, errors);
              }
            } catch (rowError: any) {
              console.error(`Error processing row ${index + 2}:`, rowError);
              errors.push(`Row ${index + 2}: ${rowError.message}`);
            }
          });

          // Special case for Tradovate which needs to group orders
          if (platform === "Tradovate") {
            processTradovateData(results.data as any[], validTrades, errors);
          }

          if (errors.length > 0) {
            setError(`Found ${errors.length} issues:\n\n${errors.slice(0, 5).join("\n")}`);
            setIsLoading(false);
            return;
          }

          console.log(`Successfully parsed ${validTrades.length} trades`);
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

  // Helper function to process TopstepX rows
  const processTopstepXRow = (row: any, index: number, platformConfig: PlatformConfig, validTrades: Trade[], errors: string[]) => {
    // Validate required fields
    const requiredFields = [
      platformConfig.symbolField,
      platformConfig.directionField,
      platformConfig.entryDateField,
      platformConfig.entryPriceField,
      platformConfig.quantityField
    ];
    
    const missingFields = requiredFields.filter(field => !row[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
    }
    
    // Parse dates with timezone information
    let entryDate;
    try {
      entryDate = new Date(row[platformConfig.entryDateField]);
      if (isNaN(entryDate.getTime())) {
        throw new Error(`Invalid entry date format: ${row[platformConfig.entryDateField]}`);
      }
    } catch (e) {
      throw new Error(`Failed to parse entry date: ${row[platformConfig.entryDateField]}`);
    }
    
    let exitDate = undefined;
    if (platformConfig.exitDateField && row[platformConfig.exitDateField]) {
      try {
        exitDate = new Date(row[platformConfig.exitDateField]);
        if (isNaN(exitDate.getTime())) {
          console.warn(`Invalid exit date format, setting to undefined: ${row[platformConfig.exitDateField]}`);
          exitDate = undefined;
        }
      } catch (e) {
        console.warn(`Failed to parse exit date, setting to undefined: ${row[platformConfig.exitDateField]}`);
      }
    }
    
    // Parse numerical values
    const entryPrice = parseFloat(String(row[platformConfig.entryPriceField]).replace(/[$,]/g, ""));
    let exitPrice = undefined;
    if (platformConfig.exitPriceField && row[platformConfig.exitPriceField]) {
      exitPrice = parseFloat(String(row[platformConfig.exitPriceField]).replace(/[$,]/g, ""));
    }
    
    const quantity = parseFloat(String(row[platformConfig.quantityField]).replace(/[,]/g, ""));
    
    // Handle direction mapping
    const rawDirection = row[platformConfig.directionField];
    const direction = platformConfig.directionMapping[rawDirection];
    
    if (!direction) {
      throw new Error(`Unknown direction: ${rawDirection}`);
    }
    
    // Handle fees and PnL
    let fees = undefined;
    if (platformConfig.feesField && row[platformConfig.feesField]) {
      fees = parseFloat(String(row[platformConfig.feesField]).replace(/[$,]/g, ""));
    }
    
    let pnl = undefined;
    if (platformConfig.pnlField && row[platformConfig.pnlField]) {
      pnl = parseFloat(String(row[platformConfig.pnlField]).replace(/[$,]/g, ""));
    } else if (entryPrice && exitPrice && quantity) {
      // Calculate PnL if not provided
      const multiplier = getContractMultiplier(row[platformConfig.symbolField]);
      const directionMultiplier = direction === "LONG" ? 1 : -1;
      pnl = directionMultiplier * (exitPrice - entryPrice) * quantity * multiplier;
    }
    
    // Create trade object
    const trade: Trade = {
      id: row.Id || crypto.randomUUID(),
      symbol: row[platformConfig.symbolField],
      direction,
      entryDate: entryDate.toISOString(),
      entryPrice,
      exitDate: exitDate?.toISOString(),
      exitPrice,
      quantity,
      pnl,
      fees,
      source: "import",
      importSource: platform,
      contractMultiplier: getContractMultiplier(row[platformConfig.symbolField]),
      accountId: selectedAccount
    };
    
    validTrades.push(trade);
  };

  // Helper function to process generic rows for other platforms
  const processGenericRow = (row: any, index: number, platformConfig: PlatformConfig, validTrades: Trade[], errors: string[]) => {
    // Check required fields
    const symbol = row[platformConfig.symbolField]?.trim();
    if (!symbol) {
      throw new Error(`Missing symbol`);
    }

    const directionRaw = row[platformConfig.directionField]?.trim();
    if (!directionRaw) {
      throw new Error(`Missing direction`);
    }

    const direction = platformConfig.directionMapping[directionRaw] || 
      (directionRaw.toLowerCase().includes("buy") ? "LONG" : "SHORT");
    
    const dateStr = row[platformConfig.entryDateField]?.trim();
    if (!dateStr) {
      const rowData = Object.entries(row)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
      throw new Error(`Missing entry date. Row data: ${rowData}`);
    }

    const entryDate = parseTradeDate(dateStr);
    if (!entryDate) {
      throw new Error(`Invalid entry date format: "${dateStr}"`);
    }

    const entryPriceRaw = row[platformConfig.entryPriceField]?.trim();
    if (!entryPriceRaw) {
      throw new Error(`Missing entry price`);
    }
    
    const entryPrice = parseFloat(entryPriceRaw.replace(/[$,]/g, ""));
    if (isNaN(entryPrice)) {
      throw new Error(`Invalid entry price: "${entryPriceRaw}"`);
    }

    const quantityRaw = row[platformConfig.quantityField]?.trim();
    if (!quantityRaw) {
      throw new Error(`Missing quantity`);
    }
    
    const quantity = parseFloat(quantityRaw.replace(/[,]/g, ""));
    if (isNaN(quantity)) {
      throw new Error(`Invalid quantity: "${quantityRaw}"`);
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
  };

  // Helper function to process Tradovate data which requires grouping orders
  const processTradovateData = (rows: any[], validTrades: Trade[], errors: string[]) => {
    // Group orders by symbol
    const ordersBySymbol = new Map<string, any[]>();
    
    // Only use filled orders
    const filledOrders = rows.filter(order => order.Status === " Filled" || order.Status === "Filled");
    
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

      // Update selected account in the filter if checkbox is checked
      if (autoSelectInFilter && selectedAccount !== "new-account") {
        // First, get current selected accounts from localStorage
        const currentSelectedAccounts = JSON.parse(
          localStorage.getItem('tradingJournalSelectedAccounts') || '[]'
        );
        
        // Add the current account if not already included
        if (!currentSelectedAccounts.includes(selectedAccount)) {
          const updatedSelectedAccounts = [...currentSelectedAccounts, selectedAccount];
          
          // Update localStorage directly
          localStorage.setItem(
            'tradingJournalSelectedAccounts', 
            JSON.stringify(updatedSelectedAccounts)
          );
          
          // Dispatch a custom event to notify components to refresh
          window.dispatchEvent(new CustomEvent('account-selection-change', { 
            detail: { selectedAccounts: updatedSelectedAccounts }
          }));
        }
        
        // Force the calendar and other components to refresh
        window.dispatchEvent(new Event('storage'));
        
        // Dispatch a custom event for trades to refresh
        window.dispatchEvent(new CustomEvent('trades-updated'));
      }

      // Close the dialog using the onClose prop if available
      if (onClose) {
        onClose();
      } else {
        setDialogOpen(false);
      }

      // Redirect to trades page with a refresh flag to ensure components update
      router.push("/trades?refresh=" + Date.now());
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
    
    // Close dialog using onClose prop if available
    if (onClose) {
      onClose();
    } else {
      setDialogOpen(false);
    }
  };

  // Function to render dialog content
  const renderDialogContent = () => {
    return (
      <>
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
              
              {platform && (
                <Badge variant="outline" className="mt-1 py-1 px-2">
                  Selected: <span className="font-medium ml-1">{platform}</span>
                </Badge>
              )}
            </div>

            {platform && <PlatformInstructions platformName={platform} />}

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
                
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.csv';
                    input.onchange = handleFileSelect;
                    input.click();
                  }}
                >
                  Select CSV File
                </Button>
                
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
              <div className="space-y-3 flex flex-col items-end">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-select-account"
                    checked={autoSelectInFilter}
                    onChange={(e) => setAutoSelectInFilter(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="auto-select-account" className="text-sm text-muted-foreground">
                    Automatically select this account in the filter
                  </label>
                </div>
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
          </div>
        )}
      </>
    );
  };

  return (
    <>
      {isOpen && (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
            {renderDialogContent()}
          </DialogContent>
        </Dialog>
      )}
    </>
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