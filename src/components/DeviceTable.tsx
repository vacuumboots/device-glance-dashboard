
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { Device } from '@/types/device';

interface DeviceTableProps {
  devices: Device[];
  onDeviceClick: (device: Device) => void;
}

interface SortConfig {
  key: keyof Device;
  direction: 'asc' | 'desc';
}

export const DeviceTable: React.FC<DeviceTableProps> = ({ devices, onDeviceClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'ComputerName', direction: 'asc' });
  const itemsPerPage = 10;

  // Sort devices
  const sortedDevices = [...devices].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate devices
  const totalPages = Math.ceil(sortedDevices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDevices = sortedDevices.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (key: keyof Device) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatGB = (gb: number) => `${gb.toFixed(1)} GB`;
  
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const SortIcon = ({ column }: { column: keyof Device }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp className="w-4 h-4 inline ml-1" /> : 
      <ArrowDown className="w-4 h-4 inline ml-1" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Device Inventory ({devices.length} devices)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('ComputerName')}
                >
                  Computer Name <SortIcon column="ComputerName" />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('Manufacturer')}
                >
                  Manufacturer <SortIcon column="Manufacturer" />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('Model')}
                >
                  Model <SortIcon column="Model" />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('OSName')}
                >
                  OS <SortIcon column="OSName" />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('TotalRAMGB')}
                >
                  RAM <SortIcon column="TotalRAMGB" />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('FreeStorageGB')}
                >
                  Free Storage <SortIcon column="FreeStorageGB" />
                </TableHead>
                <TableHead>TPM</TableHead>
                <TableHead>Secure Boot</TableHead>
                <TableHead>Win11 Ready</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('JoinType')}
                >
                  Join Type <SortIcon column="JoinType" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDevices.map((device, index) => (
                <TableRow 
                  key={`${device.ComputerName}-${index}`}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onDeviceClick(device)}
                >
                  <TableCell className="font-medium">{device.ComputerName}</TableCell>
                  <TableCell>{device.Manufacturer}</TableCell>
                  <TableCell>{device.Model}</TableCell>
                  <TableCell>{device.OSName}</TableCell>
                  <TableCell>{formatGB(device.TotalRAMGB)}</TableCell>
                  <TableCell>
                    <span className={device.FreeStorageGB < 30 ? 'text-red-600' : ''}>
                      {formatGB(device.FreeStorageGB)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={device.TPMVersion === '2.0' ? 'default' : 'secondary'}>
                      {device.TPMVersion || 'None'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={device.SecureBootEnabled ? 'default' : 'destructive'}>
                      {device.SecureBootEnabled ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={device.canUpgradeToWin11 ? 'default' : 'destructive'}>
                      {device.canUpgradeToWin11 ? 'Ready' : 'Not Ready'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{device.JoinType}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, devices.length)} of {devices.length} devices
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
