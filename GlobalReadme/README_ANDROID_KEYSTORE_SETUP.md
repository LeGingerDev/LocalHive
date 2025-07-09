# Android Keystore Setup Guide

This document provides a quick reference for setting up Android keystores for React Native/Expo projects on Windows.

## Tools & Locations

### Java Installation
Java is required for generating keystores with the `keytool` utility.

**Java Location on this system:**
- JRE: `C:\Program Files\Java\jre1.8.0_431\`
- Keytool: `C:\Program Files\Java\jre1.8.0_431\bin\keytool.exe`

Java might also be found in:
- `C:\Program Files\Android\Android Studio\jre\`
- `C:\Program Files\Unity\Hub\Editor\[version]\Editor\Data\PlaybackEngines\AndroidPlayer\OpenJDK\`

### Chocolatey
Chocolatey is a package manager for Windows that can be used to install Java and other tools.

**Installation:**
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

**Installing Java with Chocolatey:**
```powershell
choco install openjdk11 -y
```

## Generating a Keystore

### Command to Generate Keystore
```powershell
& "C:\Program Files\Java\jre1.8.0_431\bin\keytool.exe" -genkeypair -v -keystore android/keystores/upload-keystore.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android -dname "CN=YourAppName, OU=Your Team, O=Your Organization, L=Your City, S=Your State, C=US"
```

### Keystore Directory Structure
```
your-project/
├── android/
│   └── keystores/
│       └── upload-keystore.jks
├── credentials.json
└── eas.json
```

## EAS Build Configuration

### credentials.json
```json
{
  "android": {
    "keystore": {
      "keystorePath": "android/keystores/upload-keystore.jks",
      "keystorePassword": "android",
      "keyAlias": "upload",
      "keyPassword": "android"
    }
  }
}
```

### eas.json
```json
{
  "cli": {
    "version": ">= 3.15.1",
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "credentialsSource": "local"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle",
        "credentialsSource": "local"
      }
    }
  }
}
```

## Building with EAS

```bash
# Create a preview build (APK)
eas build --platform android --profile preview

# Create a production build (AAB)
eas build --platform android --profile production
```

## Troubleshooting

1. **Java not found**: Check Unity installations, Android Studio, or install OpenJDK
2. **Keytool errors**: Make sure the directory exists before running keytool
3. **EAS Build errors**: Verify credentials.json is in the root directory and paths are correct
4. **Permission errors with Chocolatey**: Run PowerShell as Administrator

## For Future Projects

1. Always check for Java first: `where java` or search in Program Files
2. Create the android/keystores directory before generating a keystore
3. Use the same keystore for development and production to avoid signing conflicts
4. Keep your keystore file secure - it's required to update your app in the future 