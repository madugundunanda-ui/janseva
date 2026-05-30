import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepartmentsService } from '../../core/services/departments.service';
import { TranslationService } from '../../core/services/translation.service';
import { Department } from '../../core/models/department.model';

interface DepartmentItem extends Department {
  nameKey: string;
}

@Component({
  selector: 'app-governance-transparency',
  imports: [CommonModule],
  template: `
    <section id="transparency" class="py-32 px-6 bg-transparent relative w-full border-t border-var overflow-hidden">
      <!-- Glow ambient overlay -->
      <div class="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-[#6AA9FF]/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div class="max-w-7xl mx-auto">
        <!-- Section Header -->
        <div class="mb-24 text-center">
          <span class="font-mono text-xs tracking-[0.25em] text-[#6AA9FF] uppercase mb-4 block animate-pulse">
            AUDITABLE PUBLIC LEDGER
          </span>
          <h2 class="text-3xl md:text-5xl font-bold tracking-tight text-primary-var uppercase text-glow leading-none font-mono">
            {{ translationService.t('GOV_TRANSPARENCY_TITLE') }}
          </h2>
          <p class="text-xs sm:text-sm text-muted-var font-mono mt-6 max-w-xl mx-auto uppercase tracking-wider">
            {{ translationService.t('GOV_TRANSPARENCY_DESC') }}
          </p>
        </div>

        <!-- Global Performance Banner Card -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <!-- Total Complaints -->
          <div class="glass-panel p-6 border-var rounded-xl text-center space-y-2">
            <span class="font-mono text-[10px] text-muted-var uppercase block">{{ translationService.t('TRANS_TOTAL') }}</span>
            <span class="text-3xl font-bold text-primary-var font-mono">{{ totalComplaints }}</span>
          </div>

          <!-- Resolved Complaints -->
          <div class="glass-panel p-6 border-var rounded-xl text-center space-y-2">
            <span class="font-mono text-[10px] text-muted-var uppercase block">{{ translationService.t('TRANS_RESOLVED') }}</span>
            <span class="text-3xl font-bold text-emerald-400 font-mono">{{ resolvedComplaints }}</span>
          </div>

          <!-- Pending Complaints -->
          <div class="glass-panel p-6 border-var rounded-xl text-center space-y-2">
            <span class="font-mono text-[10px] text-muted-var uppercase block">{{ translationService.t('TRANS_PENDING') }}</span>
            <span class="text-3xl font-bold text-amber-500 font-mono">{{ pendingComplaints }}</span>
          </div>

          <!-- Global SLA Compliance -->
          <div class="glass-panel p-6 border-var rounded-xl text-center space-y-2">
            <span class="font-mono text-[10px] text-muted-var uppercase block">{{ translationService.t('TRANS_SLA') }}</span>
            <span class="text-3xl font-bold text-[#6AA9FF] font-mono">{{ globalSla }}%</span>
          </div>
        </div>

        <!-- Department Performance Table/Grid -->
        <div class="glass-panel rounded-2xl border border-var overflow-hidden">
          <div class="p-6 border-b border-var">
            <h3 class="font-mono text-xs uppercase tracking-[0.2em] text-[#6AA9FF] font-bold">
              {{ translationService.t('DEPT_PERFORMANCE') }}
            </h3>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left font-mono text-[10px] uppercase">
              <thead>
                <tr class="border-b border-var text-muted-var">
                  <th class="p-5 font-bold tracking-wider">Department</th>
                  <th class="p-5 font-bold tracking-wider text-center">Status</th>
                  <th class="p-5 font-bold tracking-wider text-center">Active Load</th>
                  <th class="p-5 font-bold tracking-wider text-center">SLA Compliance</th>
                  <th class="p-5 font-bold tracking-wider text-center">Avg Response</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5 text-primary-var">
                @for (dept of departments; track dept.id) {
                  <tr class="hover:bg-white/2 transition-colors duration-150">
                    <td class="p-5 font-bold">{{ translationService.t(dept.nameKey || '') }}</td>
                    <td class="p-5 text-center">
                      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/10 text-[9px] font-bold">
                        <span class="w-1.5 h-1.5 rounded-full animate-pulse" [ngClass]="{
                          'bg-emerald-500': dept.liveStatus === 'operational',
                          'bg-amber-500': dept.liveStatus === 'congested',
                          'bg-red-500': dept.liveStatus === 'alert',
                          'bg-blue-500': dept.liveStatus === 'maintenance'
                        }"></span>
                        {{ dept.liveStatus }}
                      </span>
                    </td>
                    <td class="p-5 text-center font-bold text-primary-var">{{ dept.activeComplaints }} Tickets</td>
                    <td class="p-5 text-center font-bold text-emerald-400">{{ dept.resolutionRate }}%</td>
                    <td class="p-5 text-center text-muted-var">{{ dept.avgResponseTime }}h</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }
  `]
})
export class GovernanceTransparencyComponent implements OnInit {
  departments: DepartmentItem[] = [];
  totalComplaints = 0;
  resolvedComplaints = 0;
  pendingComplaints = 0;
  globalSla = 92.5;

