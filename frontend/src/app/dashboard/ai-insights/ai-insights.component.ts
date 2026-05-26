import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../core/services/ai.service';
import { DepartmentsService } from '../../core/services/departments.service';
import { Department } from '../../core/models/department.model';

@Component({
  selector: 'app-ai-insights',
  imports: [CommonModule, FormsModule],
  template: `
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
      <!-- Left 2 Cols: Forecasting Calculator & Active Insights -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Forecasting Simulator Card -->
        <div class="glass-panel p-6 rounded-xl border border-var">
          <div class="inline-flex items-center gap-2 mb-2">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span class="font-mono text-[9px] tracking-widest text-cyan-400 uppercase">SLA FORECASTING ENGINE</span>
          </div>
          <h2 class="text-xl font-bold uppercase tracking-tight text-primary-var mb-6 font-mono">Predictive SLA Simulator</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            <div class="flex flex-col">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">Civic Department</label>
              <select [(ngModel)]="predictorPayload.department" class="glass-input">
                @for (dept of departments; track dept.id) {
                  <option [value]="dept.name">{{ dept.name }}</option>
                }
              </select>
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">Priority Level</label>
              <select [(ngModel)]="predictorPayload.priority" class="glass-input">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">Active Departmental Backlog</label>
              <input type="number" [(ngModel)]="predictorPayload.activeComplaints" class="glass-input">
            </div>

            <div class="flex flex-col">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">Local Ward Queue Size</label>
              <input type="number" [(ngModel)]="predictorPayload.areaComplaints" class="glass-input">
            </div>
          </div>

          <button (click)="runPredictor()" [disabled]="loadingPredictor" class="px-6 py-3 rounded bg-white hover:bg-white/90 text-black font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300">
            @if (loadingPredictor) { COMPUTING INFERENCE... } @else { CALCULATE SLA TIME }
          </button>

          <!-- Prediction Result View -->
          @if (predictionResult) {
            <div class="mt-8 pt-6 border-t border-var grid grid-cols-2 md:grid-cols-4 gap-4 animate-float">
              <div class="p-4 rounded-lg bg-white/2 border border-var">
                <div class="font-mono text-[8px] text-muted-var uppercase tracking-widest mb-1">ETA Resolution</div>
                <div class="text-xl font-bold font-mono text-cyan-400">{{ predictionResult.estimatedDays }} Days</div>
              </div>

              <div class="p-4 rounded-lg bg-white/2 border border-var">
                <div class="font-mono text-[8px] text-muted-var uppercase tracking-widest mb-1">Delay Risk Index</div>
                <div class="text-xl font-bold font-mono" [ngClass]="{
                  'text-emerald-400': predictionResult.delayRisk === 'Low',
                  'text-amber-400': predictionResult.delayRisk === 'Medium',
                  'text-red-400': predictionResult.delayRisk === 'High'
                }">{{ predictionResult.delayRisk }}</div>
              </div>

              <div class="p-4 rounded-lg bg-white/2 border border-var">
                <div class="font-mono text-[8px] text-muted-var uppercase tracking-widest mb-1">Escalation Likelihood</div>
                <div class="text-xl font-bold font-mono text-primary-var">{{ predictionResult.escalationProbability }}%</div>
              </div>

              <div class="p-4 rounded-lg bg-white/2 border border-var">
                <div class="font-mono text-[8px] text-muted-var uppercase tracking-widest mb-1">Inference Confidence</div>
                <div class="text-xl font-bold font-mono text-primary-var">{{ predictionResult.confidence }}%</div>
              </div>
            </div>
          }
        </div>

        <!-- Severity & Intent Analysis Demo -->
        <div class="glass-panel p-6 rounded-xl border border-var">
          <div class="inline-flex items-center gap-2 mb-2">
            <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span class="font-mono text-[9px] tracking-widest text-cyan-400 uppercase">NATURAL LANGUAGE INTENT CLASS</span>
          </div>
          <h2 class="text-xl font-bold uppercase tracking-tight text-primary-var mb-6 font-mono">Real-Time Severity Profiler</h2>
          
          <div class="space-y-4 mb-6">
            <div class="flex flex-col">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">Grievance Title</label>
              <input type="text" [(ngModel)]="severityPayload.title" class="glass-input" placeholder="e.g. Dangling live wire over wet street">
            </div>
            
            <div class="flex flex-col">
              <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">Detailed Narrative</label>
              <textarea [(ngModel)]="severityPayload.description" rows="3" class="glass-input" placeholder="The snapped main wire is sparking directly in front of the primary school gate. Water log around the wire creates immediate shock hazard..."></textarea>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div class="flex flex-col">
                <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">Estimated Citizens Affected</label>
                <input type="number" [(ngModel)]="severityPayload.peopleAffected" class="glass-input">
              </div>
              <div class="flex flex-col">
                <label class="font-mono text-[10px] tracking-widest text-muted-var uppercase mb-2">Grid Location Context</label>
                <input type="text" [(ngModel)]="severityPayload.location" class="glass-input" placeholder="Near Hospital / School">
              </div>
            </div>
          </div>

          <button (click)="runSeverityProfiler()" [disabled]="loadingSeverity" class="px-6 py-3 rounded bg-white hover:bg-white/90 text-black font-mono font-bold text-xs tracking-wider uppercase transition-all duration-300">
            @if (loadingSeverity) { ANALYZING TOKENS... } @else { CALCULATE SEVERITY INDEX }
          </button>

          @if (severityResult) {
            <div class="mt-8 p-5 rounded-xl bg-white/2 border border-var animate-float">
              <div class="flex items-center justify-between mb-4">
                <div class="font-mono text-[10px] tracking-wider uppercase text-muted-var">ANALYTICS RESULT</div>
                <div class="px-3 py-1 rounded bg-red-950/20 border border-red-500/30 text-[10px] font-mono text-red-400 uppercase tracking-widest">
                  {{ severityResult.priority }} URGENCY
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div class="text-4xl font-bold font-mono text-primary-var mb-2">{{ severityResult.severityScore }} / 100</div>
                  <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest">COMPUTED SEVERITY RATIO</div>
                </div>

                <div>
                  <div class="font-mono text-[9px] text-muted-var uppercase tracking-widest mb-2">CORRELATION REASONING</div>
                  <ul class="space-y-1 text-xs font-mono text-cyan-400 uppercase">
                    @for (reason of severityResult.reason; track $index) {
                      <li>• {{ reason }}</li>
                    }
                  </ul>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Right 1 Col: Platform Auto-Route Guidelines & Settings -->
      <div class="space-y-6">
        <div class="glass-panel p-6 rounded-xl border border-var min-h-[450px]">
          <h3 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase mb-6">AI MODEL PARAMETERS</h3>
          
          <div class="space-y-6">
            <div>
              <div class="flex justify-between text-xs font-mono mb-2">
                <span class="text-muted-var">SPAM DETECT RATIO</span>
                <span class="text-cyan-400">85%</span>
              </div>
              <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-cyan-500" style="width: 85%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs font-mono mb-2">
                <span class="text-muted-var">AUTO-ROUTE CONFIDENCE</span>
                <span class="text-cyan-400">92%</span>
              </div>
              <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-cyan-500" style="width: 92%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs font-mono mb-2">
                <span class="text-muted-var">NLP CORRELATION THRESHOLD</span>
                <span class="text-cyan-400">70%</span>
              </div>
              <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-cyan-500" style="width: 70%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs font-mono mb-2">
                <span class="text-muted-var">CLIP DELTA COMPARISON</span>
                <span class="text-cyan-400">80%</span>
              </div>
              <div class="h-1 bg-white/5 rounded-full overflow-hidden">
                <div class="h-full bg-cyan-500" style="width: 80%"></div>
              </div>
            </div>
          </div>

          <div class="mt-12 pt-8 border-t border-var">
            <span class="font-mono text-[9px] tracking-widest text-muted-var uppercase mb-4 block">ACTIVE NEURAL LOG</span>
            <div class="space-y-4 font-mono text-[9px] text-muted-var">
              <div class="flex justify-between">
                <span>[10:42:15] vit-base: LOAD SUCCESS</span>
                <span class="text-emerald-400">OK</span>
              </div>
              <div class="flex justify-between">
                <span>[10:42:16] sentence-trans: MAPPED</span>
                <span class="text-emerald-400">OK</span>
              </div>
              <div class="flex justify-between">
                <span>[10:42:18] clip-vit: READY</span>
                <span class="text-emerald-400">OK</span>
              </div>
              <div class="flex justify-between">
                <span>[10:43:01] pipeline: DRAIN_BURST MAPPED</span>
                <span class="text-cyan-400">DEPT_2</span>
              </div>
            </div>
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
export class AiInsightsComponent implements OnInit {
  departments: Department[] = [];

  predictorPayload = {
    department: 'Waste Management',
    priority: 'medium',
    activeComplaints: 12,
    areaComplaints: 8
  };

  severityPayload = {
    title: '',
    description: '',
    peopleAffected: 5,
    location: ''
  };

  loadingPredictor = false;
  loadingSeverity = false;

  predictionResult: any = null;
  severityResult: any = null;

  constructor(
    private aiService: AiService,
    private departmentsService: DepartmentsService
  ) {}

  ngOnInit(): void {
    this.departmentsService.loadDepartments().subscribe((departments) => {
      this.departments = departments;
      if (departments.length > 0) {
        this.predictorPayload.department = departments[0].name;
      }
    });
  }

  runPredictor() {
    this.loadingPredictor = true;
    this.aiService.predictResolution(this.predictorPayload).subscribe({
      next: (res) => {
        this.predictionResult = res;
        this.loadingPredictor = false;
      },
      error: () => {
        this.loadingPredictor = false;
      }
    });
  }

  runSeverityProfiler() {
    this.loadingSeverity = true;
    this.aiService.calculateSeverity(this.severityPayload).subscribe({
      next: (res) => {
        this.severityResult = res;
        this.loadingSeverity = false;
      },
      error: () => {
        this.loadingSeverity = false;
      }
    });
  }
}
