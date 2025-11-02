# Image Upload System Documentation

## Overview

This document describes the robust image upload system for HarvestHub profile pictures. The system supports large files (up to 50MB), multiple formats including HEIC, mobile camera capture, progress tracking, automatic compression, and retry logic.

## Features

### Frontend Features
- ✅ **Large File Support**: Up to 50MB file size
- ✅ **Multiple Formats**: JPEG, PNG, WEBP, HEIC/HEIF (auto-converted to JPEG)
- ✅ **Mobile Camera Support**: Direct camera capture with `capture="environment"` attribute
- ✅ **Progress Tracking**: Real-time upload progress with status messages
- ✅ **Client-Side Compression**: Automatic compression for files > 5MB
- ✅ **EXIF Orientation**: Preserves correct image orientation
- ✅ **Retry Logic**: Automatic retry on network errors (max 3 attempts)
- ✅ **Detailed Error Messages**: User-friendly error messages instead of generic failures
- ✅ **Preview**: Instant image preview before upload completes

### Backend Features
- ✅ **50MB Limit**: Configured at Next.js and Nginx levels
- ✅ **Type Validation**: Only allows image/jpeg, image/png, image/webp
- ✅ **Size Validation**: Returns HTTP 413 for oversized files
- ✅ **EXIF Auto-Rotation**: Preserves correct orientation using Sharp
- ✅ **Image Optimization**: Resize to 500x500px, 85% quality JPEG
- ✅ **Cloud Storage**: Upload to DigitalOcean Spaces with CDN
- ✅ **Atomic Updates**: Database update only after successful upload
- ✅ **Old Image Cleanup**: Automatically deletes previous profile pictures
- ✅ **Detailed Logging**: Server logs with [UPLOAD] prefix for debugging
- ✅ **Precise HTTP Codes**: 413 (too large), 415 (bad type), 401 (auth), 422 (processing error)

## Architecture

### Client-Side Flow

```
User Selects Image
    ↓
Validate File (type, size)
    ↓
Create Preview
    ↓
Convert HEIC → JPEG (if needed)
    ↓
Compress if > 5MB
    ↓
Upload with Retry Logic (max 3 attempts)
    ↓
Update UI with Result
```

### Server-Side Flow

```
Receive Multipart Form Data
    ↓
Authenticate User
    ↓
Validate Type & Size
    ↓
Process with Sharp (resize, rotate, optimize)
    ↓
Upload to DigitalOcean Spaces
    ↓
Delete Old Image
    ↓
Update User Record (atomic)
    ↓
Return Public CDN URL
```

## File Structure

### Core Files

```
lib/image-upload.ts                    # Client-side upload utility
app/api/buyer/upload-profile-image/    # Upload API endpoint
components/ui/EditBuyerProfileModal.tsx # Profile edit modal with upload
app/(buyerdashboard)/buyer-profile/page.tsx # Buyer profile page
next.config.ts                         # Next.js config with 50MB limit
nginx-harvesthubph.conf               # Nginx config with 50MB limit
```

## Configuration

### Next.js Configuration

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
  // ... other config
};
```

### Nginx Configuration

```nginx
# Increase client body size to 50MB
client_max_body_size 50M;

# Increase timeouts for large uploads
client_body_timeout 120s;
client_header_timeout 120s;
send_timeout 120s;

# Proxy timeouts
proxy_connect_timeout 120s;
proxy_send_timeout 120s;
proxy_read_timeout 120s;
```

### API Route Configuration

```typescript
// app/api/buyer/upload-profile-image/route.ts
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
```

## Usage

### In a React Component

```tsx
import { uploadProfileImage } from '@/lib/image-upload';

const handleImageUpload = async (file: File) => {
  const result = await uploadProfileImage(file, (progress) => {
    console.log(`${progress.status}: ${progress.progress}%`);
  });

  if (result.success) {
    console.log('Image URL:', result.imageUrl);
  } else {
    console.error('Error:', result.error);
  }
};
```

### HTML Input Element

```tsx
<input
  type="file"
  accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
  capture="environment"  // For mobile camera
  onChange={handleImageUpload}
