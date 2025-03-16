"use client";

import { useState } from "react";
import { Plus, RefreshCw, Trash2, Link, Link2Off, ExternalLink, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useToast } from "@/components/providers/toast-provider";

export function BrokerSettings() {
  const { brokers, addBroker, updateBroker, removeBroker, connectBroker, disconnectBroker, importTradesFromBroker } = useBrokers();
  const { accounts } = useAccounts();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-medium">Broker Connections</h2>
          <p className="text-muted-foreground">
            Connect to your brokers to automatically import trades.
          </p>
        </div>
        
        <Button onClick={() => setIsAddDialogOpen(true)} className="mt-2 sm:mt-0">
          <Plus className="mr-2 h-4 w-4" />
          Add Broker
        </Button>
      </div>
      
      {brokers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {brokers.map((broker) => {
            const definition = getBrokerDefinition(broker.broker);
            const linkedAccount = broker.accountId 
              ? accounts.find(a => a.id === broker.accountId) 
              : null;
            
            return (
              <Card key={broker.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{broker.name}</CardTitle>
                    <Badge variant={broker.isConnected ? "default" : "outline"}>
                      {broker.isConnected ? "Connected" : "Not Connected"}
                    </Badge>
                  </div>
                  <CardDescription>{definition.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="pb-2 text-sm">
                  <div className="space-y-2">
                    {broker.lastSynced && (
                      <div>
                        <span className="text-muted-foreground">Last Synced:</span>{" "}
                        {new Date(broker.lastSynced).toLocaleString()}
                      </div>
                    )}
                    
                    {linkedAccount && (
                      <div className="flex items-center text-xs">
                        <CreditCard className="h-3 w-3 mr-1 text-muted-foreground" />
                        <span className="text-muted-foreground">Linked to account:</span>{" "}
                        <Badge variant="outline" className="ml-1">
                          {linkedAccount.name}
                        </Badge>
                      </div>
                    )}
                    
                    {!broker.isConnected && (
                      <div className="text-amber-500 text-xs">
                        Not connected. Connect to import trades.
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="flex flex-wrap gap-2">
                  {broker.isConnected ? (
                    <>
                      <Button size="sm" onClick={() => openImportDialog(broker.id)}>
                        <RefreshCw className="mr-2 h-3 w-3" />
                        Import Trades
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDisconnectBroker(broker.id)}
                      >
                        <Link2Off className="mr-2 h-3 w-3" />
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => openConnectDialog(broker.id)}
                    >
                      <Link className="mr-2 h-3 w-3" />
                      Connect
                    </Button>
                  )}
                  
                  <Button 
                    size="sm" 
                    variant="secondary"
                    onClick={() => openAccountLinkDialog(broker.id)}
                  >
                    <CreditCard className="mr-2 h-3 w-3" />
                    Link Account
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-destructive"
                    onClick={() => handleRemoveBroker(broker.id)}
                  >
                    <Trash2 className="mr-2 h-3 w-3" />
                    Remove
                  </Button>
                  
                  {definition.docUrl && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="ml-auto"
                      asChild
                    >
                      <a href={definition.docUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-3 w-3" />
                        Docs
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex h-40 flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
          <div className="text-muted-foreground">No broker connections</div>
          <Button
            variant="link"
            size="sm"
            className="mt-2"
            onClick={() => setIsAddDialogOpen(true)}
          >
            Add your first broker connection
          </Button>
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
                <SelectTrigger id="broker-type">
                  <SelectValue placeholder="Select a broker" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(brokerDefinitions).map(([id, def]) => (
                    <SelectItem key={id} value={id}>
                      {def.name}
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
            >
              {importing ? "Importing..." : "Import Trades"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Link Account Dialog */}
      <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link to Account</DialogTitle>
            <DialogDescription>
              Link this broker connection to an account. Imported trades will be associated with this account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="account">Select Account</Label>
              <Select 
                value={selectedAccountId} 
                onValueChange={setSelectedAccountId}
              >
                <SelectTrigger id="account">
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Unlink)</SelectItem>
                  {accounts.filter(a => !a.isArchived).map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <p className="text-xs text-muted-foreground">
              Linking a broker to an account will associate all imported trades with that account.
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAccountDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkAccount}>
              {selectedAccountId !== 'none' ? "Link Account" : "Unlink Account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 