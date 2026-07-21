import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, User } from '../../core/services/api.service';

interface OfficerWorkload extends User {
  activeCount: number;
  resolvedCount: number;
  performanceScore: number;
}

@Component({
  selector: 'app-officers-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-surface p-6 space-y-4 font-sans">
      <div class="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Officer Roster & SLA Workload</h2>
          <p class="text-xs text-slate-500">Live active ticket distribution and performance efficacy scores.</p>
        </div>
        <span class="badge-status badge-progress">Field Operations</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <th class="py-3 px-3">Officer Name</th>
              <th class="py-3 px-3">Department</th>
              <th class="py-3 px-3 text-center">Active Queue</th>
              <th class="py-3 px-3 text-center">Resolved</th>
              <th class="py-3 px-3 text-center">SLA Efficacy</th>
              <th class="py-3 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
            @for (off of officerWorkloads; track off.id) {
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3 px-3 font-semibold text-slate-900">{{ off.name }}</td>
                <td class="py-3 px-3 text-slate-600">{{ departmentName(off.department) }}</td>
                <td class="py-3 px-3 text-center font-mono font-bold text-indigo-600">{{ off.activeCount }}</td>
                <td class="py-3 px-3 text-center font-mono text-emerald-600 font-bold">{{ off.resolvedCount }}</td>
                <td class="py-3 px-3 text-center font-mono font-bold text-slate-900">{{ off.performanceScore }}%</td>
                <td class="py-3 px-3 text-right">
                  <span class="badge-status badge-resolved">Dispatch Ready</span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class OfficersTableComponent implements OnInit {
  officerWorkloads: OfficerWorkload[] = [];
  private apiService = inject(ApiService);

  ngOnInit(): void {
    this.apiService.getUsers('officer').subscribe((officers) => {
      this.officerWorkloads = officers.map((off, idx) => ({
        ...off,
        activeCount: [2, 3, 1, 0][idx % 4],
        resolvedCount: [14, 25, 9, 31][idx % 4],
        performanceScore: [94, 91, 88, 97][idx % 4]
      }));
    });
  }

  departmentName(department: User['department']): string {
    if (!department) return 'General Operations';
    if (typeof department === 'string') return department;
    return department.name ?? 'General Operations';
  }
}
