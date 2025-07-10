import React, { useState, useMemo } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { SummaryCharts } from '@/components/SummaryCharts';
import { FilterPanel } from '@/components/FilterPanel';
import { DeviceTable } from '@/components/DeviceTable';
import { DeviceDetailsModal } from '@/components/DeviceDetailsModal';
import { ExportButtons } from '@/components/ExportButtons';
import { Device, FilterState } from '@/types/device';
import { parseInventoryFiles, filterDevices } from '@/utils/deviceUtils';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    windows11Ready: 'all',
    tpmPresent: 'all',
    secureBootEnabled: 'all',
    lowStorage: 'all',
    joinType: 'all',
    deviceCategory: 'all',
    hashPresent: 'all',
    deviceModel: 'all',
    location: [],
  });

  const { toast } = useToast();

  const filteredDevices = useMemo(() => {
    return filterDevices(devices, filters);
  }, [devices, filters]);

  const handleFilesLoaded = (files: FileList) => {
    parseInventoryFiles(files)
      .then(setDevices)
      .catch((error) => {
        toast({
          title: 'Error loading inventory files',
          description: 'Please check the file format. ' + error.message,
          variant: 'destructive',
        });
      });
  };

  const handleClearData = () => {
    setDevices([]);
    setSelectedDevice(null);
    setFilters({
      windows11Ready: 'all',
      tpmPresent: 'all',
      secureBootEnabled: 'all',
      lowStorage: 'all',
      joinType: 'all',
      deviceCategory: 'all',
      hashPresent: 'all',
      deviceModel: 'all',
      location: [],
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Windows Device Inventory Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Explore and analyze your Windows device inventory data
            </p>
          </div>
          {devices.length > 0 && (
            <Button variant="outline" onClick={handleClearData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear Data
            </Button>
          )}
        </div>

        {/* File Upload */}
        <FileUpload onFilesLoaded={handleFilesLoaded} />

        {devices.length > 0 && (
          <>
            {/* Summary Section */}
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-4">
                Summary ({devices.length} devices loaded, {filteredDevices.length} shown)
              </h2>
              <SummaryCharts devices={filteredDevices} />
            </div>

            {/* Filter Panel */}
            <FilterPanel devices={devices} filters={filters} onFiltersChange={setFilters} />

            {/* Export Buttons */}
            <ExportButtons devices={filteredDevices} />

            {/* Device Table */}
            <DeviceTable devices={filteredDevices} onDeviceClick={setSelectedDevice} />

            {/* Device Details Modal */}
            {selectedDevice && (
              <DeviceDetailsModal
                device={selectedDevice}
                isOpen={!!selectedDevice}
                onClose={() => setSelectedDevice(null)}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
