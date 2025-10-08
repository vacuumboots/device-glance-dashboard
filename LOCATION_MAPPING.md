# Location Mapping Feature

This document explains how to use real location names in the Device Glance Dashboard while keeping generic names in the public codebase.

## Overview

The application uses generic location names (e.g., "Site 1A", "Location B2") in the codebase for privacy. However, when running the desktop application locally, you can load real location names from an external mapping file.

## How It Works

1. **Default Behavior**: Without a mapping file, the application uses generic location names based on IP ranges (e.g., "Site 1A", "Location B2")

2. **With Mapping File**: When you place a `location-mapping.json` file in the application's user data directory, the app will automatically load and use real location names

## Setup Instructions

### Step 1: Locate Your User Data Directory

The application looks for the mapping file in the Electron user data directory:

**Windows:**
```
%APPDATA%\device-glance-dashboard\location-mapping.json
```

Typically this resolves to:
```
C:\Users\<YourUsername>\AppData\Roaming\device-glance-dashboard\location-mapping.json
```

**macOS:**
```
~/Library/Application Support/device-glance-dashboard/location-mapping.json
```

**Linux:**
```
~/.config/device-glance-dashboard/location-mapping.json
```

### Step 2: Create the Mapping File

Copy your `location-mapping.json` file to the user data directory. The file should have this structure:

```json
{
  "locationMapping": {
    "genericToReal": {
      "Site 1A": "Big Rock",
      "Site 1B": "Dr. Morris Gibson",
      "Location B1": "Joe Clark",
      "Location B2": "Senator Reily"
    },
    "ipRangeMapping": {
      "10.51.": "Site 2A (Heritage Heights)",
      "10.52.": "Site 1A (Big Rock)",
      "10.146.": "Location B1 (Joe Clark)",
      "10.147.": "Location B2 (Senator Reily)"
    }
  }
}
```

### Step 3: Restart the Application

After placing the file, restart the Device Glance Dashboard. The application will automatically:
1. Load the mapping file on startup
2. Use real location names from `ipRangeMapping` when processing device data
3. Display real locations throughout the application

## File Format Details

### `genericToReal`
This section translates generic location names that are already present in your device data files. When a device has a location field (like `location`, `Location`, `Site`, or `Office`) with a generic name, this mapping will replace it with the real name.

Example:
- If device data contains `"location": "Region A"`
- And mapping has `"Region A": "High Country"`
- The device will display "High Country" instead

### `ipRangeMapping`
This mapping determines locations based on IP address ranges for devices that don't already have a location set. The format is:
- **Key**: IP prefix (e.g., "10.52.")
- **Value**: Real location name (e.g., "Site 1A (Big Rock)")

When a device's IP address starts with the prefix, it will be assigned the corresponding real location name.

### Priority Order
The application uses this priority order:
1. **Device data location + genericToReal mapping** - If device has a location field and there's a mapping for it
2. **Device data location (unmapped)** - If device has a location field but no mapping exists
3. **IP range mapping** - If device has no location field, determine from IP address using ipRangeMapping
4. **Hardcoded generic names** - If device has no location and no IP match, use hardcoded generic names
5. **"Unknown"** - If none of the above apply

## Privacy & Security

**Important Notes:**
- The `location-mapping.json` file should **NEVER** be committed to git
- This file is already in `.gitignore` to prevent accidental commits
- The file is stored locally on your machine only
- No location mappings are included in the compiled application or releases
- The application gracefully falls back to generic names if the file is missing

## Troubleshooting

### Locations Still Show Generic Names

1. **Check file location**: Ensure `location-mapping.json` is in the correct user data directory
2. **Check file format**: Validate JSON syntax using a JSON validator
3. **Restart application**: The mapping is loaded on startup, so restart after adding the file
4. **Check console**: Open DevTools (if running in dev mode) and check for any error messages

### Finding the User Data Directory

To find where the application is looking for the file:

1. Enable developer tools in the application
2. Check the console logs - the application logs when it successfully loads the mapping
3. You can also check the Electron documentation for `app.getPath('userData')`

## Example Use Case

**Scenario**: You have device inventory files with IP addresses like `10.52.100.5` and `10.146.50.10`.

**Without mapping file:**
- `10.52.100.5` → "Site 1A"
- `10.146.50.10` → "Location B1"

**With mapping file:**
- `10.52.100.5` → "Site 1A (Big Rock)"
- `10.146.50.10` → "Location B1 (Joe Clark)"

This allows you to:
- Share the codebase publicly with generic names
- Use meaningful location names when running locally
- Keep sensitive location information private
