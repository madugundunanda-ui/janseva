import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ApiService, User } from '../../core/services/api.service';
import { TranslationService } from '../../core/services/translation.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="glass-panel p-6 rounded-xl border border-var space-y-6 pb-12 max-w-4xl">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-var pb-4">
        <div class="flex items-center gap-3">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <h2 class="font-mono text-xs tracking-widest text-cyan-400 uppercase font-bold">{{ translationService.t('CONSOLE_SETTINGS') }}</h2>
        </div>
      </div>

      <!-- Main Grid Layout -->
      <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
        
        <!-- Left Column: Profile Picture & Core stats -->
        <div class="md:col-span-4 flex flex-col items-center space-y-6 border-r border-white/5 pr-0 md:pr-8">
          <div class="relative group">
            <div class="w-32 h-32 rounded-full border-2 border-cyan-500/40 p-1 bg-cyan-950/20 shadow-[0_0_20px_rgba(6,182,212,0.15)] flex items-center justify-center overflow-hidden">
              <img *ngIf="profileData.profilePhotoUrl; else initials" [src]="profileData.profilePhotoUrl" class="w-full h-full object-cover rounded-full">
              <ng-template #initials>
                <div class="w-full h-full rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center font-bold font-mono text-black text-3xl uppercase">
                  {{ (profileData.firstName || 'C')[0] }}
                </div>
              </ng-template>
            </div>
            
            <div class="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer">
              <span class="text-[9px] font-mono text-cyan-400 uppercase tracking-widest">Change Photo</span>
            </div>
          </div>

          <!-- Photo Url Input field -->
          <div class="w-full flex flex-col">
            <label class="font-mono text-[8px] tracking-widest text-muted-var uppercase mb-1.5">Profile Photo URL</label>
            <input type="text" [(ngModel)]="profileData.profilePhotoUrl" class="glass-input font-mono text-[9px]" placeholder="https://example.com/photo.jpg">
          </div>

          <!-- Trust score dashboard metric (for citizens) -->
          <div *ngIf="authService.currentUser()?.role === 'citizen'" class="w-full p-4 rounded-xl border border-cyan-500/10 bg-cyan-950/5 font-mono text-[9.5px] uppercase space-y-1.5">
            <div class="flex justify-between">
              <span class="text-muted-var">CIVIC TRUST SCORE:</span>
              <span class="text-cyan-400 font-bold">{{ authService.currentUser()?.trustScore ?? 100 }}/100</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-var">TRUST LEVEL:</span>
              <span class="text-emerald-400 font-bold">{{ authService.currentUser()?.trustLevel ?? 'Trusted' }}</span>
            </div>
            <div class="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-2">
              <div class="bg-cyan-500 h-full" [style.width.%]="authService.currentUser()?.trustScore ?? 100"></div>
            </div>
          </div>
        </div>

        <!-- Right Column: Profile Form Fields -->
        <div class="md:col-span-8 space-y-6">
          <h3 class="font-mono text-[10px] tracking-widest text-muted-var uppercase border-b border-var pb-2">NODE IDENTITY</h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">First Name</label>
              <input type="text" [(ngModel)]="profileData.firstName" class="glass-input">
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">Last Name</label>
              <input type="text" [(ngModel)]="profileData.lastName" class="glass-input">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">Email Address</label>
              <input type="email" [value]="profileData.email" disabled class="glass-input opacity-50 cursor-not-allowed">
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">Phone Number</label>
              <input type="text" [(ngModel)]="profileData.phone" class="glass-input">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">Aadhaar ID Number</label>
              <input type="text" [(ngModel)]="profileData.aadhaarNumber" class="glass-input" placeholder="12-digit UIDAI ID">
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">Occupation</label>
              <input type="text" [(ngModel)]="profileData.occupation" class="glass-input" placeholder="e.g. Student, Self-employed">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">Age</label>
              <input type="number" [(ngModel)]="profileData.age" class="glass-input">
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">Gender</label>
              <select [(ngModel)]="profileData.gender" class="glass-input font-mono text-[10px]">
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">Municipal Ward</label>
              <input type="text" [(ngModel)]="profileData.ward" class="glass-input" placeholder="e.g. 12">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">District / Zone</label>
              <input type="text" [(ngModel)]="profileData.district" class="glass-input" placeholder="e.g. Zone 3 / Dadar">
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">Current Residence Address</label>
              <input type="text" [(ngModel)]="profileData.currentAddress" class="glass-input">
            </div>
          </div>

          <div class="flex flex-col">
            <label class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-2">Permanent Registered Address</label>
            <input type="text" [(ngModel)]="profileData.permanentAddress" class="glass-input">
          </div>

          <button (click)="saveProfile()" class="px-6 py-2.5 rounded bg-white text-black font-mono font-bold text-[10px] uppercase tracking-wider hover:bg-white/95 transition-colors">
            SAVE PROFILE SETTINGS
          </button>
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
export class SettingsComponent implements OnInit {
  profileData = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentAddress: '',
    permanentAddress: '',
    aadhaarNumber: '',
    occupation: '',
    age: 0,
    gender: '',
    ward: '',
    district: '',
    profilePhotoUrl: '',
  };

  public translationService = inject(TranslationService);

  constructor(
    public authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.profileData.firstName = (user as any).firstName || user.name?.split(' ')[0] || '';
      this.profileData.lastName = (user as any).lastName || user.name?.split(' ').slice(1).join(' ') || '';
      this.profileData.email = user.email || '';
      this.profileData.phone = user.phone || '';
      this.profileData.currentAddress = (user as any).currentAddress || user.address || '';
      this.profileData.permanentAddress = (user as any).permanentAddress || '';
      this.profileData.aadhaarNumber = user.aadhaarNumber || '';
      this.profileData.occupation = (user as any).occupation || '';
      this.profileData.age = (user as any).age || 0;
      this.profileData.gender = (user as any).gender || '';
      this.profileData.ward = (user as any).ward || '';
      this.profileData.district = (user as any).district || '';
      this.profileData.profilePhotoUrl = (user as any).profilePhotoUrl || '';
    }
  }

  saveProfile() {
    // Call user updateProfile REST endpoint
    const payload = {
      firstName: this.profileData.firstName,
      lastName: this.profileData.lastName,
      phone: this.profileData.phone,
      currentAddress: this.profileData.currentAddress,
      permanentAddress: this.profileData.permanentAddress,
      aadhaarNumber: this.profileData.aadhaarNumber,
      occupation: this.profileData.occupation,
      age: this.profileData.age,
      gender: this.profileData.gender,
      ward: this.profileData.ward,
      district: this.profileData.district,
      profilePhotoUrl: this.profileData.profilePhotoUrl
    };

    this.apiService.put<{ user: User }>('/users/profile', payload).subscribe({
      next: (res) => {
        // Update local session storage
        localStorage.setItem('user', JSON.stringify(res.user));
        this.authService.currentUser.set(res.user);
        alert('Citizen profile details updated successfully.');
      },
      error: (err) => {
        alert('Failed to save profile: ' + err.message);
      }
    });
  }
}
