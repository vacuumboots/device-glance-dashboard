
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Device, FilterState } from '@/types/device';
import { Filter } from 'lucide-react';

interface FilterPanelProps {
  devices: Device[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  devices,
  filters,
  onFiltersChange
}) => {
  const updateFilter = (key: keyof FilterState, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  // Get unique locations from devices
  const locations = Array.from(new Set(
    devices.map(d => d.location).filter(Boolean)
  )).sort();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {/* Windows 11 Ready */}
          <div className="space-y-2">
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
          <div className="space-y-2">
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
          <div className="space-y-2">
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
          <div className="space-y-2">
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
          <div className="space-y-2">
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

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Location</label>
            <Select
              value={filters.location}
              onValueChange={(value) => updateFilter('location', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
