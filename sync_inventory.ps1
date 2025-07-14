# Sync Inventory Script: Downloads from Azure and processes unique device files
param(
    [string]$storageAccountName = $env:AZURE_STORAGE_ACCOUNT_NAME,
    [string]$containerName = $env:AZURE_STORAGE_CONTAINER_NAME,
    [string]$storageKey = $env:AZURE_STORAGE_KEY
)

try {
    # Validate required environment variables
    if (-not $storageAccountName) { throw "AZURE_STORAGE_ACCOUNT_NAME environment variable is required" }
    if (-not $containerName) { throw "AZURE_STORAGE_CONTAINER_NAME environment variable is required" }
    if (-not $storageKey) { throw "AZURE_STORAGE_KEY environment variable is required" }

    # Get the script's directory path
    $scriptPath = $PSScriptRoot
    if (!$scriptPath) {
        $scriptPath = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
    }

    # Create timestamped download folder
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $downloadsBaseDir = Join-Path -Path $scriptPath -ChildPath "data\downloads"
    $downloadPath = Join-Path -Path $downloadsBaseDir -ChildPath $timestamp
    if (-not (Test-Path -Path $downloadsBaseDir)) {
        New-Item -ItemType Directory -Path $downloadsBaseDir -Force | Out-Null
    }
    New-Item -ItemType Directory -Path $downloadPath -Force | Out-Null

    Write-Host "Downloading inventory files to: $downloadPath"

    # Install Az.Storage if needed
    if (!(Get-Module -ListAvailable -Name Az.Storage)) {
        Write-Warning "Az.Storage module not found. Attempting to install..."
        Install-Module -Name Az.Storage -Force -AllowClobber -Scope CurrentUser -Repository PSGallery
    }
    Import-Module Az.Storage

    # Download blobs from Azure
    $ctx = New-AzStorageContext -StorageAccountName $storageAccountName -StorageAccountKey $storageKey
    $blobs = Get-AzStorageBlob -Container $containerName -Context $ctx
    foreach ($blob in $blobs) {
        $dest = Join-Path $downloadPath $blob.Name
        Get-AzStorageBlobContent -Blob $blob.Name -Container $containerName -Context $ctx -Destination $dest -Force | Out-Null
    }

    # Create timestamped unique folder
    $uniqueBaseDir = Join-Path -Path $scriptPath -ChildPath "data\unique"
    $uniquePath = Join-Path -Path $uniqueBaseDir -ChildPath $timestamp
    if (-not (Test-Path -Path $uniqueBaseDir)) {
        New-Item -ItemType Directory -Path $uniqueBaseDir -Force | Out-Null
    }
    New-Item -ItemType Directory -Path $uniquePath -Force | Out-Null

    Write-Host "Processing unique files to: $uniquePath"

    # Get all JSON files and group by device ID
    Get-ChildItem -Path $downloadPath -Filter *.json | Group-Object { ($_.Name -split '_')[0] } | ForEach-Object {
        $latestFile = $_.Group | Sort-Object -Property Name -Descending | Select-Object -First 1
        Copy-Item -Path $latestFile.FullName -Destination $uniquePath -Force
    }

    # Update index.json in unique folder
    Write-Host "Unique base directory: $uniqueBaseDir"
    $dates = Get-ChildItem -Path $uniqueBaseDir -Directory | Select-Object -ExpandProperty Name | Sort-Object -Descending
    Write-Host "Export folders found: $($dates -join ', ')"
    $indexFile = Join-Path -Path $uniqueBaseDir -ChildPath "index.json"
    $dates | ConvertTo-Json | Set-Content -Path $indexFile
    Write-Host "index.json created/updated at: $indexFile"

    Write-Host "
Sync complete. Unique files are in: $uniquePath"
    Write-Host "Updated index of available dates in: $indexFile"
} catch {
    Write-Error "An error occurred during the sync process: $($_.Exception.Message)"
    # Exit with a non-zero status code to indicate failure
    exit 1
}