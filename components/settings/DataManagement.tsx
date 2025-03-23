"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  Trash2, 
  AlertCircle, 
  Database,
  Save,
  Upload,
  Shield,
  HardDrive
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDateForFileName } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

export function DataManagement() {
  const [exportOptions, setExportOptions] = useState({
    trades: true,
    accounts: true,
    journals: true,
    settings: true,
  });
  const [clearOptions, setClearOptions] = useState({
    trades: false,
    accounts: false,
    journals: false,
    settings: false,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const exportData: Record<string, any> = {};
      
      if (exportOptions.trades) {
        const tradesData = localStorage.getItem('trades');
        exportData.trades = tradesData ? JSON.parse(tradesData) : [];
      }
      
      if (exportOptions.accounts) {
        const accountsData = localStorage.getItem('accounts');
        exportData.accounts = accountsData ? JSON.parse(accountsData) : [];
      }
      
      if (exportOptions.journals) {
        const journalsData = localStorage.getItem('journals');
        exportData.journals = journalsData ? JSON.parse(journalsData) : [];
      }
      
      if (exportOptions.settings) {
        const settingsData = localStorage.getItem('settings');
        exportData.settings = settingsData ? JSON.parse(settingsData) : {};
      }
      
      const exportBlob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(exportBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trading-journal-export-${formatDateForFileName(new Date())}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: "Your data has been exported as a JSON file",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: "There was a problem exporting your data",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const tradesData = localStorage.getItem('trades');
      const trades = tradesData ? JSON.parse(tradesData) : [];
      
      if (trades.length === 0) {
        toast({
          title: "No trades to export",
          description: "There are no trades available to export as CSV",
        });
        setIsExporting(false);
        return;
      }
      
      // Get account names for lookup
      const accountsData = localStorage.getItem('accounts');
      const accounts = accountsData ? JSON.parse(accountsData) : [];
      const accountMap = accounts.reduce((acc: Record<string, string>, account: any) => {
        acc[account.id] = account.name;
        return acc;
      }, {});
      
      // Create CSV header
      let csvContent = 'Symbol,Type,Entry Date,Exit Date,Entry Price,Exit Price,Size,PnL,Account,Tags,Notes\n';
      
      // Add trade data
      trades.forEach((trade: any) => {
        const accountName = trade.accountId ? accountMap[trade.accountId] || 'Unknown' : 'N/A';
        const tags = trade.tags ? trade.tags.join('; ') : '';
        
        const row = [
          trade.symbol || '',
          trade.type || '',
          trade.entryDate || '',
          trade.exitDate || '',
          trade.entryPrice || '',
          trade.exitPrice || '',
          trade.size || '',
          trade.pnl || '',
          accountName,
          tags,
          (trade.notes || '').replace(/,/g, ';').replace(/\n/g, ' ')
        ];
        
        csvContent += row.join(',') + '\n';
      });
      
      const exportBlob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(exportBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `trading-journal-trades-${formatDateForFileName(new Date())}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export successful",
        description: "Your trades have been exported as a CSV file",
      });
    } catch (error) {
      console.error('Error exporting trades as CSV:', error);
      toast({
        title: "Export failed",
        description: "There was a problem exporting your trades as CSV",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      if (clearOptions.trades) localStorage.removeItem('trades');
      if (clearOptions.accounts) localStorage.removeItem('accounts');
      if (clearOptions.journals) localStorage.removeItem('journals');
      if (clearOptions.settings) localStorage.removeItem('settings');
      
      setClearOptions({
        trades: false,
        accounts: false,
        journals: false,
        settings: false,
      });
      
      setClearDialogOpen(false);
      
      toast({
        title: "Data cleared",
        description: "The selected data has been removed from your device",
      });
    } catch (error) {
      console.error('Error clearing data:', error);
      toast({
        title: "Operation failed",
        description: "There was a problem clearing your data",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-muted p-4">
        <h3 className="text-base font-medium mb-2">Data Management</h3>
        <p className="text-sm text-muted-foreground">
          Export, backup, and manage your trading data.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full p-1.5 bg-primary/10">
                <Save className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Export Data</CardTitle>
            </div>
            <CardDescription>
              Download your trading journal data for backup or external analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">Select data to export</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="export-trades" 
                      checked={exportOptions.trades}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, trades: checked === true }))
                      }
                    />
                    <Label htmlFor="export-trades" className="cursor-pointer">Trades</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="export-accounts" 
                      checked={exportOptions.accounts}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, accounts: checked === true }))
                      }
                    />
                    <Label htmlFor="export-accounts" className="cursor-pointer">Accounts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="export-journals" 
                      checked={exportOptions.journals}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, journals: checked === true }))
                      }
                    />
                    <Label htmlFor="export-journals" className="cursor-pointer">Journal Entries</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="export-settings" 
                      checked={exportOptions.settings}
                      onCheckedChange={(checked) => 
                        setExportOptions(prev => ({ ...prev, settings: checked === true }))
                      }
                    />
                    <Label htmlFor="export-settings" className="cursor-pointer">Settings</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button 
                  onClick={handleExportJSON}
                  disabled={isExporting || !Object.values(exportOptions).some(Boolean)}
                  className="w-full justify-start"
                >
                  <FileJson className="mr-2 h-4 w-4" />
                  Export as JSON
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={isExporting || !exportOptions.trades}
                  className="w-full justify-start"
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                  Export Trades as CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full p-1.5 bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <CardTitle className="text-lg">Clear Data</CardTitle>
            </div>
            <CardDescription>
              Remove selected data from your device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This action cannot be undone. Please export your data before clearing.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label className="font-medium">Select data to clear</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="clear-trades" 
                      checked={clearOptions.trades}
                      onCheckedChange={(checked) => 
                        setClearOptions(prev => ({ ...prev, trades: checked === true }))
                      }
                    />
                    <Label htmlFor="clear-trades" className="cursor-pointer">Trades</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="clear-accounts" 
                      checked={clearOptions.accounts}
                      onCheckedChange={(checked) => 
                        setClearOptions(prev => ({ ...prev, accounts: checked === true }))
                      }
                    />
                    <Label htmlFor="clear-accounts" className="cursor-pointer">Accounts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="clear-journals" 
                      checked={clearOptions.journals}
                      onCheckedChange={(checked) => 
                        setClearOptions(prev => ({ ...prev, journals: checked === true }))
                      }
                    />
                    <Label htmlFor="clear-journals" className="cursor-pointer">Journal Entries</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="clear-settings" 
                      checked={clearOptions.settings}
                      onCheckedChange={(checked) => 
                        setClearOptions(prev => ({ ...prev, settings: checked === true }))
                      }
                    />
                    <Label htmlFor="clear-settings" className="cursor-pointer">Settings</Label>
                  </div>
                </div>
              </div>
              
              <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="destructive"
                    disabled={isClearing || !Object.values(clearOptions).some(Boolean)}
                    className="w-full"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear Selected Data
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Data Deletion</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete the selected data? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="py-4">
                    <h4 className="font-medium mb-2">You are about to delete:</h4>
                    <ul className="space-y-1 list-disc list-inside text-sm">
                      {clearOptions.trades && <li>All your trade records</li>}
                      {clearOptions.accounts && <li>All your account data</li>}
                      {clearOptions.journals && <li>All your journal entries</li>}
                      {clearOptions.settings && <li>All application settings</li>}
                    </ul>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setClearDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleClearData}
                      disabled={isClearing}
                    >
                      {isClearing ? "Clearing..." : "Delete Data"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full p-1.5 bg-primary/10">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Import Data</CardTitle>
            </div>
            <CardDescription>
              Restore data from a previous backup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You can restore your trading data from a previous JSON export. This will merge with your existing data.
              </p>
              <div className="flex justify-center py-6 border-2 border-dashed rounded-md">
                <div className="text-center">
                  <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground">JSON files only (max 10MB)</p>
                  </div>
                  <Button variant="outline" className="mt-4">
                    Select File
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-full p-1.5 bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">Data Storage</CardTitle>
            </div>
            <CardDescription>
              Information about how your data is stored
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md bg-muted p-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium text-sm">Local Storage</h4>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Trading Journal stores all your data locally in your browser's storage. Your data never leaves your device.
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Storage usage:</span>
                  <span className="font-medium">0.8 MB / 5 MB</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '16%' }}></div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Regular backups are recommended as browser storage can be cleared by browser settings or privacy tools.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 