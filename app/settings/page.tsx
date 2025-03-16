import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BrokerSettings } from "@/components/settings/BrokerSettings";

export const metadata: Metadata = {
  title: "Settings | Trading Journal",
  description: "Configure your Trading Journal settings",
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Settings</h1>
      
      <Tabs defaultValue="brokers" className="w-full">
        <TabsList>
          <TabsTrigger value="brokers">Broker Connections</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="data">Data Management</TabsTrigger>
        </TabsList>
        
        <TabsContent value="brokers" className="mt-4">
          <BrokerSettings />
        </TabsContent>
        
        <TabsContent value="appearance" className="mt-4">
          <div className="rounded-md border p-6">
            <h2 className="text-xl font-medium">Appearance Settings</h2>
            <p className="text-muted-foreground">
              Customize the look and feel of your Trading Journal.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">More settings coming soon.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="general" className="mt-4">
          <div className="rounded-md border p-6">
            <h2 className="text-xl font-medium">General Settings</h2>
            <p className="text-muted-foreground">
              Configure general application settings.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">More settings coming soon.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="data" className="mt-4">
          <div className="rounded-md border p-6">
            <h2 className="text-xl font-medium">Data Management</h2>
            <p className="text-muted-foreground">
              Manage your trading data, exports, and backups.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">More settings coming soon.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 