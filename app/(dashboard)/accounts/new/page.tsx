"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useAccounts } from "@/hooks/useAccounts";

export default function NewAccountPage() {
  const router = useRouter();
  const { createAccount } = useAccounts();
  const [name, setName] = useState("");
  const [color, setColor] = useState("#7C3AED"); // Default purple
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) return;
    
    setLoading(true);
    
    try {
      // Create a new account using the hook function
      createAccount(name.trim(), color);
      
      // Redirect back to accounts page
      router.push("/accounts");
    } catch (error) {
      console.error("Error creating account:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Account</CardTitle>
          <CardDescription>
            Add a new trading account to track your performance
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input
                id="name"
                placeholder="e.g., Main Trading Account"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
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
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              type="button"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !name.trim()}
            >
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 