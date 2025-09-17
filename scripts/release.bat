@echo off
setlocal enabledelayedexpansion

set VERSION=%1
if "%VERSION%"=="" set VERSION=1.0.0
set TAG=v%VERSION%

echo 🚀 Creating release %TAG%...

REM Build the project
echo 📦 Building project...
call npm run build
if errorlevel 1 (
    echo ❌ Build failed
    exit /b 1
)

REM Create release directory
set RELEASE_DIR=release-%VERSION%
if exist "%RELEASE_DIR%" rmdir /s /q "%RELEASE_DIR%"
mkdir "%RELEASE_DIR%"

REM Copy built files
echo 📋 Copying release files...
xcopy /E /I dist "%RELEASE_DIR%\dist"
copy package.json "%RELEASE_DIR%\"
copy README.md "%RELEASE_DIR%\"
if exist .env.example copy .env.example "%RELEASE_DIR%\"

REM Create release archive
echo 🗜️ Creating release archive...
powershell Compress-Archive -Path "%RELEASE_DIR%\*" -DestinationPath "mcp-amadeusflights-%TAG%.zip"

REM Create GitHub release
echo 🏷️ Creating GitHub release...
gh release create %TAG% --title "MCP Amadeus Flights Server %TAG%" --notes-file release-notes.md mcp-amadeusflights-%TAG%.zip

if errorlevel 1 (
    echo ❌ GitHub release creation failed
    exit /b 1
)

echo ✅ Release created successfully!
echo 🔗 View release: https://github.com/pratikjadhav2726/mcp-amadeusflights/releases/tag/%TAG%

REM Cleanup
rmdir /s /q "%RELEASE_DIR%"
