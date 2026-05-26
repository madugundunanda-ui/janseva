import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, User } from '../../core/services/api.service';

interface OfficerWorkload extends User {
  activeCount: number;
  resolvedCount: number;
  performanceScore: number;
}

@Component({
  selector: 'app-officers',
  imports: [CommonModule],
  template: `
    <div class="glass-panel p-6 rounded-xl border border-var space-y-6 pb-12">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
        <h2 class="font-mono text-xs tracking-widest text-cyan-400 uppercase">OFFICER OPERATIONS REGISTRY</h2>
      </div>

      <!-- Table View -->
      <div class="overflow-x-auto">
        <table class="w-full font-mono text-[10px] uppercase border-collapse text-left">
          <thead>
            <tr class="border-b border-var text-muted-var">
              <th class="pb-3 pr-4">Officer Name</th>
              <th class="pb-3 px-4">Department Node</th>
              <th class="pb-3 px-4 text-center">Active Load</th>
              <th class="pb-3 px-4 text-center">Resolved Stack</th>
              <th class="pb-3 px-4 text-center">SLA Efficacy</th>
              <th class="pb-3 px-4 text-right">Duty Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-primary-var">
            @for (off of officerWorkloads; track off.id) {
              <tr>
                <td class="py-4 pr-4 font-semibold text-primary-var">{{ off.name }}</td>
                <td class="py-4 px-4 text-muted-var">{{ departmentName(off.department) }}</td>
                <td class="py-4 px-4 text-center text-cyan-400">{{ off.activeCount }} Tickets</td>
                <td class="py-4 px-4 text-center text-emerald-400">{{ off.resolvedCount }} Fixed</td>
                <td class="py-4 px-4 text-center font-bold text-primary-var">{{ off.performanceScore }}%</td>
                <td class="py-4 px-4 text-right">
                  <span class="px-2.5 py-0.5 rounded text-[8px] bg-emerald-950/20 border border-emerald-500/30 text-emerald-400">
                    DISPATCH_READY
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class OfficersComponent implements OnInit {
  officerWorkloads: OfficerWorkload[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getUsers('officer').subscribe((officers) => {
      // Mock workload aggregation for testing dashboard
      this.officerWorkloads = officers.map((off, idx) => ({
        ...off,
        activeCount: [2, 3, 1, 0][idx % 4],
        resolvedCount: [14, 25, 9, 31][idx % 4],
        performanceScore: [94, 91, 88, 97][idx % 4]
      }));
    });
  }

  departmentName(department: User['department']): string {
    if (!department) {
      return 'General Operations';
    }
    if (typeof department === 'string') {
      return department;
    }
    return department.name ?? 'General Operations';
  }
}
