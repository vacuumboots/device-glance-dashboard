import React, { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Device, FilterState } from '@/types/device';
import { Filter } from 'lucide-react';

interface CommunityCheckboxProps {
  id: string;
  checked: boolean;
  indeterminate: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const CommunityCheckbox: React.FC<CommunityCheckboxProps> = ({
  id,
  checked,
  indeterminate,
  onCheckedChange,
}) => {
  const checkboxRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      const input = checkboxRef.current.querySelector('input[type="checkbox"]') as HTMLInputElement;
      if (input) {
        input.indeterminate = indeterminate;
      }
    }
  }, [indeterminate]);

  return <Checkbox ref={checkboxRef} id={id} checked={checked} onCheckedChange={onCheckedChange} />;
};

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

  // Grouped locations mapping
  const locationGroups = {
    'High Country': ['C. Ian McLaren', 'Longview', 'Millarville', 'Oilfields', 'Turner Valley'],
    'High River': ['Joe Clark', 'Senator Reily', 'Highwood', 'Spitzee'],
    'High River Area': ['Blackie', 'Cayley'],
    Okotoks: [
      'Big Rock',
      'Dr. Morris Gibson',
      'Okotoks Junior',
      'Percy Pegler',
      'Foothills Composite',
      'Meadow Ridge',
      'Westmount',
    ],
    'Okotoks Area': ['Heritage Heights', 'Red Deer Lake'],
  };

  const handleLocationChange = (location: string, checked: boolean) => {
    const newLocations = checked
      ? [...filters.location, location]
      : filters.location.filter((l) => l !== location);
    onFiltersChange({ ...filters, location: newLocations });
  };

  const handleCommunityChange = (community: string, checked: boolean) => {
    const communityLocations = locationGroups[community as keyof typeof locationGroups] || [];
    const availableCommunityLocations = communityLocations.filter((loc) => locations.includes(loc));

    let newLocations;
    if (checked) {
      // Add all community locations that aren't already selected
      newLocations = [...new Set([...filters.location, ...availableCommunityLocations])];
    } else {
      // Remove all community locations
      newLocations = filters.location.filter((l) => !availableCommunityLocations.includes(l));
    }
    onFiltersChange({ ...filters, location: newLocations });
  };

  const isCommunitySelected = (community: string) => {
    const communityLocations = locationGroups[community as keyof typeof locationGroups] || [];
    const availableCommunityLocations = communityLocations.filter((loc) => locations.includes(loc));
    return (
      availableCommunityLocations.length > 0 &&
      availableCommunityLocations.every((loc) => filters.location.includes(loc))
    );
  };

  const isCommunityPartiallySelected = (community: string) => {
    const communityLocations = locationGroups[community as keyof typeof locationGroups] || [];
    const availableCommunityLocations = communityLocations.filter((loc) => locations.includes(loc));
    const selectedCount = availableCommunityLocations.filter((loc) =>
      filters.location.includes(loc)
    ).length;
    return selectedCount > 0 && selectedCount < availableCommunityLocations.length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
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

          {/* Device Category */}
          <div className="space-y-2">
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
          <div className="space-y-2">
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

          {/* Location */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Locations</label>
            <div className="space-y-3 max-h-48 overflow-y-auto border rounded-md p-3">
              {Object.entries(locationGroups).map(([groupName, groupLocations]) => (
                <div key={groupName} className="space-y-2">
                  {/* Community Group Checkbox */}
                  <div className="flex items-center space-x-2 border-b border-muted pb-1">
                    <CommunityCheckbox
                      id={`community-${groupName}`}
                      checked={isCommunitySelected(groupName)}
                      indeterminate={isCommunityPartiallySelected(groupName)}
                      onCheckedChange={(checked) => handleCommunityChange(groupName, !!checked)}
                    />
                    <label
                      htmlFor={`community-${groupName}`}
                      className="text-sm font-semibold cursor-pointer text-foreground"
                    >
                      {groupName}
                    </label>
                  </div>

                  {/* Individual Location Checkboxes */}
                  <div className="space-y-1 pl-6">
                    {groupLocations
                      .filter((loc) => locations.includes(loc))
                      .map((location) => (
                        <div key={location} className="flex items-center space-x-2">
                          <Checkbox
                            id={`location-${location}`}
                            checked={filters.location.includes(location)}
                            onCheckedChange={(checked) => handleLocationChange(location, !!checked)}
                          />
                          <label
                            htmlFor={`location-${location}`}
                            className="text-sm cursor-pointer"
                          >
                            {location}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
