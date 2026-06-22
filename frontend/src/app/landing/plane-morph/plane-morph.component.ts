import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy, PLATFORM_ID, Inject, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ImagePreloaderService } from '../../core/services/image-preloader.service';

@Component({
  selector: 'app-plane-morph',
  standalone: true,
  imports: [],
  template: `
    <section #sectionContainer class="h-[250vh] relative w-full bg-[#050505]">
      <!-- Preloader overlay -->
      @if (preloader.isLoading() && activeSequence) {
      <div class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md">
        <div class="w-24 h-[1px] bg-white/10 mb-4 relative overflow-hidden">
          <div class="h-full bg-blue-500 transition-all duration-300" [style.width.%]="preloader.loadingProgress()"></div>
        </div>
        <span class="font-mono text-[9px] tracking-widest text-blue-400 uppercase">
          MORPH INDEXING ({{ preloader.loadingProgress() }}%)
        </span>
      </div>
      }

      <div class="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
        <canvas #canvas class="w-full h-full object-cover"></canvas>
        
        <!-- Interactive Sticky HUD Details -->
        <div class="absolute inset-0 pointer-events-none flex flex-col justify-between p-10 md:p-20 z-10">
          <div class="flex items-start justify-between">
            <div class="max-w-md mt-20">
              <h2 #hudTitle class="text-xs font-mono tracking-widest text-blue-400 uppercase mb-2">ENGINE: KINETIC_MORPH_V3</h2>
              <h3 #hudHeadline class="text-2xl md:text-4xl font-bold tracking-tight text-white uppercase text-glow">
                Structural Scanning Array
              </h3>
              <p #hudDesc class="text-xs md:text-sm text-white/80 mt-4 leading-relaxed font-mono uppercase">
                As physical elements transform into mathematical nodes, the platform constructs an audit blueprint detailing grid parameters and structural defects.
              </p>
            </div>
            
            <div class="mt-20 font-mono text-[9px] text-right hidden sm:block">
              <div class="text-blue-400">VECTOR_SYSTEM: ARMED</div>
              <div class="text-white/75">RESOLUTION: 1920 x 1080</div>
              <div class="text-white/75">PROJECTION: PERSPECTIVE_3D</div>
            </div>
          </div>
          
          <div class="flex items-end justify-between font-mono text-[9px] md:text-xs text-white/70 uppercase tracking-widest">
            <div>TARGET: CIVIC_BLUEPRINT_AUTOGEN</div>
            <div>VERIFIED SIMILARITY DELTA: 100% -> 0%</div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class PlaneMorphComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('sectionContainer') sectionRef!: ElementRef<HTMLElement>;
  @ViewChild('hudTitle') hudTitle!: ElementRef<HTMLElement>;
  @ViewChild('hudHeadline') hudHeadline!: ElementRef<HTMLElement>;
  @ViewChild('hudDesc') hudDesc!: ElementRef<HTMLElement>;

  private context!: CanvasRenderingContext2D;
  private frames: (HTMLImageElement | HTMLCanvasElement)[] = [];
  private scrollTriggerInstance: any = null;
  private totalFrames = 100;
  activeSequence = false;

  constructor(
    public preloader: ImagePreloaderService,
    @Inject(PLATFORM_ID) private platformId: object,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {}

  async ngAfterViewInit(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;

    const canvas = this.canvasRef.nativeElement;
    this.context = canvas.getContext('2d')!;

    this.resizeCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));

    // Load frames (Sequence 2)
    this.activeSequence = true;
    this.frames = await this.preloader.preloadSequence(
      'sequence-2',
      '/assets/sequence-2',
      this.totalFrames,
      'webp'
    );
    this.activeSequence = false;

    // Initial frame draw
    if (this.frames.length > 0) {
      this.drawFrame(0);
    }

    this.ngZone.runOutsideAngular(() => {
      this.initScrollTrigger();
    });
  }

  private resizeCanvas() {
    const canvas = this.canvasRef.nativeElement;
    canvas.width = canvas.clientWidth * window.devicePixelRatio;
    canvas.height = canvas.clientHeight * window.devicePixelRatio;
    
    if (this.frames && this.frames.length > 0 && this.scrollTriggerInstance) {
      const progress = this.scrollTriggerInstance.progress;
      const frameIdx = Math.min(
        this.totalFrames - 1,
        Math.floor(progress * this.totalFrames)
      );
      this.drawFrame(frameIdx);
    }
  }

  private drawFrame(index: number) {
    const canvas = this.canvasRef.nativeElement;
    const ctx = this.context;
    const img = this.frames[index];

    if (!img) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imgWidth = img instanceof HTMLImageElement ? img.naturalWidth : (img as HTMLCanvasElement).width;
    const imgHeight = img instanceof HTMLImageElement ? img.naturalHeight : (img as HTMLCanvasElement).height;

    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = imgWidth / imgHeight;

    let drawWidth = canvas.width;
    let drawHeight = canvas.height;
    let offsetX = 0;
    let offsetY = 0;

    if (canvasRatio > imgRatio) {
      drawHeight = canvas.width / imgRatio;
      offsetY = (canvas.height - drawHeight) / 2;
    } else {
      drawWidth = canvas.height * imgRatio;
      offsetX = (canvas.width - drawWidth) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }

  private initScrollTrigger() {
    Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger')
    ]).then(([gsapModule, triggerModule]) => {
      const gsap = gsapModule.default;
      const ScrollTrigger = triggerModule.default;

      gsap.registerPlugin(ScrollTrigger);

      this.scrollTriggerInstance = ScrollTrigger.create({
        trigger: this.sectionRef.nativeElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          const frameIdx = Math.min(
            this.totalFrames - 1,
            Math.floor(self.progress * this.totalFrames)
          );
          requestAnimationFrame(() => this.drawFrame(frameIdx));
        }
      });

      // HUD element entry reveals
      gsap.timeline({
        scrollTrigger: {
          trigger: this.sectionRef.nativeElement,
          start: 'top 80%',
          end: 'top 20%',
          scrub: 1
        }
      })
      .from(this.hudTitle.nativeElement, { opacity: 0, x: 50 })
      .from(this.hudHeadline.nativeElement, { opacity: 0, y: 30 }, '<')
      .from(this.hudDesc.nativeElement, { opacity: 0, y: 20 }, '<+0.2');
    });
  }

  ngOnDestroy(): void {
    if (this.scrollTriggerInstance) {
      this.scrollTriggerInstance.kill();
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeCanvas.bind(this));
    }
  }
}
