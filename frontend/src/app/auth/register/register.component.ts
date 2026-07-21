import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService, LanguageCode } from '../../core/services/translation.service';
import { EmailOtpService } from '../../core/services/email-otp.service';
import { SmsService } from '../../core/services/sms.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  template: `
    <div class="min-h-screen flex w-full bg-slate-50 text-slate-900 font-sans">
      
      <!-- Left Split Panel: Brand & Platform Showcase -->
      <div class="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
            J
          </div>
          <div>
            <span class="font-bold text-xl tracking-tight block leading-none">JANSEVA</span>
            <span class="text-xs text-indigo-400 font-medium">AI Civic Governance Platform</span>
          </div>
        </div>

        <div class="relative z-10 space-y-6 my-auto max-w-lg">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/80 border border-indigo-700/60 text-xs font-bold text-indigo-300 uppercase tracking-wider">
            <span>Verified Citizen Onboarding</span>
          </div>

          <h1 class="text-3xl font-extrabold tracking-tight leading-tight text-slate-100">
            Join the Next-Gen Civic Redressal Network
          </h1>
          <p class="text-slate-300 text-sm leading-relaxed">
            Register your Citizen Account with Email & SMS OTP security. Track complaint SLA timelines live, earn Civic Points, and receive AI-verified resolution proof.
          </p>

          <div class="space-y-3 pt-2">
            <div class="flex items-center gap-3 text-xs text-slate-200">
              <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</span>
              Backend Email & Mobile OTP Verification
            </div>
            <div class="flex items-center gap-3 text-xs text-slate-200">
              <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</span>
              Multilingual Voice Input (5 Languages)
            </div>
            <div class="flex items-center gap-3 text-xs text-slate-200">
              <span class="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">✓</span>
              AI Vision & Gemini Issue Classification
            </div>
          </div>
        </div>

        <div class="relative z-10 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-6">
          <span>© 2026 Ministry of Electronics & IT Governance</span>
          <span>Made in India 🇮🇳</span>
        </div>
      </div>

      <!-- Right Split Panel: Multi-Step Registration Stepper -->
      <div class="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 md:p-14">
        
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-2 lg:hidden">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">J</div>
            <span class="font-bold text-lg text-slate-900">JANSEVA</span>
          </div>

          <select [value]="translationService.currentLang()" (change)="onLanguageChange($event)" 
                  class="select-field text-xs py-1.5 px-3 bg-white border border-slate-200 ml-auto max-w-[140px]">
            <option value="en">English (EN)</option>
            <option value="te">తెలుగు (TE)</option>
            <option value="ta">தமிழ் (TA)</option>
            <option value="kn">ಕನ್ನಡ (KN)</option>
            <option value="hi">हिंदी (HI)</option>
          </select>
        </div>

        <div class="max-w-md w-full mx-auto my-auto space-y-6">
          
          <!-- Header & Stepper Progress -->
          <div>
            <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Register Citizen Account</h2>
            <p class="text-xs text-slate-500 mt-1">Step {{ currentStep }} of 4 — {{ getStepTitle() }}</p>
          </div>

          <!-- Stepper Progress Bar -->
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs font-mono text-slate-600 font-bold">
              <span>Progress</span>
              <span>{{ getProgressPercent() }}%</span>
            </div>
            <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div class="h-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-500 rounded-full"
                   [style.width.%]="getProgressPercent()"></div>
            </div>
          </div>

          <!-- Error Alert Banner -->
          <div *ngIf="errorMessage" class="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium space-y-2">
            <div class="flex items-center justify-between">
              <span>{{ errorMessage }}</span>
              <button (click)="errorMessage = ''" class="text-rose-500 hover:text-rose-800 font-bold ml-2">✕</button>
            </div>
            <div *ngIf="isDuplicateAccount" class="pt-1 border-t border-rose-200/60">
              <a [routerLink]="['/auth/citizen/login']" class="text-indigo-700 font-bold hover:underline">Click here to Sign In directly →</a>
            </div>
          </div>

          <!-- STEP 1: Basic Information -->
          <div *ngIf="currentStep === 1" class="space-y-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-700 block">Full Name</label>
              <input type="text" name="name" [(ngModel)]="userData.name" class="input-field" placeholder="Full legal name">
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-700 block">Municipal Ward / Address</label>
              <input type="text" name="address" [(ngModel)]="userData.address" class="input-field" placeholder="City, Ward No. 12">
            </div>

            <button (click)="goToStep2()" [disabled]="!userData.name || !userData.address" class="btn-primary w-full py-2.5 text-sm font-semibold">
              Continue to Email Verification →
            </button>
          </div>

          <!-- STEP 2: Email OTP Verification -->
          <div *ngIf="currentStep === 2" class="space-y-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-700 block">Gmail Address</label>
              <input type="email" name="email" [(ngModel)]="userData.email" (ngModelChange)="validateEmail()" [disabled]="emailOtpSent" class="input-field" placeholder="name@gmail.com">
              <span *ngIf="emailError" class="text-rose-600 text-xs font-medium block mt-0.5">{{ emailError }}</span>
            </div>

            <div *ngIf="!emailOtpSent">
              <button (click)="sendEmailOtp()" [disabled]="loading || !userData.email || emailError !== ''" class="btn-primary w-full py-2.5 text-xs font-semibold">
                <span *ngIf="loading">Sending OTP...</span>
                <span *ngIf="!loading">Send Email OTP</span>
              </button>
            </div>

            <div *ngIf="emailOtpSent" class="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-slate-700">Enter 6-Digit Email OTP</span>
                <span class="font-mono text-indigo-600 font-bold" *ngIf="emailTimer > 0">Expires in {{ formatTimer(emailTimer) }}</span>
                <span class="font-mono text-rose-600 font-bold" *ngIf="emailTimer === 0">OTP Expired</span>
              </div>

              <input type="text" [(ngModel)]="emailOtpCode" maxLength="6" class="input-field text-center font-mono tracking-widest text-lg font-bold" placeholder="• • • • • •">

              <div *ngIf="devEmailOtp" class="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-mono">
                [Dev Mode OTP]: {{ devEmailOtp }}
              </div>

              <div class="flex items-center gap-2">
                <button (click)="verifyEmailOtp()" [disabled]="loading || emailOtpCode.length !== 6" class="btn-primary flex-1 py-2 text-xs font-semibold">
                  <span *ngIf="loading">Verifying...</span>
                  <span *ngIf="!loading">Verify OTP</span>
                </button>
                
                <button (click)="sendEmailOtp()" [disabled]="emailTimer > 0" class="btn-secondary py-2 px-3 text-xs font-semibold">
                  Resend
                </button>
              </div>
            </div>

            <button (click)="currentStep = 1" class="text-xs text-slate-500 hover:text-slate-700 block mx-auto">← Back to Basic Details</button>
          </div>

          <!-- STEP 3: Mobile SMS OTP Verification -->
          <div *ngIf="currentStep === 3" class="space-y-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-700 block">Mobile Phone Number</label>
              <input type="text" name="phone" [(ngModel)]="userData.phone" (ngModelChange)="validatePhone()" [disabled]="smsOtpSent" class="input-field" placeholder="9876543210">
              <span *ngIf="phoneError" class="text-rose-600 text-xs font-medium block mt-0.5">{{ phoneError }}</span>
            </div>

            <div *ngIf="!smsOtpSent">
              <button (click)="sendSmsOtp()" [disabled]="loading || !userData.phone || phoneError !== ''" class="btn-primary w-full py-2.5 text-xs font-semibold">
                <span *ngIf="loading">Dispatched SMS OTP...</span>
                <span *ngIf="!loading">Send SMS OTP (MSG91)</span>
              </button>
            </div>

            <div *ngIf="smsOtpSent" class="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div class="flex items-center justify-between text-xs">
                <span class="font-semibold text-slate-700">Enter 6-Digit Mobile OTP</span>
                <span class="font-mono text-indigo-600 font-bold" *ngIf="smsTimer > 0">Expires in {{ formatTimer(smsTimer) }}</span>
                <span class="font-mono text-rose-600 font-bold" *ngIf="smsTimer === 0">OTP Expired</span>
              </div>

              <input type="text" [(ngModel)]="smsOtpCode" maxLength="6" class="input-field text-center font-mono tracking-widest text-lg font-bold" placeholder="• • • • • •">

              <div *ngIf="devSmsOtp" class="p-2 rounded bg-amber-50 border border-amber-200 text-[11px] text-amber-800 font-mono">
                [Dev Mode SMS OTP]: {{ devSmsOtp }}
              </div>

              <div class="flex items-center gap-2">
                <button (click)="verifySmsOtp()" [disabled]="loading || smsOtpCode.length !== 6" class="btn-primary flex-1 py-2 text-xs font-semibold">
                  <span *ngIf="loading">Verifying...</span>
                  <span *ngIf="!loading">Verify Mobile</span>
                </button>
                
                <button (click)="sendSmsOtp()" [disabled]="smsTimer > 0" class="btn-secondary py-2 px-3 text-xs font-semibold">
                  Resend
                </button>
              </div>
            </div>

            <button (click)="currentStep = 2" class="text-xs text-slate-500 hover:text-slate-700 block mx-auto">← Back to Email Verification</button>
          </div>

          <!-- STEP 4: Password Creation, Confirm Password & Strength Meter -->
          <div *ngIf="currentStep === 4" class="space-y-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-700 block">Password</label>
              <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" name="password" [(ngModel)]="userData.password" (ngModelChange)="checkPasswordRequirements()" class="input-field pr-10">
                <button type="button" (click)="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                  <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                </button>
              </div>
            </div>

            <!-- Password Strength Meter Bar -->
            <div class="space-y-1">
              <div class="flex items-center justify-between text-[11px] font-bold">
                <span class="text-slate-500">Password Strength:</span>
                <span [ngClass]="getStrengthLabelClass()">{{ getStrengthLabel() }}</span>
              </div>
              <div class="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div class="h-full transition-all duration-300 rounded-full" [ngClass]="getStrengthBarClass()" [style.width.%]="getStrengthScore() * 25"></div>
              </div>
            </div>

            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-700 block">Confirm Password</label>
              <input type="password" name="confirmPassword" [(ngModel)]="confirmPassword" class="input-field" placeholder="Re-enter password">
              <span *ngIf="confirmPassword && confirmPassword !== userData.password" class="text-rose-600 text-[11px] font-medium block">
                ✕ Passwords do not match.
              </span>
              <span *ngIf="confirmPassword && confirmPassword === userData.password" class="text-emerald-600 text-[11px] font-bold block">
                ✓ Passwords match.
              </span>
            </div>

            <!-- Live Password Requirements Checklist -->
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span class="font-bold text-slate-700 block">Requirements Checklist:</span>
              <div class="grid grid-cols-2 gap-2 text-[11px]">
                <div class="flex items-center gap-1.5" [ngClass]="pwdChecks.length ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                  <span>{{ pwdChecks.length ? '✔' : '○' }}</span> Min 8 characters
                </div>
                <div class="flex items-center gap-1.5" [ngClass]="pwdChecks.upper ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                  <span>{{ pwdChecks.upper ? '✔' : '○' }}</span> One uppercase letter
                </div>
                <div class="flex items-center gap-1.5" [ngClass]="pwdChecks.number ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                  <span>{{ pwdChecks.number ? '✔' : '○' }}</span> One number
                </div>
                <div class="flex items-center gap-1.5" [ngClass]="pwdChecks.special ? 'text-emerald-600 font-bold' : 'text-slate-400'">
                  <span>{{ pwdChecks.special ? '✔' : '○' }}</span> One special char
                </div>
              </div>
            </div>

            <button (click)="onSubmit()" [disabled]="loading || !isPasswordValid || confirmPassword !== userData.password" class="btn-primary w-full py-2.5 text-sm font-semibold">
              <span *ngIf="loading">Creating Citizen Account...</span>
              <span *ngIf="!loading">Complete Citizen Registration</span>
            </button>
          </div>

          <div class="text-center text-xs text-slate-500 pt-2">
            Already registered? 
            <a [routerLink]="['/auth/citizen/login']" class="text-indigo-600 hover:underline font-bold ml-1">Sign In</a>
          </div>
        </div>

        <div class="text-center text-xs text-slate-400 pt-8">
          Protected by Enterprise Governance Security Standards
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent implements OnInit, OnDestroy {
  currentStep = 1;

  userData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    role: 'citizen' as const,
  };

  confirmPassword = '';
  loading = false;
  errorMessage = '';
  emailError = '';
  phoneError = '';
  isDuplicateAccount = false;
  showPassword = false;

  emailOtpSent = false;
  emailVerified = false;
  emailOtpCode = '';
  devEmailOtp = '';
  emailTimer = 0;
  private emailInterval: any;

  smsOtpSent = false;
  smsVerified = false;
  smsOtpCode = '';
  devSmsOtp = '';
  smsTimer = 0;
  private smsInterval: any;

  pwdChecks = {
    length: false,
    upper: false,
    number: false,
    special: false
  };

  constructor(
    private authService: AuthService,
    public translationService: TranslationService,
    private emailOtpService: EmailOtpService,
    private smsService: SmsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnDestroy(): void {
    if (this.emailInterval) clearInterval(this.emailInterval);
    if (this.smsInterval) clearInterval(this.smsInterval);
  }

  onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.translationService.setLang(select.value as LanguageCode);
  }

  validateEmail() {
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (this.userData.email && !gmailRegex.test(this.userData.email)) {
      this.emailError = 'Citizen registration requires a valid Gmail address (@gmail.com).';
    } else {
      this.emailError = '';
    }
  }

  validatePhone() {
    const phoneRegex = /^[6-9]\d{9}$/;
    const cleanPhone = (this.userData.phone || '').replace(/\D/g, '');
    if (cleanPhone && !phoneRegex.test(cleanPhone)) {
      this.phoneError = 'Please enter a valid 10-digit mobile number.';
    } else {
      this.phoneError = '';
    }
  }

  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Basic Details';
      case 2: return 'Email OTP Verification';
      case 3: return 'Mobile SMS OTP';
      case 4: return 'Create Password';
      default: return '';
    }
  }

  getProgressPercent(): number {
    return this.currentStep * 25;
  }

  goToStep2() {
    if (!this.userData.name || !this.userData.address) return;
    this.currentStep = 2;
  }

  sendEmailOtp() {
    this.validateEmail();
    if (this.emailError) return;

    this.loading = true;
    this.errorMessage = '';
    this.isDuplicateAccount = false;

    this.emailOtpService.sendOtp(this.userData.email).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (!res.success && res.isDuplicate) {
          this.errorMessage = res.message;
          this.isDuplicateAccount = true;
          return;
        }
        this.emailOtpSent = true;
        this.devEmailOtp = res.devOtp || '';
        this.startTimer('email');
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Failed to dispatch Email OTP.';
        if (err?.error?.isDuplicate) {
          this.isDuplicateAccount = true;
        }
      }
    });
  }

  verifyEmailOtp() {
    this.loading = true;
    this.errorMessage = '';
    this.emailOtpService.verifyOtp(this.userData.email, this.emailOtpCode).subscribe({
      next: () => {
        this.loading = false;
        this.emailVerified = true;
        this.currentStep = 3;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Invalid Email OTP code.';
      }
    });
  }

  sendSmsOtp() {
    this.validatePhone();
    if (!this.userData.phone || this.phoneError) return;

    this.loading = true;
    this.errorMessage = '';
    this.isDuplicateAccount = false;

    this.smsService.sendOtp(this.userData.phone).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (!res.success && res.isDuplicate) {
          this.errorMessage = res.message;
          this.isDuplicateAccount = true;
          return;
        }
        this.smsOtpSent = true;
        this.devSmsOtp = res.devOtp || '';
        this.startTimer('sms');
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Failed to dispatch SMS OTP.';
        if (err?.error?.isDuplicate) {
          this.isDuplicateAccount = true;
        }
      }
    });
  }

  verifySmsOtp() {
    this.loading = true;
    this.errorMessage = '';
    this.smsService.verifyOtp(this.userData.phone, this.smsOtpCode).subscribe({
      next: () => {
        this.loading = false;
        this.smsVerified = true;
        this.currentStep = 4;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Invalid SMS OTP code.';
      }
    });
  }

  checkPasswordRequirements() {
    const pwd = this.userData.password || '';
    this.pwdChecks.length = pwd.length >= 8;
    this.pwdChecks.upper = /[A-Z]/.test(pwd);
    this.pwdChecks.number = /[0-9]/.test(pwd);
    this.pwdChecks.special = /[^A-Za-z0-9]/.test(pwd);
  }

  getStrengthScore(): number {
    let score = 0;
    if (this.pwdChecks.length) score++;
    if (this.pwdChecks.upper) score++;
    if (this.pwdChecks.number) score++;
    if (this.pwdChecks.special) score++;
    return score;
  }

  getStrengthLabel(): string {
    const score = this.getStrengthScore();
    if (score <= 1) return 'Weak';
    if (score === 2) return 'Medium';
    if (score === 3) return 'Strong';
    return 'Very Strong';
  }

  getStrengthLabelClass(): string {
    const score = this.getStrengthScore();
    if (score <= 1) return 'text-rose-600';
    if (score === 2) return 'text-amber-600';
    if (score === 3) return 'text-sky-600';
    return 'text-emerald-600';
  }

  getStrengthBarClass(): string {
    const score = this.getStrengthScore();
    if (score <= 1) return 'bg-rose-500';
    if (score === 2) return 'bg-amber-500';
    if (score === 3) return 'bg-sky-500';
    return 'bg-emerald-500';
  }

  get isPasswordValid(): boolean {
    return this.pwdChecks.length && this.pwdChecks.upper && this.pwdChecks.number && this.pwdChecks.special;
  }

  startTimer(type: 'email' | 'sms') {
    if (type === 'email') {
      this.emailTimer = 300; // 5 mins
      if (this.emailInterval) clearInterval(this.emailInterval);
      this.emailInterval = setInterval(() => {
        if (this.emailTimer > 0) this.emailTimer--;
        else clearInterval(this.emailInterval);
      }, 1000);
    } else {
      this.smsTimer = 300;
      if (this.smsInterval) clearInterval(this.smsInterval);
      this.smsInterval = setInterval(() => {
        if (this.smsTimer > 0) this.smsTimer--;
        else clearInterval(this.smsInterval);
      }, 1000);
    }
  }

  formatTimer(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  onSubmit() {
    if (!this.isPasswordValid || this.confirmPassword !== this.userData.password) return;
    this.loading = true;
    this.errorMessage = '';
    this.authService.register(this.userData).subscribe({
      next: () => {
        this.loading = false;
        if (typeof window !== 'undefined') {
          window.sessionStorage.setItem('showGuidedTourPrompt', 'true');
        }
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        const friendly = err?.friendlyMessage || err?.error?.message || err?.message || '';
        this.errorMessage = friendly || 'Registration failed.';
        this.loading = false;
      },
    });
  }
}
