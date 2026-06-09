import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../core/services/api.service';

interface ReportNode {
  id: string;
  name: string;
  generatedAt: string;
  type: string;
  fileSize: string;
}

interface AnnouncementLike {
  id?: string;
  title?: string;
  description?: string;
  publishedDate?: string;
  createdAt?: string;
}

@Component({
  selector: 'app-reports-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="glass-panel p-6 rounded-xl border border-white/10 space-y-6 pb-12 bg-black/40 text-white">
      <!-- Header -->
      <div class="flex items-center gap-3">
        <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
        <h2 class="font-mono text-xs tracking-widest text-cyan-400 uppercase">SYSTEM AUDIT INTELLIGENCE REPORTS</h2>
      </div>

      <!-- Export Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 p-5 bg-white/2 border border-white/10 rounded-xl">
        <div class="flex-1">
          <h4 class="font-mono text-[10px] text-primary-var mb-2 uppercase text-white">EXPORT GENERAL COMPLAINT LEDGER</h4>
          <p class="text-[9px] font-mono text-muted-var uppercase text-gray-400">EXPORTS THE CHRONOLOGICAL WORKFLOW LOGS, COORDINATES AND RESOLUTION STATES.</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="exportReport('csv')" class="py-2.5 px-5 rounded bg-white hover:bg-white/90 text-black font-mono font-bold text-[10px] uppercase tracking-wider cursor-pointer">
            COMPILE CSV DATA
          </button>
          <button (click)="exportReport('pdf')" class="py-2.5 px-5 rounded border border-white/10 hover:bg-white/5 text-primary-var font-mono text-[10px] uppercase text-white cursor-pointer">
            COMPILE PDF REPORT
          </button>
        </div>
      </div>

      <!-- Historical Compiled Reports -->
      <div class="space-y-4">
        <span class="font-mono text-[9px] tracking-widest text-muted-var uppercase text-gray-400">COMPILED SYSTEM LOG ARCHIVES</span>
        <div class="space-y-2">
          @for (report of compiledReports; track report.id) {
            <div class="p-4 rounded-xl border border-white/10 bg-white/2 flex items-center justify-between font-mono text-[10px] uppercase">
              <div>
                <span class="text-cyan-400 block">{{ report.name }}</span>
                <span class="text-muted-var text-[8px] mt-1 block text-gray-400">COMPILED: {{ report.generatedAt }} | SIZE: {{ report.fileSize }}</span>
              </div>
              <button (click)="downloadReport(report)" class="px-3 py-1.5 rounded border border-white/10 hover:bg-white/5 text-[9px] tracking-wider font-semibold text-primary-var hover:text-primary-var transition-colors duration-200 text-white cursor-pointer">
                DOWNLOAD
              </button>
            </div>
          }
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
export class ReportsTableComponent implements OnInit {
  compiledReports: ReportNode[] = [];

  private apiService = inject(ApiService);

  ngOnInit(): void {
    this.apiService.getAnnouncements().subscribe((items) => {
      this.compiledReports = (items as AnnouncementLike[]).slice(0, 6).map((item, index) => ({
        id: item.id ?? `report-${index}`,
        name: (item.title ?? 'UNNAMED_REPORT').toUpperCase().replace(/\s+/g, '_'),
        generatedAt: (item.publishedDate ?? item.createdAt ?? new Date().toISOString()).slice(0, 16).replace('T', ' '),
        type: index % 2 === 0 ? 'PDF' : 'CSV',
        fileSize: `${(1.2 + index * 0.7).toFixed(1)} MB`
      }));
    });
  }

  exportReport(format: string) {
    alert(`Initiating server aggregation. Generating secure Q2 ${format.toUpperCase()} archive ledger...`);
  }

  downloadReport(report: ReportNode) {
    alert(`Downloading archive stream: ${report.name}.${report.type.toLowerCase()}`);
  }
}
