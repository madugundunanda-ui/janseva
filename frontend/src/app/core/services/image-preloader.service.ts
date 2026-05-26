import { Injectable, signal } from '@angular/core';

type LegacyPreloadArgs = [sequenceId: string, folderPath: string, frameCount: number, extension?: string];
type ModernPreloadArgs = [path: string, totalFrames: number, filePrefix?: string];
type PreloadArgs = LegacyPreloadArgs | ModernPreloadArgs;

@Injectable({
  providedIn: 'root',
})
export class ImagePreloaderService {
  readonly loadingProgress = signal(0);
  readonly isReady = signal(false);
  readonly isLoading = signal(false);

  private readonly frameCache = new Map<string, HTMLImageElement | HTMLCanvasElement>();
  private readonly pendingLoads = new Map<string, Promise<HTMLImageElement | HTMLCanvasElement>>();

  preloadSequence(path: string, totalFrames: number, filePrefix?: string): Promise<HTMLImageElement[]>;
  preloadSequence(
    sequenceId: string,
    folderPath: string,
    frameCount: number,
    extension?: string
  ): Promise<(HTMLImageElement | HTMLCanvasElement)[]>;
  async preloadSequence(...args: PreloadArgs): Promise<(HTMLImageElement | HTMLCanvasElement)[]> {
    const { basePath, totalFrames, filePrefix, extension } = this.normalizeArgs(args);

    this.beginLoad();

    if (!this.isBrowser()) {
      this.isReady.set(true);
      this.isLoading.set(false);
      return [];
    }

    const frames: (HTMLImageElement | HTMLCanvasElement)[] = new Array(totalFrames);
    const concurrency = Math.max(2, Math.min(8, this.getConcurrency()));
    let nextIndex = 0;
    let completed = 0;

    try {
      await Promise.all(
        Array.from({ length: Math.min(concurrency, totalFrames) }, async () => {
          while (true) {
            const index = nextIndex++;
            if (index >= totalFrames) break;

            const frameNumber = index + 1;
            const url = this.buildFrameUrl(basePath, frameNumber, filePrefix, extension);
            const frame = await this.loadFrame(url, frameNumber, totalFrames);

            frames[index] = frame;
            completed += 1;
            this.loadingProgress.set(Math.round((completed / totalFrames) * 100));

            await this.yieldToBrowser();
          }
        })
      );

      this.loadingProgress.set(100);
      this.isReady.set(true);
      return frames;
    } finally {
      this.isLoading.set(false);
    }
  }

  private normalizeArgs(args: PreloadArgs): {
    basePath: string;
    totalFrames: number;
    filePrefix: string;
    extension: string;
  } {
    if (typeof args[1] === 'number') {
      const [basePath, totalFrames, filePrefix = ''] = args as ModernPreloadArgs;
      return {
        basePath,
        totalFrames,
        filePrefix,
        extension: 'webp',
      };
    }

    const [, folderPath, frameCount, extension = 'webp'] = args as LegacyPreloadArgs;
    return {
      basePath: folderPath,
      totalFrames: frameCount,
      filePrefix: '',
      extension,
    };
  }

  private beginLoad(): void {
    this.isLoading.set(true);
    this.isReady.set(false);
    this.loadingProgress.set(0);
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof Image !== 'undefined';
  }

  private getConcurrency(): number {
    const hardware = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 4 : 4;
    return hardware > 1 ? Math.ceil(hardware / 2) : 2;
  }

  private buildFrameUrl(basePath: string, frameNumber: number, filePrefix: string, extension: string): string {
    const padded = String(frameNumber).padStart(4, '0');
    const prefix = filePrefix ? `${filePrefix}` : '';
    const ext = extension.startsWith('.') ? extension.slice(1) : extension;
    return `${basePath}/${prefix}${padded}.${ext}`;
  }

  private async loadFrame(
    url: string,
    frameNumber: number,
    totalFrames: number
  ): Promise<HTMLImageElement | HTMLCanvasElement> {
    const cached = this.frameCache.get(url);
    if (cached) {
      return cached;
    }

    const pending = this.pendingLoads.get(url);
    if (pending) {
      return pending;
    }

    const loadPromise = new Promise<HTMLImageElement | HTMLCanvasElement>((resolve) => {
      const img = new Image();
      img.decoding = 'async';

      if ('fetchPriority' in img) {
        (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = 'high';
      }

      img.onload = async () => {
        try {
          if (typeof img.decode === 'function') {
            await img.decode();
          }
        } catch {
          // If decode fails, the image still loaded, so we can safely continue.
        }

        this.frameCache.set(url, img);
        resolve(img);
      };

      img.onerror = () => {
        const fallback = this.createFallbackFrame(frameNumber, totalFrames);
        this.frameCache.set(url, fallback);
        resolve(fallback);
      };

      img.src = url;
    });

    this.pendingLoads.set(url, loadPromise);

    try {
      return await loadPromise;
    } finally {
      this.pendingLoads.delete(url);
    }
  }

  private async yieldToBrowser(): Promise<void> {
    if (typeof requestIdleCallback !== 'undefined') {
      await new Promise<void>((resolve) => {
        requestIdleCallback(() => resolve(), { timeout: 40 });
      });
      return;
    }

    await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }

  private createFallbackFrame(frameNumber: number, totalFrames: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return canvas;
    }

    const progress = frameNumber / totalFrames;
    const accent = progress > 0.5 ? 'rgba(59, 130, 246, 0.9)' : 'rgba(6, 182, 212, 0.9)';

    const background = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    background.addColorStop(0, '#050505');
    background.addColorStop(1, '#101420');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const glow = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      40,
      canvas.width / 2,
      canvas.height / 2,
      540
    );
    glow.addColorStop(0, accent.replace('0.9', '0.18'));
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.font = '700 36px Geist, sans-serif';
    ctx.fillText(`FRAME ${String(frameNumber).padStart(4, '0')}`, 72, 120);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '14px Geist, sans-serif';
    ctx.fillText('ASSET FALLBACK ACTIVE', 74, 154);

    return canvas;
  }
}
