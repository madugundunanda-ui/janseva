import { Injectable } from '@angular/core';
import Compressor from 'compressorjs';

/**
 * Service to compress image files on the client side before upload.
 * Uses CompressorJS to resize and adjust quality.
 */
@Injectable({
  providedIn: 'root',
})
export class ImageCompressionService {
  /**
   * Compress an image file.
   * @param file Original image file.
   * @param maxWidth Maximum width in pixels (default 1024).
   * @param maxHeight Maximum height in pixels (default 1024).
   * @param quality Quality between 0 and 1 (default 0.72).
   * @returns Promise that resolves to a compressed File.
   */
  compress(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.72): Promise<File> {
    return new Promise((resolve) => {
      // Create compressorjs instance using safe fallback for ES module import
      const CompressorClass = (Compressor as any).default || Compressor;
      
      if (!CompressorClass || typeof CompressorClass !== 'function') {
        console.error('[ImageCompression] CompressorJS constructor not found or is not a function, using original file');
        resolve(file);
        return;
      }

      try {
        new CompressorClass(file, {
          quality: quality,
          maxWidth: maxWidth,
          maxHeight: maxHeight,
          mimeType: 'image/jpeg',
          success(result: any) {
            const compressedFile = new File([result], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          error(err: any) {
            console.error('[ImageCompression] CompressorJS failed, returning original file:', err);
            resolve(file); // Fallback to original file in case of failure
          },
        });
      } catch (err) {
        console.error('[ImageCompression] Error instantiating CompressorJS, returning original file:', err);
        resolve(file); // Fallback to original file in case of exception
      }
    });
  }
}

