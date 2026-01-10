# Delete k- images from Desktop
$desktop = [Environment]::GetFolderPath('Desktop')
Write-Host "Desktop path: $desktop"

$files = Get-ChildItem -Path $desktop -Filter 'k-*' | Where-Object {
    $_.Extension -match '\.(jpg|jpeg|png|gif|bmp|webp)$'
}

if ($files.Count -eq 0) {
    Write-Host "No k- images found on desktop"
} else {
    Write-Host "Found $($files.Count) files:"
    $files | ForEach-Object { Write-Host "  - $($_.Name)" }

    Write-Host "`nDeleting files..."
    $files | Remove-Item -Force
    Write-Host "Done!"
}
