"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash } from "lucide-react";
import { useAccounts } from "@/hooks/useAccounts";
import { useToast } from "@/components/ui/use-toast";

export function AccountManager() {
  const { accounts, createAccount, toggleArchiveAccount } = useAccounts();
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountDescription, setNewAccountDescription] = useState("");
  const { toast } = useToast();

  const addAccount = () => {
    if (!newAccountName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an account name",
        variant: "destructive",
      });
      return;
    }

    createAccount(newAccountName.trim());
    setNewAccountName("");
    setNewAccountDescription("");
    
    toast({
      title: "Success",
      description: "Account created successfully",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addAccount();
    }
  };

  const myAccounts = accounts.filter((account) => !account.isArchived);
  const archivedAccounts = accounts.filter((account) => account.isArchived);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Add New Account</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Account name"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Input
              placeholder="Description (optional)"
              value={newAccountDescription}
              onChange={(e) => setNewAccountDescription(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button onClick={addAccount}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {myAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: account.color || '#7C3AED' }}
                  />
                  <div>
                    <h3 className="font-medium">{account.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Created {new Date(account.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={!account.isArchived}
                    onCheckedChange={() => toggleArchiveAccount(account.id)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleArchiveAccount(account.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {archivedAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Archived Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {archivedAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg opacity-60"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: account.color || '#7C3AED' }}
                    />
                    <div>
                      <h3 className="font-medium">{account.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(account.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={!account.isArchived}
                      onCheckedChange={() => toggleArchiveAccount(account.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleArchiveAccount(account.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 