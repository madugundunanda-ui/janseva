import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { TranslationService, LanguageCode } from '../../core/services/translation.service';

@Component({
  selector: 'app-register',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6 relative overflow-hidden tech-dots-bg">
      <!-- Glow backdrop -->
      <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#A33F93]/15 rounded-full blur-[120px] pointer-events-none"></div>

      <!-- Register Card -->
      <div class="w-full max-w-lg glass-panel glow-card rounded-2xl p-8 relative z-10">
        
        <!-- Header with Language Switcher -->
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-[#A33F93] animate-pulse"></span>
            <span class="font-mono text-[9px] tracking-widest text-[#A33F93] uppercase">{{ translationService.t('SECURE_GATEWAY') }}</span>
          </div>
          <!-- Language Switcher -->
          <select [value]="translationService.currentLang()" (change)="onLanguageChange($event)" class="px-2.5 py-1 rounded-full border border-var bg-glass-var text-primary-var font-mono text-[9px] tracking-wider uppercase bg-transparent outline-none cursor-pointer hover:border-[#A33F93]/50 transition-colors">
            <option value="en" class="bg-black text-white">EN</option>
            <option value="te" class="bg-black text-white">TE (తెలుగు)</option>
            <option value="ta" class="bg-black text-white">TA (தமிழ்)</option>
            <option value="kn" class="bg-black text-white">KN (ಕನ್ನಡ)</option>
          </select>
        </div>

        <div class="text-center mb-6">
          <h2 class="text-2xl font-bold tracking-tight uppercase font-mono text-glow">{{ translationService.t('CREATE_NODE') }}</h2>
        </div>

        @if (errorMessage) {
          <div class="mb-6 p-4 rounded bg-red-100 border border-red-300 text-red-700 font-mono text-xs uppercase tracking-wide">
            {{ errorMessage }}
          </div>
        }

        <!-- Signup Form -->
        <form (ngSubmit)="onSubmit()" class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="flex flex-col">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('NAME') }}</label>
              <input type="text" name="name" [(ngModel)]="userData.name" required class="glass-input" placeholder="Aarav Sharma">
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('EMAIL_ADDRESS') }}</label>
              <input type="email" name="email" [(ngModel)]="userData.email" required class="glass-input" placeholder="citizen@gmail.com">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="flex flex-col">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('PHONE') }}</label>
              <input type="text" name="phone" [(ngModel)]="userData.phone" required class="glass-input" placeholder="9876543210">
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('ADDRESS') }}</label>
              <input type="text" name="address" [(ngModel)]="userData.address" required class="glass-input" placeholder="Ward 12, Mumbai">
            </div>
          </div>

          <div class="flex flex-col">
            <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">{{ translationService.t('PASSWORD') }}</label>
            <input type="password" name="password" [(ngModel)]="userData.password" required class="glass-input" placeholder="••••••••">
          </div>

          <button type="submit" [disabled]="loading" class="w-full mt-2 py-3.5 rounded bg-[#A33F93] hover:bg-[#8c357f] text-white font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300 disabled:opacity-50">
            @if (loading) {
              {{ translationService.t('REGISTERING') }}
            } @else {
              {{ translationService.t('INIT_REGISTER') }}
            }
          </button>
        </form>

        <div class="mt-8 text-center text-xs font-mono text-muted-var">
          {{ translationService.t('ALREADY_ALIGNED') }} 
          <a [routerLink]="['/auth/login']" class="text-[#A33F93] hover:opacity-80 uppercase ml-1">{{ translationService.t('CONSOLE_LOGIN') }}</a>
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
export class RegisterComponent implements OnInit {
  userData = {
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    role: 'citizen' as const,
  };
  loading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    public translationService: TranslationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  onLanguageChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.translationService.setLang(select.value as LanguageCode);
  }

  onSubmit() {
    this.loading = true;
    this.errorMessage = '';
    this.authService.register(this.userData).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.errorMessage = err.message || 'Registration rejected by authentication module.';
        this.loading = false;
      },
    });
  }
}

