# Find and delete K-041 files
$desktop = [Environment]::GetFolderPath('Desktop')

Write-Host "Desktop: $desktop"

$allFiles = Get-ChildItem -Path $desktop -File -Recurse -ErrorAction SilentlyContinue

# Find files containing K-041
$kFiles = $allFiles | Where-Object { $_.Name -like '*K-041*' -or $_.Name -like '*k-041*' }

Write-Host "Found $($kFiles.Count) file(s) matching 'K-041':"

if ($kFiles.Count -gt 0) {
    $kFiles | ForEach-Object {
        Write-Host "  $($_.FullName)"
    }

    Write-Host ""
    Write-Host "Deleting..."
    $kFiles | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "Deleted!"
} else {
    Write-Host "No K-041 files found."

    # Also check for any file with K- pattern
    $kDash = $allFiles | Where-Object { $_.Name -match '^K-' -or $_.Name -match '^k-' }
    if ($kDash.Count -gt 0) {
        Write-Host ""
        Write-Host "Files starting with K-:"
        $kDash | ForEach-Object { Write-Host "  $($_.Name)" }
    }
}
