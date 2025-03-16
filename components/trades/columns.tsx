"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Trade } from "@/types/trade";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

export const columns: ColumnDef<Trade>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
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
  },
  {
    accessorKey: "direction",
    header: "Direction",
    cell: ({ row }) => {
      const direction = row.getValue("direction") as string;
      return (
        <div className={direction === "LONG" ? "text-green-600" : "text-red-600"}>
          {direction}
        </div>
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
      return formatDateTime(row.getValue("entryDate"));
    },
  },
  {
    accessorKey: "entryPrice",
    header: "Entry Price",
    cell: ({ row }) => {
      const amount = row.getValue("entryPrice");
      return formatCurrency(amount as number);
    },
  },
  {
    accessorKey: "exitPrice",
    header: "Exit Price",
    cell: ({ row }) => {
      const amount = row.getValue("exitPrice");
      return amount ? formatCurrency(parseFloat(amount as string)) : "-";
    },
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
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
      const amount = row.getValue("pnl") as number;
      return (
        <div className={amount >= 0 ? "text-green-600" : "text-red-600"}>
          {formatCurrency(amount)}
        </div>
      );
    },
  },
]; 