/>
```

## Error Messages

The system provides user-friendly error messages:

| Error Code | Message |
|------------|---------|
| 400 | "No file provided" |
| 401 | "Session expired. Please log in again." |
| 413 | "File too large. Maximum size is 50 MB." |
| 415 | "File type not allowed. Please upload JPEG, PNG, or WEBP images." |
| 422 | "Failed to process image. Please try a different file." |
| 503 | "Failed to upload to storage. Please try again." |
| Network | "Network error. Please check your connection and try again." |

## Upload Progress States

```typescript
type UploadStatus = 
  | 'idle'        // Initial state
  | 'converting'  // Converting HEIC to JPEG
  | 'compressing' // Compressing large images
  | 'uploading'   // Uploading to server
  | 'success'     // Upload completed
  | 'error';      // Upload failed
```

## Dependencies

```json
{
  "browser-image-compression": "^2.0.2",
  "heic2any": "^0.0.4",
  "sharp": "^0.33.0"
}
```

## Installation

```bash
npm install browser-image-compression heic2any
```

## Testing

### Test Cases

1. **Small Image (< 5MB)**: Should upload without compression
2. **Large Image (> 5MB)**: Should compress before upload
3. **HEIC Image**: Should convert to JPEG
4. **Invalid Type**: Should reject with 415 error
5. **Oversized File (> 50MB)**: Should reject with 413 error
6. **Network Failure**: Should retry up to 3 times
7. **Mobile Camera**: Should work with camera capture
8. **Slow Connection**: Should show progress bar

### Manual Testing

```bash
# Start dev server
npm run dev

# Navigate to /buyer-profile
# Click camera icon on avatar
# Select or capture image
# Verify progress bar appears
# Verify upload completes successfully
```

## Performance Optimizations

1. **Client-Side Compression**: Reduces upload time for large images
2. **Dynamic Imports**: HEIC converter and compressor loaded only when needed
3. **CDN URLs**: Images served from DigitalOcean Spaces CDN
4. **Progressive Loading**: Preview shown immediately, upload in background
5. **Optimized Processing**: Sharp library for fast server-side processing

## Security Considerations

1. **Type Validation**: Only allows image types
2. **Size Limits**: Multiple layers (client, Next.js, Nginx)
3. **Authentication**: Requires valid session token
4. **Content-Type Check**: Validates MIME type
5. **Atomic Updates**: Database only updated after successful upload
6. **Old Image Cleanup**: Prevents storage bloat

## Troubleshooting

### Upload Fails with "Network Error"

- Check internet connection
- Verify DigitalOcean Spaces credentials in `.env.local`
- Check server logs for detailed error

### Upload Fails with "413 Payload Too Large"

- Verify Nginx `client_max_body_size` is set to 50M
- Check Next.js config has `sizeLimit: '50mb'`
- Restart Nginx: `sudo systemctl restart nginx`

### HEIC Conversion Fails

- Ensure `heic2any` package is installed
- Browser must support Blob API
- Check browser console for errors

### Image Quality Issues

- Adjust Sharp quality settings in API route
- Modify resize dimensions (currently 500x500)
- Change compression threshold (currently 5MB)

## Monitoring

### Server Logs

All upload operations are logged with `[UPLOAD]` prefix:

```
[UPLOAD] User 507f1f77bcf86cd799439011 starting profile image upload
[UPLOAD] File received: photo.jpg, size: 3.45MB, type: image/jpeg
[UPLOAD] Processing image...
[UPLOAD] Image processed. Original: 3450KB, Processed: 245KB
[UPLOAD] Uploading to storage: profile-507f1f77bcf86cd799439011-1699012345678.jpg
[UPLOAD] Upload successful: https://cdn.example.com/profile-pictures/...
[UPLOAD] User profile updated successfully
```

### Client Logs

```javascript
console.log('Upload progress:', {
  status: 'uploading',
  progress: 75
});
```

## Future Enhancements

- [ ] Support for GIF and SVG formats
- [ ] Multiple image uploads (gallery)
- [ ] Image cropping/editing before upload
- [ ] Background upload with service worker
- [ ] Upload queue for multiple files
- [ ] WebP conversion for better compression
- [ ] Face detection and auto-centering
- [ ] Upload resume on connection loss

## License

Internal use only - HarvestHub Platform
