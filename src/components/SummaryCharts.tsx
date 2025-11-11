import React from 'react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Device } from '@features/inventory/model/device';
import { generateChartData } from '@/utils/chartUtils';
import { TooltipProps } from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { ChartData } from '@features/inventory/model/device';

interface SummaryChartsProps {
  devices: Device[];
}

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  payload?: [
    {
      payload: ChartData;
    },
  ];
}

export const SummaryCharts: React.FC<SummaryChartsProps> = ({ devices }) => {
  const windows11Data = generateChartData(devices, 'canUpgradeToWin11', {
    true: { name: 'Windows 11 Ready', color: '#22c55e' },
    false: { name: 'Not Ready', color: '#ef4444' },
  });

  const tpmData = generateChartData(devices, 'TPMVersion', {
    '2.0': { name: 'TPM 2.0', color: '#22c55e' },
    '1.2': { name: 'TPM 1.2', color: '#f59e0b' },
    None: { name: 'No TPM', color: '#ef4444' },
    '': { name: 'Unknown', color: '#6b7280' },
    null: { name: 'Unknown', color: '#6b7280' },
  });

  const secureBootData = generateChartData(devices, 'SecureBootEnabled', {
    true: { name: 'Enabled', color: '#22c55e' },
    false: { name: 'Disabled', color: '#ef4444' },
  });

  const joinTypeData = generateChartData(devices, 'JoinType', {
    Hybrid: { name: 'Hybrid', color: '#3b82f6' },
    AzureAD: { name: 'Azure AD', color: '#8b5cf6' },
    OnPremAD: { name: 'On-Prem AD', color: '#f59e0b' },
    None: { name: 'Workgroup', color: '#6b7280' },
  });

  const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} devices ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Windows 11 Readiness */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Windows 11 Readiness</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={windows11Data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label={({ percentage }) => `${percentage}%`}
              >
                {windows11Data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* TPM Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">TPM Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={tpmData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8884d8">
                {tpmData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Secure Boot */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Secure Boot Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={secureBootData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={60}
                label={({ percentage }) => `${percentage}%`}
              >
                {secureBootData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Join Type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Domain Join Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={joinTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#8884d8">
                {joinTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
