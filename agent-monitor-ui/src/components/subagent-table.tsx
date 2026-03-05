"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MonitorStatus } from "@/types/monitor";

type SubRow = MonitorStatus["subagent_execution"][number];

const statusVariant: Record<string, "ok" | "warn" | "error" | "neutral"> = {
  ok: "ok",
  warn: "warn",
  error: "error",
};

const columns: ColumnDef<SubRow>[] = [
  { accessorKey: "parent_agent", header: "Parent Agent" },
  { accessorKey: "agent", header: "Sub-agent" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = String(row.original.status ?? "neutral");
      return <Badge variant={statusVariant[value] ?? "neutral"}>{value}</Badge>;
    },
  },
  { accessorKey: "stage", header: "Stage" },
  {
    accessorKey: "progress",
    header: "Progress",
    cell: ({ row }) => (
      <div className="flex min-w-40 items-center gap-2">
        <Progress value={Number(row.original.progress ?? 0)} className="flex-1" />
        <span className="w-10 text-right text-xs text-zinc-600">{Number(row.original.progress ?? 0)}%</span>
      </div>
    ),
  },
  {
    accessorKey: "current_task",
    header: "Current Task",
    cell: ({ row }) => <span className="block max-w-xs truncate text-xs text-zinc-600">{String(row.original.current_task || "-")}</span>,
  },
  { accessorKey: "runtime", header: "Runtime" },
  { accessorKey: "result", header: "Result" },
];

export function SubagentTable({ rows }: { rows: SubRow[] }) {
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-16 text-center text-zinc-500">
                No sub-agent rows.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
