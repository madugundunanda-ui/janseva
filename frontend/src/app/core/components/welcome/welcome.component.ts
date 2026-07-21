import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[100] flex items-center justify-center bg-white bg-gradient-to-b from-white via-sky-50/60 to-indigo-50/40 font-sans p-6 overflow-hidden transition-opacity duration-700"
         [ngClass]="{ 'opacity-0 pointer-events-none': isFadingOut }">
      
      <!-- Ambient Glow Orbs -->
      <div class="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-200/40 blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-200/40 blur-3xl pointer-events-none"></div>

      <!-- Skip Button -->
      <button (click)="skipWelcome()"
              class="absolute top-6 right-6 z-10 text-xs font-semibold text-slate-500 hover:text-indigo-600 bg-white/80 hover:bg-white border border-slate-200/80 rounded-full px-4 py-2 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer">
        <span>Skip</span>
        <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>

      <!-- Main Glassmorphism Container -->
      <div class="max-w-md w-full bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-indigo-500/5 relative space-y-8 text-center">
        
        <!-- Logo & Brand Header -->
        <div class="space-y-4">
          <!-- Animated Government AI Vector Crest -->
          <div class="relative w-20 h-20 mx-auto">
            <div class="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-600 via-blue-500 to-sky-400 opacity-90 shadow-lg shadow-indigo-500/20 flex items-center justify-center animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div class="absolute -inset-1 rounded-2xl bg-indigo-400/30 blur-md pointer-events-none"></div>
          </div>

          <div>
            <h1 class="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
              JANSEVA
            </h1>
            <p class="text-xs font-bold tracking-widest text-indigo-600 uppercase mt-1">
              AI Governance Platform
            </p>
          </div>

          <p class="text-xs text-slate-600 max-w-xs mx-auto leading-relaxed">
            Building Transparent Governance Through Artificial Intelligence
          </p>
        </div>

        <!-- Startup Sequence Steps List -->
        <div class="space-y-2.5 text-left bg-slate-50/80 rounded-2xl p-4 border border-slate-100 text-xs font-medium font-sans">
          <div *ngFor="let step of steps; let i = index"
               class="flex items-center gap-3 transition-all duration-500 transform"
               [ngClass]="{
                 'opacity-100 translate-y-0': i <= currentStepIndex,
                 'opacity-20 translate-y-1': i > currentStepIndex
               }">
            <div class="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300"
                 [ngClass]="{
                   'bg-emerald-500 text-white': i < currentStepIndex || (i === currentStepIndex && isComplete),
                   'bg-indigo-600 text-white animate-spin': i === currentStepIndex && !isComplete,
                   'bg-slate-200 text-slate-400': i > currentStepIndex
                 }">
              <svg *ngIf="i < currentStepIndex || (i === currentStepIndex && isComplete)" xmlns="http://www.w3.org/2000/svg" class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6L9 17l-5-5"/></svg>
              <div *ngIf="i === currentStepIndex && !isComplete" class="w-1.5 h-1.5 rounded-full bg-white"></div>
            </div>

            <span [ngClass]="{
              'text-slate-900 font-semibold': i === currentStepIndex,
              'text-slate-600': i < currentStepIndex,
              'text-slate-400': i > currentStepIndex
            }">
              {{ step.text }}
            </span>
          </div>
        </div>

        <!-- Progress Bar & Status Footer -->
        <div class="space-y-2 pt-1">
          <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-sky-500 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300 ease-out"
                 [style.width.%]="progressPercent"></div>
          </div>
          <div class="flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>{{ statusText }}</span>
            <span>{{ progressPercent }}%</span>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class WelcomeComponent implements OnInit, OnDestroy {
  @Output() completed = new EventEmitter<void>();

  isFadingOut = false;
  currentStepIndex = 0;
  progressPercent = 0;
  isComplete = false;

  steps = [
    { text: 'Welcome to JANSEVA', duration: 400 },
    { text: 'Connecting Citizen Services...', duration: 500 },
    { text: 'Loading Government Departments...', duration: 500 },
    { text: 'Preparing AI Assistant...', duration: 500 },
    { text: 'Fetching Government Updates...', duration: 400 },
    { text: 'Ready.', duration: 300 }
  ];

  private intervalId: any;
  private progressIntervalId: any;

  get statusText(): string {
    if (this.isComplete) return 'Platform Ready';
    return this.steps[this.currentStepIndex]?.text || 'Initializing...';
  }

  ngOnInit(): void {
    this.startProgressTimer();
    this.startStepSequence();
  }

  ngOnDestroy(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.progressIntervalId) clearInterval(this.progressIntervalId);
  }

  private startProgressTimer(): void {
    const totalDuration = 2500; // ~2.5 seconds total
    const updateFreq = 40; // update every 40ms
    const stepIncrement = 100 / (totalDuration / updateFreq);

    this.progressIntervalId = setInterval(() => {
      if (this.progressPercent < 100) {
        this.progressPercent = Math.min(100, Math.round(this.progressPercent + stepIncrement));
      } else {
        clearInterval(this.progressIntervalId);
      }
    }, updateFreq);
  }

  private startStepSequence(): void {
    let delay = 0;
    this.steps.forEach((step, index) => {
      delay += step.duration;
      setTimeout(() => {
        this.currentStepIndex = index;
        if (index === this.steps.length - 1) {
          this.isComplete = true;
          this.progressPercent = 100;
          setTimeout(() => this.finishWelcome(), 400);
        }
      }, delay);
    });
  }

  skipWelcome(): void {
    this.finishWelcome();
  }

  private finishWelcome(): void {
    if (this.isFadingOut) return;
    this.isFadingOut = true;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('welcomeSeen', 'true');
    }
    setTimeout(() => {
      this.completed.emit();
    }, 700);
  }
}
