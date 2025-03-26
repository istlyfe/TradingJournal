"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  RowSelectionState,
  getFilteredRowModel,
  OnChangeFn,
  Updater,
  ColumnFiltersState,
  getPaginationRowModel,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onDeleteRows?: (rowIndices: number[]) => void;
  enableRowSelection?: boolean;
  getRowId?: (row: TData) => string;
  onRowSelectionChange?: (rowIds: string[]) => void;
}

// Create a wrapper component for useReactTable to ensure hooks are used properly
export function DataTable<TData, TValue>({
  columns,
  data,
  onDeleteRows,
  ...props
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Handle row selection change with preventPropagation
  const handleRowSelectionChange = (updatedRowSelection: any) => {
    console.log("Row selection changed:", updatedRowSelection);
    setRowSelection(updatedRowSelection);
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: handleRowSelectionChange,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
    enableRowSelection: true,
    enableMultiRowSelection: true,
    initialState: {
      pagination: {
        pageSize: 100, // Show 100 trades per page by default
      },
    },
  });

  // Delete selected rows
  const handleDeleteRows = () => {
    // Get selected row indices more directly
    const selectedIndices: number[] = [];
    
    // Loop through rowSelection to get selected indices
    for (const [indexStr, isSelected] of Object.entries(rowSelection)) {
      if (isSelected) {
        const index = parseInt(indexStr, 10);
        if (!isNaN(index)) {
          selectedIndices.push(index);
        }
      }
    }
    
    console.log("Raw rowSelection:", rowSelection);
    console.log("Selected row indices to delete:", selectedIndices);
    
    if (selectedIndices.length > 0 && onDeleteRows) {
      onDeleteRows(selectedIndices);
      table.resetRowSelection();
      setShowDeleteDialog(false);
    } else {
      console.error("No rows selected or no delete handler provided");
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter symbols..."
          value={(table.getColumn("symbol")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("symbol")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.setPageSize(table.getFilteredRowModel().rows.length || data.length)}
            className="whitespace-nowrap"
          >
            Show All
          </Button>
          {Object.keys(rowSelection).length > 0 && (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteDialog(true)}
            >
              Delete Selected
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <div className="max-h-[70vh] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={row.getIsSelected() ? "bg-muted/50" : ""}
                    onClick={(e) => {
                      // Don't toggle selection when clicking checkboxes directly
                      // The checkbox cell handles its own click
                      if (!(e.target as HTMLElement).closest('[role="checkbox"]') && 
                          !(e.target as HTMLElement).closest('[data-row-select-bypass="true"]')) {
                        row.toggleSelected();
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getFilteredRowModel().rows.length} of {data.length} trades
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Trades</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {Object.keys(rowSelection).length} trade{Object.keys(rowSelection).length > 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRows}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 