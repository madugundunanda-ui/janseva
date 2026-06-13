import { Injectable, PLATFORM_ID, Inject, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class SmoothScrollService {
  private lenis: any = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private ngZone: NgZone
  ) {}

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Dynamically load Lenis to avoid Server-Side Rendering (SSR) issues
    import('@studio-freight/lenis').then(({ default: Lenis }) => {
      this.ngZone.runOutsideAngular(() => {
        this.lenis = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          direction: 'vertical',
          gestureDirection: 'vertical',
          smooth: true,
          mouseMultiplier: 1,
          smoothTouch: false,
          touchMultiplier: 2,
          infinite: false,
        } as any);

        const raf = (time: number) => {
          this.lenis?.raf(time);
          requestAnimationFrame(raf);
        };
        requestAnimationFrame(raf);
      });
    });
  }

  getLenis(): any {
    return this.lenis;
  }

  stop(): void {
    this.lenis?.stop();
  }

  start(): void {
    this.lenis?.start();
  }

  scrollTo(target: any, options?: any): void {
    this.lenis?.scrollTo(target, options);
  }

  destroy(): void {
    this.lenis?.destroy();
    this.lenis = null;
  }
}
