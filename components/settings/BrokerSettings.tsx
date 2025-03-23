"use client";

import { useState } from "react";
import { Plus, RefreshCw, Download, Unplug, Plug, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBrokers } from "@/hooks/useBrokers";
import { useAccounts } from "@/hooks/useAccounts";
import { brokerDefinitions } from "@/lib/broker-config";
import { BrokerType, BrokerCredentials } from "@/types/broker";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { AccountSelector } from "@/components/accounts/AccountSelector";
import { ServerCog } from "lucide-react";

export function BrokerSettings() {
  const { brokers, addBroker, updateBroker, removeBroker, connectBroker, disconnectBroker, importTradesFromBroker } = useBrokers();
  const { accounts } = useAccounts();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [selectedBrokerType, setSelectedBrokerType] = useState<BrokerType | ''>('');
  const [newBrokerName, setNewBrokerName] = useState('');
  const [selectedBrokerId, setSelectedBrokerId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('none');
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStartDate, setImportStartDate] = useState('');
  const [importEndDate, setImportEndDate] = useState('');
  const { toast } = useToast();
  const [selectedBroker, setSelectedBroker] = useState<Broker | null>(null);
  
  // Handle adding a new broker
  const handleAddBroker = () => {
    if (!selectedBrokerType || !newBrokerName) return;
    
    addBroker({
      id: '',
      name: newBrokerName,
      broker: selectedBrokerType,
      isConnected: false,
    });
    
    setIsAddDialogOpen(false);
    setSelectedBrokerType('');
    setNewBrokerName('');
    
    toast({
      title: "Broker Added",
      description: `${newBrokerName} has been added. Connect to start importing trades.`,
    });
  };
  
  // Open the connect dialog for a broker
  const openConnectDialog = (brokerId: string) => {
    setSelectedBrokerId(brokerId);
    setCredentials({});
    setIsConnectDialogOpen(true);
  };
  
  // Open the import dialog for a broker
  const openImportDialog = (brokerId: string) => {
    setSelectedBrokerId(brokerId);
    setImportStartDate('');
    setImportEndDate('');
    setIsImportDialogOpen(true);
  };
  
  // Open the account link dialog
  const openAccountLinkDialog = (brokerId: string) => {
    setSelectedBrokerId(brokerId);
    const broker = brokers.find(b => b.id === brokerId);
    setSelectedAccountId(broker?.accountId || 'none');
    setIsAccountDialogOpen(true);
  };
  
  // Handle connecting to a broker
  const handleConnectBroker = async () => {
    if (!selectedBrokerId) return;
    
    setConnecting(true);
    
    const result = await connectBroker(selectedBrokerId, credentials as BrokerCredentials);
    
    setConnecting(false);
    setIsConnectDialogOpen(false);
    
    if (result.success) {
      toast({
        title: "Connection Successful",
        description: "Your broker account has been connected successfully.",
      });
    } else {
      toast({
        title: "Connection Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  };
  
  // Handle disconnecting from a broker
  const handleDisconnectBroker = (brokerId: string) => {
    disconnectBroker(brokerId);
    
    toast({
      title: "Disconnected",
      description: "Your broker account has been disconnected.",
    });
  };
  
  // Handle removing a broker
  const handleRemoveBroker = (brokerId: string) => {
    removeBroker(brokerId);
    
    toast({
      title: "Broker Removed",
      description: "The broker connection has been removed.",
    });
  };
  
  // Handle importing trades from a broker
  const handleImportTrades = async () => {
    if (!selectedBrokerId) return;
    
    setImporting(true);
    
    let dateRange;
    if (importStartDate && importEndDate) {
      dateRange = {
        startDate: new Date(importStartDate),
        endDate: new Date(importEndDate),
      };
    }
    
    // In a real implementation, you'd need to pass the actual account ID
    const result = await importTradesFromBroker(selectedBrokerId, "default", dateRange);
    
    setImporting(false);
    setIsImportDialogOpen(false);
    
    if (result.success) {
      toast({
        title: "Import Successful",
        description: result.message,
      });
    } else {
      toast({
        title: "Import Failed",
        description: result.message,
        variant: "destructive",
      });
    }
  };
  
  // Handle linking account to broker
  const handleLinkAccount = () => {
    if (!selectedBrokerId) return;
    
    updateBroker(selectedBrokerId, { 
      accountId: selectedAccountId === 'none' ? undefined : selectedAccountId
    });
    
    setIsAccountDialogOpen(false);
    
    toast({
      title: "Account Linked",
      description: selectedAccountId !== 'none'
        ? "Broker has been linked to the selected account." 
        : "Broker has been unlinked from account.",
    });
  };
  
  // Get the broker definition for a given type
  const getBrokerDefinition = (type: BrokerType) => brokerDefinitions[type];
  
  // Find the broker object by ID
  const getBrokerById = (id: string) => brokers.find(b => b.id === id);
  
  // Render fields for the selected broker type in the connect dialog
  const renderConnectFields = () => {
    if (!selectedBrokerId) return null;
    
    const broker = getBrokerById(selectedBrokerId);
    if (!broker) return null;
    
    const definition = getBrokerDefinition(broker.broker);
    
    return definition.fields.map(field => (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name}>{field.label}</Label>
        <Input
          id={field.name}
          type={field.type}
          placeholder={field.placeholder}
          value={credentials[field.name] || ''}
          onChange={(e) => setCredentials({
            ...credentials,
            [field.name]: e.target.value
          })}
          required={field.required}
        />
      </div>
    ));
  };
  
  return (
    <div className="space-y-6">
      <div className="rounded-md bg-muted p-4">
        <h3 className="text-base font-medium mb-2">Broker Connections</h3>
        <p className="text-sm text-muted-foreground">
          Connect to your trading platforms to import trades automatically.
        </p>
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">My Brokers</h3>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Broker
        </Button>
      </div>
      
      {brokers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 border rounded-lg border-dashed bg-background/30 px-4">
          <ServerCog className="h-16 w-16 text-muted-foreground mb-4 opacity-70" />
          <h3 className="text-base font-medium mb-2">No brokers connected</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            Connect to your trading platforms to automatically import trades and track your performance.
          </p>
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Broker
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {brokers.map((broker) => (
            <div key={broker.id} className="bg-background border border-border rounded-lg overflow-hidden">
              <div className="p-4 border-b border-border flex justify-between items-center">
                <div>
                  <h3 className="font-medium mb-1">{broker.name}</h3>
                  {broker.type && <p className="text-sm text-muted-foreground">Type: {broker.type}</p>}
                </div>
                <Badge className={broker.isConnected ? "bg-green-500/20 text-green-500 hover:bg-green-500/30" : "bg-muted text-muted-foreground"}>
                  {broker.isConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              
              <div className="px-4 py-3">
                {broker.lastSync && <p className="text-sm text-muted-foreground">Last synced: {broker.lastSync}</p>}
              </div>
              
              <div className="px-4 py-3 border-t border-border bg-muted/30 flex justify-end gap-2">
                {broker.isConnected ? (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-transparent border-border hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setSelectedBroker(broker);
                        setIsImportDialogOpen(true);
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Import
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="bg-transparent border-border hover:bg-accent hover:text-accent-foreground"
                      onClick={() => {
                        setSelectedBroker(broker);
                        setIsDisconnectDialogOpen(true);
                      }}
                    >
                      <Unplug className="mr-2 h-4 w-4" />
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="bg-transparent border-border hover:bg-accent hover:text-accent-foreground"
                    onClick={() => {
                      setSelectedBroker(broker);
                      setIsConnectDialogOpen(true);
                    }}
                  >
                    <Plug className="mr-2 h-4 w-4" />
                    Connect
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="outline"
                  className="bg-transparent text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setSelectedBroker(broker);
                    setIsRemoveDialogOpen(true);
                  }}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add Broker Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Broker Connection</DialogTitle>
            <DialogDescription>
              Connect to your broker to automatically import trades.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="broker-type">Broker</Label>
              <Select 
                value={selectedBrokerType} 
                onValueChange={(value) => setSelectedBrokerType(value as BrokerType)}
              >
                <SelectTrigger id="broker-type" className="w-full">
                  <SelectValue placeholder="Select a broker" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] select-content-fix z-50">
                  {Object.entries(brokerDefinitions).map(([id, def]) => (
                    <SelectItem key={id} value={id} className="cursor-pointer">
                      <div className="flex items-center">
                        <span>{def.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="connection-name">Connection Name</Label>
              <Input
                id="connection-name"
                placeholder="e.g., My TD Ameritrade Account"
                value={newBrokerName}
                onChange={(e) => setNewBrokerName(e.target.value)}
              />
            </div>
            
            {selectedBrokerType && !brokerDefinitions[selectedBrokerType].hasOfficialSupport && (
              <Alert>
                <AlertDescription>
                  This broker does not have official API support. Integration may be limited or unstable.
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddBroker}
              disabled={!selectedBrokerType || !newBrokerName}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Add Broker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Connect Broker Dialog */}
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect to Broker</DialogTitle>
            <DialogDescription>
              Enter your credentials to connect to your broker account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {renderConnectFields()}
            
            {selectedBrokerId && (
              <p className="text-xs text-muted-foreground">
                Your credentials are stored locally and are only used to connect to your broker.
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConnectBroker}
              disabled={connecting}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {connecting ? "Connecting..." : "Connect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import Trades Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Trades</DialogTitle>
            <DialogDescription>
              Choose a date range to import trades from your broker.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={importStartDate}
                  onChange={(e) => setImportStartDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={importEndDate}
                  onChange={(e) => setImportEndDate(e.target.value)}
                />
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Leave dates empty to import all available trades.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImportTrades}
              disabled={importing}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {importing ? "Importing..." : "Import Trades"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Account Link Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Link to Trading Account</DialogTitle>
            <DialogDescription>
              Link this broker to a specific trading account for better organization and importing.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Trading Account</Label>
              <div style={{ position: 'relative', zIndex: 999 }}>
                <AccountSelector
                  selectedId={selectedAccountId === 'none' ? '' : selectedAccountId}
                  onSelect={(value) => setSelectedAccountId(value || 'none')}
                  allowCreateNew={false}
                  fullWidth={true}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLinkAccount}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Link Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 