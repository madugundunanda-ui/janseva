import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AiService } from '../../core/services/ai.service';

@Component({
  selector: 'app-ai-diagnostics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="space-y-6 pb-12 text-white">
      <!-- Header Banner -->
      <div class="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden bg-gradient-to-r from-violet-950/20 via-transparent to-transparent shadow-[0_0_30px_rgba(139,92,246,0.1)] bg-black/40">
        <div class="space-y-2">
          <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-violet-500/20 bg-violet-950/20 font-mono text-[9px] text-violet-400 uppercase tracking-widest animate-pulse text-white">
            <span>🧠 AI NEURAL DIAGNOSTICS // REAL-TIME TELEMETRY</span>
          </div>
          <h2 class="text-2xl md:text-3xl font-bold tracking-tight text-primary-var uppercase font-mono text-white">
            AI SYSTEM <span class="text-glow-cyan">DIAGNOSTICS</span>
          </h2>
          <p class="font-mono text-[10px] text-muted-var uppercase max-w-xl text-gray-400">
            Live monitoring of computer vision classification pipeline, NLP embedding inference engine, and neural network resource utilization.
          </p>
        </div>
        <div class="flex gap-3">
          <button (click)="refreshHealth()" class="px-5 py-3 rounded-lg bg-violet-500 hover:bg-violet-400 text-white font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.2)] cursor-pointer">
            Refresh
          </button>
          <a [routerLink]="['/dashboard/admin']" class="px-5 py-3 rounded-lg border border-violet-500/30 hover:border-violet-500 text-violet-400 font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer text-white">
            ← Back
          </a>
        </div>
      </div>

      <!-- Status Badge -->
      <div class="glass-panel p-5 rounded-xl border border-white/10 flex items-center justify-between bg-black/40">
        <div class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full animate-pulse" [ngClass]="{
            'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)]': healthData?.status === 'Online',
            'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)]': healthData?.status === 'Busy',
            'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]': healthData?.status === 'Offline'
          }"></span>
          <span class="font-mono text-[11px] tracking-widest uppercase font-bold" [ngClass]="{
            'text-emerald-400': healthData?.status === 'Online',
            'text-amber-400': healthData?.status === 'Busy',
            'text-red-500': healthData?.status === 'Offline'
          }">{{ healthData?.status || 'CHECKING...' }}</span>
        </div>
        <span class="font-mono text-[9px] text-muted-var uppercase text-gray-400">
          Response: {{ healthData?.responseTimeMs || 0 }}ms // Queue: {{ healthData?.queueSize || 0 }} jobs
        </span>
      </div>

      <!-- Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Requests -->
        <div class="glass-panel p-5 rounded-xl border border-white/10 bg-black/30">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2 text-gray-400">Total Requests</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-primary-var text-white">{{ healthData?.pythonStats?.totalRequests || 0 }}</div>
          <div class="font-mono text-[8px] text-cyan-400 mt-1 uppercase tracking-wide">LIFETIME AI INVOCATIONS</div>
        </div>

        <!-- Successful -->
        <div class="glass-panel p-5 rounded-xl border border-white/10 bg-black/30">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2 text-gray-400">Successful</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-emerald-400">{{ healthData?.pythonStats?.successfulRequests || 0 }}</div>
          <div class="font-mono text-[8px] text-emerald-400 mt-1 uppercase tracking-wide">INFERENCE COMPLETIONS</div>
        </div>

        <!-- Failed -->
        <div class="glass-panel p-5 rounded-xl border border-white/10 bg-black/30">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2 text-gray-400">Failed</div>
          <div class="text-2xl font-bold font-mono tracking-tight" [ngClass]="(healthData?.pythonStats?.failedRequests || 0) > 0 ? 'text-red-400' : 'text-white'">{{ healthData?.pythonStats?.failedRequests || 0 }}</div>
          <div class="font-mono text-[8px] text-red-400 mt-1 uppercase tracking-wide">ERROR RATE</div>
        </div>

        <!-- Avg Latency -->
        <div class="glass-panel p-5 rounded-xl border border-white/10 bg-black/30">
          <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2 text-gray-400">Avg Inference</div>
          <div class="text-2xl font-bold font-mono tracking-tight text-violet-400">{{ healthData?.pythonStats?.avgInferenceTimeMs || 0 }}ms</div>
          <div class="font-mono text-[8px] text-violet-400 mt-1 uppercase tracking-wide">MEAN LATENCY</div>
        </div>
      </div>

      <!-- Detailed Panels -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Models Panel -->
        <div class="glass-panel p-6 rounded-2xl border border-white/10 space-y-4 bg-black/30">
          <h3 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold">Pre-Loaded Models</h3>
          <div class="space-y-2.5">
            @for (model of healthData?.models || []; track model) {
              <div class="flex justify-between items-center p-3 rounded bg-white/2 border border-white/10 font-mono text-[10px] uppercase text-white">
                <span>🔬 {{ model }}</span>
                <span class="text-emerald-400">LOADED</span>
              </div>
            }
            @if (!healthData?.models || healthData.models.length === 0) {
              <div class="p-3 rounded bg-white/2 border border-white/10 font-mono text-[10px] text-muted-var uppercase text-center text-gray-500">
                No models detected
              </div>
            }
          </div>
          <div class="pt-3 border-t border-white/5 font-mono text-[9px] text-muted-var uppercase space-y-1 text-gray-400">
            <div class="flex justify-between">
              <span>Models Ready:</span>
              <span [ngClass]="healthData?.pythonStats?.modelsLoaded ? 'text-emerald-400' : 'text-red-400'">{{ healthData?.pythonStats?.modelsLoaded ? 'YES' : 'NO' }}</span>
            </div>
            <div class="flex justify-between">
              <span>Inference Readiness:</span>
              <span [ngClass]="healthData?.pythonStats?.inferenceReadiness === 'ready' ? 'text-emerald-400' : 'text-amber-400'">{{ healthData?.pythonStats?.inferenceReadiness || 'UNKNOWN' }}</span>
            </div>
          </div>
        </div>

        <!-- System Resources Panel -->
        <div class="glass-panel p-6 rounded-2xl border border-white/10 space-y-4 bg-black/30">
          <h3 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold">System Resources</h3>
          <div class="space-y-2.5 font-mono text-[10px] uppercase">
            <div class="flex justify-between items-center p-3 rounded bg-white/2 border border-white/10">
              <span class="text-primary-var text-white">GPU Accelerator</span>
              <span [ngClass]="healthData?.pythonStats?.gpuAvailable ? 'text-emerald-400' : 'text-amber-400'">
                {{ healthData?.pythonStats?.gpuAvailable ? '● ACTIVE' : '○ CPU ONLY' }}
              </span>
            </div>
            <div class="flex justify-between items-center p-3 rounded bg-white/2 border border-white/10">
              <span class="text-primary-var text-white">Compute Device</span>
              <span class="text-cyan-400">{{ healthData?.pythonStats?.gpuDeviceName || 'cpu' }}</span>
            </div>
            <div class="flex justify-between items-center p-3 rounded bg-white/2 border border-white/10">
              <span class="text-primary-var text-white">Node.js Memory (RSS)</span>
              <span class="text-cyan-400">{{ healthData?.system?.nodeMemoryMB || 0 }} MB</span>
            </div>
            <div class="flex justify-between items-center p-3 rounded bg-white/2 border border-white/10">
              <span class="text-primary-var text-white">Python Memory (WSS)</span>
              <span class="text-cyan-400">{{ healthData?.system?.pythonMemoryMB || 0 }} MB</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Jobs -->
      <div class="glass-panel p-6 rounded-2xl border border-white/10 space-y-4 bg-black/30">
        <h3 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold">Recent AI Jobs</h3>
        <div class="overflow-x-auto">
          <table class="w-full font-mono text-[10px] uppercase">
            <thead>
              <tr class="border-b border-white/10 text-muted-var text-gray-400">
                <th class="py-2 px-3 text-left">Job ID</th>
                <th class="py-2 px-3 text-left">Status</th>
                <th class="py-2 px-3 text-left">Progress</th>
                <th class="py-2 px-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              @for (job of healthData?.system?.activeJobs || []; track job.id) {
                <tr class="border-b border-white/5 hover:bg-white/2">
                  <td class="py-2.5 px-3 text-cyan-400">{{ job.id?.substring(0, 8) }}...</td>
                  <td class="py-2.5 px-3">
                    <span class="px-2 py-0.5 rounded text-[8px] border" [ngClass]="{
                      'border-emerald-500/30 text-emerald-400': job.status === 'completed',
                      'border-cyan-500/30 text-cyan-400': job.status === 'processing',
                      'border-amber-500/30 text-amber-400': job.status === 'queued',
                      'border-red-500/30 text-red-400': job.status === 'failed'
                    }">{{ job.status }}</span>
                  </td>
                  <td class="py-2.5 px-3 text-primary-var text-white">{{ job.progress || 0 }}%</td>
                  <td class="py-2.5 px-3 text-muted-var text-gray-400">{{ job.createdAt | date:'short' }}</td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="py-6 text-center text-muted-var text-gray-500 font-bold">No recent jobs recorded</td>
                </tr>
              }
            </tbody>
          </table>
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
export class AiDiagnosticsComponent implements OnInit, OnDestroy {
  healthData: any = null;
  private refreshInterval: any;

  private aiService = inject(AiService);

  ngOnInit(): void {
    this.refreshHealth();
    this.refreshInterval = setInterval(() => this.refreshHealth(), 15000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  refreshHealth(): void {
    this.aiService.getAiHealthStatus().subscribe({
      next: (data) => {
        this.healthData = data;
      },
      error: (err) => {
        console.error('Failed to fetch AI health:', err);
        this.healthData = { status: 'Offline', pythonStats: {}, system: {} };
      }
    });
  }
}
