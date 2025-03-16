import { Metadata } from "next";
import { JournalEntries } from "@/components/journal/JournalEntries";
import { BookOpen, BarChart2, Lightbulb } from "lucide-react";

export const metadata: Metadata = {
  title: "Trading Journal | Journal Entries",
  description: "Record your trading thoughts, market conditions, and lessons learned",
};

export default function JournalPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Trading Journal</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <p className="text-muted-foreground max-w-prose">
            Record your thoughts, market conditions, and lessons learned from your trading journey.
            Regular journaling helps identify patterns in your trading behavior and improve decision-making.
          </p>
          
          <div className="flex flex-col gap-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <span className="font-medium">Tips for Effective Journaling</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1 mt-1">
              <li>• Record your thoughts before and after trades</li>
              <li>• Note market conditions and sentiment</li>
              <li>• Document what worked and what didn't</li>
              <li>• Review regularly to identify patterns</li>
            </ul>
          </div>
        </div>
      </div>
      
      <JournalEntries />
    </div>
  );
} 