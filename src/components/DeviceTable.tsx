import React, { useMemo, useRef, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Device } from '@/types/device';

interface DeviceTableProps {
  devices: Device[];
  onDeviceClick: (device: Device) => void;
}

export const DeviceTable: React.FC<DeviceTableProps> = ({ devices, onDeviceClick }) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const formatGB = (gb: number) => `${gb.toFixed(1)} GB`;

  const formatDate = (
    dateInput: string | { value: string; DisplayHint: number; DateTime: string }
  ) => {
    try {
      // Handle CollectionDate object format
      if (typeof dateInput === 'object' && dateInput !== null) {
        // Try DateTime property first (readable format)
        if (dateInput.DateTime) {
          return new Date(dateInput.DateTime).toLocaleDateString();
        }
        // Fall back to parsing the value property (.NET Date format)
        if (
          dateInput.value &&
          dateInput.value.includes('/Date(') &&
          dateInput.value.includes(')/')
        ) {
          const timestamp = dateInput.value.match(/\d+/)?.[0];
          if (timestamp) {
            return new Date(parseInt(timestamp)).toLocaleDateString();
          }
        }
      }
      // Handle string format
  return new Date(dateInput as string).toLocaleDateString();
    } catch {
      return typeof dateInput === 'string' ? dateInput : '-';
    }
  };

  const formatLastBootTime = (dateString: string) => {
    try {
      // Handle .NET Date format like "/Date(1750298266500)/"
      if (dateString.includes('/Date(') && dateString.includes(')/')) {
        const timestamp = dateString.match(/\d+/)?.[0];
        if (timestamp) {
          return new Date(parseInt(timestamp)).toLocaleDateString();
        }
      }
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const columns = useMemo<ColumnDef<Device>[]>(
    () => [
      {
        accessorKey: 'ComputerName',
        header: () => 'Computer Name',
        cell: ({ row }) => <span className="font-medium">{row.original.ComputerName}</span>,
      },
      { accessorKey: 'Manufacturer', header: () => 'Manufacturer' },
      { accessorKey: 'Model', header: () => 'Model' },
      { accessorKey: 'OSName', header: () => 'OS' },
      {
        accessorKey: 'LastBootUpTime',
        header: () => 'Last Boot Time',
        cell: ({ row }) => (
          <span>
            {row.original.LastBootUpTime
              ? formatLastBootTime(row.original.LastBootUpTime)
              : '-'}
          </span>
        ),
        sortingFn: (a, b, columnId) => {
          const av = a.getValue<string>(columnId);
          const bv = b.getValue<string>(columnId);
          const at = Date.parse(av ?? '');
          const bt = Date.parse(bv ?? '');
          return (at || 0) - (bt || 0);
        },
      },
      {
        accessorKey: 'TotalRAMGB',
        header: () => 'RAM',
        cell: ({ row }) => formatGB(row.original.TotalRAMGB),
      },
      {
        accessorKey: 'TotalStorageGB',
        header: () => 'Storage',
        cell: ({ row }) => formatGB(row.original.TotalStorageGB),
      },
      {
        accessorKey: 'FreeStorageGB',
        header: () => 'Free Storage',
        cell: ({ row }) => (
          <span className={row.original.FreeStorageGB < 30 ? 'text-red-600' : ''}>
            {formatGB(row.original.FreeStorageGB)}
          </span>
        ),
      },
      {
        accessorKey: 'TPMVersion',
        header: () => 'TPM',
        cell: ({ row }) => (
          <Badge variant={row.original.TPMVersion === '2.0' ? 'default' : 'secondary'}>
            {row.original.TPMVersion || 'None'}
          </Badge>
        ),
      },
      {
        accessorKey: 'SecureBootEnabled',
        header: () => 'Secure Boot',
        cell: ({ row }) => (
          <Badge variant={row.original.SecureBootEnabled ? 'default' : 'destructive'}>
            {row.original.SecureBootEnabled ? 'Yes' : 'No'}
          </Badge>
        ),
        enableSorting: true,
      },
      {
        accessorKey: 'canUpgradeToWin11',
        header: () => 'Win11 Ready',
        cell: ({ row }) => (
          <Badge variant={row.original.canUpgradeToWin11 ? 'default' : 'destructive'}>
            {row.original.canUpgradeToWin11 ? 'Yes' : 'No'}
          </Badge>
        ),
      },
      {
        accessorKey: 'JoinType',
        header: () => 'Join Type',
        cell: ({ row }) => <Badge variant="outline">{row.original.JoinType}</Badge>,
      },
      { accessorKey: 'location', header: () => 'Location' },
    ],
    []
  );

  const table = useReactTable({
    data: devices,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: false,
  });

  const rows = table.getRowModel().rows;

  const parentRef = useRef<HTMLDivElement | null>(null);
  const enableVirtual = rows.length > 30;
  const rowVirtualizer = useVirtualizer({
    count: enableVirtual ? rows.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 44, // approximate row height
    overscan: 8,
  });
  const virtualItems = enableVirtual ? rowVirtualizer.getVirtualItems() : [];
  const paddingTop = enableVirtual && virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom = enableVirtual && virtualItems.length > 0
    ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Inventory ({devices.length} devices)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Make the body scrollable vertically; keep header sticky by separating containers */}
          <Table>
            <TableHeader>
              <TableRow>
                {table.getFlatHeaders().map((header) => (
                  <TableHead
                    key={header.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={header.column.getToggleSortingHandler()}
                    aria-sort={
                      header.column.getIsSorted() === 'asc'
                        ? 'ascending'
                        : header.column.getIsSorted() === 'desc'
                        ? 'descending'
                        : 'none'
                    }
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && (
                      <ArrowUp className="w-4 h-4 inline ml-1" />
                    )}
                    {header.column.getIsSorted() === 'desc' && (
                      <ArrowDown className="w-4 h-4 inline ml-1" />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* If few rows, render normally without virtualization to keep tests simple */}
              {!enableVirtual &&
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onDeviceClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {/* Virtualized rendering for large datasets */}
              {enableVirtual && (
                <>
                  {/* top padding */}
                  {paddingTop > 0 && (
                    <TableRow>
                      <TableCell colSpan={columns.length} style={{ height: paddingTop }} />
                    </TableRow>
                  )}
                  {virtualItems.map((virtualRow) => {
                    const row = rows[virtualRow.index]!;
                    return (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => onDeviceClick(row.original)}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                  {/* bottom padding */}
                  {paddingBottom > 0 && (
                    <TableRow>
                      <TableCell colSpan={columns.length} style={{ height: paddingBottom }} />
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
        </div>
        {/* Virtual scroll container (height constraint) */}
        <div
          ref={parentRef}
          className="mt-2 max-h-[60vh] overflow-y-auto"
          aria-label="Device table scroll container"
        />
      </CardContent>
    </Card>
  );
};
