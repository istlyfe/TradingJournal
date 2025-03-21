"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useTheme } from "next-themes";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only show the theme switcher when mounted on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Preferences</CardTitle>
        <CardDescription>
          Choose your preferred theme for the Trading Journal
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={theme}
          onValueChange={setTheme}
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
        >
          <div>
            <RadioGroupItem
              value="light"
              id="theme-light"
              className="peer sr-only"
            />
            <Label
              htmlFor="theme-light"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Sun className="mb-3 h-6 w-6" />
              <span className="font-medium">Light</span>
            </Label>
          </div>
          
          <div>
            <RadioGroupItem
              value="dark"
              id="theme-dark"
              className="peer sr-only"
            />
            <Label
              htmlFor="theme-dark"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Moon className="mb-3 h-6 w-6" />
              <span className="font-medium">Dark</span>
            </Label>
          </div>
          
          <div>
            <RadioGroupItem
              value="system"
              id="theme-system"
              className="peer sr-only"
            />
            <Label
              htmlFor="theme-system"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Monitor className="mb-3 h-6 w-6" />
              <span className="font-medium">System</span>
            </Label>
          </div>
        </RadioGroup>
        
        <div className="rounded-md bg-muted p-4">
          <h3 className="mb-2 font-medium">About Theme Preferences</h3>
          <p className="text-sm text-muted-foreground">
            The light theme is optimized for daytime trading, while the dark theme reduces eye strain during night sessions. 
            The system option automatically matches your device's theme preference.
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 