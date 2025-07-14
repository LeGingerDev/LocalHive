# Camera Service Documentation

## Overview

The Camera Service provides a centralized way to handle camera functionality, gallery access, and image compression in the LocalHive app. It uses Expo's camera packages and follows the service layer pattern.

## Installed Packages

- `expo-camera`: For camera access and permissions
- `expo-image-picker`: For gallery access and image selection
- `expo-image-manipulator`: For image compression and manipulation

## Usage

### Basic Usage with Hook

```typescript
import { useCamera } from '../hooks/useCamera'

function MyComponent() {
  const {
    isTakingPhoto,
    isPickingFromGallery,
    lastImage,
    error,
    takePhoto,
    pickFromGallery,
    compressImage,
    clearError,
  } = useCamera()

  const handleTakePhoto = async () => {
    const result = await takePhoto({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })
    
    if (result) {
      console.log('Photo taken:', result.uri)
    }
  }

  const handlePickFromGallery = async () => {
    const result = await pickFromGallery({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })
    
    if (result) {
      console.log('Image picked:', result.uri)
    }
  }

  const handleCompressImage = async () => {
    if (lastImage) {
      const compressed = await compressImage(lastImage.uri, 0.5, 800, 600)
      if (compressed) {
        console.log('Compressed size:', compressed.compressedSize)
      }
    }
  }

  return (
    <View>
      <Button onPress={handleTakePhoto} disabled={isTakingPhoto} />
      <Button onPress={handlePickFromGallery} disabled={isPickingFromGallery} />
      <Button onPress={handleCompressImage} disabled={!lastImage} />
      
      {error && <Text>Error: {error}</Text>}
      {lastImage && <Image source={{ uri: lastImage.uri }} />}
    </View>
  )
}
```

### Direct Service Usage

```typescript
import { cameraService } from '../services/cameraService'

// Check permissions
const hasCameraPermission = await cameraService.hasCameraPermission()
const hasGalleryPermission = await cameraService.hasMediaLibraryPermission()

// Request permissions
const cameraGranted = await cameraService.requestCameraPermission()
const galleryGranted = await cameraService.requestMediaLibraryPermission()

// Take photo
const photo = await cameraService.takePhoto({
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
})

// Pick from gallery
const image = await cameraService.pickFromGallery({
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
})

// Compress image
const compressed = await cameraService.compressImage(
  imageUri,
  0.7, // quality
  1024, // maxWidth
  1024  // maxHeight
)

// Convert to base64
const base64 = await cameraService.imageToBase64(imageUri)
```

## API Reference

### CameraService Methods

#### `requestCameraPermission(): Promise<boolean>`
Requests camera permission from the user.

#### `requestMediaLibraryPermission(): Promise<boolean>`
Requests media library permission from the user.

#### `hasCameraPermission(): Promise<boolean>`
Checks if camera permission is granted.

#### `hasMediaLibraryPermission(): Promise<boolean>`
Checks if media library permission is granted.

#### `takePhoto(options?: ImagePickerOptions): Promise<ImageResult | null>`
Opens camera to take a photo.

#### `pickFromGallery(options?: ImagePickerOptions): Promise<ImageResult | null>`
Opens gallery to pick an image.

#### `compressImage(imageUri: string, quality?: number, maxWidth?: number, maxHeight?: number): Promise<CompressedImageResult>`
Compresses an image to reduce file size.

#### `imageToBase64(imageUri: string): Promise<string>`
Converts an image to base64 string.

#### `getAvailableCameraTypes(): Promise<CameraType[]>`
Returns available camera types on the device.

### Types

#### `ImageResult`
```typescript
interface ImageResult {
  uri: string
  width: number
  height: number
  type: string
  size?: number
}
```

#### `CompressedImageResult`
```typescript
interface CompressedImageResult extends ImageResult {
  compressedUri: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
}
```

### useCamera Hook

The hook provides state management and error handling for camera operations:

#### State
- `isTakingPhoto: boolean`
- `isPickingFromGallery: boolean`
- `isCompressing: boolean`
- `lastImage: ImageResult | null`
- `lastCompressedImage: CompressedImageResult | null`
- `error: string | null`

#### Actions
- `takePhoto(options?: any): Promise<ImageResult | null>`
- `pickFromGallery(options?: any): Promise<ImageResult | null>`
- `compressImage(imageUri: string, quality?: number, maxWidth?: number, maxHeight?: number): Promise<CompressedImageResult | null>`
- `clearError(): void`
- `clearLastImage(): void`

## Best Practices

1. **Always check permissions** before attempting to use camera or gallery
2. **Handle errors gracefully** - the service throws errors for permission issues
3. **Compress images** before uploading to reduce bandwidth and storage costs
4. **Use the hook** for components that need camera functionality - it provides better state management
5. **Clear sensitive data** when done with images to free up memory

## Example Component

See `app/components/CameraExample.tsx` for a complete example of how to use the camera functionality.

## Permissions

The following permissions are required:

### iOS (Info.plist)
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs access to camera to take photos of items.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>This app needs access to photo library to select item images.</string>
```

### Android (AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

These permissions are automatically added by the Expo packages when you build the app. 