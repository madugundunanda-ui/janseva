import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ComplaintsService } from '../../core/services/complaints.service';
import { TranslationService } from '../../core/services/translation.service';
import { Complaint } from '../../core/services/api.service';
import { AnalyticsService, CivicHealthScore, RiskAssessment, GovernanceInsight } from '../../core/services/analytics.service';
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

      <!-- Governance Intelligence Row -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Civic Impact Card -->
        <div class="glass-panel p-5 rounded-xl border border-var flex flex-col justify-between bg-gradient-to-br from-purple-900/20 to-transparent">
          <div>
            <div class="font-mono text-[9px] text-purple-400 uppercase tracking-widest mb-4">Your Civic Impact</div>
            <div class="flex items-end gap-3 mb-2">
              <span class="text-4xl font-bold font-mono tracking-tight text-white">{{ resolvedCount * 42 }}</span>
              <span class="text-xs font-mono mb-1 uppercase text-purple-300">
                Citizens Benefited
              </span>
            </div>
            <div class="space-y-1.5 mt-4">
              <div class="flex justify-between font-mono text-[9px] uppercase">
                <span class="text-muted-var">Complaints Submitted:</span>
                <span class="text-primary-var">{{ myComplaints.length }}</span>
              </div>
              <div class="flex justify-between font-mono text-[9px] uppercase">
                <span class="text-muted-var">Verified Resolved:</span>
                <span class="text-emerald-400">{{ resolvedCount }}</span>
              </div>
              <div class="flex justify-between font-mono text-[9px] uppercase mt-2 pt-2 border-t border-var">
                <span class="text-muted-var">Area Score Improvement:</span>
                <span class="text-cyan-400" [ngClass]="{'text-emerald-400': civicScore?.trendPercentage! > 0}">
                  {{ (civicScore?.score || 60) - (civicScore?.trendPercentage || 0) | number:'1.0-0' }} → {{ civicScore?.score || 60 | number:'1.0-0' }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Area Risk Level -->
        <div class="glass-panel p-5 rounded-xl border border-var">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-4">Local Area Risks</div>
          @if(localRisks.length > 0) {
            <div class="space-y-3">
              @for (risk of localRisks.slice(0, 3); track risk._id) {
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[10px] uppercase text-primary-var truncate max-w-[70%]">{{ risk.riskType }}</span>
                  <span class="px-2 py-0.5 rounded text-[8px] font-mono border uppercase tracking-wider" 
                    [ngClass]="{'border-red-500/30 text-red-400 bg-red-950/15': risk.riskCategory === 'Critical', 'border-yellow-500/30 text-yellow-400 bg-yellow-950/15': risk.riskCategory === 'High'}">
                    {{ risk.riskCategory }}
                  </span>
                </div>
              }
            </div>
          } @else {
            <p class="font-mono text-xs text-muted-var uppercase text-center mt-4">No critical risks identified in your ward.</p>
          }
        </div>

        <!-- Government Updates Feed -->
        <div class="glass-panel p-5 rounded-xl border border-var overflow-hidden flex flex-col">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-4">Gov Intelligence Feed</div>
          <div class="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar">
            @for (update of govUpdates; track update._id) {
              <div class="p-3 bg-white/2 rounded-lg border border-white/5 space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-mono text-[9px] text-purple-400 uppercase">{{ update.title }}</span>
                  <span class="text-[8px] font-mono text-muted-var">{{ update.severity }}</span>
                </div>
                <p class="font-mono text-[10px] text-primary-var leading-snug">{{ update.description }}</p>
                @if(update.actionableRecommendation) {
                  <p class="font-mono text-[8px] text-emerald-400/80 mt-1 uppercase tracking-wide">Action: {{ update.actionableRecommendation }}</p>
                }
              </div>
            } @empty {
              <p class="font-mono text-xs text-muted-var uppercase text-center mt-4">No recent updates.</p>
            }
          </div>
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
  
  civicScore: CivicHealthScore | null = null;
  localRisks: RiskAssessment[] = [];
  govUpdates: GovernanceInsight[] = [];

  constructor(
    public authService: AuthService,
    private complaintsService: ComplaintsService,
    public translationService: TranslationService,
    private analyticsService: AnalyticsService
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUser();
    if (user) {
      this.complaintsService.loadComplaints().subscribe((data) => {
        this.myComplaints = data.filter(c => c.citizen?.id === user.id || c.citizen?.name === user.name);
        this.resolvedCount = this.myComplaints.filter(c => c.status === 'resolved').length;
      });

      this.analyticsService.getCivicHealth().subscribe(res => {
        // Find ward specific or use first
        this.civicScore = res.scores.find(s => s.areaName === `Ward ${user.ward || '12'}`) || res.scores[0] || null;
      });

      this.analyticsService.getRisks().subscribe(res => {
        this.localRisks = res.risks.filter(r => r.areaName === `Ward ${user.ward || '12'}`);
      });

      this.analyticsService.getGovernanceInsights().subscribe(res => {
        this.govUpdates = res.insights.slice(0, 5);
      });
    }
  }

  absoluteMath(val: number): number {
    return Math.abs(val);
  }
}
