# Find and delete k- images from Desktop
$desktop = "C:\Users\ohyus\OneDrive\바탕 화면"

Write-Host "Checking: $desktop"
Write-Host ""

# Get ALL files first
$allFiles = Get-ChildItem -Path $desktop -File -ErrorAction SilentlyContinue

Write-Host "Total files found: $($allFiles.Count)"
Write-Host ""

# Filter for k- prefix (case insensitive)
$kFiles = $allFiles | Where-Object { $_.Name -match '^[kK]-' }

if ($kFiles.Count -eq 0) {
    Write-Host "No files starting with 'k-' or 'K-' found."
    Write-Host ""
    Write-Host "Listing all files for reference:"
    $allFiles | ForEach-Object {
        Write-Host "  $($_.Name)"
    }
} else {
    Write-Host "Found $($kFiles.Count) file(s) starting with 'k-':"
    $kFiles | ForEach-Object {
        Write-Host "  $($_.FullName)"
    }

    Write-Host ""
    Write-Host "Deleting..."
    $kFiles | Remove-Item -Force -ErrorAction SilentlyContinue
    Write-Host "Done!"
}
