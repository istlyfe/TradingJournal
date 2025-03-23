"use client";

import { useTheme } from "next-themes";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { SunMedium, Moon, Monitor, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>("appearance");
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);

  const themes = [
    {
      id: "light",
      name: "Light",
      icon: SunMedium,
      description: "Light mode with bright backgrounds and dark text."
    },
    {
      id: "dark",
      name: "Dark",
      icon: Moon,
      description: "Dark mode with dark backgrounds and light text. Easier on the eyes in low light."
    },
    {
      id: "system",
      name: "System",
      icon: Monitor,
      description: "Automatically matches your device's theme settings."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-muted p-4">
        <h3 className="text-base font-medium mb-2">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize how Trading Journal looks and feels.
        </p>
      </div>

      <Tabs defaultValue="theme" className="w-full">
        <TabsList className="w-full bg-background border border-border mb-6">
          <TabsTrigger 
            value="theme" 
            className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Theme
          </TabsTrigger>
          <TabsTrigger 
            value="accessibility" 
            className="flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
          >
            Accessibility
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="theme" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themes.map((item) => (
              <div
                key={item.id}
                className={`bg-background border border-border rounded-lg overflow-hidden cursor-pointer transition-all ${
                  theme === item.id 
                    ? "ring-2 ring-primary border-primary" 
                    : "hover:bg-accent/10"
                }`}
                onClick={() => setTheme(item.id)}
              >
                <div className="p-4 border-b border-border">
                  <div className="flex justify-between items-center">
                    <item.icon className="h-5 w-5" />
                    <div className={`w-4 h-4 rounded-full ${theme === item.id ? "bg-primary" : "border border-muted-foreground"}`}>
                      {theme === item.id && (
                        <div className="w-full h-full rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="text-base font-medium mt-2">{item.name}</h3>
                </div>
                <div className="p-4">
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Color scheme</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-muted-foreground mb-4">
                Choose a predefined color scheme for your trading journal.
              </p>
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center gap-1">
                  <Button 
                    variant="outline"
                    className="h-12 w-12 rounded-full bg-primary p-0 border-primary"
                    style={{ backgroundColor: 'hsl(var(--primary))' }}
                  />
                  <span className="text-xs font-medium">Default</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Button 
                    variant="outline"
                    className="h-12 w-12 rounded-full p-0 border border-border"
                    style={{ backgroundColor: '#22c55e' }}
                  />
                  <span className="text-xs">Green</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Button 
                    variant="outline"
                    className="h-12 w-12 rounded-full p-0 border border-border"
                    style={{ backgroundColor: '#3b82f6' }}
                  />
                  <span className="text-xs">Blue</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Button 
                    variant="outline"
                    className="h-12 w-12 rounded-full p-0 border border-border"
                    style={{ backgroundColor: '#a855f7' }}
                  />
                  <span className="text-xs">Purple</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="accessibility" className="space-y-4">
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium">Accessibility Settings</h3>
            </div>
            <div className="divide-y divide-border">
              <div className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Reduced Motion</Label>
                  <p className="text-sm text-muted-foreground">Minimize animations throughout the application</p>
                </div>
                <Switch 
                  checked={reducedMotion}
                  onCheckedChange={setReducedMotion}
                />
              </div>
              
              <div className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">High Contrast</Label>
                  <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                </div>
                <Switch 
                  checked={highContrast}
                  onCheckedChange={setHighContrast}
                />
              </div>
              
              <div className="p-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Font Size</Label>
                  <p className="text-sm text-muted-foreground">Adjust the text size across the application</p>
                </div>
                <div className="flex items-center">
                  <Button variant="outline" size="sm" className="h-8 w-8 rounded-l-md p-0 text-xs font-medium">A-</Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 rounded-none p-0 border-l-0 border-r-0 text-xs font-medium">A</Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 rounded-r-md p-0 text-xs font-medium">A+</Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 