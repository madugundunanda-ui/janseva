import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService, LanguageCode } from '../../core/services/translation.service';
import { DemoModeService } from '../../core/services/demo-mode.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  template: `
    <div class="min-h-screen flex w-full bg-slate-50 text-slate-900 font-sans">
      
      <!-- Left Split Panel: Brand & Platform Showcase -->
      <div class="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <!-- Subtle Glow Circle -->
        <div class="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none"></div>

        <!-- Top Brand Header -->
        <div class="relative z-10 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-md">
            J
          </div>
          <div>
            <span class="font-bold text-xl tracking-tight block leading-none">JANSEVA</span>
            <span class="text-xs text-indigo-400 font-medium">AI Civic Governance Platform</span>
          </div>
        </div>

        <!-- Center Showcase Graphic & Metrics -->
        <div class="relative z-10 space-y-8 my-auto max-w-lg">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-700/50 text-xs font-semibold text-indigo-300">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            National Hackathon Edition 2026
          </div>

          <h1 class="text-3xl font-extrabold tracking-tight leading-tight text-slate-100">
            One Complaint. <br>
            One Intelligent Resolution.
          </h1>

          <p class="text-slate-300 text-sm leading-relaxed">
            JANSEVA integrates multilingual voice NLP, automated department triaging, and real-time SLA risk forecasting to eliminate administrative bottlenecks across Bharat.
          </p>

          <!-- Key Metrics Counter Bar -->
          <div class="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div>
              <span class="text-2xl font-bold text-white block">142.8k+</span>
              <span class="text-[11px] text-slate-400 uppercase font-medium">Resolved Cases</span>
            </div>
            <div>
              <span class="text-2xl font-bold text-emerald-400 block">98.4%</span>
              <span class="text-[11px] text-slate-400 uppercase font-medium">SLA Compliance</span>
            </div>
            <div>
              <span class="text-2xl font-bold text-indigo-400 block">3.2 hrs</span>
              <span class="text-[11px] text-slate-400 uppercase font-medium">Avg Triage Time</span>
            </div>
          </div>
        </div>

        <!-- Left Panel Footer -->
        <div class="relative z-10 text-xs text-slate-500 flex items-center justify-between border-t border-slate-800/80 pt-6">
          <span>© 2026 Ministry of Electronics & IT Governance</span>
          <span>WCAG AA Compliant</span>
        </div>
      </div>

      <!-- Right Split Panel: Authentication Form -->
      <div class="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 md:p-16">
        
        <!-- Header Controls -->
        <div class="flex items-center justify-between mb-8">
          <div class="flex items-center gap-2 lg:hidden">
            <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">J</div>
            <span class="font-bold text-lg text-slate-900">JANSEVA</span>
          </div>

          <!-- Language & Demo Mode Controls -->
          <div class="flex items-center gap-3 ml-auto">
            <button class="btn-secondary text-xs py-1.5 px-3" (click)="demoService.openTour()" title="Interactive Feature Tour">
              <span>Guided Tour</span>
            </button>

            <select [value]="translationService.currentLang()" (change)="onLanguageChange($event)" 
                    class="select-field text-xs py-1.5 px-3 bg-white border border-slate-200">
              <option value="en">English (EN)</option>
              <option value="te">తెలుగు (TE)</option>
              <option value="ta">தமிழ் (TA)</option>
              <option value="kn">ಕನ್ನಡ (KN)</option>
            </select>
          </div>
        </div>

        <!-- Form Center Container -->
        <div class="max-w-md w-full mx-auto my-auto space-y-6">
          
          <div>
            <h2 class="text-2xl font-bold text-slate-900 tracking-tight">Sign In to JANSEVA</h2>
            <p class="text-sm text-slate-500 mt-1">Select your portal role to access authorized tools.</p>
          </div>

          <!-- Role Selector Tabs -->
          <div class="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
            <button (click)="selectRole('citizen')" 
                    class="py-2 rounded-lg transition-all"
                    [ngClass]="selectedRole === 'citizen' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'">
              Citizen
            </button>
            <button (click)="selectRole('officer')" 
                    class="py-2 rounded-lg transition-all"
                    [ngClass]="selectedRole === 'officer' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'">
              Officer
            </button>
            <button (click)="selectRole('supervisor')" 
                    class="py-2 rounded-lg transition-all"
                    [ngClass]="selectedRole === 'supervisor' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'">
              Supervisor
            </button>
            <button (click)="selectRole('admin')" 
                    class="py-2 rounded-lg transition-all"
                    [ngClass]="selectedRole === 'admin' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'">
              Admin
            </button>
          </div>

          <!-- Quick Demo Preset Fill Notification Pill -->
          <div class="p-3 rounded-lg bg-indigo-50/80 border border-indigo-100 flex items-center justify-between text-xs">
            <span class="text-indigo-950 font-medium">✨ Hackathon Demo Preset Auto-Filled</span>
            <button (click)="selectRole(selectedRole)" class="text-indigo-600 font-bold hover:underline">Reset</button>
          </div>

          <!-- Error Alert State -->
          <div *ngIf="errorMessage" class="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {{ errorMessage }}
          </div>

          <!-- Login Form -->
          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div class="space-y-1">
              <label class="text-xs font-semibold text-slate-700 block">{{ translationService.t('EMAIL_ADDRESS') }}</label>
              <input type="email" name="email" [(ngModel)]="credentials.email" required 
                     class="input-field" 
                     [placeholder]="translationService.t('PH_EMAIL_EXAMPLE')">
            </div>

            <div class="space-y-1">
              <div class="flex justify-between items-center">
                <label class="text-xs font-semibold text-slate-700 block">{{ translationService.t('PASSWORD') }}</label>
                <a href="#" class="text-xs text-indigo-600 hover:underline font-medium">{{ translationService.t('FORGOT_SECRET') }}</a>
              </div>
              <div class="relative">
                <input [type]="showPassword ? 'text' : 'password'" name="password" [(ngModel)]="credentials.password" required 
                       class="input-field pr-10">
                <button type="button" (click)="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
                  <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                </button>
              </div>
            </div>

            <button type="submit" [disabled]="loading" class="btn-primary w-full py-2.5 text-sm font-semibold">
              <span *ngIf="loading">Authenticating Gateway...</span>
              <span *ngIf="!loading">Sign In to Portal</span>
            </button>
          </form>

          <!-- Register Link for Citizen -->
          <div *ngIf="selectedRole === 'citizen'" class="text-center text-xs text-slate-500 pt-2">
            Don't have an account? 
            <a [routerLink]="['/auth/register']" class="text-indigo-600 hover:underline font-bold ml-1">Create Citizen Account</a>
          </div>
        </div>

        <!-- Footer -->
        <div class="text-center text-xs text-slate-400 pt-8">
          Protected by Enterprise JWT Authentication & RBAC Policy
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  credentials = {
    email: '',
    password: '',
  };
  selectedRole: 'citizen' | 'officer' | 'supervisor' | 'admin' = 'citizen';
  loading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    public translationService: TranslationService,
    public demoService: DemoModeService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.redirectToDashboard();
    }
    
    this.route.data.subscribe(data => {
      if (data['role']) {
        this.selectRole(data['role'] as any);
      } else {
        this.selectRole('citizen');
      }
    });
  }

  selectRole(role: 'citizen' | 'officer' | 'supervisor' | 'admin') {
    this.selectedRole = role;
    this.errorMessage = '';

    if (role === 'admin') {
      this.credentials.email = 'admin1@janseva.gov.in';
      this.credentials.password = 'Password@123';
    } else if (role === 'supervisor') {
      this.credentials.email = 'super1@works.janseva.gov.in';
      this.credentials.password = 'Password@123';
    } else if (role === 'officer') {
      this.credentials.email = 'officer1@water.janseva.gov.in';
      this.credentials.password = 'Password@123';
    } else {
      this.credentials.email = 'bhavna.citizen@gmail.com';
      this.credentials.password = 'Password@123';
    }
  }

  onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.translationService.setLang(select.value as LanguageCode);
  }

  onSubmit() {
    if (this.loading) return;

    this.loading = true;
    this.errorMessage = '';

    const payload = {
      email: this.credentials.email,
      password: this.credentials.password,
      role: this.selectedRole
    };

    this.authService.login(payload).pipe(
      finalize(() => {
        this.loading = false;
      })
    ).subscribe({
      next: (res) => {
        this.redirectToDashboard(res?.user?.role);
      },
      error: (err) => {
        const status = err?.status;
        const friendly = err?.friendlyMessage || err?.error?.message || err?.message || '';
        if ((status === 401 || status === 403) && /role/i.test(friendly)) {
          this.errorMessage = "The requested role does not match this user's account role.";
        } else if (status === 403) {
          this.errorMessage = 'Access forbidden for the selected role.';
        } else if (status === 401) {
          this.errorMessage = 'Invalid credentials.';
        } else {
          this.errorMessage = friendly || 'Authentication Gateway Rejected Credentials';
        }
      },
    });
  }

  redirectToDashboard(role?: string) {
    const userRole = role || this.authService.userRole();
    if (userRole === 'citizen') {
      this.router.navigate(['/dashboard/citizen']);
    } else if (userRole === 'officer') {
      this.router.navigate(['/dashboard/officer']);
    } else if (userRole === 'supervisor') {
      this.router.navigate(['/dashboard/supervisor']);
    } else if (userRole === 'admin') {
      this.router.navigate(['/dashboard/admin']);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
