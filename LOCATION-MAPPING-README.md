# Location Mapping System

## Overview

This project uses a dual location naming system to protect sensitive location information while maintaining full functionality.

## System Design

### Generic Names (Public)
- **Source Code**: Uses generic names like "Region A", "District 1", "Site 1A"
- **GitHub Releases**: Only contains generic location identifiers
- **Public Distribution**: No sensitive location information exposed

### Real Names (Private)
- **location-mapping.json**: Contains mapping between generic and real names
- **Local Development**: Developers can reference real locations when needed
- **Git Ignored**: Never committed to repository or included in releases

## File Structure

```
├── src/
│   ├── components/FilterPanel.tsx     # Uses generic names
│   ├── utils/deviceUtils.ts          # Uses generic names  
│   └── __tests__/                    # Tests use generic names
├── location-mapping.json             # IGNORED - Real location mapping
└── .gitignore                        # Excludes location-mapping.json
```

## Location Mappings

### Region Groups
- **Region A** → High Country
- **Region B** → High River  
- **Region C** → High River Area
- **District 1** → Okotoks
- **District 2** → Okotoks Area

### Individual Sites
- **Site 1A** → Big Rock
- **Site 1B** → Dr. Morris Gibson
- **Site 1C** → Okotoks Junior
- **Location A1** → C. Ian McLaren
- **Location B1** → Joe Clark
- etc.

## Security Measures

1. **`.gitignore`** - Excludes `location-mapping.json` and patterns
2. **`package.json`** - Electron-builder excludes location mapping from releases
3. **Source Code** - All hardcoded location names replaced with generic alternatives

## For Developers

- Use the `location-mapping.json` file (if available locally) to understand real location correspondence
- Never commit location mapping files to git
- Always use generic names in code, tests, and documentation
- When adding new locations, follow the established naming convention

## Adding New Locations

When adding new locations:

1. **Choose Generic Name**: Follow pattern (Region X, District X, Site XY, Location XY)
2. **Update Source Code**: Use only generic name in all code
3. **Update Mapping**: Add to local `location-mapping.json` (if it exists)
4. **Never Commit**: Ensure mapping file stays git-ignored

This system ensures complete privacy compliance while maintaining full application functionality.