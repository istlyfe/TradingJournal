"use client";

import { useState, useEffect } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { ChevronsRight, Check, Import } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface AccountCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSuccess?: (accountId: string) => void;
  showImportOption?: boolean;
}

export function AccountCreationModal({ 
  isOpen, 
  onClose, 
  onCreateSuccess,
  showImportOption = true 
}: AccountCreationModalProps) {
  const { createAccount } = useAccounts();
  const [accountName, setAccountName] = useState('');
  const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  // Reset form when modal is opened
  useEffect(() => {
    if (isOpen) {
      setAccountName('');
      setSelectedColor(ACCOUNT_COLORS[0]);
      setIsCreating(false);
    }
  }, [isOpen]);

  const handleCreate = () => {
    if (!accountName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an account name",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const newAccount = createAccount(accountName, selectedColor);
      toast({
        title: "Account Created",
        description: `Account "${accountName}" has been created successfully`,
      });

      // Call the success callback if provided
      if (onCreateSuccess) {
        onCreateSuccess(newAccount.id);
      }

      // Close the modal
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateAndImport = () => {
    if (!accountName.trim()) {
      toast({
        title: "Error",
        description: "Please enter an account name",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    try {
      const newAccount = createAccount(accountName, selectedColor);
      toast({
        title: "Account Created",
        description: `Account "${accountName}" has been created successfully`,
      });

      // Close the modal and redirect to imports
      onClose();
      setTimeout(() => {
        router.push('/trades?import=true&account=' + newAccount.id);
      }, 100);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create account",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Account</DialogTitle>
          <DialogDescription>
            Add a new trading account to track your trades and performance
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Account Name</Label>
            <Input
              id="name"
              placeholder="e.g., Futures Account, Forex Account"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {ACCOUNT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full transition-all hover:scale-110 relative",
                    selectedColor === color ? "ring-2 ring-offset-2 ring-primary" : ""
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Check className="absolute inset-0 m-auto text-white h-5 w-5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <div className="flex-1 flex gap-2">
            <Button 
              onClick={handleCreate} 
              disabled={isCreating || !accountName.trim()}
              className="flex-1"
            >
              {isCreating ? "Creating..." : "Create Account"}
            </Button>
            {showImportOption && (
              <Button 
                onClick={handleCreateAndImport} 
                disabled={isCreating || !accountName.trim()}
                className="flex-1"
                variant="secondary"
              >
                <Import className="mr-2 h-4 w-4" />
                Create & Import
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 