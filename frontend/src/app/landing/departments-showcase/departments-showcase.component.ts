import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { DepartmentsService } from '../../core/services/departments.service';
import { Department } from '../../core/models/department.model';

@Component({
  selector: 'app-departments-showcase',
  imports: [CommonModule],
  template: `
    <section #deptSection class="py-32 px-6 bg-transparent relative w-full border-t border-var overflow-hidden">
      <!-- Glow ambient overlay -->
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#6AA9FF]/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto">
        <!-- Section Header -->
        <div class="mb-24 text-center">
          <span class="font-mono text-xs tracking-[0.25em] text-[#6AA9FF] uppercase mb-4 block">
            STATE ADMINISTRATIVE NODES
          </span>
          <h2 class="text-3xl md:text-5xl font-bold tracking-tight text-primary-var uppercase text-glow leading-none font-mono">
            Government Departments Ecosystem
          </h2>
          <p class="text-xs sm:text-sm text-muted-var font-mono mt-6 max-w-xl mx-auto uppercase tracking-wider">
            Monitor real-time operational capacity, backlog states, and SLA indices across primary municipal divisions.
          </p>
        </div>

        <!-- Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          @for (dept of departments; track dept.id; let idx = $index) {
            <div [attr.data-card]="idx" class="dept-card glass-panel bg-glass-var border-var glow-card rounded-xl p-5 flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:-translate-y-1 hover:border-[#6AA9FF]/30">
              
              <!-- Top Row Info -->
              <div>
                <div class="flex justify-between items-start mb-4">
                  <span class="font-mono text-[9px] text-[#6AA9FF] uppercase tracking-wider font-bold">NODE 0{{ idx + 1 }}</span>
                  <!-- Pulse Indicator -->
                  <div class="flex items-center gap-1.5 font-mono text-[8px]">
                    <span class="w-1.5 h-1.5 rounded-full animate-pulse" [ngClass]="{
                      'bg-emerald-500': dept.liveStatus === 'operational',
                      'bg-amber-500': dept.liveStatus === 'congested',
                      'bg-red-500': dept.liveStatus === 'alert',
                      'bg-blue-500': dept.liveStatus === 'maintenance'
                    }"></span>
                    <span class="text-muted-var">{{ dept.liveStatus.toUpperCase() }}</span>
                  </div>
                </div>

                <h3 class="text-sm font-semibold text-primary-var font-mono uppercase tracking-wide mb-6">
                  {{ dept.name }}
                </h3>
              </div>

              <!-- Metrics -->
              <div class="space-y-2.5 pt-4 border-t border-var font-mono text-[9px] uppercase text-muted-var">
                <div class="flex justify-between">
                  <span>Active Load:</span>
                  <span class="text-primary-var font-bold">{{ dept.activeComplaints }} Tickets</span>
                </div>
                <div class="flex justify-between">
                  <span>SLA Cleared:</span>
                  <span class="text-emerald-400 font-bold">{{ dept.resolutionRate }}%</span>
                </div>
                <div class="flex justify-between">
                  <span>Avg Response:</span>
                  <span class="text-primary-var">{{ dept.avgResponseTime }}h</span>
                </div>
              </div>

            </div>
          }
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
export class DepartmentsShowcaseComponent implements OnInit, AfterViewInit {
  @ViewChild('deptSection') sectionRef!: ElementRef<HTMLElement>;

  departments: Department[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private departmentsService: DepartmentsService
  ) {}

  ngOnInit(): void {
    this.departmentsService.loadDepartments().subscribe((items) => {
      this.departments = items.slice(0, 10);
      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => {
          this.animateCards();
        }, 50);
      }
    });
  }

  ngAfterViewInit(): void {}

  private animateCards() {
    import('gsap').then(({ gsap }) => {
      import('gsap/ScrollTrigger').then(({ ScrollTrigger }) => {
        gsap.registerPlugin(ScrollTrigger);

        const cards = this.sectionRef.nativeElement.querySelectorAll('.dept-card');
        if (cards.length === 0) return;

        gsap.from(cards, {
          opacity: 0,
          y: 30,
          duration: 1.0,
          stagger: 0.08,
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
}
