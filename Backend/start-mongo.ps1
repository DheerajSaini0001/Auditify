# start-mongo.ps1
# Launches MongoDB as a normal user process (no admin / no Windows service required).
# Use this each session when the MongoDB service is stopped and you can't start it
# (starting the service needs admin rights). Data persists in the dbpath below.

$mongod  = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"
$dataDir = "$env:USERPROFILE\mongodb-data\db"
$logPath = "$env:USERPROFILE\mongodb-data\mongod.log"
$port    = 27017

if (-not (Test-Path $mongod)) {
    Write-Host "mongod.exe not found at $mongod" -ForegroundColor Red
    exit 1
}

# Ensure the data directory exists
New-Item -ItemType Directory -Force -Path $dataDir | Out-Null

# Already running?
if (Get-Process -Name mongod -ErrorAction SilentlyContinue) {
    Write-Host "mongod is already running." -ForegroundColor Yellow
} else {
    Start-Process -FilePath $mongod `
        -ArgumentList "--dbpath `"$dataDir`"", "--port $port", "--logpath `"$logPath`"" `
        -WindowStyle Hidden
    Start-Sleep -Seconds 3
}

# Verify it's listening
$ok = (Test-NetConnection -ComputerName 127.0.0.1 -Port $port -WarningAction SilentlyContinue).TcpTestSucceeded
if ($ok) {
    Write-Host "MongoDB is up and listening on 127.0.0.1:$port" -ForegroundColor Green
    Write-Host "  dbpath: $dataDir"
    Write-Host "  log:    $logPath"
} else {
    Write-Host "MongoDB did not start. Check the log: $logPath" -ForegroundColor Red
    exit 1
}
