# List all files starting with k- or K- on Desktop
$desktop = [Environment]::GetFolderPath('Desktop')
Write-Host "Desktop path: $desktop"
Write-Host ""

# List all files starting with k- (case insensitive)
$files = Get-ChildItem -Path $desktop | Where-Object { $_.Name -like 'k-*' -or $_.Name -like 'K-*' }

if ($files.Count -eq 0) {
    Write-Host "No files starting with 'k-' found"
    Write-Host ""
    Write-Host "All files on desktop:"
    Get-ChildItem -Path $desktop | ForEach-Object { Write-Host "  $($_.Name)" }
} else {
    Write-Host "Files starting with 'k-':"
    $files | ForEach-Object {
        Write-Host "  $($_.Name) ($($_.Extension))"
    }
}
