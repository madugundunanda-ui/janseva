import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-tour',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Optional Tour Invitation Dialog -->
    <div *ngIf="showPrompt" class="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div class="max-w-sm w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 text-center space-y-6 animate-in fade-in zoom-in duration-300">
        
        <div class="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-2xl mx-auto shadow-xs">
          ✨
        </div>

        <div class="space-y-2">
          <h3 class="text-xl font-extrabold text-slate-900">Welcome to JANSEVA</h3>
          <p class="text-xs text-slate-600 leading-relaxed">
            Would you like a 60-second guided tour of your citizen dashboard features?
          </p>
        </div>

        <div class="flex items-center gap-3 pt-2">
          <button (click)="startTour()" class="btn-primary flex-1 py-2.5 text-xs font-semibold">
            Start Tour (60s)
          </button>
          <button (click)="skipTour()" class="btn-secondary py-2.5 px-4 text-xs font-semibold">
            Skip
          </button>
        </div>

      </div>
    </div>

    <!-- Active Tour Spotlight Step Modal -->
    <div *ngIf="isTourActive" class="fixed inset-0 z-[130] pointer-events-none flex items-center justify-center p-4">
      <!-- Dark Overlay -->
      <div class="absolute inset-0 bg-slate-950/70 pointer-events-auto"></div>

      <!-- Tour Step Card -->
      <div class="relative z-10 max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-200 space-y-6 pointer-events-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
        
        <!-- Step Progress Badge -->
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wider">
            Step {{ currentStepIndex + 1 }} of {{ steps.length }}
          </span>
          <button (click)="skipTour()" class="text-slate-400 hover:text-slate-600 font-bold">✕ Close</button>
        </div>

        <!-- Content -->
        <div class="space-y-2">
          <div class="text-2xl">{{ steps[currentStepIndex].icon }}</div>
          <h4 class="text-lg font-bold text-slate-900">{{ steps[currentStepIndex].title }}</h4>
          <p class="text-xs text-slate-600 leading-relaxed">{{ steps[currentStepIndex].desc }}</p>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between pt-2 border-t border-slate-100">
          <button (click)="prevStep()" [disabled]="currentStepIndex === 0" class="text-xs font-semibold text-slate-500 hover:text-slate-900 disabled:opacity-30">
            ← Previous
          </button>

          <button (click)="nextStep()" class="btn-primary py-2 px-5 text-xs font-semibold">
            {{ currentStepIndex === steps.length - 1 ? 'Finish Tour' : 'Next Step →' }}
          </button>
        </div>

      </div>
    </div>
  `
})
export class UserTourComponent implements OnInit {
  @Output() tourEnded = new EventEmitter<void>();

  showPrompt = false;
  isTourActive = false;
  currentStepIndex = 0;

  steps = [
    {
      icon: '🚀',
      title: 'Welcome to JANSEVA AI Governance',
      desc: 'Your single portal for transparent civic grievance redressal, real-time SLA tracking, and verified field resolutions.'
    },
    {
      icon: '📝',
      title: 'Raise Grievance via Voice & Photo',
      desc: 'Click "Raise Complaint" to capture photos or speak in English, Telugu, Tamil, Kannada, or Hindi. AI instantly detects department and priority.'
    },
    {
      icon: '🤖',
      title: 'JANSEVA AI Copilot & Triage',
      desc: 'Ask our AI Assistant any question regarding municipal services, tracking status, or departmental emergency hotlines.'
    },
    {
      icon: '📰',
      title: 'Live Government Updates',
      desc: 'Stay informed with verified state policies, municipal notices, and emergency alerts filtered by state and district.'
    },
    {
      icon: '⭐',
      title: 'Civic Trust Points & Profile',
      desc: 'Earn Civic Trust Points for auditing resolved complaints and helping keep your municipal ward clean and safe.'
    }
  ];

  ngOnInit(): void {
    if (typeof window !== 'undefined' && window.sessionStorage.getItem('showGuidedTourPrompt') === 'true') {
      this.showPrompt = true;
      window.sessionStorage.removeItem('showGuidedTourPrompt');
    }
  }

  startTour(): void {
    this.showPrompt = false;
    this.isTourActive = true;
    this.currentStepIndex = 0;
  }

  skipTour(): void {
    this.showPrompt = false;
    this.isTourActive = false;
    this.tourEnded.emit();
  }

  nextStep(): void {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
    } else {
      this.isTourActive = false;
      this.tourEnded.emit();
    }
  }

  prevStep(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
    }
  }
}
