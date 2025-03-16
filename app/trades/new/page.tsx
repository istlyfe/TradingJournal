import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import TradeForm from "@/components/trades/TradeForm";

export const metadata: Metadata = {
  title: "Add New Trade | Trading Journal",
  description: "Add a new trade to your trading journal",
};

export default function NewTradePage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Add New Trade</h1>
      <Card>
        <CardHeader>
          <CardTitle>Trade Details</CardTitle>
          <CardDescription>
            Enter the details of your trade. Be sure to include accurate entry and exit prices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TradeForm />
        </CardContent>
      </Card>
    </div>
  );
}
