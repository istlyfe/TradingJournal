"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Database, CheckCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';

export function MigrationBanner() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [hasLocalData, setHasLocalData] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isMigrated, setIsMigrated] = useState(false);

  // Check if user has localStorage data
  useEffect(() => {
    if (session?.user?.email) {
      const hasTrades = localStorage.getItem('tradingJournalTrades');
      const hasAccounts = localStorage.getItem('tradingJournalAccounts');
      const hasJournal = localStorage.getItem('tradingJournalEntries');
      
      setHasLocalData(!!(hasTrades || hasAccounts || hasJournal));
    }
  }, [session]);

  const migrateData = async () => {
    if (!session?.user?.email) return;

    setIsMigrating(true);

    try {
      // Get localStorage data
      const trades = localStorage.getItem('tradingJournalTrades');
      const accounts = localStorage.getItem('tradingJournalAccounts');
      const journalEntries = localStorage.getItem('tradingJournalEntries');

      let migratedCount = 0;

      // Migrate accounts first
      if (accounts) {
        try {
          const accountsData = JSON.parse(accounts);
          for (const account of accountsData) {
            await fetch('/api/accounts', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: account.name,
                type: account.type || 'TRADING',
                currency: account.currency || 'USD',
                initialBalance: account.initialBalance || 0,
                color: account.color || '#7C3AED',
              }),
            });
            migratedCount++;
          }
        } catch (error) {
          console.error('Error migrating accounts:', error);
        }
      }

      // Migrate trades
      if (trades) {
        try {
          const tradesData = JSON.parse(trades);
          for (const trade of Object.values(tradesData)) {
            await fetch('/api/trades', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                symbol: trade.symbol,
                tradeType: trade.direction || trade.tradeType || 'LONG',
                entryPrice: trade.entryPrice,
                exitPrice: trade.exitPrice,
                quantity: trade.quantity,
                entryDate: trade.entryDate,
                exitDate: trade.exitDate,
                pnl: trade.pnl,
                fees: trade.fees || 0,
                notes: trade.notes || '',
                strategy: trade.strategy || '',
                emotionalState: trade.emotionalState || '',
                tags: trade.tags || [],
                accountId: trade.accountId || '1', // Default to first account
              }),
            });
            migratedCount++;
          }
        } catch (error) {
          console.error('Error migrating trades:', error);
        }
      }

      // Mark as migrated
      setIsMigrated(true);
      localStorage.setItem('tradingJournalMigrated', 'true');
      
      toast({
        title: 'Migration Complete',
        description: `Successfully migrated ${migratedCount} items to the database.`,
      });

      // Refresh the page to show new data
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (error) {
      console.error('Migration failed:', error);
      toast({
        title: 'Migration Failed',
        description: 'There was an error migrating your data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  // Don't show if no local data or already migrated
  if (!hasLocalData || isMigrated || localStorage.getItem('tradingJournalMigrated')) {
    return null;
  }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Database className="h-5 w-5" />
          Migrate to Database
        </CardTitle>
        <CardDescription className="text-blue-700 dark:text-blue-300">
          We found data in your browser storage. Migrate it to your account for better security and cross-device access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 border-blue-200 bg-blue-100 dark:border-blue-800 dark:bg-blue-900">
          <Upload className="h-4 w-4" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            This will move your trades, accounts, and journal entries from browser storage to your secure account database.
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2">
          <Button 
            onClick={migrateData} 
            disabled={isMigrating}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isMigrating ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Migrating...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Migrate Now
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => localStorage.setItem('tradingJournalMigrated', 'true')}
            className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900"
          >
            Dismiss
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
