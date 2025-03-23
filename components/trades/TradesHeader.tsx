"use client";

import { useState } from "react";
import { AccountFilter } from "@/components/accounts/AccountFilter";
import { CsvImport } from "@/components/trades/CsvImport";
import { useRouter } from "next/navigation";
import { useAccounts } from "@/hooks/useAccounts";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface TradesHeaderProps {
  onImportRequested?: () => void;
  isImportOpen?: boolean;
  onImportClosed?: () => void;
}

export function TradesHeader({ 
  onImportRequested, 
  isImportOpen = false, 
  onImportClosed 
}: TradesHeaderProps) {
  const [showImport, setShowImport] = useState(false);
  const router = useRouter();
  const { accounts, selectedAccounts } = useAccounts();
  const { toast } = useToast();

  // Use external state if provided, otherwise use internal state
  const isDialogOpen = isImportOpen !== undefined ? isImportOpen : showImport;
  
  const handleImportClick = () => {
    if (onImportRequested) {
      onImportRequested();
    } else {
      setShowImport(true);
    }
  };
  
  const handleImportClose = () => {
    if (onImportClosed) {
      onImportClosed();
    } else {
      setShowImport(false);
    }
    
    // Force refresh the page with a timestamp query param
    router.push(`/trades?refresh=${Date.now()}`);
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center flex-grow">
        <h1 className="text-2xl font-bold tracking-tight">Trade History</h1>
        <AccountFilter />
      </div>
      
      <div className="flex items-center">
        <Button 
          id="add-trade-button" 
          variant="outline"
          onClick={handleImportClick}
        >
          <Upload className="mr-2 h-4 w-4" />
          Add Trade
        </Button>
      </div>
      
      {/* Conditionally render the CsvImport component to prevent duplicate dialogs */}
      {isDialogOpen && (
        <CsvImport 
          isOpen={true}
          onClose={handleImportClose}
        />
      )}
    </div>
  );
} 