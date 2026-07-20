#requires -version 5.1

<#
.SYNOPSIS
Generates images/thumbs/ on Windows without third-party dependencies.

.DESCRIPTION
Uses the System.Drawing APIs included with Windows. Originals are opened
read-only. Transparent images remain PNG; opaque images become JPEG; and an
output is kept only when it is smaller than its original.
#>

[CmdletBinding()]
param(
    [ValidateRange(1, 10000)]
    [int]$MaxDimension = 640,

    [ValidateRange(1, 100)]
    [int]$JpegQuality = 82
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($env:OS -ne 'Windows_NT') {
    throw 'tools/make-thumbs.ps1 uses Windows System.Drawing. Run tools/make-thumbs.sh on macOS.'
}

Add-Type -AssemblyName System.Drawing

$repoRoot = Split-Path -Parent $PSScriptRoot
$imagesDir = Join-Path $repoRoot 'images'
$thumbsDir = Join-Path $imagesDir 'thumbs'
[System.IO.Directory]::CreateDirectory($thumbsDir) | Out-Null

function Test-ImageHasAlpha {
    param([System.Drawing.Image]$Image)

    if ([System.Drawing.Image]::IsAlphaPixelFormat($Image.PixelFormat)) {
        return $true
    }

    $alphaFlags = [int][System.Drawing.Imaging.ImageFlags]::HasAlpha -bor
        [int][System.Drawing.Imaging.ImageFlags]::HasTranslucent
    if (([int]$Image.Flags -band $alphaFlags) -ne 0) {
        return $true
    }

    $indexed = [int][System.Drawing.Imaging.PixelFormat]::Indexed
    if (([int]$Image.PixelFormat -band $indexed) -ne 0) {
        foreach ($color in $Image.Palette.Entries) {
            if ($color.A -lt 255) {
                return $true
            }
        }
    }

    return $false
}

function Save-ResizedImage {
    param(
        [string]$SourcePath,
        [string]$OutputPath,
        [int]$Width,
        [int]$Height,
        [bool]$KeepAlpha
    )

    $source = [System.Drawing.Image]::FromFile($SourcePath)
    try {
        if ($KeepAlpha) {
            $pixelFormat = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
        } else {
            $pixelFormat = [System.Drawing.Imaging.PixelFormat]::Format24bppRgb
        }

        $bitmap = [System.Drawing.Bitmap]::new($Width, $Height, $pixelFormat)
        try {
            if ($source.HorizontalResolution -gt 0 -and $source.VerticalResolution -gt 0) {
                $bitmap.SetResolution($source.HorizontalResolution, $source.VerticalResolution)
            }
            $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
            try {
                if ($KeepAlpha) {
                    $graphics.Clear([System.Drawing.Color]::Transparent)
                    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
                } else {
                    $graphics.Clear([System.Drawing.Color]::Black)
                    $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
                }
                $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

                $attributes = [System.Drawing.Imaging.ImageAttributes]::new()
                try {
                    $attributes.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
                    $destination = [System.Drawing.Rectangle]::new(0, 0, $Width, $Height)
                    $graphics.DrawImage(
                        $source,
                        $destination,
                        0,
                        0,
                        $source.Width,
                        $source.Height,
                        [System.Drawing.GraphicsUnit]::Pixel,
                        $attributes
                    )
                } finally {
                    $attributes.Dispose()
                }
            } finally {
                $graphics.Dispose()
            }

            if (Test-Path -LiteralPath $OutputPath) {
                Remove-Item -LiteralPath $OutputPath -Force
            }

            if ($KeepAlpha) {
                $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
            } else {
                $jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
                    Where-Object { $_.MimeType -eq 'image/jpeg' } |
                    Select-Object -First 1
                if ($null -eq $jpegCodec) {
                    throw 'Windows JPEG encoder is unavailable.'
                }

                $encoderParameters = [System.Drawing.Imaging.EncoderParameters]::new(1)
                try {
                    $qualityParameter = [System.Drawing.Imaging.EncoderParameter]::new(
                        [System.Drawing.Imaging.Encoder]::Quality,
                        [long]$JpegQuality
                    )
                    $encoderParameters.Param[0] = $qualityParameter
                    $bitmap.Save($OutputPath, $jpegCodec, $encoderParameters)
                } finally {
                    if ($null -ne $encoderParameters.Param[0]) {
                        $encoderParameters.Param[0].Dispose()
                    }
                    $encoderParameters.Dispose()
                }
            }
        } finally {
            $bitmap.Dispose()
        }
    } finally {
        $source.Dispose()
    }
}

$supportedExtensions = @('.png', '.jpg', '.jpeg')
$files = Get-ChildItem -LiteralPath $imagesDir -File |
    Where-Object {
        $supportedExtensions -contains $_.Extension.ToLowerInvariant() -and
        $_.Name -ine 'texture.png'
    } |
    Sort-Object @{ Expression = { $_.Name.ToLowerInvariant() } }, @{ Expression = { $_.Name } }

$manifestLines = [System.Collections.Generic.List[string]]::new()

foreach ($file in $files) {
    $image = [System.Drawing.Image]::FromFile($file.FullName)
    try {
        $width = $image.Width
        $height = $image.Height
        $hasAlpha = Test-ImageHasAlpha $image
    } finally {
        $image.Dispose()
    }

    $longSide = [Math]::Max($width, $height)
    $scale = [Math]::Min(1.0, $MaxDimension / [double]$longSide)
    $outputWidth = [Math]::Max(1, [int][Math]::Round($width * $scale))
    $outputHeight = [Math]::Max(1, [int][Math]::Round($height * $scale))
    $outputExtension = if ($hasAlpha) { '.png' } else { '.jpg' }
    $outputName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name) + $outputExtension
    $outputPath = Join-Path $thumbsDir $outputName

    $needsGeneration = -not (Test-Path -LiteralPath $outputPath)
    if (-not $needsGeneration) {
        $outputInfo = Get-Item -LiteralPath $outputPath
        $needsGeneration = $file.LastWriteTimeUtc -gt $outputInfo.LastWriteTimeUtc
    }

    if ($needsGeneration) {
        if ($hasAlpha -and $longSide -le $MaxDimension) {
            Copy-Item -LiteralPath $file.FullName -Destination $outputPath -Force
        } else {
            Save-ResizedImage `
                -SourcePath $file.FullName `
                -OutputPath $outputPath `
                -Width $outputWidth `
                -Height $outputHeight `
                -KeepAlpha $hasAlpha
        }

        $outputBytes = (Get-Item -LiteralPath $outputPath).Length
        Write-Output ("  made images/thumbs/{0} ({1} bytes from {2} bytes)" -f
            $outputName, $outputBytes, $file.Length)
    }

    $outputInfo = Get-Item -LiteralPath $outputPath
    if ($outputInfo.Length -ge $file.Length) {
        Remove-Item -LiteralPath $outputPath -Force
        Write-Output ("  skipped {0} - original is already small" -f $file.Name)
        continue
    }

    $sourceJson = ConvertTo-Json -InputObject $file.Name -Compress
    $outputJson = ConvertTo-Json -InputObject $outputName -Compress
    $manifestLines.Add(("  {0}: {1}," -f $sourceJson, $outputJson))
}

$manifest = @(
    '/* GENERATED by tools/make-thumbs.* - do not edit by hand. */'
    'window.THUMBS = {'
) + $manifestLines.ToArray() + @(
    '};'
    ''
)

$manifestPath = Join-Path $thumbsDir 'index.js'
$utf8WithoutBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllText($manifestPath, ($manifest -join "`n"), $utf8WithoutBom)

Write-Output ("wrote images/thumbs/index.js ({0} entries)" -f $manifestLines.Count)
