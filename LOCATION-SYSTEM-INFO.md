# Location Privacy System

## Overview

This project uses generic location identifiers to protect sensitive location information while maintaining full functionality.

## System Design

### Public Codebase
- All source code uses generic location names (Region A, District 1, Site 1A, etc.)
- GitHub releases contain no sensitive location information
- Tests and documentation use only generic identifiers

### Private Development Files
- `location-mapping.json` - Contains actual location mappings (git-ignored)
- `LOCATION-MAPPING-README.md` - Detailed documentation (git-ignored)
- These files exist only locally for authorized developers

## Generic Naming Convention

### Region Groups
- **Region A, Region B, Region C** - Large geographical areas
- **District 1, District 2** - Administrative districts

### Individual Sites  
- **Site 1A, Site 1B, Site 1C** - Individual buildings/campuses
- **Location A1, Location B1** - Secondary locations

## Security Measures

1. **`.gitignore`** - Excludes all location mapping files
2. **`package.json`** - Electron-builder excludes mapping files from releases  
3. **Source Code** - Contains only generic location identifiers
4. **Documentation** - Public docs contain no real location references

## For Developers

- Reference local `location-mapping.json` file (if available) for real location correspondence
- Always use generic names in all code, tests, and public documentation
- Never commit files containing real location names
- Follow established naming patterns when adding new locations

## File Structure

```
├── src/                              # Uses generic names only
├── location-mapping.json             # IGNORED - Real mappings
├── LOCATION-MAPPING-README.md        # IGNORED - Detailed docs  
└── LOCATION-SYSTEM-INFO.md           # Public - Generic info only
```

This system ensures complete privacy compliance while maintaining full application functionality.