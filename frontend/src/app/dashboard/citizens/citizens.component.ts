import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService, User } from '../../core/services/api.service';

@Component({
  selector: 'app-citizens',
  imports: [CommonModule],
  template: `
    <div class="glass-panel p-6 rounded-xl border border-var space-y-6 pb-12">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
        <h2 class="font-mono text-xs tracking-widest text-cyan-400 uppercase">CITIZEN NODE DIRECTORY</h2>
      </div>

      <!-- Citizens Table Roster -->
      <div class="overflow-x-auto">
        <table class="w-full font-mono text-[10px] uppercase border-collapse text-left">
          <thead>
            <tr class="border-b border-var text-muted-var">
              <th class="pb-3 pr-4">Node Name</th>
              <th class="pb-3 px-4">Secure Contact Email</th>
              <th class="pb-3 px-4">Register Phone</th>
              <th class="pb-3 px-4 text-center">Ward Address</th>
              <th class="pb-3 px-4 text-right">Verification</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5 text-primary-var">
            @for (cit of citizensList; track cit.id) {
              <tr>
                <td class="py-4 pr-4 font-semibold text-primary-var">{{ cit.name }}</td>
                <td class="py-4 px-4 text-muted-var lowercase font-sans">{{ cit.email }}</td>
                <td class="py-4 px-4 text-muted-var">{{ cit.phone || '9999999999' }}</td>
                <td class="py-4 px-4 text-center text-cyan-400">{{ cit.address || 'Ward 12' }}</td>
                <td class="py-4 px-4 text-right">
                  <span class="px-2 py-0.5 rounded text-[8px] bg-cyan-950/20 border border-cyan-500/30 text-cyan-400">
                    VERIFIED_ID
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
export class CitizensComponent implements OnInit {
  citizensList: User[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.apiService.getUsers('citizen').subscribe((users) => {
      this.citizensList = users;
    });
  }
}
