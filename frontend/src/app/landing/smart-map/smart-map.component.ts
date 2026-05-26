import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';

interface CitizenRight {
  id: string;
  title: string;
  quote: string;
  context: string;
  slaLimit: string;
  legalBasis: string;
}

@Component({
  selector: 'app-smart-map',
  imports: [CommonModule, RouterLink],
  template: `
    <section #mapSection class="py-32 px-6 bg-transparent relative w-full border-t border-var overflow-hidden">
      <!-- Dot grid decorative background -->
      <div class="absolute inset-0 tech-dots-bg opacity-30 pointer-events-none"></div>

      <div class="max-w-7xl mx-auto relative z-10">
        <!-- Section Header -->
        <div class="mb-16 text-center">
          <span class="font-mono text-xs tracking-[0.25em] text-[#6AA9FF] uppercase mb-4 block font-bold">
            CITIZEN EMPOWERMENT
          </span>
          <h2 class="text-3xl md:text-5xl font-bold tracking-tight text-primary-var uppercase text-glow leading-none font-mono">
            Citizen Rights & Redressal
          </h2>
          <p class="text-xs sm:text-sm text-muted-var font-mono mt-6 max-w-xl mx-auto uppercase tracking-wider">
            Know your constitutional and municipal rights to report issues, enforce SLA timelines, and audit governance.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <!-- Column Left: Interactive Rights Board & Quotes -->
          <div class="lg:col-span-8 glass-panel rounded-2xl border border-var bg-glass-var p-8 flex flex-col justify-between relative overflow-hidden min-h-[450px]">
            
            <!-- Background glow effect -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
              <div class="w-[500px] h-[500px] absolute top-[-50%] left-[-20%] bg-[#6AA9FF]/3 rounded-full blur-[120px]"></div>
            </div>

            <div class="relative z-10 flex-1 flex flex-col justify-between gap-8">
              <!-- Giant Quote Symbol and Text -->
              <div class="space-y-6">
                <span class="text-6xl md:text-8xl font-serif text-[#6AA9FF]/20 block leading-none -mb-6 select-none">“</span>
                <blockquote class="text-lg sm:text-xl md:text-2xl font-medium italic text-primary-var leading-relaxed font-mono">
                  {{ selectedRight.quote }}
                </blockquote>
                <div class="flex items-center gap-3 pt-2">
                  <span class="w-2 h-[1px] bg-[#6AA9FF]"></span>
                  <cite class="font-mono text-[9px] tracking-wider text-[#6AA9FF] uppercase not-italic font-bold">
                    {{ selectedRight.legalBasis }}
                  </cite>
                </div>
              </div>

              <!-- Context Description -->
              <div class="space-y-4 pt-4 border-t border-var">
                <h4 class="font-mono text-[9px] tracking-widest text-muted-var uppercase font-bold">EXPLANATORY CONTEXT</h4>
                <p class="text-[11px] text-muted-var font-mono leading-relaxed uppercase">
                  {{ selectedRight.context }}
                </p>
              </div>

              <!-- Interactive Tabs at the Bottom -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-var">
                @for (right of rights; track right.id; let idx = $index) {
                  <button 
                    (click)="selectRight(idx)"
                    class="p-3 rounded-lg border text-left font-mono transition-all duration-300 flex flex-col justify-between gap-2 uppercase cursor-pointer"
                    [class.border-[#6AA9FF]]="activeRightIndex === idx"
                    [class.bg-[#6AA9FF]/5]="activeRightIndex === idx"
                    [class.border-var]="activeRightIndex !== idx"
                    [class.bg-transparent]="activeRightIndex !== idx">
                    <span class="text-[8px]" [class.text-[#6AA9FF]]="activeRightIndex === idx" [class.text-muted-var]="activeRightIndex !== idx">
                      0{{ idx + 1 }} // ID: {{ right.id }}
                    </span>
                    <span class="text-[9px] font-bold tracking-wide" [class.text-primary-var]="activeRightIndex === idx" [class.text-muted-var]="activeRightIndex !== idx">
                      {{ right.title }}
                    </span>
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Column Right: Active Right Node Detailed Telemetry / SLA Action Guide -->
          <div class="lg:col-span-4 flex flex-col justify-between gap-6">
            <!-- Details Panel -->
            <div class="glass-panel rounded-2xl border border-var bg-glass-var p-6 flex-1 flex flex-col justify-between">
              <div class="space-y-6">
                <span class="font-mono text-[9px] tracking-widest text-[#6AA9FF] uppercase font-bold">RIGHT_REDRESSAL_METRICS</span>
                
                <div class="space-y-4 font-mono text-[10px] uppercase">
                  <div class="flex justify-between border-b border-var pb-2">
                    <span class="text-muted-var">CHARTER ID:</span>
                    <span class="text-primary-var font-bold">{{ selectedRight.id }}</span>
                  </div>
                  <div class="flex justify-between border-b border-var pb-2">
                    <span class="text-muted-var">LEGAL BASIS:</span>
                    <span class="text-[#6AA9FF] font-bold">{{ selectedRight.legalBasis }}</span>
                  </div>
                  <div class="flex justify-between border-b border-var pb-2">
                    <span class="text-muted-var">SLA DURATION LIMIT:</span>
                    <span class="text-primary-var font-bold">{{ selectedRight.slaLimit }}</span>
                  </div>
                  <div class="flex justify-between border-b border-var pb-2">
                    <span class="text-muted-var">SYSTEM PROTOCOL:</span>
                    <span class="text-emerald-400 font-bold">ENFORCED</span>
                  </div>
                  <div class="flex justify-between pb-2">
                    <span class="text-muted-var">CITIZEN STATUS:</span>
                    <span class="text-emerald-400 font-bold">EMPOWERED TO FILE</span>
                  </div>
                </div>

                <!-- Guidance Info block -->
                <div class="p-4 rounded-xl border border-var bg-[#6AA9FF]/3 font-mono text-[9px] uppercase tracking-wide leading-relaxed text-muted-var">
                  <div class="text-[#6AA9FF] font-bold mb-2">How to invoke this right:</div>
                  Use the JanSeva portal to upload photo evidence. Integrated geofencing establishes the coordinates automatically, bypassing municipal ward delays.
                </div>
              </div>

              <!-- Action Link / Button -->
              <div class="pt-6 border-t border-var">
                <a [routerLink]="['/auth/register']" class="w-full py-4.5 rounded-full bg-[#1A2530] text-white hover:bg-black font-mono text-xs tracking-wider uppercase font-bold transition-all duration-300 block text-center shadow-lg">
                  Raise Complaint Now
                </a>
              </div>
            </div>
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
export class SmartMapComponent implements OnInit, AfterViewInit {
  @ViewChild('mapSection') sectionRef!: ElementRef<HTMLElement>;

  rights: CitizenRight[] = [
    {
      id: 'RIGHT_01',
      title: 'Safe Infrastructure',
      quote: 'Access to hazard-free public roads and basic hygiene is a fundamental extension of the Right to Life under Article 21.',
      context: 'Every citizen has the legal right to demand the repair of public hazards (potholes, open drains, broken lights) that endanger community safety.',
      slaLimit: '48 Hours for Critical Hazards',
      legalBasis: 'Constitution of India, Article 21'
    },
    {
      id: 'RIGHT_02',
      title: 'Timely Redressal',
      quote: 'Public service charters enforce strict timeline boundaries. Grievance resolution is an entitlement, not a favor.',
      context: 'Municipal boards are bound by regional Right to Services Acts to acknowledge, dispatch, and close grievances within predefined SLA intervals.',
      slaLimit: '3 to 7 Days depending on severity',
      legalBasis: 'State Right to Public Services Act'
    },
    {
      id: 'RIGHT_03',
      title: 'Transparent Tracking',
      quote: 'Transparency is the core of citizen trust. You have the right to audit every stage of the grievance pipeline.',
      context: 'Citizens are entitled to live coordinates of dispatch officers, proof of material dispatches, and before-and-after visual audits.',
      slaLimit: 'Real-time telemetry access',
      legalBasis: 'Municipal Disclosure Standards'
    },
    {
      id: 'RIGHT_04',
      title: 'Escalate & Appeal',
      quote: 'Administrative silence is a breach of duty. Citizens hold the power to escalate unaddressed complaints.',
      context: 'If a local ward node fails to resolve a ticket within the SLA timeline, the system automatically routes the ticket to the commissioner scale queue.',
      slaLimit: 'Instant automated escalation',
      legalBasis: 'Grievance Redressal Regulation 14A'
    }
  ];

  selectedRight!: CitizenRight;
  activeRightIndex = 0;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit(): void {
    this.selectedRight = this.rights[0];
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        // Simple entrance animation for elements on scroll
        gsap.from(this.sectionRef.nativeElement.querySelector('.glass-panel'), {
          opacity: 0,
          y: 40,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: this.sectionRef.nativeElement,
            start: 'top 75%',
            toggleActions: 'play none none none'
          }
        });
      });
    });
  }

  selectRight(index: number) {
    this.activeRightIndex = index;
    this.selectedRight = this.rights[index];
  }
}
