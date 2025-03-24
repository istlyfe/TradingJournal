"use client";

import React, { useState, useEffect, useRef } from "react";
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
  ChevronsUpDown,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { parse } from "papaparse";
import { parseTradeDate, formatDateTime, formatCurrency, cn } from "@/lib/utils";
import { calculatePnL, getContractMultiplier, isFutures } from "@/lib/tradeService";
import { Account } from "@/components/accounts/AccountManager";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { AccountSelector } from "@/components/accounts/AccountSelector";
import { safeNavigate } from "@/lib/browser-utils";

export interface TradeData {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
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
  directionMapping: Record<string, 'long' | 'short'>;
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
      "Long": "long",
      "Short": "short"
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
      "B": "long",
      "Buy": "long",
      "S": "short",
      "Sell": "short"
    }
  },
  {
    name: "TradingView",
    requiredHeaders: ["Symbol", "Side", "Type", "Qty", "Fill Price", "Status", "Placing Time", "Closing Time", "Order ID"],
    symbolField: "Symbol",
    directionField: "Side",
    entryDateField: "Placing Time",
    entryPriceField: "Fill Price",
    exitDateField: "Closing Time",
    quantityField: "Qty",
    directionMapping: {
      "Buy": "long",
      "Sell": "short"
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
      "BUY": "long",
      "SELL": "short",
      "B": "long",
      "S": "short"
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
      "BUY": "long",
      "SELL": "short",
      "BOT": "long",
      "SLD": "short"
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
      "BUY": "long",
      "SELL": "short",
      "Buy": "long",
      "Sell": "short"
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
  "TradingView": [
    "Login to your TradingView account",
    "Open any chart",
    "At the bottom, click on 'Paper trading' or 'Live Trading'",
    "On the History table, click the three dots on the right-hand side",
    "Select columns to export - check all boxes (Side, Type, Qty, Price, etc.)",
    "Click on the TradingView logo for a dropdown menu",
    "Select 'Export data'",
    "Click on 'History' then click 'Export'",
    "Download and save the CSV file"
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
  const [selectedAccount, setSelectedAccount] = useState<string>("new-account");
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
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>("");
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialRun = useRef(true);

  // Use the isOpen prop if provided, otherwise use internal state
  const showDialog = isOpen !== undefined ? isOpen : dialogOpen;

  // Set selectedAccount to first account if accounts exist and none selected 
  // (only when accounts length changes or component mounts)
  useEffect(() => {
    // We only want to set the initial account once, when the component mounts
    if (initialRun.current && accounts.length > 0) {
      // Initialize with the first account
      console.log("Setting selectedAccount to first account", accounts[0].id);
      setSelectedAccount(accounts[0].id);
      initialRun.current = false;
    }
  // Don't have any dependencies to prevent re-running
  }, []);

  // Handle account selection changes
  const handleAccountChange = (value: string) => {
    if (value === "new-account") {
      setShowNewAccountForm(true);
    } else {
      setSelectedAccount(value);
      setShowNewAccountForm(false);
    }
  };

  // Handle creating a new account
  const handleCreateAccount = () => {
    if (!newAccountName.trim()) {
      setError("Account name cannot be empty");
      return;
    }
    
    try {
      // Create the account using the hook function
      const newAccount = createAccount(newAccountName, selectedColor);
      console.log("Created new account:", newAccount.id);
      
      // Select the newly created account
      setSelectedAccount(newAccount.id);
      
      // Reset form state
      setNewAccountName("");
      setSelectedColor(ACCOUNT_COLORS[0]);
      setShowNewAccountForm(false);
      setError(undefined);
      
      // Don't trigger any extra account selection events here
      // since the useEffect and account changes will handle that
    } catch (err) {
      console.error("Error creating account:", err);
      setError("Failed to create account. Please try again.");
    }
  };

  const handleOpenChange = (open: boolean) => {
    // Add an extra layer of protection around the open/close handling
    try {
      // First update the dialog open state
      if (onClose && !open) {
        onClose();
      } else {
        setDialogOpen(open);
      }

      // After very brief delay, reset state when dialog is closed
      if (!open) {
        setTimeout(() => {
          try {
            setPlatform(undefined);
            setSelectedFile(undefined);
            setSelectedAccount(accounts.length > 0 ? accounts[0].id : "new-account");
            setParsedTrades([]);
            setStep(1);
            setError(undefined);
            setSelectedBrokerId("");
            setShowNewAccountForm(false);
          } catch (err) {
            console.error("Error resetting state after dialog close:", err);
          }
        }, 50);
      }
    } catch (err) {
      console.error("Error in handleOpenChange:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
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
          switch (platform) {
            case "TopstepX":
              processTopstepXRow(results.data[0], 0, platformConfig, validTrades, errors);
              break;
            case "Tradovate":
              processTradovateData(results.data as any[], validTrades, errors);
              break;
            case "TradingView":
              processTradingViewData(results.data as any[], validTrades, errors);
              break;
            default:
              // For generic and other platforms
              results.data.forEach((row: any, index: number) => {
                processGenericRow(row, index, platformConfig, validTrades, errors);
              });
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
    
    let exitDate: Date | undefined = undefined;
    if (platformConfig.exitDateField && row[platformConfig.exitDateField]) {
      try {
        const parsedDate = new Date(row[platformConfig.exitDateField]);
        if (!isNaN(parsedDate.getTime())) {
          exitDate = parsedDate;
        } else {
          console.warn(`Invalid exit date format, setting to undefined: ${row[platformConfig.exitDateField]}`);
        }
      } catch (e) {
        console.warn(`Failed to parse exit date, setting to undefined: ${row[platformConfig.exitDateField]}`);
      }
    }
    
    // Parse numerical values
    const entryPrice = parseFloat(String(row[platformConfig.entryPriceField]).replace(/[$,]/g, ""));
    let exitPrice: number | undefined = undefined;
    if (platformConfig.exitPriceField && row[platformConfig.exitPriceField]) {
      exitPrice = parseFloat(String(row[platformConfig.exitPriceField]).replace(/[$,]/g, ""));
      if (isNaN(exitPrice)) exitPrice = undefined;
    }
    
    const quantity = parseFloat(String(row[platformConfig.quantityField]).replace(/[,]/g, ""));
    
    // Handle direction mapping
    const rawDirection = row[platformConfig.directionField];
    const mappedDirection = platformConfig.directionMapping[rawDirection];
    
    if (!mappedDirection) {
      throw new Error(`Unknown direction: ${rawDirection}`);
    }
    
    // Convert direction to lowercase to match Trade interface
    const direction = mappedDirection.toLowerCase() as 'long' | 'short';
    
    // Handle fees and PnL
    let fees: number | undefined = undefined;
    if (platformConfig.feesField && row[platformConfig.feesField]) {
      fees = parseFloat(String(row[platformConfig.feesField]).replace(/[$,]/g, ""));
      if (isNaN(fees)) fees = undefined;
    }
    
    let pnl: number | undefined = undefined;
    if (platformConfig.pnlField && row[platformConfig.pnlField]) {
      pnl = parseFloat(String(row[platformConfig.pnlField]).replace(/[$,]/g, ""));
      if (isNaN(pnl)) pnl = undefined;
    } else if (entryPrice && exitPrice && quantity) {
      // Calculate PnL if not provided
      const multiplier = getContractMultiplier(row[platformConfig.symbolField]);
      const directionMultiplier = direction === "long" ? 1 : -1;
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

    const mappedDirection = platformConfig.directionMapping[directionRaw] || 
      (directionRaw.toLowerCase().includes("buy") ? "long" : "short");
    
    // Convert direction to lowercase to match Trade interface
    const direction = mappedDirection.toLowerCase() as 'long' | 'short';
    
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
    let exitDate: string | undefined = undefined;
    let exitPrice: number | undefined = undefined;
    let pnl: number | undefined = undefined;
    let fees: number | undefined = undefined;

    if (platformConfig.exitDateField && row[platformConfig.exitDateField]?.trim()) {
      const parsedExitDate = parseTradeDate(row[platformConfig.exitDateField]);
      if (parsedExitDate) {
        exitDate = parsedExitDate.toISOString();
      }
    }

    if (platformConfig.exitPriceField && row[platformConfig.exitPriceField]?.trim()) {
      exitPrice = parseFloat(row[platformConfig.exitPriceField].replace(/[$,]/g, ""));
      if (isNaN(exitPrice)) exitPrice = undefined;
    }

    if (platformConfig.pnlField && row[platformConfig.pnlField]?.trim()) {
      pnl = parseFloat(row[platformConfig.pnlField].replace(/[$,]/g, ""));
      if (isNaN(pnl)) pnl = undefined;
    }

    if (platformConfig.feesField && row[platformConfig.feesField]?.trim()) {
      fees = parseFloat(row[platformConfig.feesField].replace(/[$,]/g, ""));
      if (isNaN(fees)) fees = undefined;
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
              const pnl = calculatePnL(symbol, "short", avgShortEntry, price, closeQty);
              
              console.log(`Closing SHORT position: ${closeQty} @ ${price}, entry was ${avgShortEntry}, PNL: ${pnl}`);
              
              validTrades.push({
                id: crypto.randomUUID(),
                symbol,
                direction: "short",
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
              const pnl = calculatePnL(symbol, "long", avgLongEntry, price, closeQty);
              
              console.log(`Closing LONG position: ${closeQty} @ ${price}, entry was ${avgLongEntry}, PNL: ${pnl}`);
              
              validTrades.push({
                id: crypto.randomUUID(),
                symbol,
                direction: "long",
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
          direction: "long",
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
          direction: "short",
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

  // Process TradingView data which has a different structure
  const processTradingViewData = (rows: any[], validTrades: Trade[], errors: string[]) => {
    console.log("Processing TradingView/Topstep data:", rows.slice(0, 3));
    
    // Get all column headers for debugging
    if (rows.length > 0) {
      const sampleRow = rows[0];
      console.log("Available columns:", Object.keys(sampleRow));
      
      // Check if this is a Topstep CSV format
      const isTopstep = 'Symbol' in sampleRow && 'Side' in sampleRow && 
                      ('Entry Price' in sampleRow || 'Exit Price' in sampleRow);
      
      if (isTopstep) {
        console.log("Detected Topstep CSV format");
        processTopstepData(rows, validTrades, errors);
        return;
      }
    }
    
    // Get complete rows with non-empty values for debugging
    const completeRow = rows.find(row => 
      row["Symbol"] && row["Side"] && row["Fill Price"] && 
      row["Placing Time"] && row["Status"] === "Filled"
    );
    console.log("Sample complete row:", completeRow);
    
    // Handle single-row format of TradingView exports
    rows.forEach((row, index) => {
      try {
        // Skip non-filled orders
        if (row["Status"] !== "Filled" && row["Status"] !== undefined) {
          return;
        }
        
        // Basic validation
        if (!row["Symbol"] || !row["Fill Price"] || !row["Qty"]) {
          errors.push(`Row ${index + 1}: Missing required fields`);
          return;
        }
        
        // Get direction (buy/sell)
        const direction = row["Side"] === "Buy" ? "long" : "short";
        
        // Parse values
        const symbol = row["Symbol"];
        const quantity = parseFloat(row["Qty"]);
        const entryPrice = parseFloat(row["Fill Price"]);
        const entryDate = new Date(row["Placing Time"]);
        
        // Exit price and date
        let exitPrice: number | undefined = undefined;
        let exitDate: Date | undefined = undefined;
        
        // For closed trades, the Closing Time will be defined
        if (row["Closing Time"] && row["Closing Time"].trim() !== "") {
          exitDate = new Date(row["Closing Time"]);
          
          // TradingView doesn't provide exit price directly, so we need to find the matching exit row
          // Look for a row with the same Order ID but opposite Side
          const oppositeDirection = direction === "long" ? "Sell" : "Buy";
          const exitRow = rows.find(r => 
            r["Order ID"] === row["Order ID"] && 
            r["Side"] === oppositeDirection && 
            r["Status"] === "Filled"
          );
          
          if (exitRow) {
            exitPrice = parseFloat(exitRow["Fill Price"]);
            console.log(`Found matching exit row with price: ${exitPrice}`);
          }
        }
        
        // Create trade object
        const trade: Trade = {
          id: `tv-${Date.now()}-${index}`,
          symbol,
          direction,
          entryDate: entryDate.toISOString(),
          entryPrice,
          quantity,
          source: "csv",
          importSource: "tradingview",
          accountId: selectedAccount
        };
        
        // Add exit information if available
        if (exitPrice && exitDate) {
          trade.exitDate = exitDate.toISOString();
          trade.exitPrice = exitPrice;
          
          // Calculate P&L
          const multiplier = getContractMultiplier(trade.symbol);
          const entryValue = trade.entryPrice * trade.quantity * multiplier;
          const exitValue = exitPrice * trade.quantity * multiplier;
          
          if (direction === "long") {
            trade.pnl = exitValue - entryValue;
          } else {
            trade.pnl = entryValue - exitValue;
          }
          
          console.log(`Calculated P&L for ${symbol}: ${trade.pnl}`);
        }
        
        validTrades.push(trade);
      } catch (e) {
        console.error(`Error processing row ${index}:`, e);
        errors.push(`Error processing row ${index + 1}: ${e instanceof Error ? e.message : String(e)}`);
      }
    });
    
    console.log(`Processed ${validTrades.length} valid trades from TradingView data`);
  };
  
  // Process Topstep format CSV
  const processTopstepData = (rows: any[], validTrades: Trade[], errors: string[]) => {
    console.log("Processing Topstep data:", rows.length, "rows found");
    
    // Log the first row to understand the structure
    if (rows.length > 0) {
      console.log("Sample row data:", rows[0]);
      console.log("Available columns:", Object.keys(rows[0]));
    }
    
    let processedTrades = 0;
    
    rows.forEach((row, index) => {
      try {
        // Skip rows without core data
        if (!row || Object.keys(row).length === 0) {
          return;
        }
        
        // Skip rows without symbol
        const symbol = row["Symbol"] || row["Contract"] || row["ContractName"];
        if (!symbol) {
          return;
        }
        
        // Get direction from various possible fields
        let direction: 'long' | 'short' = 'long';
        if (row["Side"]) {
          direction = String(row["Side"]).toLowerCase().includes("buy") ? "long" : "short";
        } else if (row["Type"]) {
          direction = String(row["Type"]).toLowerCase().includes("long") ? "long" : "short";
        } else if (row["Direction"]) {
          direction = String(row["Direction"]).toLowerCase().includes("buy") ? "long" : "short";
        } else if (row["B/S"]) {
          direction = String(row["B/S"]).toLowerCase().includes("b") ? "long" : "short";
        }
        
        // Handle quantity with different field names
        let quantity = 1; // Default fallback
        for (const field of ["Qty", "Quantity", "Size", "Amount", "Contracts"]) {
          if (row[field] !== undefined && row[field] !== "") {
            const parsed = parseFloat(String(row[field]).replace(/[,]/g, ""));
            if (!isNaN(parsed) && parsed > 0) {
              quantity = parsed;
              break;
            }
          }
        }
        
        // Handle entry price with different field names
        let entryPrice = 0; // Default to 0 instead of null
        for (const field of ["Entry Price", "EntryPrice", "Entry", "Fill Price", "Price"]) {
          if (row[field] !== undefined && row[field] !== "") {
            const parsed = parseFloat(String(row[field]).replace(/[$,]/g, ""));
            if (!isNaN(parsed) && parsed > 0) {
              entryPrice = parsed;
              break;
            }
          }
        }
        
        // Handle exit price with different field names
        let exitPrice = 0; // Default to 0 instead of null
        let hasExitPrice = false;
        for (const field of ["Exit Price", "ExitPrice", "Exit"]) {
          if (row[field] !== undefined && row[field] !== "") {
            const parsed = parseFloat(String(row[field]).replace(/[$,]/g, ""));
            if (!isNaN(parsed) && parsed > 0) {
              exitPrice = parsed;
              hasExitPrice = true;
              break;
            }
          }
        }
        
        // Skip rows without either entry or exit price
        if (entryPrice === 0 && !hasExitPrice) {
          return;
        }
        
        // If only one price exists, use it for entry
        if (entryPrice === 0 && hasExitPrice) {
          entryPrice = exitPrice;
          exitPrice = 0;
          hasExitPrice = false;
        }
        
        // Handle date fields with different names
        let entryDate: Date | null = null;
        for (const field of ["Entry Time", "EntryTime", "Entry Date", "EnteredAt", "Time", "Date", "Placing Time"]) {
          if (row[field] !== undefined && row[field] !== "") {
            const parsed = new Date(row[field]);
            if (!isNaN(parsed.getTime())) {
              entryDate = parsed;
              break;
            }
          }
        }
        
        // If no valid entry date found, use current date
        if (entryDate === null) {
          entryDate = new Date();
        }
        
        // Handle exit date fields with different names
        let exitDate: Date | null = null;
        if (hasExitPrice) {
          for (const field of ["Exit Time", "ExitTime", "Exit Date", "ExitedAt", "Closing Time"]) {
            if (row[field] !== undefined && row[field] !== "") {
              const parsed = new Date(row[field]);
              if (!isNaN(parsed.getTime())) {
                exitDate = parsed;
                break;
              }
            }
          }
          
          // If exit price exists but no exit date, use current date
          if (exitDate === null && hasExitPrice) {
            exitDate = new Date();
          }
        }
        
        // Create the trade object
        const trade: Trade = {
          id: `ts-${Date.now()}-${index}`,
          symbol,
          direction,
          entryDate: entryDate.toISOString(),
          entryPrice,
          quantity,
          source: "csv",
          importSource: "topstep",
          accountId: selectedAccount
        };
        
        // Add exit information if available
        if (hasExitPrice && exitDate !== null) {
          trade.exitDate = exitDate.toISOString();
          trade.exitPrice = exitPrice;
          
          // Calculate P&L
          const multiplier = getContractMultiplier(symbol);
          const entryValue = entryPrice * quantity * multiplier;
          const exitValue = exitPrice * quantity * multiplier;
          
          if (direction === "long") {
            trade.pnl = exitValue - entryValue;
          } else {
            trade.pnl = entryValue - exitValue;
          }
          
          console.log(`Calculated PNL for ${symbol}: ${trade.pnl}`);
        }
        
        processedTrades++;
        console.log(`Adding Topstep trade #${processedTrades}: ${symbol}, ${direction}, entry: ${entryPrice}, exit: ${hasExitPrice ? exitPrice : 'N/A'}`);
        validTrades.push(trade);
      } catch (e) {
        console.error(`Error processing Topstep row ${index}:`, e);
        errors.push(`Error processing row ${index + 1}: ${e instanceof Error ? e.message : String(e)}`);
      }
    });
    
    console.log(`Successfully processed ${processedTrades} trades from ${rows.length} Topstep rows`);
  };

  const handleImport = () => {
    if (!selectedAccount || parsedTrades.length === 0) return;

    try {
      // Save current state for use in timeouts
      const currentSelectedAccount = selectedAccount;
      const currentParsedTrades = [...parsedTrades];
      const currentAutoSelectInFilter = autoSelectInFilter;
      
      // Get existing trades
      const existingTradesStr = localStorage.getItem('tradingJournalTrades');
      const existingTrades = existingTradesStr ? JSON.parse(existingTradesStr) : {};

      // Find the selected account
      const account = accounts.find(acc => acc.id === currentSelectedAccount);
      
      // Find associated broker if any
      const associatedBroker = brokers.find(b => b.accountId === currentSelectedAccount);
      const importSource = associatedBroker 
        ? `${associatedBroker.name} (${platform})`
        : platform;

      // Add new trades
      const updatedTrades = {
        ...existingTrades,
        ...Object.fromEntries(currentParsedTrades.map(trade => [trade.id, {
          ...trade,
          importSource,
          importDate: new Date().toISOString()
        }]))
      };

      // Save to localStorage first, before any UI actions
      localStorage.setItem('tradingJournalTrades', JSON.stringify(updatedTrades));
      
      // Prepare to update account selection if needed
      if (currentAutoSelectInFilter && currentSelectedAccount !== "new-account") {
        try {
          // First, get current selected accounts from localStorage
          const currentSelectedAccounts = JSON.parse(
            localStorage.getItem('tradingJournalSelectedAccounts') || '[]'
          );
          
          // If account is not already selected, add it
          if (!currentSelectedAccounts.includes(currentSelectedAccount)) {
            const updatedSelectedAccounts = [...currentSelectedAccounts, currentSelectedAccount];
            
            // Update localStorage directly
            localStorage.setItem(
              'tradingJournalSelectedAccounts', 
              JSON.stringify(updatedSelectedAccounts)
            );
            
            // Temporarily disable account selection events during import
            const tempDisableEvents = false;
            if (!tempDisableEvents) {
              // Dispatch events to update UI
              window.dispatchEvent(new CustomEvent('account-selection-change', { 
                detail: { selectedAccounts: updatedSelectedAccounts }
              }));
            }
          }
        } catch (e) {
          console.error("Error updating selected accounts:", e);
        }
      }
      
      // Dispatch a custom event for trades to refresh
      window.dispatchEvent(new CustomEvent('trades-updated'));
      
      // Call the onImportSuccess callback if provided
      if (onImportSuccess) {
        onImportSuccess(currentParsedTrades as unknown as TradeData[]);
      }
      
      // First, properly close the dialog without redirecting yet
      if (onClose) {
        onClose();
      } else {
        setDialogOpen(false);
      }
      
      // Use a longer delay to ensure dialog animations complete fully before navigation
      setTimeout(() => {
        // Safely navigate after dialog is closed
        safeNavigate(`/trades`);
      }, 500);
      
    } catch (error) {
      console.error("Error importing trades:", error);
      setError(`Failed to import trades: ${error instanceof Error ? error.message : String(error)}`);
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

    // Close dialog first to prevent DOM manipulation conflicts
    if (onClose) {
      onClose();
    } else {
      setDialogOpen(false);
    }
    
    // Reset form state after dialog is closed
    setTimeout(() => {
      setPlatform(undefined);
      setSelectedFile(undefined);
      setSelectedAccount(accounts.length > 0 ? accounts[0].id : "new-account");
      setParsedTrades([]);
      setStep(1);
    }, 0);
  };

  // Render the dialog content based on the current step
  const renderDialogContent = () => {
    return (
      <>
        {step === 1 ? (
          <div className="space-y-6">
            {/* Platform Selection */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center mb-2">
                <Building2 className="h-3.5 w-3.5 text-primary mr-1.5" />
                <h3 className="text-sm font-medium">Select Trading Platform</h3>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {platformConfigs.map((config) => (
                  <button
                    key={config.name}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg border border-border hover:bg-accent transition-colors",
                      platform === config.name && "bg-primary/10 border-primary"
                    )}
                    onClick={() => setPlatform(config.name)}
                  >
                    <div className="text-primary mb-1">
                      {PLATFORM_ICONS[config.name] || <FileText className="h-4 w-4" />}
                    </div>
                    <span className="text-[10px] font-medium text-center leading-tight">{config.name}</span>
                  </button>
                ))}
              </div>
              {platform && <PlatformInstructions platformName={platform} />}
            </div>

            {/* Account Selection */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center mb-2">
                <Banknote className="h-3.5 w-3.5 text-primary mr-1.5" />
                <h3 className="text-sm font-medium">Select Account</h3>
              </div>
              
              {/* Native HTML Select for maximum compatibility */}
              <div className="relative border rounded-md">
                <select 
                  value={selectedAccount} 
                  onChange={(e) => handleAccountChange(e.target.value)}
                  className="w-full py-2 px-3 bg-transparent appearance-none outline-none"
                >
                  <option value="new-account">
                    Create New Account
                  </option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              
              {showNewAccountForm && (
                <div className="mt-3 space-y-3 border rounded-md p-3 bg-muted/10">
                  <div className="space-y-1.5">
                    <Label htmlFor="account-name" className="text-xs">Account Name</Label>
                    <Input
                      id="account-name"
                      placeholder="Enter account name"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Account Color</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {ACCOUNT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-5 h-5 rounded-full ${
                            selectedColor === color ? 'ring-2 ring-primary ring-offset-1' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleCreateAccount}
                    >
                      Create Account
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* File Upload - replace with the new function */}
            {renderFileUploadSection()}

            {error && (
              <Alert variant="destructive" className="mt-3 py-2">
                <div className="flex items-start">
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5" />
                  <div className="ml-2">
                    <AlertTitle className="text-xs font-medium mb-1">Error</AlertTitle>
                    <AlertDescription className="whitespace-pre-wrap text-xs font-normal">
                      {error}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            <div className="flex justify-between mt-4">
              <Button 
                variant="outline" 
                onClick={() => handleOpenChange(false)}
                size="sm"
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                onClick={parseCSV}
                disabled={!platform || !selectedFile || !selectedAccount || isLoading}
                size="sm"
                className="text-xs h-8"
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner mr-1.5"></span>
                    Parsing...
                  </>
                ) : (
                  <>
                    Import Trades
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <BarChart4 className="h-4 w-4 text-primary mr-2" />
                <h3 className="text-base font-medium">Trade Preview</h3>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary py-1 px-2 text-xs font-medium">
                {parsedTrades.length} trade{parsedTrades.length !== 1 ? 's' : ''} found
              </Badge>
            </div>

            <div className="relative border rounded-lg overflow-hidden shadow-sm bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left p-2">Symbol</th>
                      <th className="text-left p-2">Side</th>
                      <th className="text-right p-2">Entry Date</th>
                      <th className="text-right p-2">Entry Price</th>
                      <th className="text-right p-2">Qty</th>
                      <th className="text-right p-2">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedTrades.slice(0, 5).map((trade) => (
                      <tr key={trade.id} className="border-t border-border">
                        <td className="p-2 font-medium">{trade.symbol}</td>
                        <td className="p-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            String(trade.direction).toLowerCase() === "long" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}>
                            {String(trade.direction).toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2 text-right whitespace-nowrap text-xs">{formatDateTime(trade.entryDate)}</td>
                        <td className="p-2 text-right whitespace-nowrap font-medium">{formatCurrency(trade.entryPrice)}</td>
                        <td className="p-2 text-right whitespace-nowrap">{trade.quantity}</td>
                        <td className={`p-2 text-right font-medium whitespace-nowrap ${
                          (trade.pnl || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        }`}>
                          {trade.pnl ? formatCurrency(trade.pnl) : calculateAndFormatPnL(trade)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedTrades.length > 5 && (
                <div className="p-2 text-center text-xs bg-muted/20 border-t">
                  <div className="flex items-center justify-center gap-1">
                    <Info className="h-3 w-3 text-primary" />
                    <span>
                      Showing 5 of {parsedTrades.length} trades
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Select auto-import options:</h4>
                <div className="flex items-center gap-2">
                  <Label htmlFor="auto-select" className="text-xs text-muted-foreground">
                    Auto-select imported account
                  </Label>
                  <input
                    type="checkbox"
                    id="auto-select"
                    checked={autoSelectInFilter}
                    onChange={(e) => setAutoSelectInFilter(e.target.checked)}
                    className="h-4 w-4"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={() => setStep(1)} size="sm">
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleDeleteImport} size="sm">
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
                <Button onClick={handleImport} size="sm">
                  <Check className="h-3 w-3 mr-1" />
                  Import
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderFileUploadSection = () => {
    return (
      <div className="space-y-2">
        <div className="flex items-center">
          <FileText className="h-3.5 w-3.5 text-primary mr-1.5" />
          <h3 className="text-sm font-medium">Upload CSV File</h3>
        </div>
        <div 
          className={cn(
            "border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:bg-accent/50 transition-colors",
            selectedFile ? "bg-primary/5 border-primary/30" : "border-border"
          )}
          onClick={handleFileInputClick}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            id="file-upload" 
            accept=".csv" 
            className="hidden" 
            onChange={handleFileChange}
          />
          {selectedFile ? (
            <div className="space-y-1.5">
              <div className="flex justify-center">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <p className="text-xs font-medium break-all">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
              <Button variant="outline" size="sm" onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(undefined);
              }} className="mt-1 h-7 text-xs">
                <Trash2 className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
          ) : (
            <div className="py-3">
              <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1.5" />
              <p className="text-xs font-medium">Drag & drop or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">CSV files only</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper function to calculate and format P&L
  const calculateAndFormatPnL = (trade: any): string => {
    if (!trade.exitPrice) return "-";
    
    const multiplier = getContractMultiplier(trade.symbol);
    const entryValue = trade.entryPrice * trade.quantity * multiplier;
    const exitValue = trade.exitPrice * trade.quantity * multiplier;
    
    let pnl = 0;
    if (trade.direction === "long") {
      pnl = exitValue - entryValue;
    } else {
      pnl = entryValue - exitValue;
    }
    
    return formatCurrency(pnl);
  };

  useEffect(() => {
    // Clean up event listeners when component unmounts
    return () => {
      // Remove any event listeners by having empty handlers
      window.removeEventListener('click', () => {});
      window.removeEventListener('keydown', () => {});
      
      // Clear any timeouts that might be pending
      const highestId = window.setTimeout(() => {}, 0);
      for (let i = highestId; i >= 0; i--) {
        window.clearTimeout(i);
      }
    };
  }, []);

  // Add a specific cleanup effect for dialog state
  useEffect(() => {
    // Cleanup function to ensure dialog state is handled properly
    let isMounted = true;
    
    // Return cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <Dialog 
        open={showDialog} 
        onOpenChange={handleOpenChange}
        modal={true} // Ensure modal behavior
      >
        <DialogTrigger asChild>
          <Button variant="secondary" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            <span>Import Trades</span>
          </Button>
        </DialogTrigger>
        <DialogContent 
          className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto csv-import-dialog"
          // Remove any unsafe inline styles
          style={{
            zIndex: 9999,
            position: 'fixed',
          }}
        >
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Import Trades
            </DialogTitle>
            <DialogDescription className="text-xs">
              Import your trades from a CSV file exported from your trading platform.
            </DialogDescription>
          </DialogHeader>
          
          {showDialog && renderDialogContent()}
        </DialogContent>
      </Dialog>
    </>
  );
} 