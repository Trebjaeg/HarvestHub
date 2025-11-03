/**
 * Robust Image Upload Utility
 * Handles image compression, format conversion, EXIF orientation, and upload with retry logic
 */

// Supported image formats - be very permissive for mobile devices
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/img',  // Added support for .img files
  'application/octet-stream', // Mobile devices sometimes send this
  '', // Some mobile devices don't send MIME type
  'image/pjpeg', // Progressive JPEG
  'image/x-png', // Alternative PNG MIME type
];

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
export const COMPRESSION_THRESHOLD = 5 * 1024 * 1024; // Compress if > 5 MB

export interface UploadProgress {
  progress: number;
  status: 'idle' | 'compressing' | 'converting' | 'uploading' | 'success' | 'error';
  error?: string;
}

/**
 * Convert HEIC/HEIF to JPEG
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    // Dynamic import to avoid SSR issues
    const heic2any = (await import('heic2any')).default;
    
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9
    });

    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    return new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
      type: 'image/jpeg'
    });
  } catch (error) {
    console.error('HEIC conversion failed:', error);
    throw new Error('Failed to convert HEIC image. Please try a different format.');
  }
}

/**
 * Compress image if it's too large
 */
async function compressImage(file: File, maxSizeMB: number = 5): Promise<File> {
  try {
    // Dynamic import to avoid SSR issues
    const imageCompression = (await import('browser-image-compression')).default;

    const options = {
      maxSizeMB,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
      preserveExif: true, // Preserve EXIF orientation
      fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp'
    };

    const compressedFile = await imageCompression(file, options);
    console.log('Image compressed:', {
      original: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      compressed: (compressedFile.size / 1024 / 1024).toFixed(2) + ' MB'
    });

    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original file if compression fails
    return file;
  }
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check if file exists
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file type - be very permissive for mobile uploads
  const fileName = file.name?.toLowerCase() || '';
  const fileType = file.type?.toLowerCase() || '';
  
  // Check if it looks like an image by extension
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.img', '.jfif', '.pjpeg', '.pjp'];
  const hasImageExtension = imageExtensions.some(ext => fileName.endsWith(ext));
  
  // Check if MIME type suggests it's an image
  const hasImageMimeType = SUPPORTED_IMAGE_TYPES.includes(fileType) || fileType.startsWith('image/');
  
  // Accept if either extension looks like image OR MIME type suggests image
  if (!hasImageExtension && !hasImageMimeType) {
    return { 
      valid: false, 
      error: `File type not supported. Please upload JPEG, PNG, WEBP, HEIC, or IMG images.` 
    };
  }

  // Check file size (50 MB limit)
  if (file.size > MAX_FILE_SIZE) {
    return { 
      valid: false, 
      error: `File too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB.` 
    };
  }

  return { valid: true };
}

/**
 * Prepare image for upload (convert HEIC, compress if needed)
 */
export async function prepareImageForUpload(
  file: File,
  onProgress: (progress: UploadProgress) => void
): Promise<File> {
  let processedFile = file;

  try {
    // Convert HEIC/HEIF to JPEG
    if (file.type === 'image/heic' || file.type === 'image/heif') {
      onProgress({ progress: 10, status: 'converting' });
      processedFile = await convertHeicToJpeg(file);
      onProgress({ progress: 30, status: 'converting' });
    }

    // Compress if file is too large (> 5 MB)
    if (processedFile.size > COMPRESSION_THRESHOLD) {
      onProgress({ progress: 40, status: 'compressing' });
      processedFile = await compressImage(processedFile, 5);
      onProgress({ progress: 60, status: 'compressing' });
    }

    return processedFile;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to prepare image');
  }
}

/**
 * Upload image with retry logic and progress tracking
 */
export async function uploadImageWithRetry(
  file: File,
  endpoint: string,
  onProgress: (progress: UploadProgress) => void,
  maxRetries: number = 3
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      onProgress({ progress: 70 + (attempt - 1) * 10, status: 'uploading' });

      const formData = new FormData();
      formData.append('profileImage', file);

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      // Handle specific HTTP errors
      if (response.status === 413) {
        return { 
          success: false, 
          error: 'File too large. Maximum size is 50 MB.' 
        };
      }

      if (response.status === 415) {
        return { 
          success: false, 
          error: 'File type not allowed. Please upload JPEG, PNG, or WEBP images.' 
        };
      }

      if (response.status === 401) {
        return { 
          success: false, 
          error: 'Session expired. Please log in again.' 
        };
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.imageUrl) {
        onProgress({ progress: 100, status: 'success' });
        return { success: true, imageUrl: data.imageUrl };
      } else {
        throw new Error(data.message || 'Upload failed - no image URL returned');
      }

    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Upload attempt ${attempt} failed:`, lastError);

      // Check if it's a network error that we should retry
      const isNetworkError = 
        lastError.message.includes('fetch') ||
        lastError.message.includes('network') ||
        lastError.message.includes('timeout');

      // Don't retry on client-side errors, only network/server errors
      if (!isNetworkError && attempt < maxRetries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // All retries failed
  const errorMessage = lastError?.message || 'Upload failed after multiple attempts';
  onProgress({ progress: 0, status: 'error', error: errorMessage });
  
  return { 
    success: false, 
    error: errorMessage.includes('Network') 
      ? 'Network error. Please check your connection and try again.'
      : errorMessage
  };
}

/**
 * Main upload function with full pipeline
 */
export async function uploadProfileImage(
  file: File,
  onProgress: (progress: UploadProgress) => void
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    // Validate file
    onProgress({ progress: 0, status: 'idle' });
    
    const validation = validateImageFile(file);
    if (!validation.valid) {
      onProgress({ progress: 0, status: 'error', error: validation.error });
      return { success: false, error: validation.error };
    }

    // Prepare image (convert HEIC, compress)
    const processedFile = await prepareImageForUpload(file, onProgress);

    // Upload with retry logic
    const result = await uploadImageWithRetry(
      processedFile,
      '/api/buyer/upload-profile-image',
      onProgress,
      3 // Max 3 retries
    );

    return result;

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
    onProgress({ progress: 0, status: 'error', error: errorMessage });
    return { success: false, error: errorMessage };
  }
}
