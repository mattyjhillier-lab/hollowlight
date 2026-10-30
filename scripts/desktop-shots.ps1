# Wrapper: run phone-shots.mjs to a temp dir, then re-encode PNG -> JPEG (q70) into docs/screenshots/desktop-build (keeps the repo small).
# Usage: powershell -File scripts/desktop-shots.ps1 <prefix> <sizes> <screens>
param([string]$Prefix, [string]$Sizes, [string]$Screens)
$root = Split-Path $PSScriptRoot -Parent
$tmp = Join-Path $env:TEMP ("dshots-" + [guid]::NewGuid().ToString('N'))
$out = Join-Path $root 'docs/screenshots/desktop-build'
New-Item -ItemType Directory -Force $tmp, $out | Out-Null
& node (Join-Path $root 'scripts/phone-shots.mjs') $tmp $Prefix $Sizes $Screens
Add-Type -AssemblyName System.Drawing
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]70)
Get-ChildItem "$tmp\*.png" | ForEach-Object {
  $img = [System.Drawing.Image]::FromFile($_.FullName)
  $img.Save((Join-Path $out ($_.BaseName + '.jpg')), $codec, $ep); $img.Dispose()
}
Remove-Item $tmp -Recurse -Force
