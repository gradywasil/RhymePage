param(
    [string]$PasswordFile,
    [string]$Keystore = "$env:LOCALAPPDATA\RhymePage\signing\rhymepage-upload.p12",
    [string]$KeyAlias = 'rhymepage-upload',
    [switch]$CreateKey
)

$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$Keystore = [IO.Path]::GetFullPath($Keystore)
if ($Keystore.StartsWith($projectRoot + '\', [StringComparison]::OrdinalIgnoreCase)) {
    throw 'Keep the private upload keystore outside the checkout.'
}
$names = @('JAVA_HOME', 'ANDROID_HOME', 'RHYMEPAGE_UPLOAD_KEYSTORE', 'RHYMEPAGE_UPLOAD_STORE_PASSWORD', 'RHYMEPAGE_UPLOAD_KEY_ALIAS', 'RHYMEPAGE_UPLOAD_KEY_PASSWORD')
$previous = @{}
foreach ($name in $names) { $previous[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }
$previousLocation = Get-Location
$securePassword = $null
try {
    Set-Location -LiteralPath $projectRoot
    if (!$env:JAVA_HOME) { $env:JAVA_HOME = "$env:LOCALAPPDATA\RhymePage\toolchains\jdk-21.0.12.1+1" }
    if (!$env:ANDROID_HOME) { $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk" }
    $keytool = Join-Path $env:JAVA_HOME 'bin\keytool.exe'
    if (!(Test-Path -LiteralPath $keytool)) { throw 'Set JAVA_HOME to an installed JDK 21 before building.' }
    if ($PasswordFile) {
        $uploadPassword = (Get-Content -Raw -LiteralPath $PasswordFile).TrimEnd([char[]]"`r`n")
    } else {
        $securePassword = Read-Host 'Upload keystore password (save it in your password manager)' -AsSecureString
        $uploadPassword = [Net.NetworkCredential]::new('', $securePassword).Password
    }
    if ($uploadPassword.Length -lt 6 -or $uploadPassword.Contains("`n") -or $uploadPassword.Contains("`r")) {
        throw 'The upload password must be a single line with at least six characters.'
    }
    $env:RHYMEPAGE_UPLOAD_KEYSTORE = $Keystore
    $env:RHYMEPAGE_UPLOAD_STORE_PASSWORD = $uploadPassword
    $env:RHYMEPAGE_UPLOAD_KEY_ALIAS = $KeyAlias
    $env:RHYMEPAGE_UPLOAD_KEY_PASSWORD = $uploadPassword
    if (!(Test-Path -LiteralPath $Keystore)) {
        if (!$CreateKey) { throw 'Keystore not found. Restore your existing key, or use -CreateKey only for a new upload identity.' }
        $directory = Split-Path -Parent $Keystore
        if (!(Test-Path -LiteralPath $directory)) {
            New-Item -ItemType Directory -Path $directory | Out-Null
            $owner = [Security.Principal.WindowsIdentity]::GetCurrent().Name
            & icacls.exe $directory /inheritance:r /grant:r "${owner}:(OI)(CI)F" '*S-1-5-18:(OI)(CI)F' | Out-Null
            if ($LASTEXITCODE -ne 0) { throw 'Could not restrict upload-key directory access.' }
        }
        & $keytool -genkeypair -keystore $Keystore -storetype PKCS12 -alias $KeyAlias -keyalg RSA -keysize 3072 -sigalg SHA256withRSA -validity 10000 -dname 'CN=RhymePage Upload, O=RhymePage' -storepass:env RHYMEPAGE_UPLOAD_STORE_PASSWORD -keypass:env RHYMEPAGE_UPLOAD_KEY_PASSWORD
        if ($LASTEXITCODE -ne 0) { throw 'Upload-key creation failed.' }
    }
    & $keytool -exportcert -rfc -keystore $Keystore -alias $KeyAlias -storepass:env RHYMEPAGE_UPLOAD_STORE_PASSWORD -file 'docs/android/rhymepage-upload-certificate.pem'
    if ($LASTEXITCODE -ne 0) { throw 'Could not open the upload key. Check the password and alias.' }
    & npm.cmd run android:bundle
    if ($LASTEXITCODE -ne 0) { throw 'Android bundle build failed.' }
    # Put the JAR manifest first so both Java archive readers verify the same entries.
    $uploadBundle = 'android/app/build/outputs/bundle/release/rhymepage-upload.aab'
    $jarsigner = Join-Path $env:JAVA_HOME 'bin\jarsigner.exe'
    & $jarsigner -keystore $Keystore -storepass:env RHYMEPAGE_UPLOAD_STORE_PASSWORD -keypass:env RHYMEPAGE_UPLOAD_KEY_PASSWORD -sigalg SHA256withRSA -digestalg SHA-256 -signedjar $uploadBundle 'android/app/build/outputs/bundle/release/app-release.aab' $KeyAlias
    if ($LASTEXITCODE -ne 0) { throw 'Upload bundle signing failed.' }
    $verification = & $jarsigner -verify $uploadBundle
    if ($LASTEXITCODE -ne 0 -or $verification -match 'internal inconsistencies|unsigned entries|jar is unsigned') {
        throw 'Upload bundle signature verification failed.'
    }
    Write-Output "Signed upload bundle: $uploadBundle"
} finally {
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $previous[$name], 'Process') }
    $uploadPassword = $null
    if ($securePassword) { $securePassword.Dispose() }
    Set-Location -LiteralPath $previousLocation
}
