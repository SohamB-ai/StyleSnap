Add-Type -AssemblyName System.Drawing

function Create-RoundedIcon {
    param(
        [string]$sourcePath,
        [string]$destPath,
        [int]$size,
        [float]$radiusRatio = 0.22
    )

    $srcImg = [System.Drawing.Image]::FromFile($sourcePath)
    $bmp = New-Object System.Drawing.Bitmap($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)

    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $radius = [int]($size * $radiusRatio)
    if ($radius -lt 2) { $radius = 2 }
    $d = $radius * 2

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(0, 0, $d, $d, 180, 90)
    $path.AddArc($size - $d, 0, $d, $d, 270, 90)
    $path.AddArc($size - $d, $size - $d, $d, $d, 0, 90)
    $path.AddArc(0, $size - $d, $d, $d, 90, 90)
    $path.CloseFigure()

    $g.SetClip($path)
    $g.DrawImage($srcImg, 0, 0, $size, $size)

    $g.Dispose()
    $srcImg.Dispose()

    $bmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Generated $destPath at $size"
}

Create-RoundedIcon "imp docs\stitch_icon_design.png" "public\icons\icon-16.png" 16 0.22
Create-RoundedIcon "imp docs\stitch_icon_design.png" "public\icons\icon-32.png" 32 0.22
Create-RoundedIcon "imp docs\stitch_icon_design.png" "public\icons\icon-48.png" 48 0.22
Create-RoundedIcon "imp docs\stitch_icon_design.png" "public\icons\icon-128.png" 128 0.22
Create-RoundedIcon "imp docs\stitch_icon_design.png" "public\stylesnap-logo.png" 256 0.22
