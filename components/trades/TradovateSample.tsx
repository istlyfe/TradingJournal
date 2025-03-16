"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TradovateSample() {
  const downloadSample = () => {
    // Create a download link to the sample file in the public directory
    const link = document.createElement("a");
    link.href = "/samples/tradovate-sample.csv";
    link.download = "tradovate-sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-start">
      <p className="text-sm text-muted-foreground mb-4">
        Download a sample Tradovate order CSV file to test the import functionality. 
        This file contains sample trades with buy and sell orders that will be 
        automatically paired to create trade records.
      </p>
      <Button
        onClick={downloadSample}
        variant="outline"
        className="flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Download Sample CSV
      </Button>
    </div>
  );
} 