  private departmentsService = inject(DepartmentsService);
  public translationService = inject(TranslationService);

  // Fallback / Predefined 20 departments structure matching showcase
  private allDepartmentsMock: DepartmentItem[] = [
    { id: 'roads', name: 'Roads & Highways', nameKey: 'DEPT_ROADS', activeComplaints: 14, resolvedComplaints: 120, resolutionRate: 92, avgResponseTime: 4.2, liveStatus: 'operational' },
    { id: 'water', name: 'Water Supply', nameKey: 'DEPT_WATER', activeComplaints: 8, resolvedComplaints: 85, resolutionRate: 95, avgResponseTime: 3.5, liveStatus: 'operational' },
    { id: 'electricity', name: 'Electricity', nameKey: 'DEPT_ELECTRICITY', activeComplaints: 19, resolvedComplaints: 140, resolutionRate: 88, avgResponseTime: 2.8, liveStatus: 'congested' },
    { id: 'sanitation', name: 'Sanitation', nameKey: 'DEPT_SANITATION', activeComplaints: 26, resolvedComplaints: 90, resolutionRate: 82, avgResponseTime: 6.5, liveStatus: 'alert' },
    { id: 'health', name: 'Public Health', nameKey: 'DEPT_HEALTH', activeComplaints: 5, resolvedComplaints: 45, resolutionRate: 96, avgResponseTime: 12.0, liveStatus: 'operational' },
    { id: 'revenue', name: 'Revenue', nameKey: 'DEPT_REVENUE', activeComplaints: 11, resolvedComplaints: 60, resolutionRate: 85, avgResponseTime: 24.5, liveStatus: 'maintenance' },
    { id: 'transport', name: 'Transport', nameKey: 'DEPT_TRANSPORT', activeComplaints: 7, resolvedComplaints: 70, resolutionRate: 94, avgResponseTime: 8.0, liveStatus: 'operational' },
    { id: 'smart_city', name: 'Smart City Operations', nameKey: 'DEPT_SMART_CITY', activeComplaints: 4, resolvedComplaints: 50, resolutionRate: 98, avgResponseTime: 1.5, liveStatus: 'operational' },
    { id: 'rural_dev', name: 'Rural Development', nameKey: 'DEPT_RURAL_DEV', activeComplaints: 15, resolvedComplaints: 75, resolutionRate: 84, avgResponseTime: 16.2, liveStatus: 'congested' },
    { id: 'emergency', name: 'Emergency Response', nameKey: 'DEPT_EMERGENCY', activeComplaints: 2, resolvedComplaints: 190, resolutionRate: 99, avgResponseTime: 0.5, liveStatus: 'operational' },
    { id: 'parks', name: 'Public Parks & Gardens', nameKey: 'DEPT_PARKS', activeComplaints: 6, resolvedComplaints: 35, resolutionRate: 90, avgResponseTime: 18.0, liveStatus: 'operational' },
    { id: 'street_lights', name: 'Street Lighting', nameKey: 'DEPT_STREET_LIGHTS', activeComplaints: 21, resolvedComplaints: 110, resolutionRate: 86, avgResponseTime: 5.0, liveStatus: 'congested' },
    { id: 'waste', name: 'Waste Management', nameKey: 'DEPT_WASTE', activeComplaints: 18, resolvedComplaints: 125, resolutionRate: 89, avgResponseTime: 7.2, liveStatus: 'operational' },
    { id: 'drainage', name: 'Drainage & Sewerage', nameKey: 'DEPT_DRAINAGE', activeComplaints: 28, resolvedComplaints: 80, resolutionRate: 78, avgResponseTime: 10.5, liveStatus: 'alert' },
    { id: 'animal', name: 'Animal Control', nameKey: 'DEPT_ANIMAL', activeComplaints: 12, resolvedComplaints: 40, resolutionRate: 83, avgResponseTime: 14.0, liveStatus: 'maintenance' },
    { id: 'licensing', name: 'Municipal Licensing', nameKey: 'DEPT_LICENSING', activeComplaints: 9, resolvedComplaints: 65, resolutionRate: 91, avgResponseTime: 32.0, liveStatus: 'operational' },
    { id: 'housing', name: 'Public Housing & Urban Planning', nameKey: 'DEPT_HOUSING', activeComplaints: 13, resolvedComplaints: 55, resolutionRate: 87, avgResponseTime: 48.0, liveStatus: 'operational' },
    { id: 'pollution', name: 'Pollution Control & Environment', nameKey: 'DEPT_POLLUTION', activeComplaints: 10, resolvedComplaints: 48, resolutionRate: 89, avgResponseTime: 9.0, liveStatus: 'operational' },
    { id: 'welfare', name: 'Citizen Welfare & Social Services', nameKey: 'DEPT_WELFARE', activeComplaints: 16, resolvedComplaints: 95, resolutionRate: 85, avgResponseTime: 22.0, liveStatus: 'congested' },
    { id: 'disaster', name: 'Disaster Management & Relief', nameKey: 'DEPT_DISASTER', activeComplaints: 1, resolvedComplaints: 200, resolutionRate: 100, avgResponseTime: 1.0, liveStatus: 'operational' }
  ];

