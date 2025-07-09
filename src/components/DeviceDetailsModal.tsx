import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Device } from '@/types/device';
import { getUpgradeRecommendations } from '@/utils/upgradeUtils';

interface DeviceDetailsModalProps {
  device: Device;
  isOpen: boolean;
  onClose: () => void;
}

export const DeviceDetailsModal: React.FC<DeviceDetailsModalProps> = ({
  device,
  isOpen,
  onClose,
}) => {
  const recommendations = getUpgradeRecommendations(device);

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toString();
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  };

  const keyDisplayNames: Record<string, string> = {
    ComputerName: 'Computer Name',
    Manufacturer: 'Manufacturer',
    Model: 'Model',
    OSName: 'Operating System',
    WindowsVersion: 'Windows Version',
    WindowsEdition: 'Windows Edition',
    TotalRAMGB: 'Total RAM (GB)',
    TotalStorageGB: 'Total Storage (GB)',
    FreeStorageGB: 'Free Storage (GB)',
    HardDriveType: 'Hard Drive Type',
    TPMVersion: 'TPM Version',
    SecureBootEnabled: 'Secure Boot Enabled',
    JoinType: 'Domain Join Type',
    InternalIP: 'Internal IP Address',
    LastBootUpTime: 'Last Boot Time',
    HardwareHash: 'Hardware Hash',
    SerialNumber: 'Serial Number',
    canUpgradeToWin11: 'Windows 11 Ready',
    location: 'Location',
  };

  const primaryKeys = [
    'ComputerName',
    'Manufacturer',
    'Model',
    'OSName',
    'WindowsVersion',
    'WindowsEdition',
    'TotalRAMGB',
    'TotalStorageGB',
    'FreeStorageGB',
    'TPMVersion',
    'SecureBootEnabled',
    'JoinType',
    'canUpgradeToWin11',
  ];

  const getOtherProperties = () => {
    return Object.keys(device)
      .filter((key) => !primaryKeys.includes(key) && !['issues'].includes(key))
      .sort();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Device Details: {device.ComputerName}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-6">
            {/* Primary Information */}
            <Card>
              <CardHeader>
                <CardTitle>Primary Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {primaryKeys.map((key) => (
                    <div key={key} className="flex justify-between items-center">
                      <span className="font-medium">{keyDisplayNames[key] || key}:</span>
                      <span className="text-right">
                        {key === 'canUpgradeToWin11' ? (
                          <Badge variant={device[key] ? 'default' : 'destructive'}>
                            {device[key] ? 'Ready' : 'Not Ready'}
                          </Badge>
                        ) : key === 'SecureBootEnabled' ? (
                          <Badge variant={device[key] ? 'default' : 'destructive'}>
                            {device[key] ? 'Enabled' : 'Disabled'}
                          </Badge>
                        ) : (
                          formatValue(device[key])
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Windows 11 Upgrade Status */}
            <Card>
              <CardHeader>
                <CardTitle>Windows 11 Upgrade Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={device.canUpgradeToWin11 ? 'default' : 'destructive'}
                    className="text-lg py-2 px-4"
                  >
                    {device.canUpgradeToWin11 ? 'Windows 11 Ready' : 'Not Ready for Windows 11'}
                  </Badge>
                </div>

                {device.issues && device.issues.length > 0 && (
                  <div>
                    <h4 className="font-medium text-destructive mb-2">Issues Found:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {device.issues.map((issue, index) => (
                        <li key={index} className="text-muted-foreground">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recommendations:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {recommendations.map((rec, index) => (
                        <li key={index} className="text-muted-foreground">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Properties */}
            {getOtherProperties().length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Properties</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    {getOtherProperties().map((key) => (
                      <div key={key} className="flex justify-between items-center py-1">
                        <span className="font-medium">{keyDisplayNames[key] || key}:</span>
                        <span className="text-right text-muted-foreground break-all max-w-xs">
                          {formatValue(device[key])}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
