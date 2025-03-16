"use client";

import { useState } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountFilter } from './AccountFilter';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AccountsPanel() {
  const { createAccount } = useAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  const handleCreateAccount = () => {
    if (newAccountName.trim()) {
      createAccount(newAccountName);
      setNewAccountName('');
      setDialogOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <AccountFilter />
      
      <Button 
        size="icon" 
        variant="outline"
        onClick={() => setDialogOpen(true)}
        title="Add Account"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>
              Add a new trading account to track your performance
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
                placeholder="e.g., My Trading Account"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateAccount}
              disabled={!newAccountName.trim()}
            >
              Create Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 