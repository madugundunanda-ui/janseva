import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ComplaintsService } from '../../core/services/complaints.service';
import { TranslationService } from '../../core/services/translation.service';
import { Complaint } from '../../core/services/api.service';
import { VoiceAssistantComponent } from './voice-assistant/voice-assistant.component';

@Component({
  selector: 'app-citizen',
  imports: [CommonModule, RouterLink, VoiceAssistantComponent],
  template: `
    <div class="space-y-6 pb-12">
      <!-- Welcome Hero Banner -->
      <div class="glass-panel p-6 rounded-2xl border border-var flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden bg-gradient-to-r from-purple-950/5 via-transparent to-transparent">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-purple-500/20 bg-purple-950/10 font-mono text-[9px] text-purple-400 uppercase tracking-widest">
            <span>● CITIZEN GATEWAY NODE ACTIVE</span>
          </div>
          <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-primary-var uppercase font-mono">
            Welcome back, <span class="text-glow">{{ authService.currentUser()?.name }}</span>
          </h2>
          <p class="font-mono text-[10px] text-muted-var uppercase max-w-xl">
            You are logged into the JanSeva AI Civic resolution network. Use this console to track status of complaints in your municipal ward and submit local proofs.
          </p>
        </div>

        <button [routerLink]="['/dashboard/complaints']" class="px-5 py-3 rounded-lg bg-[#A33F93] hover:bg-[#8c357f] text-white font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-[0_0_15px_rgba(163,63,147,0.2)] cursor-pointer">
          File New Grievance
        </button>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Metric: Total Filed -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">My Total Grievances</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var">{{ myComplaints.length }}</div>
          <div class="font-mono text-[8px] text-purple-400 mt-1 uppercase tracking-wide">FILED TO ARCHIVE</div>
        </div>

        <!-- Metric: Resolved -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Resolved Grievances</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var">{{ resolvedCount }}</div>
          <div class="font-mono text-[8px] text-emerald-400 mt-1 uppercase tracking-wide">VERIFIED CLEARED</div>
        </div>

        <!-- Metric: Trust Score -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Civic Trust Score</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-cyan-400">{{ authService.currentUser()?.trustScore ?? 100 }}/100</div>
          <div class="font-mono text-[8px] text-cyan-400 mt-1 uppercase tracking-wide">LEVEL: {{ authService.currentUser()?.trustLevel ?? 'Trusted' }}</div>
        </div>

        <!-- Metric: Ward/District -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">Municipal Region</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var">Ward {{ authService.currentUser()?.ward ?? '12' }}</div>
          <div class="font-mono text-[8px] text-muted-var mt-1 uppercase tracking-wide">{{ authService.currentUser()?.district ?? 'Zone 3 / Dadar' }}</div>
        </div>
      </div>

      <!-- Grievance Stack Overview -->
      <div class="glass-panel rounded-2xl border border-var overflow-hidden">
        <div class="p-5 border-b border-var flex items-center justify-between">
          <h3 class="font-mono text-[10px] tracking-widest text-purple-400 uppercase font-bold">My Filed Grievances</h3>
          <span class="font-mono text-[9px] text-muted-var uppercase">Recent Activity</span>
        </div>

        <div class="divide-y divide-white/5">
          @for (complaint of myComplaints; track complaint.id) {
            <div class="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-white/2 transition-colors">
              <div class="space-y-1">
                <div class="flex items-center gap-3 font-mono text-[9px] uppercase">
                  <span class="text-purple-400">{{ complaint.id }}</span>
                  <span class="text-muted-var">• WARD {{ complaint.location.ward }}</span>
                  <span class="text-muted-var">• Priority: {{ complaint.priority }}</span>
                </div>
                <h4 class="text-sm font-semibold text-primary-var uppercase">{{ complaint.title }}</h4>
                <p class="text-xs text-muted-var line-clamp-1 font-mono uppercase">{{ complaint.description }}</p>
              </div>

              <div class="flex items-center gap-4 self-stretch md:self-auto justify-between md:justify-end">
                <span class="px-2 py-0.5 rounded text-[8px] font-mono border uppercase tracking-wider" [ngClass]="{
                  'border-purple-500/30 text-purple-400 bg-purple-950/15': complaint.status === 'submitted',
                  'border-blue-500/30 text-blue-400 bg-blue-950/15': complaint.status === 'assigned',
                  'border-cyan-500/30 text-cyan-400 bg-cyan-950/15': complaint.status === 'in_progress',
                  'border-emerald-500/30 text-emerald-400 bg-emerald-950/15': complaint.status === 'resolved',
                  'border-red-500/30 text-red-400 bg-red-950/15': complaint.status === 'escalated'
                }">{{ translationService.t(complaint.status.toUpperCase()) }}</span>
                
                <button [routerLink]="['/dashboard/complaints']" class="px-3 py-1.5 rounded border border-var hover:border-purple-500/40 text-[9px] font-mono uppercase text-primary-var cursor-pointer">
                  View Detail
                </button>
              </div>
            </div>
          } @empty {
            <div class="p-12 text-center space-y-4">
              <p class="font-mono text-xs text-muted-var uppercase">No grievances registered on your account node.</p>
              <button [routerLink]="['/dashboard/complaints']" class="px-4 py-2 rounded bg-[#A33F93] text-white font-mono text-[9px] uppercase font-bold hover:bg-[#8c357f]">
                Initialize First Ticket
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Multilingual Voice Assistant Co-Pilot -->
      <app-voice-assistant></app-voice-assistant>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class CitizenComponent implements OnInit {
  myComplaints: Complaint[] = [];
  resolvedCount = 0;

  constructor(
    public authService: AuthService,
    private complaintsService: ComplaintsService,
    public translationService: TranslationService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.complaintsService.loadComplaints().subscribe((data) => {
        this.myComplaints = data.filter(c => c.citizen?.id === user.id || c.citizen?.name === user.name);
        this.resolvedCount = this.myComplaints.filter(c => c.status === 'resolved').length;
      });
    }
  }
}
