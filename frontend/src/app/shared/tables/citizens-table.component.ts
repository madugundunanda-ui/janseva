import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, User } from '../../core/services/api.service';

@Component({
  selector: 'app-citizens-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card-surface p-6 space-y-4 font-sans">
      <div class="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900">Citizens Directory</h2>
          <p class="text-xs text-slate-500">Verified citizen nodes registered for civic grievance filing.</p>
        </div>
        <span class="badge-status badge-progress">Verified Nodes</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <th class="py-3 px-3">Citizen Name</th>
              <th class="py-3 px-3">Email Address</th>
              <th class="py-3 px-3">Phone</th>
              <th class="py-3 px-3 text-center">Ward Address</th>
              <th class="py-3 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium text-slate-800">
            @for (cit of citizensList; track cit.id) {
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="py-3 px-3 font-semibold text-slate-900">{{ cit.name }}</td>
                <td class="py-3 px-3 text-slate-600 font-mono">{{ cit.email }}</td>
                <td class="py-3 px-3 text-slate-600 font-mono">{{ cit.phone || '+91 9876543210' }}</td>
                <td class="py-3 px-3 text-center text-indigo-600 font-semibold">{{ cit.address || 'Ward 12' }}</td>
                <td class="py-3 px-3 text-right">
                  <span class="badge-status badge-resolved">Verified Node</span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class CitizensTableComponent implements OnInit {
  citizensList: User[] = [];
  private apiService = inject(ApiService);

  ngOnInit(): void {
    this.apiService.getUsers('citizen').subscribe((users) => {
      this.citizensList = users;
    });
  }
}
