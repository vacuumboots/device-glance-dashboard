import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Device, FilterState } from '@/types/device';
import { Filter, Search } from 'lucide-react';

interface FilterPanelProps {
  devices: Device[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ devices, filters, onFiltersChange }) => {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Get unique locations from devices
  const locations = Array.from(new Set(devices.map((d) => d.location).filter(Boolean))).sort();

  // Get unique device models from devices
  const deviceModels = Array.from(new Set(devices.map((d) => d.Model).filter(Boolean))).sort();

  const handleLocationChange = (location: string, checked: boolean) => {
    const newLocations = checked
      ? [...filters.location, location]
      : filters.location.filter((l) => l !== location);
    onFiltersChange({ ...filters, location: newLocations });
  };

  return (
    <Card data-testid="filter-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by device name or serial number..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-8 gap-4">
          {/* Windows 11 Ready */}
          <div className="space-y-2" data-testid="filter-windows11">
            <label className="text-sm font-medium">Windows 11 Ready</label>
            <Select
              value={filters.windows11Ready}
              onValueChange={(value) => updateFilter('windows11Ready', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="not-ready">Not Ready</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* TPM Present */}
          <div className="space-y-2" data-testid="filter-tpm">
            <label className="text-sm font-medium">TPM</label>
            <Select
              value={filters.tpmPresent}
              onValueChange={(value) => updateFilter('tpmPresent', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="missing">Missing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Secure Boot */}
          <div className="space-y-2" data-testid="filter-secureboot">
            <label className="text-sm font-medium">Secure Boot</label>
            <Select
              value={filters.secureBootEnabled}
              onValueChange={(value) => updateFilter('secureBootEnabled', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Storage */}
          <div className="space-y-2" data-testid="filter-storage">
            <label className="text-sm font-medium">Free Storage</label>
            <Select
              value={filters.lowStorage}
              onValueChange={(value) => updateFilter('lowStorage', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="low">Less than 30 GB</SelectItem>
                <SelectItem value="sufficient">30 GB or more</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Join Type */}
          <div className="space-y-2" data-testid="filter-jointype">
            <label className="text-sm font-medium">Join Type</label>
            <Select
              value={filters.joinType}
              onValueChange={(value) => updateFilter('joinType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Hybrid">Hybrid</SelectItem>
                <SelectItem value="AzureAD">Azure AD</SelectItem>
                <SelectItem value="OnPremAD">On-Prem AD</SelectItem>
                <SelectItem value="None">Workgroup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Device Category */}
          <div className="space-y-2" data-testid="filter-category">
            <label className="text-sm font-medium">Device Category</label>
            <Select
              value={filters.deviceCategory}
              onValueChange={(value) => updateFilter('deviceCategory', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Desktop">Desktop</SelectItem>
                <SelectItem value="Laptop">Laptop</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hash Present */}
          <div className="space-y-2" data-testid="filter-hashpresent">
            <label className="text-sm font-medium">Hash Present</label>
            <Select
              value={filters.hashPresent}
              onValueChange={(value) => updateFilter('hashPresent', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="missing">Missing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Device Model (add aria-label for test targeting) */}
          <div className="space-y-2" data-testid="filter-model">
            <label className="text-sm font-medium" id="device-model-label">Device Model</label>
            <Select
              value={filters.deviceModel}
              onValueChange={(value) => updateFilter('deviceModel', value)}
              aria-labelledby="device-model-label"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {deviceModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2" data-testid="filter-locations">
            <label className="text-sm font-medium">Locations</label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {locations.map((location) => {
                const labelId = `location-label-${location}`;
                return (
                  <div key={location} className="flex items-center space-x-2">
                    <Checkbox
                      aria-labelledby={labelId}
                      aria-label={location}
                      checked={filters.location.includes(location)}
                      onCheckedChange={(checked) => handleLocationChange(location, !!checked)}
                    />
                    <span id={labelId} className="text-sm cursor-pointer">
                      {location}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
