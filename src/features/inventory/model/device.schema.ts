import { z } from 'zod';

export const DeviceSchema = z
  .object({
    ComputerName: z.string().default(''),
    Manufacturer: z.string().default(''),
    Model: z.string().default(''),
    OSName: z.string().default(''),
    WindowsVersion: z.string().default(''),
    WindowsEdition: z.string().default(''),
    TotalRAMGB: z.coerce.number().default(0),
    TotalStorageGB: z.coerce.number().default(0),
    FreeStorageGB: z.coerce.number().default(0),
    HardDriveType: z.string().default(''),
    TPMVersion: z.string().default(''),
    SecureBootEnabled: z.coerce.boolean().default(false),
    JoinType: z.string().default('None'),
    InternalIP: z.string().default(''),
    LastBootUpTime: z.string().default(''),
    HardwareHash: z.string().default(''),
    SerialNumber: z.string().optional(),
    canUpgradeToWin11: z.coerce.boolean().default(false),
    issues: z.array(z.string()).default([]),
    location: z.string().optional(),
    CollectionDate: z.string().optional(),
    category: z.string().optional(),
  })
  .passthrough();

export type DeviceParsed = z.infer<typeof DeviceSchema>;