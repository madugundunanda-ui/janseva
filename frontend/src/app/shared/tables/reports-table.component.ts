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
    <div class="card-surface p-6 space-y-6 font-sans">
      <div class="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900">System Audit Intelligence Reports</h2>
          <p class="text-xs text-slate-500">Export grievance ledgers, SLA compliance records, and AI model audit logs.</p>
        </div>
        <span class="badge-status badge-progress">Audit Ledger</span>
      </div>

      <div class="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 class="font-bold text-sm text-slate-900">Export Complete Grievance Ledger</h4>
          <p class="text-xs text-slate-500 mt-0.5">Includes chronological workflow logs, location coordinates, and resolution proof timestamps.</p>
        </div>

        <div class="flex items-center gap-3 shrink-0">
          <button (click)="exportReport('csv')" class="btn-primary text-xs py-2 px-4">Compile CSV</button>
          <button (click)="exportReport('pdf')" class="btn-secondary text-xs py-2 px-4">Compile PDF</button>
        </div>
      </div>

      <div class="space-y-3">
        <h3 class="text-xs font-semibold text-slate-700 uppercase tracking-wider">Historical Audit Archives</h3>
        <div class="space-y-2">
          @for (report of compiledReports; track report.id) {
            <div class="p-3.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs hover:border-slate-300 transition-colors">
              <div>
                <span class="font-bold text-slate-900 block">{{ report.name }}</span>
                <span class="text-slate-500 text-[11px] font-mono mt-0.5 block">Compiled: {{ report.generatedAt }} • Size: {{ report.fileSize }}</span>
              </div>
              <button (click)="downloadReport(report)" class="btn-secondary text-xs py-1 px-3">Download</button>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class ReportsTableComponent implements OnInit {
  compiledReports: ReportNode[] = [];
  private apiService = inject(ApiService);

  ngOnInit(): void {
    this.apiService.getAnnouncements().subscribe((items) => {
      this.compiledReports = (items as AnnouncementLike[]).slice(0, 6).map((item, index) => ({
        id: item.id ?? `report-${index}`,
        name: (item.title ?? 'UNNAMED_REPORT').replace(/\s+/g, ' '),
        generatedAt: (item.publishedDate ?? item.createdAt ?? new Date().toISOString()).slice(0, 16).replace('T', ' '),
        type: index % 2 === 0 ? 'PDF' : 'CSV',
        fileSize: `${(1.2 + index * 0.7).toFixed(1)} MB`
      }));
    });
  }

  exportReport(format: string) {
    alert(`Generating ${format.toUpperCase()} archive ledger report...`);
  }

  downloadReport(report: ReportNode) {
    alert(`Downloading archive: ${report.name}.${report.type.toLowerCase()}`);
  }
}
