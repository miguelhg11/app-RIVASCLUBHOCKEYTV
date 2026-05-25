Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("C:\Users\migue\Documents\--PROYECTOS IA--\WEB PROGRAMA DIRECTOS RIVAS TV\rivas_youtube_live_handoff\MINIATURAS YOUTUBE-APP\ejemplo-relleno.jpg")
$bmp = New-Object System.Drawing.Bitmap($img)

Write-Output "Sampling yellow pixels coordinates..."
$count = 0
for ($x = 0; $x -lt $bmp.Width; $x += 2) {
    for ($y = 0; $y -lt $bmp.Height; $y += 2) {
        $p = $bmp.GetPixel($x, $y)
        if ($p.R -gt 200 -and $p.G -gt 180 -and $p.B -lt 100) {
            $count++
            if ($count -le 20) {
                Write-Output "Yellow at ($x, $y) -> R:$($p.R) G:$($p.G) B:$($p.B)"
            }
        }
    }
}
Write-Output "Total yellow: $count"

$bmp.Dispose()
$img.Dispose()
