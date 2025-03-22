"use client";

import { useState } from "react";
import { AlertTriangle, Download, FileJson, FileCsv, Trash2, Upload, DatabaseBackup } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function DataManagement() {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [includeAccounts, setIncludeAccounts] = useState(true);
  const [includeTrades, setIncludeTrades] = useState(true);
  const [includeJournals, setIncludeJournals] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);
  
  // Handle export data as JSON
  const handleExportJSON = () => {
    setIsExporting(true);
    
    // Simulate exporting data
    setTimeout(() => {
      try {
        // Get data from localStorage
        const data: Record<string, any> = {};
        
        if (includeTrades) {
          const trades = localStorage.getItem('tradingJournalTrades');
          if (trades) data.trades = JSON.parse(trades);
        }
        
        if (includeAccounts) {
          const accounts = localStorage.getItem('tradingJournalAccounts');
          if (accounts) data.accounts = JSON.parse(accounts);
        }
        
        if (includeSettings) {
          const brokers = localStorage.getItem('tradingJournalBrokers');
          if (brokers) data.brokers = JSON.parse(brokers);
        }
        
        // Create a download link
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        
        const exportFileDefaultName = `trading-journal-export-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        toast({
          title: "Export Complete",
          description: "Your data has been exported successfully.",
        });
      } catch (error) {
        console.error("Export error:", error);
        toast({
          title: "Export Failed",
          description: "There was a problem exporting your data.",
          variant: "destructive",
        });
      } finally {
        setIsExporting(false);
      }
    }, 1000);
  };
  
  // Handle export data as CSV
  const handleExportCSV = () => {
    setIsExporting(true);
    
    // Simulate exporting data
    setTimeout(() => {
      try {
        // Get trades from localStorage
        const tradesJson = localStorage.getItem('tradingJournalTrades');
        if (!tradesJson) {
          throw new Error('No trade data found');
        }
        
        const trades = Object.values(JSON.parse(tradesJson));
        
        // Create CSV header
        const headers = [
          'ID', 'Symbol', 'Direction', 'Entry Date', 'Entry Price', 
          'Exit Date', 'Exit Price', 'Quantity', 'P&L', 'Account', 
          'Strategy', 'Setup', 'Notes'
        ];
        
        // Create CSV rows
        const rows = trades.map((trade: any) => [
          trade.id,
          trade.symbol,
          trade.direction,
          trade.entryDate,
          trade.entryPrice,
          trade.exitDate || '',
          trade.exitPrice || '',
          trade.quantity,
          trade.pnl || 0,
          trade.accountId || '',
          trade.strategy || '',
          trade.setup || '',
          trade.notes || ''
        ]);
        
        // Combine header and rows
        const csvContent = [
          headers.join(','),
          ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        // Create a download link
        const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
        const exportFileDefaultName = `trading-journal-trades-${new Date().toISOString().split('T')[0]}.csv`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        toast({
          title: "CSV Export Complete",
          description: "Your trades have been exported as CSV successfully.",
        });
      } catch (error) {
        console.error("CSV export error:", error);
        toast({
          title: "Export Failed",
          description: "There was a problem exporting your trades as CSV.",
          variant: "destructive",
        });
      } finally {
        setIsExporting(false);
      }
    }, 1000);
  };
  
  // Handle clear all data
  const handleClearData = () => {
    // Clear selected data from localStorage
    try {
      if (includeTrades) localStorage.removeItem('tradingJournalTrades');
      if (includeAccounts) localStorage.removeItem('tradingJournalAccounts');
      if (includeSettings) {
        localStorage.removeItem('tradingJournalBrokers');
        localStorage.removeItem('tradingJournalSelectedAccounts');
      }
      
      setShowClearDialog(false);
      
      toast({
        title: "Data Cleared",
        description: "The selected data has been cleared successfully.",
      });
      
      // Reload the page to reflect changes
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      console.error("Clear data error:", error);
      toast({
        title: "Operation Failed",
        description: "There was a problem clearing your data.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Export</CardTitle>
          <CardDescription>
            Export your trading data for backup or analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="json" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="json">JSON Export</TabsTrigger>
              <TabsTrigger value="csv">CSV Export</TabsTrigger>
            </TabsList>
            
            <TabsContent value="json" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="include-trades" checked={includeTrades} onCheckedChange={setIncludeTrades} />
                    <Label htmlFor="include-trades">Include Trades</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="include-accounts" checked={includeAccounts} onCheckedChange={setIncludeAccounts} />
                    <Label htmlFor="include-accounts">Include Accounts</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="include-journals" checked={includeJournals} onCheckedChange={setIncludeJournals} />
                    <Label htmlFor="include-journals">Include Journal Entries</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="include-settings" checked={includeSettings} onCheckedChange={setIncludeSettings} />
                    <Label htmlFor="include-settings">Include Settings</Label>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleExportJSON} 
                    disabled={isExporting || !(includeTrades || includeAccounts || includeJournals || includeSettings)}
                  >
                    {isExporting ? <DatabaseBackup className="mr-2 h-4 w-4 animate-spin" /> : <FileJson className="mr-2 h-4 w-4" />}
                    Export as JSON
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="csv" className="space-y-4 mt-4">
              <div className="rounded-md bg-muted p-4">
                <div className="flex items-start">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-foreground">CSV Export Limitations</h3>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <p>CSV export only includes trade data. For a complete backup, use JSON export.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleExportCSV} disabled={isExporting}>
                  {isExporting ? <DatabaseBackup className="mr-2 h-4 w-4 animate-spin" /> : <FileCsv className="mr-2 h-4 w-4" />}
                  Export Trades as CSV
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>
            Perform actions that will delete your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              Clearing your data is permanent and cannot be undone. Make sure to export a backup first.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex justify-between items-center border-t px-6 py-4">
          <div className="text-sm text-muted-foreground">
            Clear selected data from this device
          </div>
          <Button variant="destructive" onClick={() => setShowClearDialog(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Data
          </Button>
        </CardFooter>
      </Card>
      
      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear Trading Data</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the selected data from your device.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch id="clear-trades" checked={includeTrades} onCheckedChange={setIncludeTrades} />
                <Label htmlFor="clear-trades">Clear Trade Data</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="clear-accounts" checked={includeAccounts} onCheckedChange={setIncludeAccounts} />
                <Label htmlFor="clear-accounts">Clear Account Data</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="clear-settings" checked={includeSettings} onCheckedChange={setIncludeSettings} />
                <Label htmlFor="clear-settings">Clear Settings & Preferences</Label>
              </div>
            </div>
            
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Are you absolutely sure? This action is irreversible.
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleClearData}
              disabled={!(includeTrades || includeAccounts || includeSettings)}
            >
              Yes, Clear Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 