import { Injectable } from '@angular/core';

/**
 * Service to compress image files on the client side before upload.
 * Uses canvas to resize and adjust JPEG quality.
 */
@Injectable({
  providedIn: 'root',
})
export class ImageCompressionService {
  /**
   * Compress an image file.
   * @param file Original image file.
   * @param maxWidth Maximum width in pixels.
   * @param maxHeight Maximum height in pixels.
   * @param quality JPEG quality between 0 and 1.
   * @returns Promise that resolves to a compressed JPEG File.
   */
  compress(file: File, maxWidth = 300, maxHeight = 300, quality = 0.65): Promise<File> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Maintain aspect ratio while fitting within max dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  resolve(file);
                }
              },
              'image/jpeg',
              quality
            );
          } else {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }
}
