$connections = Get-NetTCPConnection -LocalPort 3010 -ErrorAction SilentlyContinue
if ($connections) {
    $pids = $connections.OwningProcess | Select-Object -Unique
    foreach ($pidToKill in $pids) {
        Write-Host "Killing PID: $pidToKill"
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 1
