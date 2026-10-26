$pythonPath = "C:\Users\moizs\.gemini\antigravity\scratch\ai-vs-asli\.venv\Scripts\python.exe"
$appPath = "C:\Users\moizs\.gemini\antigravity\scratch\ai-vs-asli\server_runner.py"
$workDir = "C:\Users\moizs\.gemini\antigravity\scratch\ai-vs-asli"
$cmd = "`"$pythonPath`" `"$appPath`""

# Check for existing port 5000 listeners and kill them cleanly
$existing = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($existing) {
    foreach ($pidToKill in $existing) {
        if ($pidToKill -gt 0) {
            Write-Output "Stopping existing PID $pidToKill on port 5000..."
            Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
}

# Launch completely detached via WMI so it persists independently of the agent session
$res = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = $cmd
    CurrentDirectory = $workDir
}

Write-Output "Spawned ProcessId: $($res.ProcessId), ReturnValue: $($res.ReturnValue)"
Start-Sleep -Seconds 3

# Test connectivity with retries
$connected = $false
for ($i = 0; $i -lt 5; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:5000" -UseBasicParsing -TimeoutSec 3
        if ($resp.StatusCode -eq 200) {
            Write-Output "Status: 200 OK (Successfully verified!)"
            $connected = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $connected) {
    Write-Output "Warning: Could not connect within 5 attempts."
}
