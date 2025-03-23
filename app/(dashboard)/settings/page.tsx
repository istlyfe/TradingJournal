"use client";

import React, { useState, useMemo } from "react";
import { BrokerSettings } from "@/components/settings/BrokerSettings";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { DataManagement } from "@/components/settings/DataManagement";
import { 
  Settings, 
  Palette, 
  Database, 
  LifeBuoy, 
  Shield,
  User,
  KeyRound,
  Bell,
  Network
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<string>("brokers");

  const tabs = [
    {
      id: "brokers",
      label: "Broker Connections",
      icon: Network,
      count: 0,
      description: "Manage your connections to trading platforms and brokers"
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
      description: "Customize how Trading Journal looks and feels"
    },
    {
      id: "general",
      label: "General",
      icon: Settings,
      description: "Configure basic settings for your trading journal"
    },
    {
      id: "data",
      label: "Data Management",
      icon: Database,
      description: "Export, backup, and manage your trading data"
    },
    {
      id: "account",
      label: "Account",
      icon: User,
      description: "Manage your user profile and preferences"
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      description: "Configure security settings and access controls"
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Control how you receive alerts and notifications"
    },
    {
      id: "support",
      label: "Help & Support",
      icon: LifeBuoy,
      description: "Get help and contact support"
    }
  ];

  // Use useMemo to find the active tab to avoid recreating it in the render
  const activeTabData = useMemo(() => {
    return tabs.find(t => t.id === activeTab);
  }, [activeTab]);

  // Create an IconComponent reference
  const IconComponent = activeTabData?.icon;

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-8">
        Manage your account settings and preferences.
      </p>
      
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-3 lg:col-span-2">
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="flex flex-col">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    activeTab === tab.id 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-accent/50"
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        <div className="col-span-12 md:col-span-9 lg:col-span-10">
          <div className="bg-background rounded-lg border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3">
                {IconComponent && (
                  <div className="rounded-full p-2.5 bg-primary/10">
                    <IconComponent className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-semibold">
                    {activeTabData?.label}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {activeTabData?.description}
                  </p>
                </div>
              </div>
            </div>
            <Separator />
            <div className="p-6">
              {activeTab === "brokers" && <BrokerSettings />}
              {activeTab === "appearance" && <ThemeSettings />}
              {activeTab === "data" && <DataManagement />}
              {activeTab === "general" && (
                <div className="space-y-6">
                  <div className="rounded-md bg-muted p-4">
                    <h3 className="text-base font-medium mb-2">General Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure general application settings including date formats, 
                      timezone preferences, and default views.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="bg-background rounded-lg border border-border overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-medium">Trading Preferences</h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">Set your preferred currency, position size calculation method, and risk parameters.</p>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Default Currency</label>
                            <select className="w-full p-2 rounded-md border bg-background">
                              <option value="USD">USD ($)</option>
                              <option value="EUR">EUR (€)</option>
                              <option value="GBP">GBP (£)</option>
                              <option value="JPY">JPY (¥)</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Default Risk Per Trade</label>
                            <div className="flex items-center space-x-2">
                              <input type="number" defaultValue={1} min={0.1} max={10} step={0.1} className="w-20 p-2 rounded-md border bg-background" />
                              <span className="text-sm">%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-background rounded-lg border border-border overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-medium">Time & Date Settings</h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">Configure how dates and times are displayed throughout the app.</p>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Date Format</label>
                            <select className="w-full p-2 rounded-md border bg-background">
                              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Time Format</label>
                            <select className="w-full p-2 rounded-md border bg-background">
                              <option value="12h">12-hour (AM/PM)</option>
                              <option value="24h">24-hour</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-background rounded-lg border border-border overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-medium">Default Views</h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">Set your preferred default views for trades, dashboard, and analytics.</p>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Default Dashboard Timeframe</label>
                            <select className="w-full p-2 rounded-md border bg-background">
                              <option value="1W">Last Week</option>
                              <option value="1M">Last Month</option>
                              <option value="3M">Last 3 Months</option>
                              <option value="YTD">Year to Date</option>
                              <option value="1Y">Last Year</option>
                              <option value="ALL">All Time</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium">Default Trades View</label>
                            <select className="w-full p-2 rounded-md border bg-background">
                              <option value="table">Table</option>
                              <option value="grid">Grid (Cards)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-background rounded-lg border border-border overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-medium">Performance Metrics</h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">Select which performance metrics are most important to you.</p>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="winRate" defaultChecked className="rounded border-gray-300" />
                            <label htmlFor="winRate" className="text-sm">Win Rate</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="profitFactor" defaultChecked className="rounded border-gray-300" />
                            <label htmlFor="profitFactor" className="text-sm">Profit Factor</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="expectancy" defaultChecked className="rounded border-gray-300" />
                            <label htmlFor="expectancy" className="text-sm">Expectancy</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="avgRR" defaultChecked className="rounded border-gray-300" />
                            <label htmlFor="avgRR" className="text-sm">Average Risk/Reward Ratio</label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="sharpe" className="rounded border-gray-300" />
                            <label htmlFor="sharpe" className="text-sm">Sharpe Ratio</label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "account" && (
                <div className="space-y-6">
                  <div className="rounded-md bg-muted p-4">
                    <h3 className="text-base font-medium mb-2">Account Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your user account settings, profile information, and preferences.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="bg-background rounded-lg border border-border overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-medium">Profile Information</h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">Update your profile details and preferences.</p>
                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-sm italic">Coming soon</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-background rounded-lg border border-border overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-medium">Email Settings</h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">Manage your email preferences and notifications.</p>
                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-sm italic">Coming soon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "security" && (
                <div className="space-y-6">
                  <div className="rounded-md bg-muted p-4">
                    <h3 className="text-base font-medium mb-2">Security Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage security settings, passwords, and authentication options.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="bg-background rounded-lg border border-border overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-medium">Password Management</h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">Update your password and security settings.</p>
                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-sm italic">Coming soon</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-background rounded-lg border border-border overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-medium">Two-Factor Authentication</h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">Set up additional security for your account.</p>
                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-sm italic">Coming soon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div className="rounded-md bg-muted p-4">
                    <h3 className="text-base font-medium mb-2">Notification Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Control how and when you receive notifications from the Trading Journal.
                    </p>
                  </div>
                  <div className="bg-muted/50 rounded-md p-6 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <Bell className="h-12 w-12 text-muted-foreground mx-auto" />
                      <h3 className="font-medium text-base">Notification settings coming soon</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        We're working on adding notification features to help you stay updated on your trading activity.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "support" && (
                <div className="space-y-6">
                  <div className="rounded-md bg-muted p-4">
                    <h3 className="text-base font-medium mb-2">Help & Support</h3>
                    <p className="text-sm text-muted-foreground">
                      Find help resources and contact support.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="bg-background rounded-lg border border-border overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-medium">Documentation</h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">Access our comprehensive documentation and guides.</p>
                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-sm italic">Coming soon</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-background rounded-lg border border-border overflow-hidden">
                      <div className="p-4 border-b border-border">
                        <h3 className="font-medium">Contact Support</h3>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-4">Get help with any issues or questions about the Trading Journal.</p>
                        <div className="bg-muted/50 rounded-md p-3">
                          <p className="text-sm italic">Coming soon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 