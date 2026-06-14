import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, Inject, OnDestroy, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { TheProblemComponent } from './the-problem/the-problem.component';
import { HowItWorksComponent } from './how-it-works/how-it-works.component';
import { DepartmentsShowcaseComponent } from './departments-showcase/departments-showcase.component';
import { GovernanceIntelligenceCenterComponent } from './governance-intelligence-center/governance-intelligence-center.component';
import { AiShowcaseComponent } from './ai-showcase/ai-showcase.component';
import { CitizenEmpowermentComponent } from './citizen-empowerment/citizen-empowerment.component';
import { GovernanceTransparencyComponent } from './governance-transparency/governance-transparency.component';
import { DashboardShowcaseComponent } from './dashboard-showcase/dashboard-showcase.component';
import { GlobeFooterComponent } from './globe-footer/globe-footer.component';
import { CtaComponent } from './cta/cta.component';
import { AuthService } from '../core/services/auth.service';
import { TranslationService, LanguageCode } from '../core/services/translation.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    RouterLink,
    TheProblemComponent,
    HowItWorksComponent,
    DepartmentsShowcaseComponent,
    GovernanceIntelligenceCenterComponent,
    AiShowcaseComponent,
    CitizenEmpowermentComponent,
    GovernanceTransparencyComponent,
    DashboardShowcaseComponent,
    GlobeFooterComponent,
    CtaComponent
  ],
  template: `
    <div class="landing-container min-h-screen relative overflow-hidden tech-dots-bg">
      <!-- Fixed Government Header -->
      <header class="fixed top-0 left-0 right-0 z-50 h-20 glass-panel border-var bg-glass-var backdrop-blur-md transition-all duration-300">
        <div class="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <!-- Logo -->
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full border border-[#6AA9FF]/30 flex items-center justify-center bg-[#6AA9FF]/5 shadow-[0_0_15px_rgba(106,169,255,0.15)]">
              <div class="w-3 h-3 rounded-full bg-[#6AA9FF] animate-pulse"></div>
            </div>
            <span class="font-semibold tracking-[0.15em] text-sm uppercase text-primary-var font-mono">
              JANSEVA <span class="text-[#6AA9FF]">AI</span>
            </span>
          </div>

          <!-- Navigation Links -->
          <nav class="hidden xl:flex items-center gap-6 font-mono text-[9px] tracking-wider text-muted-var">
            <a href="#hero" class="hover:text-primary-var transition-colors duration-200 uppercase">{{ translationService.t('MISSION') }}</a>
            <a href="#problem" class="hover:text-[#6AA9FF] transition-colors duration-200 uppercase">{{ translationService.t('THE_CONFLICT') }}</a>
            <a href="#journey" class="hover:text-[#6AA9FF] transition-colors duration-200 uppercase">{{ translationService.t('JOURNEY') }}</a>
            <a href="#departments" class="hover:text-[#6AA9FF] transition-colors duration-200 uppercase">{{ translationService.t('ECOSYSTEM') }}</a>
            <a href="#transparency" class="hover:text-[#6AA9FF] transition-colors duration-200 uppercase">{{ translationService.t('GOV_TRANSPARENCY_TITLE') }}</a>
            <a href="#intelligence" class="hover:text-[#6AA9FF] transition-colors duration-200 uppercase">{{ translationService.t('INTELLIGENCE') }}</a>
            <a href="#showcase" class="hover:text-[#6AA9FF] transition-colors duration-200 uppercase">{{ translationService.t('AI_FEATURES') }}</a>
            <a href="#empowerment" class="hover:text-[#6AA9FF] transition-colors duration-200 uppercase">{{ translationService.t('CITIZEN_EMPOWERMENT_TITLE') }}</a>
            <a href="#dashboard" class="hover:text-[#6AA9FF] transition-colors duration-200 uppercase">{{ translationService.t('CONSOLE') }}</a>
          </nav>

          <!-- Action Buttons -->
          <div class="flex items-center gap-4">
            <!-- Language Switcher -->
            <select [value]="translationService.currentLang()" (change)="onLanguageChange($event)" class="px-3 py-1.5 rounded-full border border-var bg-glass-var text-primary-var font-mono text-[9px] tracking-wider uppercase bg-transparent outline-none cursor-pointer hover:border-[#6AA9FF]/50 transition-colors">
              <option value="en" class="bg-black text-white">English</option>
              <option value="te" class="bg-black text-white">తెలుగు</option>
              <option value="ta" class="bg-black text-white">தமிழ்</option>
              <option value="kn" class="bg-black text-white">ಕನ್ನಡ</option>
            </select>

              @if (authService.isAuthenticated()) {
                <a [routerLink]="['/dashboard']" class="px-5 py-2.5 rounded-full border border-var bg-glass-var transition-all duration-300 font-mono text-xs tracking-wider uppercase text-primary-var hover:text-[#6AA9FF]">
                  {{ translationService.t('CONSOLE') }}
                </a>
              } @else {
                <a [routerLink]="['/auth/citizen/login']" class="px-5 py-2.5 rounded-full border border-var bg-glass-var transition-all duration-300 font-mono text-xs tracking-wider uppercase text-primary-var hover:text-[#6AA9FF]">
                  {{ translationService.t('SIGN_IN') }}
                </a>
                <a [routerLink]="['/auth/citizen/register']" class="px-5 py-2.5 rounded-full bg-[#6AA9FF] hover:bg-[#5998ee] text-black font-mono text-xs tracking-wider uppercase font-bold shadow-[0_0_20px_rgba(106,169,255,0.3)] transition-all duration-300">
                  {{ translationService.t('JOIN_NETWORK') }}
                </a>
              }
          </div>
        </div>
      </header>

      <!-- Section 1: Hero Splash -->
      <section id="hero" class="min-h-screen flex flex-col justify-center items-center px-6 pt-20 relative overflow-hidden bg-transparent">
        
        <!-- Interactive Layered Landscape Background (Structurally aligned to reference layout) -->
        <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-transparent">
          <svg class="absolute bottom-0 left-0 w-full h-[60%] min-h-[350px]" viewBox="0 0 1440 500" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="hill-back" x1="720" y1="100" x2="720" y2="500" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#D8E2D5" stop-opacity="0.35"/>
                <stop offset="100%" stop-color="#D8E2D5" stop-opacity="0.95"/>
              </linearGradient>
              <linearGradient id="hill-front" x1="720" y1="300" x2="720" y2="500" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#A2BA9F" stop-opacity="0.6"/>
                <stop offset="100%" stop-color="#A2BA9F" stop-opacity="1"/>
              </linearGradient>
            </defs>

            <!-- Decorative Central Sun Circle -->
            <circle cx="720" cy="220" r="140" fill="#EDF3EB" opacity="0.95" />
            <circle cx="720" cy="220" r="140" stroke="#E2EBE0" stroke-width="1.5" stroke-dasharray="6 6" opacity="0.6" />
            
            <!-- Hill 1 (Back Layer - Single Curved Dome) -->
            <path d="M -100,500 C 350,300 1090,300 1540,500 Z" fill="url(#hill-back)" />
            
            <!-- Flying birds flock in V-Formation -->
            <g id="birds-flock" stroke="#5F765B" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.6">
              <path d="M 810,140 Q 815,133 820,140 Q 825,133 830,140" />
              <path d="M 835,152 Q 840,145 845,152 Q 850,145 855,152" />
              <path d="M 860,164 Q 865,157 870,164 Q 875,157 880,164" />
              <path d="M 830,176 Q 835,169 840,176 Q 845,169 850,176" />
              <path d="M 885,148 Q 890,141 895,148 Q 900,141 905,148" />
              <path d="M 910,160 Q 915,153 920,160 Q 925,153 930,160" />
            </g>

            <!-- Winding dotted pathways curving on the back hill -->
            <path d="M 480,440 C 560,400 620,410 700,450" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="5 5" fill="none" opacity="0.6" />
            <circle cx="480" cy="440" r="4.5" fill="#A12B7D" />
            
            <path d="M 740,450 C 820,410 880,400 960,440" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="5 5" fill="none" opacity="0.6" />
            <!-- Direction Arrow -->
            <path d="M 720,415 L 720,425 M 715,420 L 720,425 L 725,420" stroke="#A12B7D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />

            <!-- Hill 2 (Front Layer - Single Curved Dome) -->
            <path d="M -100,500 C 400,340 1040,340 1540,500 Z" fill="url(#hill-front)" />

            <!-- Landscape Trees (Grouped and styled as in ginekocentar.hr with local rotation anchors) -->
            <g id="landscape-trees">
              <!-- Background Tree Left -->
              <g class="swaying-tree" style="transform-origin: 530px 390px;">
                <circle cx="530" cy="310" r="22" fill="#B9CBAF" stroke="#5F765B" stroke-width="1.8" />
                <path d="M 530,390 L 530,300" stroke="#5F765B" stroke-width="2" stroke-linecap="round" />
                <path d="M 530,345 L 518,333" stroke="#5F765B" stroke-width="1.5" stroke-linecap="round" />
                <path d="M 530,330 L 542,318" stroke="#5F765B" stroke-width="1.5" stroke-linecap="round" />
              </g>
              
              <!-- Background Tree Right -->
              <g class="swaying-tree-slow" style="transform-origin: 910px 390px;">
                <circle cx="910" cy="310" r="22" fill="#B9CBAF" stroke="#5F765B" stroke-width="1.8" />
                <path d="M 910,390 L 910,300" stroke="#5F765B" stroke-width="2" stroke-linecap="round" />
                <path d="M 910,345 L 898,333" stroke="#5F765B" stroke-width="1.5" stroke-linecap="round" />
                <path d="M 910,330 L 922,318" stroke="#5F765B" stroke-width="1.5" stroke-linecap="round" />
              </g>

              <!-- Foreground Tree Left -->
              <g class="swaying-tree" style="transform-origin: 620px 380px;">
                <circle cx="620" cy="270" r="32" fill="#A2BA9E" stroke="#5F765B" stroke-width="2.2" />
                <path d="M 620,380 L 620,250" stroke="#5F765B" stroke-width="2.8" stroke-linecap="round" />
                <path d="M 620,315 L 602,297" stroke="#5F765B" stroke-width="2" stroke-linecap="round" />
                <path d="M 620,295 L 638,277" stroke="#5F765B" stroke-width="2" stroke-linecap="round" />
                <path d="M 620,275 L 608,263" stroke="#5F765B" stroke-width="2" stroke-linecap="round" />
              </g>

              <!-- Foreground Tree Right -->
              <g class="swaying-tree-slow" style="transform-origin: 820px 380px;">
                <circle cx="820" cy="270" r="32" fill="#A2BA9E" stroke="#5F765B" stroke-width="2.2" />
                <path d="M 820,380 L 820,250" stroke="#5F765B" stroke-width="2.8" stroke-linecap="round" />
                <path d="M 820,315 L 802,297" stroke="#5F765B" stroke-width="2" stroke-linecap="round" />
                <path d="M 820,295 L 838,277" stroke="#5F765B" stroke-width="2" stroke-linecap="round" />
                <path d="M 820,275 L 808,263" stroke="#5F765B" stroke-width="2" stroke-linecap="round" />
              </g>
            </g>

            <!-- State district node indicators (pulsing peaks in SVG) -->
            <g id="state-nodes" font-family="monospace" font-size="7" font-weight="bold" fill="#4A3C31" text-anchor="middle" letter-spacing="1">
              <!-- Central Node -->
              <g>
                <circle cx="720" cy="370" r="6" fill="#5F765B" fill-opacity="0.1" stroke="#5F765B" stroke-width="1" />
                <circle cx="720" cy="370" r="2" fill="#5F765B" />
                <text x="720" y="388">NODE_CENTRAL</text>
              </g>
              
              <!-- Ward 03 Node -->
              <g>
                <circle cx="320" cy="420" r="6" fill="#5F765B" fill-opacity="0.1" stroke="#5F765B" stroke-width="1" />
                <circle cx="320" cy="420" r="2" fill="#5F765B" />
                <text x="320" y="438">WARD_03</text>
              </g>
              
              <!-- Ward 12 Node -->
              <g>
                <circle cx="1120" cy="430" r="6" fill="#5F765B" fill-opacity="0.1" stroke="#5F765B" stroke-width="1" />
                <circle cx="1120" cy="430" r="2" fill="#5F765B" />
                <text x="1120" y="448">WARD_12</text>
              </g>
            </g>
          </svg>

          <!-- Canvas for slow drift environmental particles -->
          <canvas #driftCanvas class="absolute inset-0 w-full h-full pointer-events-none opacity-40"></canvas>
        </div>

        <div class="max-w-4xl text-center z-10 relative">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#6AA9FF]/20 bg-glass-var mb-8 animate-float">
            <span class="w-1.5 h-1.5 rounded-full bg-[#6AA9FF]"></span>
            <span class="font-mono text-[9px] tracking-widest text-[#6AA9FF] uppercase">
              {{ translationService.t('STATE_SCALE_INFRA') }}
            </span>
          </div>

          <h1 #heroTitle class="text-5xl sm:text-7xl md:text-9xl font-bold tracking-tight text-primary-var mb-8 text-glow leading-none font-mono">
            JANSEVA
          </h1>

          <p #heroDesc class="text-xs sm:text-sm md:text-base text-muted-var max-w-2xl mx-auto mb-12 font-mono leading-relaxed uppercase tracking-wider">
            {{ translationService.t('UNIFIED_PLATFORM') }}
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-5">
            <a href="#journey" class="w-full sm:w-auto px-8 py-4 rounded-full bg-[#1A2530] text-white hover:bg-black font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-lg">
              {{ translationService.t('EXPLORE_ENGINE') }}
            </a>
            <a [routerLink]="['/auth/register']" class="w-full sm:w-auto px-8 py-4 rounded-full border border-var bg-glass-var hover:bg-white/10 transition-all duration-300 text-xs font-semibold uppercase tracking-wider text-primary-var">
              {{ translationService.t('FILE_GRIEVANCE') }}
            </a>
          </div>
        </div>


        <!-- Scroll Indicator -->
        <div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-pointer z-10">
          <span class="font-mono text-[8px] tracking-widest text-muted-var uppercase">SCROLL TO ANALYZE</span>
          <div class="w-[1px] h-12 bg-gradient-to-b from-[#1A2530] to-transparent"></div>
        </div>
      </section>

      <!-- Section 2: Real-Time Governance Intelligence Center -->
      <app-governance-intelligence-center></app-governance-intelligence-center>

      <!-- Section 3: The Problem -->
      <app-the-problem id="problem"></app-the-problem>

      <!-- Section 4: How The AI Engine Works (scroll-driven animated story) -->
      <app-how-it-works id="journey"></app-how-it-works>

      <!-- Section 5: Government Departments Ecosystem -->
      <app-departments-showcase id="departments"></app-departments-showcase>

      <!-- Section 6: Governance Transparency -->
      <app-governance-transparency id="transparency"></app-governance-transparency>

      <!-- Section 7: AI Showcase -->
      <app-ai-showcase id="showcase"></app-ai-showcase>

      <!-- Section 8: Citizen Empowerment -->
      <app-citizen-empowerment id="empowerment"></app-citizen-empowerment>

      <!-- Section 9: Dashboard Showcase -->
      <app-dashboard-showcase id="dashboard"></app-dashboard-showcase>

      <!-- Section 10: Future of Governance (Flowing Vector Landscape Footer) -->
      <app-globe-footer></app-globe-footer>

      <!-- Section 11: CTA Footer -->
      <app-cta></app-cta>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    header {
      border-radius: 0 0 24px 24px;
      margin: 0 auto;
      max-width: 1280px;
      top: 16px;
      left: 16px;
      right: 16px;
      height: 4.5rem;
    }
    @keyframes swaying {
      0%, 100% { transform: rotate(-3deg); }
      50% { transform: rotate(3deg); }
    }
    @keyframes swaying-slow {
      0%, 100% { transform: rotate(-2deg); }
      50% { transform: rotate(2deg); }
    }
    .swaying-tree {
      transform-origin: bottom center;
      animation: swaying 6s ease-in-out infinite;
    }
    .swaying-tree-slow {
      transform-origin: bottom center;
      animation: swaying-slow 9s ease-in-out infinite;
    }
  `]
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('heroTitle') heroTitle!: ElementRef<HTMLHeadingElement>;
  @ViewChild('heroDesc') heroDesc!: ElementRef<HTMLParagraphElement>;
  @ViewChild('driftCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private driftContext!: CanvasRenderingContext2D;
  private driftParticles: Array<{ x: number, y: number, r: number, vx: number, vy: number, alpha: number }> = [];
  private driftAnimationFrameId: number | null = null;
  
  private resizeListener: any;
  private scrollTriggers: any[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public authService: AuthService,
    public translationService: TranslationService,
    private ngZone: NgZone,
    private elRef: ElementRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      const role = this.authService.userRole();
      if (role === 'admin') {
        this.router.navigate(['/dashboard/admin']);
      } else if (role === 'officer') {
        this.router.navigate(['/dashboard/officer']);
      } else if (role === 'supervisor') {
        this.router.navigate(['/dashboard/supervisor']);
      }
      // Citizens stay on the home page
    }
  }

  onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.translationService.setLang(select.value as LanguageCode);
  }


  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Load GSAP dynamically to run animations smoothly
    import('gsap').then(({ gsap }) => {
      this.splitAndAnimateText(gsap, this.heroTitle.nativeElement);
      
      gsap.from(this.heroDesc.nativeElement, {
        opacity: 0,
        y: 20,
        duration: 1.5,
        delay: 0.6,
        ease: 'power3.out'
      });

      // Initialize scroll background/theme transitions
      this.initScrollTransitions(gsap);
    });

    // Initialize drift particles outside Angular Zone to prevent change detection runs
    this.ngZone.runOutsideAngular(() => {
      this.initDriftParticles();
    });
  }

  private initDriftParticles() {
    try {
      const canvas = this.canvasRef.nativeElement;
      this.driftContext = canvas.getContext('2d')!;
      
      const resizeCanvas = () => {
        if (canvas) {
          canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
          canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
        }
      };
      
      resizeCanvas();
      this.resizeListener = resizeCanvas.bind(this);
      window.addEventListener('resize', this.resizeListener);

      const particleCount = 40;
      for (let i = 0; i < particleCount; i++) {
        this.driftParticles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 2 + 1,
          vx: (Math.random() - 0.5) * 0.1,
          vy: -(Math.random() * 0.15 + 0.05), // Drift upwards slowly
          alpha: Math.random() * 0.35 + 0.1
        });
      }

      const draw = () => {
        const ctx = this.driftContext;
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        for (let p of this.driftParticles) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(106, 169, 255, ${p.alpha})`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();

          p.x += p.vx;
          p.y += p.vy;

          if (p.y < 0) {
            p.y = h;
            p.x = Math.random() * w;
          }
          if (p.x < 0 || p.x > w) {
            p.x = Math.random() * w;
          }
        }
        this.driftAnimationFrameId = requestAnimationFrame(draw);
      };

      draw();
    } catch (e) {
      console.warn('Drift particles animation fail: ', e);
    }
  }

  private initScrollTransitions(gsap: any) {
    import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
      gsap.registerPlugin(ScrollTrigger);

      const root = document.documentElement;
      const lightPhase = gsap.timeline({
        scrollTrigger: {
          trigger: '#departments',
          start: 'top bottom',
          end: 'bottom bottom',
          scrub: 1,
          invalidateOnRefresh: true
        }
      });

      lightPhase.to(root, {
        '--gineko-glow-core': '#eef2e4',
        '--gineko-glow-mid': '#dfe7d4',
        '--gineko-glow-outer': '#cad6c0',
        duration: 1,
        ease: 'none'
      }, 0)
      .to('#hill-back stop', {
        attr: { 'stop-color': '#c9d7bf' },
        duration: 1,
        ease: 'none'
      }, 0)
      .to('#hill-front stop', {
        attr: { 'stop-color': '#9eb996' },
        duration: 1,
        ease: 'none'
      }, 0)
      .to('#birds-flock path, #landscape-trees path, #landscape-trees circle', {
        stroke: '#6f8571',
        fill: '#afc4a3',
        duration: 1,
        ease: 'none'
      }, 0)
      .to('#state-nodes text, #state-nodes circle', {
        fill: '#6e7768',
        stroke: '#6e7768',
        duration: 1,
        ease: 'none'
      }, 0);

      if (lightPhase.scrollTrigger) {
        this.scrollTriggers.push(lightPhase.scrollTrigger);
      }

      // Keep environment light through intelligence section as requested.
      const intelligencePhase = gsap.timeline({
        scrollTrigger: {
          trigger: '#intelligence',
          start: 'top bottom',
          end: 'top top',
          scrub: 1,
          invalidateOnRefresh: true
        }
      });

      intelligencePhase.to(root, {
        '--gineko-glow-core': '#ececf3',
        '--gineko-glow-mid': '#d9dceb',
        '--gineko-glow-outer': '#c8cfdf',
        duration: 1,
        ease: 'none'
      });

      if (intelligencePhase.scrollTrigger) {
        this.scrollTriggers.push(intelligencePhase.scrollTrigger);
      }
    });
  }

  private splitAndAnimateText(gsap: any, element: HTMLElement) {
    const textContent = element.innerText;
    element.innerHTML = '';
    
    const words = textContent.split(' ');
    words.forEach((word) => {
      const span = document.createElement('span');
      span.innerText = word + ' ';
      span.style.display = 'inline-block';
      span.style.opacity = '0';
      span.style.transform = 'translateY(25px)';
      element.appendChild(span);
    });

    gsap.to(element.children, {
      opacity: 1,
      y: 0,
      duration: 1.0,
      stagger: 0.1,
      ease: 'power3.out',
      overwrite: 'auto'
    });
  }

  ngOnDestroy(): void {
    if (this.driftAnimationFrameId) {
      cancelAnimationFrame(this.driftAnimationFrameId);
    }
    if (typeof window !== 'undefined' && this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    // Kill GSAP ScrollTriggers
    this.scrollTriggers.forEach((st) => st.kill());
  }
}
