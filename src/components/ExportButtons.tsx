import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileX } from 'lucide-react';
import { Device } from '@features/inventory/model/device';
import { exportToCSV } from '@/utils/exportUtils';

interface ExportButtonsProps {
  devices: Device[];
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({ devices }) => {
  const formatDate = (
    dateValue: string | { value: string; DisplayHint: number; DateTime: string } | undefined
  ): string => {
    if (!dateValue) return '';

    if (typeof dateValue === 'string') {
      // Handle .NET DateTime format: /Date(1750397103953)/
      const netDateMatch = dateValue.match(/\/Date\((\d+)\)\//);
      if (netDateMatch) {
        const timestamp = parseInt(netDateMatch[1], 10);
        return new Date(timestamp).toISOString();
      }
      return dateValue;
    } else if (typeof dateValue === 'object' && dateValue.DateTime) {
      return dateValue.DateTime;
    }

    return '';
  };

  const handleExportHardwareHashes = () => {
    const csvData = devices.map((device) => ({
      ComputerName: device.ComputerName,
      SerialNumber: device.SerialNumber || '',
      HardwareHash: device.HardwareHash,
    }));

    exportToCSV(csvData, 'hardware-hashes.csv');
  };

  const handleExportFullData = () => {
    const csvData = devices.map((device) => ({
      ComputerName: device.ComputerName,
      Manufacturer: device.Manufacturer,
      Model: device.Model,
      OSName: device.OSName,
      WindowsVersion: device.WindowsVersion,
      WindowsEdition: device.WindowsEdition,
      SerialNumber: device.SerialNumber || '',
      TotalRAMGB: device.TotalRAMGB,
      TotalStorageGB: device.TotalStorageGB,
      FreeStorageGB: device.FreeStorageGB,
      HardDriveType: device.HardDriveType,
      TPMVersion: device.TPMVersion,
      SecureBootEnabled: device.SecureBootEnabled,
      JoinType: device.JoinType,
      InternalIP: device.InternalIP,
      LastBootUpTime: formatDate(device.LastBootUpTime),
      CollectionDate: formatDate(device.CollectionDate),
      Windows11Ready: device.canUpgradeToWin11,
      Issues: device.issues.join('; '),
      Location: device.location || '',
    }));

    exportToCSV(csvData, 'device-inventory.csv');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export Data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4">
          <Button onClick={handleExportHardwareHashes} variant="outline">
            <FileX className="w-4 h-4 mr-2" />
            Export Hardware Hashes
          </Button>
          <Button onClick={handleExportFullData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Full Dataset
          </Button>
          <div className="text-sm text-muted-foreground self-center">
            Exporting {devices.length} devices
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