  ngOnInit(): void {
    this.departmentsService.loadDepartments().subscribe((items) => {
      // Merge live data with our mock 20 departments list
      this.departments = this.allDepartmentsMock.map(staticDept => {
        const liveDept = items.find(d => 
          d.name.toLowerCase() === staticDept.name.toLowerCase() ||
          d.id === staticDept.id ||
          (staticDept.id === 'roads' && d.name.toLowerCase() === 'roads') ||
          (staticDept.id === 'drainage' && d.name.toLowerCase() === 'drainage') ||
          (staticDept.id === 'waste' && d.name.toLowerCase() === 'waste management') ||
          (staticDept.id === 'street_lights' && d.name.toLowerCase() === 'street lighting')
        );
        if (liveDept) {
          return {
            ...staticDept,
            id: liveDept.id,
            activeComplaints: liveDept.activeComplaints || staticDept.activeComplaints,
            resolvedComplaints: liveDept.resolvedComplaints || staticDept.resolvedComplaints,
            resolutionRate: liveDept.resolutionRate || staticDept.resolutionRate,
            avgResponseTime: liveDept.avgResponseTime || staticDept.avgResponseTime,
            liveStatus: liveDept.liveStatus || staticDept.liveStatus
          };
        }
        return staticDept;
      });

      this.calculateAggregateMetrics();
    });
  }

  private calculateAggregateMetrics() {
    let totalActive = 0;
    let totalResolved = 0;
    let slaSum = 0;

    this.departments.forEach(dept => {
      totalActive += dept.activeComplaints;
      totalResolved += dept.resolvedComplaints;
      slaSum += dept.resolutionRate;
    });

    this.pendingComplaints = totalActive;
    this.resolvedComplaints = totalResolved;
    this.totalComplaints = this.pendingComplaints + this.resolvedComplaints;
    this.globalSla = Number((slaSum / this.departments.length).toFixed(1));
  }
}
