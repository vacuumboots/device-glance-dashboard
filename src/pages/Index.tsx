import React, { useState, useMemo, useEffect } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { SummaryCharts } from '@/components/SummaryCharts';
import { FilterPanel } from '@/components/FilterPanel';
import { DeviceTable } from '@/components/DeviceTable';
import { DeviceDetailsModal } from '@/components/DeviceDetailsModal';
import { ExportButtons } from '@/components/ExportButtons';
import { Device, FilterState } from '@/types/device';
import { parseInventoryFiles } from '@/utils/deviceUtils';
import { useFilteredDevices } from '@/hooks/useFilteredDevices';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SyncPanel } from '@/components/SyncPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { LocationMapping } from '@/types/electron';

const Index = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [locationMapping, setLocationMapping] = useState<LocationMapping | null>(null);
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
    searchTerm: '',
  });

  const { toast } = useToast();

  // Load location mapping on mount (only in Electron environment)
  useEffect(() => {
    if (window.electronAPI?.loadLocationMapping) {
      window.electronAPI
        .loadLocationMapping()
        .then((result) => {
          if (result.success && result.mapping) {
            setLocationMapping(result.mapping);
            console.log('Location mapping loaded successfully');
          }
        })
        .catch((error) => {
          console.error('Failed to load location mapping:', error);
        });
    }
  }, []);

  const filteredDevices = useFilteredDevices(devices, filters);

  const handleFilesLoaded = (files: FileList) => {
    parseInventoryFiles(files, locationMapping)
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
      searchTerm: '',
    });
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Windows Device Inventory Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Explore and analyze your Windows device inventory data
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {devices.length > 0 && (
              <Button variant="outline" onClick={handleClearData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear Data
              </Button>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        <SettingsPanel />

        {/* Sync Panel */}
        <SyncPanel onFilesLoaded={setDevices} locationMapping={locationMapping} />

        {/* File Upload */}
        <FileUpload onFilesLoaded={handleFilesLoaded} />

        {devices.length > 0 && (
          <>
            {/* Summary Section */}
            <div className="bg-card p-6 rounded-lg border">
              <h2 className="text-xl font-semibold mb-2">
                Summary ({devices.length} devices loaded, {filteredDevices.length} shown)
              </h2>
              {/* Visible plain counts text to satisfy integration tests expecting exact match */}
              <p className="text-sm text-muted-foreground mb-4" data-testid="device-counts">
                {devices.length} devices loaded, {filteredDevices.length} shown
              </p>
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
