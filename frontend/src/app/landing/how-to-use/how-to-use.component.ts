import { Component, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationService } from '../../core/services/translation.service';

interface HowToUseStep {
  number: number;
  title: string;
  desc: string;
  speechText: string;
  icon: string;
}

@Component({
  selector: 'app-how-to-use',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section id="how-to-use" class="py-20 bg-slate-900 text-white font-sans relative overflow-hidden">
      
      <!-- Background Ambient Glow -->
      <div class="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute bottom-0 left-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-12">
        
        <!-- Header & Voice Assistant Guide Controls -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
          <div class="space-y-3 max-w-2xl">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-900/60 border border-indigo-700/60 text-xs font-bold text-indigo-300 uppercase tracking-wider">
              <span>Guided Citizen Journey</span>
            </div>
            <h2 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-100">
              How to Use JANSEVA Platform
            </h2>
            <p class="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Step-by-step citizen onboarding flow with real-time AI resolution verification.
            </p>
          </div>

          <!-- Synchronized Voice Guide Controls with Speed & State -->
          <div class="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 flex flex-wrap items-center gap-3 shrink-0 shadow-lg">
            
            <button (click)="toggleVoiceGuide()"
                    class="px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2.5 transition-all shadow-md cursor-pointer"
                    [ngClass]="{
                      'bg-emerald-500 text-white hover:bg-emerald-600': isSpeaking && !isPaused,
                      'bg-amber-500 text-white hover:bg-amber-600': isPaused,
                      'bg-indigo-600 text-white hover:bg-indigo-500': !isSpeaking
                    }">
              <span *ngIf="!isSpeaking" class="text-base">🎙️</span>
              <span *ngIf="isSpeaking && !isPaused" class="w-2 h-2 rounded-full bg-white animate-ping"></span>
              <span>
                {{ !isSpeaking ? 'Listen Instructions' : (isPaused ? 'Resume Guide' : 'Pause Guide') }}
              </span>
            </button>

            <!-- Replay Button -->
            <button (click)="replayVoiceGuide()" class="p-2.5 rounded-xl bg-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold cursor-pointer" title="Replay Guide From Start">
              🔄 Replay
            </button>

            <!-- Playback Speed Selector -->
            <div class="flex items-center gap-1.5 bg-slate-900/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-mono">
              <span class="text-slate-400 font-sans text-[11px]">Speed:</span>
              <select [(ngModel)]="playbackSpeed" (change)="changeSpeed()" class="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer">
                <option value="0.75" class="bg-slate-800 text-white">0.75x</option>
                <option value="1.0" class="bg-slate-800 text-white">1.0x (Normal)</option>
                <option value="1.25" class="bg-slate-800 text-white">1.25x</option>
                <option value="1.5" class="bg-slate-800 text-white">1.5x</option>
              </select>
            </div>

            <button *ngIf="isSpeaking" (click)="stopVoiceGuide()" class="text-xs text-rose-400 hover:underline font-semibold cursor-pointer">
              Stop
            </button>

            <!-- Audio Waveform Animation -->
            <div *ngIf="isSpeaking && !isPaused" class="flex items-center gap-1 h-5">
              <span class="w-1 bg-emerald-400 animate-bounce h-3 rounded-full"></span>
              <span class="w-1 bg-emerald-400 animate-bounce h-5 rounded-full delay-100"></span>
              <span class="w-1 bg-emerald-400 animate-bounce h-2.5 rounded-full delay-200"></span>
              <span class="w-1 bg-emerald-400 animate-bounce h-4 rounded-full delay-150"></span>
            </div>
          </div>
        </div>

        <!-- Interactive Timeline Visual Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div *ngFor="let step of steps; let i = index"
               [id]="'use-step-' + step.number"
               class="bg-slate-800/60 border rounded-2xl p-6 relative transition-all duration-500 flex flex-col justify-between space-y-4 cursor-pointer"
               (click)="playSingleStep(i)"
               [ngClass]="{
                 'border-emerald-500 bg-slate-800/90 shadow-xl shadow-emerald-500/10 ring-2 ring-emerald-500/40 scale-[1.02]': activeSpeakingStep === step.number,
                 'border-slate-700/80 hover:border-slate-600': activeSpeakingStep !== step.number
               }">
            
            <!-- Step Header & Number Badge -->
            <div class="flex items-center justify-between">
              <span class="w-8 h-8 rounded-xl font-mono text-xs font-bold flex items-center justify-center transition-colors"
                    [ngClass]="{
                      'bg-emerald-500 text-white': activeSpeakingStep === step.number,
                      'bg-indigo-600/30 text-indigo-400 border border-indigo-500/30': activeSpeakingStep !== step.number
                    }">
                0{{ step.number }}
              </span>
              <span class="text-2xl">{{ step.icon }}</span>
            </div>

            <!-- Title & Description -->
            <div class="space-y-2">
              <h3 class="text-base font-bold text-slate-100"
                  [ngClass]="{ 'text-emerald-400': activeSpeakingStep === step.number }">
                {{ step.title }}
              </h3>
              <p class="text-xs text-slate-400 leading-relaxed">
                {{ step.desc }}
              </p>
            </div>

            <!-- Active Speaking Indicator Badge -->
            <div *ngIf="activeSpeakingStep === step.number" class="pt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 animate-pulse">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Voice Explaining Step {{ step.number }}...</span>
            </div>

          </div>
        </div>

      </div>
    </section>
  `
})
export class HowToUseComponent implements OnDestroy {
  translationService = inject(TranslationService);

  isSpeaking = false;
  isPaused = false;
  activeSpeakingStep = 0;
  playbackSpeed = '1.0';
  private synth: SpeechSynthesis | null = null;

  steps: HowToUseStep[] = [
    {
      number: 1,
      title: 'Create Account',
      desc: 'Sign up as a citizen with legal name and municipal ward address.',
      speechText: 'Step 1: Create your Citizen Account with legal name and municipal ward.',
      icon: '👤'
    },
    {
      number: 2,
      title: 'Verify Email',
      desc: 'Enter 6-digit Email OTP sent securely by backend authentication.',
      speechText: 'Step 2: Enter the secure 6 digit Email OTP code.',
      icon: '✉️'
    },
    {
      number: 3,
      title: 'Verify Mobile',
      desc: 'Enter 6-digit SMS OTP dispatched to your mobile phone.',
      speechText: 'Step 3: Verify your mobile phone with SMS OTP code.',
      icon: '📱'
    },
    {
      number: 4,
      title: 'Raise Complaint',
      desc: 'Upload issue photo or speak description in your native language.',
      speechText: 'Step 4: Raise a complaint by uploading a photo or speaking in your native language.',
      icon: '📝'
    },
    {
      number: 5,
      title: 'Track Complaint',
      desc: 'Monitor real-time officer assignment, severity score, and SLA timeline.',
      speechText: 'Step 5: Track complaint progress and officer assignment live on your dashboard.',
      icon: '⏱️'
    },
    {
      number: 6,
      title: 'Receive Notifications',
      desc: 'Get automated updates via SMS and in-app alerts when status changes.',
      speechText: 'Step 6: Receive instant notifications when your complaint is updated.',
      icon: '🔔'
    },
    {
      number: 7,
      title: 'Verify Resolution',
      desc: 'AI vision verifies before-after photo match to confirm resolution.',
      speechText: 'Step 7: Confirm resolution via AI visual proof matching.',
      icon: '✅'
    }
  ];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  ngOnDestroy(): void {
    this.stopVoiceGuide();
  }

  toggleVoiceGuide(): void {
    if (!this.isSpeaking) {
      this.playVoiceGuide();
    } else if (this.isPaused) {
      this.resumeVoiceGuide();
    } else {
      this.pauseVoiceGuide();
    }
  }

  playVoiceGuide(): void {
    if (!this.synth) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    this.synth.cancel();
    this.isSpeaking = true;
    this.isPaused = false;
    this.speakStep(0);
  }

  replayVoiceGuide(): void {
    this.playVoiceGuide();
  }

  playSingleStep(index: number): void {
    if (!this.synth) return;
    this.synth.cancel();
    this.isSpeaking = true;
    this.isPaused = false;
    this.speakStep(index);
  }

  changeSpeed(): void {
    if (this.isSpeaking && !this.isPaused && this.synth) {
      // Re-trigger current step at new speed
      const currentIndex = this.activeSpeakingStep ? this.activeSpeakingStep - 1 : 0;
      this.synth.cancel();
      this.speakStep(currentIndex);
    }
  }

  private speakStep(index: number): void {
    if (index >= this.steps.length || !this.isSpeaking || !this.synth) {
      this.stopVoiceGuide();
      return;
    }

    const step = this.steps[index];
    this.activeSpeakingStep = step.number;

    const elem = document.getElementById(`use-step-${step.number}`);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    const langCode = this.translationService.currentLang();
    const voiceLangMap: Record<string, string> = {
      en: 'en-US',
      te: 'te-IN',
      ta: 'ta-IN',
      kn: 'kn-IN',
      hi: 'hi-IN'
    };

    const utterance = new SpeechSynthesisUtterance(step.speechText);
    utterance.lang = voiceLangMap[langCode] || 'en-US';
    utterance.rate = parseFloat(this.playbackSpeed) || 1.0;

    utterance.onend = () => {
      if (this.isSpeaking && !this.isPaused) {
        setTimeout(() => this.speakStep(index + 1), 300);
      }
    };

    utterance.onerror = () => {
      this.stopVoiceGuide();
    };

    this.synth.speak(utterance);
  }

  pauseVoiceGuide(): void {
    if (this.synth) {
      this.synth.pause();
    }
    this.isPaused = true;
  }

  resumeVoiceGuide(): void {
    if (this.synth) {
      this.synth.resume();
    }
    this.isPaused = false;
  }

  stopVoiceGuide(): void {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.isPaused = false;
    this.activeSpeakingStep = 0;
  }
}
