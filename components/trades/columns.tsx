"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Trade } from "@/types/trade";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export const columns: ColumnDef<Trade>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="trade-table-checkbox"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="trade-table-checkbox"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "symbol",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Symbol
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const symbol = row.getValue("symbol") as string;
      return <div className="font-medium">{symbol}</div>;
    },
  },
  {
    accessorKey: "direction",
    header: "Direction",
    cell: ({ row }) => {
      const direction = row.getValue("direction") as "long" | "short";
      return (
        <Badge 
          variant={direction === "long" ? "default" : "destructive"}
          className="capitalize"
        >
          {direction}
        </Badge>
      );
    },
  },
  {
    accessorKey: "entryDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Entry Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("entryDate");
      if (!date) return null;
      return <div>{format(new Date(date as string), "MMM d, yyyy")}</div>;
    },
    sortingFn: "datetime",
  },
  {
    accessorKey: "exitDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Exit Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.getValue("exitDate");
      if (!date) return <div className="text-muted-foreground">Open</div>;
      return <div>{format(new Date(date as string), "MMM d, yyyy")}</div>;
    },
    sortingFn: "datetime",
  },
  {
    accessorKey: "entryPrice",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Entry Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("entryPrice"));
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(price);
      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "exitPrice",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Exit Price
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const price = row.getValue("exitPrice");
      if (!price) return <div className="text-muted-foreground">-</div>;
      
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(parseFloat(price as string));
      return <div>{formatted}</div>;
    },
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Quantity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const quantity = parseFloat(row.getValue("quantity"));
      return <div>{quantity.toLocaleString()}</div>;
    },
  },
  {
    accessorKey: "pnl",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          P&L
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const trade = row.original;
      let pnl = 0;
      
      if (trade.pnl !== undefined) {
        pnl = parseFloat(trade.pnl.toString());
      } else if (trade.exitPrice && trade.entryPrice && trade.quantity) {
        const entryPrice = parseFloat(trade.entryPrice);
        const exitPrice = parseFloat(trade.exitPrice);
        const quantity = parseFloat(trade.quantity);
        
        if (trade.direction === "long") {
          pnl = (exitPrice - entryPrice) * quantity;
        } else {
          pnl = (entryPrice - exitPrice) * quantity;
        }
      }
      
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        signDisplay: "auto",
      }).format(pnl);
      
      return (
        <div className={pnl >= 0 ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
          {formatted}
        </div>
      );
    },
  },
]; 