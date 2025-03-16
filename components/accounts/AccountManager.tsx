"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash } from "lucide-react";

export interface Account {
  id: string;
  name: string;
  description?: string;
  isEnabled: boolean;
  color?: string;
}

export function AccountManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [newAccountName, setNewAccountName] = useState("");
  const [newAccountDescription, setNewAccountDescription] = useState("");

  // Load accounts from localStorage
  useEffect(() => {
    const storedAccounts = localStorage.getItem('tradingJournalAccounts');
    if (storedAccounts) {
      setAccounts(JSON.parse(storedAccounts));
    } else {
      // Create default account if none exists
      const defaultAccount: Account = {
        id: "default",
        name: "Default Account",
        description: "Default trading account",
        isEnabled: true,
        color: "#3b82f6" // Blue
      };
      setAccounts([defaultAccount]);
      localStorage.setItem('tradingJournalAccounts', JSON.stringify([defaultAccount]));
    }
  }, []);

  // Save accounts to localStorage whenever they change
  useEffect(() => {
    if (accounts.length > 0) {
      localStorage.setItem('tradingJournalAccounts', JSON.stringify(accounts));
    }
  }, [accounts]);

  const addAccount = () => {
    if (!newAccountName.trim()) return;

    const newAccount: Account = {
      id: `account-${Date.now()}`,
      name: newAccountName.trim(),
      description: newAccountDescription.trim() || undefined,
      isEnabled: true,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}` // Random color
    };

    setAccounts(prev => [...prev, newAccount]);
    setNewAccountName("");
    setNewAccountDescription("");
  };

  const toggleAccount = (accountId: string) => {
    setAccounts(prev => prev.map(account => 
      account.id === accountId 
        ? { ...account, isEnabled: !account.isEnabled }
        : account
    ));
  };

  const deleteAccount = (accountId: string) => {
    // Don't allow deleting the default account
    if (accountId === "default") return;
    
    setAccounts(prev => prev.filter(account => account.id !== accountId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trading Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add new account */}
          <div className="flex flex-col gap-2">
            <Input
              placeholder="Account Name"
              value={newAccountName}
              onChange={(e) => setNewAccountName(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={newAccountDescription}
              onChange={(e) => setNewAccountDescription(e.target.value)}
            />
            <Button onClick={addAccount} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </div>

          {/* Account list */}
          <div className="space-y-2">
            {accounts.map(account => (
              <div
                key={account.id}
                className="flex items-center justify-between p-2 rounded-lg border"
                style={{ borderLeftColor: account.color, borderLeftWidth: '4px' }}
              >
                <div className="flex-1">
                  <h3 className="font-medium">{account.name}</h3>
                  {account.description && (
                    <p className="text-sm text-muted-foreground">{account.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={account.isEnabled}
                    onCheckedChange={() => toggleAccount(account.id)}
                  />
                  {account.id !== "default" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAccount(account.id)}
                    >
                      <Trash className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 