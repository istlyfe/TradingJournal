"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrokerSettings } from "@/components/settings/BrokerSettings";
import { ThemeSettings } from "@/components/settings/ThemeSettings";
import { DataManagement } from "@/components/settings/DataManagement";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Tabs defaultValue="brokers" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="brokers">Broker Connections</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="brokers" className="mt-6">
          <BrokerSettings />
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-6">
          <ThemeSettings />
        </TabsContent>
        
        <TabsContent value="general" className="mt-6">
          <div className="rounded-md border p-6">
            <h2 className="text-xl font-medium">General Settings</h2>
            <p className="text-muted-foreground">
              Configure general application settings.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">More settings coming soon.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="data" className="mt-6">
          <DataManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
} 