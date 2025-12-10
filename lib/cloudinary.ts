// Cloudinary configuration for image uploads
// Add these to your .env.local:
// NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
// NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

export const cloudinaryConfig = {
  cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
};

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
}

export const openCloudinaryWidget = (
  onSuccess: (url: string) => void,
  onError?: (error: Error) => void
) => {
  if (typeof window === 'undefined') return;

  // @ts-ignore - Cloudinary widget is loaded via script
  if (!window.cloudinary) {
    console.error('Cloudinary widget not loaded');
    onError?.(new Error('Cloudinary widget not loaded'));
    return;
  }

  // @ts-ignore
  const widget = window.cloudinary.createUploadWidget(
    {
      cloudName: cloudinaryConfig.cloudName,
      uploadPreset: cloudinaryConfig.uploadPreset,
      sources: ['local', 'url', 'camera'],
      multiple: false,
      maxFiles: 1,
      clientAllowedFormats: ['png', 'jpg', 'jpeg', 'webp'],
      maxFileSize: 5000000, // 5MB
      folder: 'products',
      resourceType: 'image',
      cropping: true,
      croppingAspectRatio: 1,
      croppingShowDimensions: true,
      showSkipCropButton: false,
    },
    (error: Error | null, result: { event: string; info: CloudinaryUploadResult }) => {
      if (error) {
        console.error('Upload error:', error);
        onError?.(error);
        return;
      }

      if (result.event === 'success') {
        onSuccess(result.info.secure_url);
        widget.close();
      }
    }
  );

  widget.open();
};
