"use client";

import { useState, useEffect } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { Plus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountFilter, ACCOUNT_CREATED } from './AccountFilter';
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
import { useToast } from '@/components/providers/toast-provider';

// Pre-defined account colors
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

export function AccountsPanel() {
  const { accounts, createAccount } = useAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);
  const { toast } = useToast();
  const [forceRefresh, setForceRefresh] = useState(0);

  // Update when accounts change
  useEffect(() => {
    // Force update when an account is created elsewhere in the app
    const handleAccountCreated = () => {
      setForceRefresh(prev => prev + 1);
    };
    
    window.addEventListener(ACCOUNT_CREATED, handleAccountCreated);
    
    return () => {
      window.removeEventListener(ACCOUNT_CREATED, handleAccountCreated);
    };
  }, []);

  const handleCreateAccount = () => {
    if (newAccountName.trim()) {
      const newAccount = createAccount(newAccountName, selectedColor);
      setNewAccountName('');
      setSelectedColor(ACCOUNT_COLORS[0]);
      setDialogOpen(false);
      
      // Force a refresh to ensure UI updates
      setForceRefresh(prev => prev + 1);
      
      // Show success toast
      toast({
        title: "Account created",
        description: `${newAccount.name} has been created and selected`,
        duration: 3000,
        variant: "success"
      });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <AccountFilter key={`account-filter-${forceRefresh}`} />
      
      <div 
        onClick={() => setDialogOpen(true)}
        className="flex items-center justify-center h-[40px] w-[40px] rounded-md border-2 border-primary bg-background hover:bg-accent cursor-pointer shadow-sm"
        title="Create New Account"
      >
        <Plus className="h-6 w-6" />
      </div>

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
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newAccountName.trim()) {
                    handleCreateAccount();
                  }
                }}
              />
            </div>
            
            <div className="grid gap-2">
              <Label>Account Color</Label>
              <div className="flex flex-wrap gap-2">
                {ACCOUNT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`relative w-8 h-8 rounded-full transition-all ${
                      selectedColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    title={`Select ${color} as account color`}
                  >
                    {selectedColor === color && (
                      <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
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