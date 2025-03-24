"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAccounts } from "@/hooks/useAccounts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountDialog({ open, onOpenChange }: AddAccountDialogProps) {
  const { createAccount } = useAccounts();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#7C3AED"); // Default purple
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    setLoading(true);
    
    try {
      // Create a new account
      const newAccount = createAccount(name.trim(), color);
      
      // Trigger a storage event to refresh other components
      window.dispatchEvent(new Event('storage'));
      
      // Reset form and close dialog
      setName("");
      setColor("#7C3AED");
      
      // Short delay to ensure data is synced before closing
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
      
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      setLoading(false);
    }
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Focus the input when dialog opens
      setTimeout(() => {
        const nameInput = document.getElementById('name');
        if (nameInput) {
          (nameInput as HTMLInputElement).focus();
        }
      }, 100);
    } else {
      // Reset form when dialog closes
      setName("");
      setColor("#7C3AED");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
            <DialogDescription>
              Add a new trading account to track your performance
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                placeholder="e.g., Main Trading Account"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="color">Account Color</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="color"
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <span className="text-sm text-muted-foreground">
                  Choose a color to identify this account
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !name.trim()}
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 