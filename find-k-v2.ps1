# Find and delete k- images using environment path
$desktop = [Environment]::GetFolderPath('Desktop')

Write-Host "Desktop: $desktop"

if (-not (Test-Path $desktop)) {
    Write-Host "Desktop path not found!"
    exit 1
}

$allFiles = Get-ChildItem -Path $desktop -File

Write-Host "Files on desktop: $($allFiles.Count)"

$kFiles = $allFiles | Where-Object { $_.Name -match '^[kK]-' }

if ($kFiles.Count -gt 0) {
    Write-Host "Found k- files:"
    $kFiles | ForEach-Object { Write-Host "  $($_.Name)" }

    $kFiles | Remove-Item -Force
    Write-Host "Deleted!"
} else {
    Write-Host "No k- files found."
    Write-Host ""
    Write-Host "All files:"
    $allFiles | Select-Object -First 50 | ForEach-Object {
        Write-Host "  $($_.Name)"
    }
}
