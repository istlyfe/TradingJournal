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

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  onDeleteRows?: (rowIds: string[]) => void;
  enableRowSelection?: boolean;
  getRowId?: (row: TData) => string;
  onRowSelectionChange?: (rowIds: string[]) => void;
}

// Create a wrapper component for useReactTable to ensure hooks are used properly
export function DataTable<TData, TValue>({
  columns,
  data,
  onDeleteRows,
  enableRowSelection = false,
  getRowId = (row: any) => row.id,
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleRowSelectionChange = (updaterOrValue: Updater<RowSelectionState>) => {
    // Handle both function updaters and direct value assignments
    const newRowSelection = typeof updaterOrValue === 'function' 
      ? updaterOrValue(rowSelection)
      : updaterOrValue;
    
    setRowSelection(newRowSelection);
    
    if (onRowSelectionChange) {
      // Extract selected row IDs
      const selectedIds = Object.keys(newRowSelection)
        .filter(key => newRowSelection[key])
        .map(index => {
          const row = data[parseInt(index, 10)];
          return getRowId(row);
        });
      
      onRowSelectionChange(selectedIds);
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: handleRowSelectionChange,
    enableRowSelection,
    state: {
      sorting,
      rowSelection,
    },
    getRowId: (row, index) => String(index), // Use index for internal selection management
  });

  const selectedRows = table.getSelectedRowModel().rows;

  const handleDeleteSelected = () => {
    if (onDeleteRows && selectedRows.length > 0) {
      const rowIds = selectedRows.map(row => getRowId(row.original));
      onDeleteRows(rowIds);
      setRowSelection({});
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {selectedRows.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedRows.length} row(s) selected
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Selected
          </Button>
        </div>
      )}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
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
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Trades</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedRows.length} selected {selectedRows.length === 1 ? 'trade' : 'trades'}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 