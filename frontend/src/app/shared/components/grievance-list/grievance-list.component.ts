import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Complaint, Department } from '../../../core/services/api.service';
import { TranslationService } from '../../../core/services/translation.service';
import { ComplaintsService } from '../../../core/services/complaints.service';
import { DepartmentsService } from '../../../core/services/departments.service';

@Component({
  selector: 'app-grievance-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6 text-white">
      <!-- Filters panel -->
      <div class="glass-panel p-5 rounded-xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40">
        <div class="flex items-center gap-3">
          <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
          <h2 class="font-mono text-[10px] tracking-widest text-cyan-400 uppercase font-bold">{{ translationService.t('FILTERS') }}</h2>
        </div>

        <div class="flex items-center gap-3">
          <select [(ngModel)]="filterStatus" (change)="applyFilters()" class="glass-input !py-1.5 !px-2.5 font-mono text-[10px] uppercase bg-black text-white border border-white/10 rounded">
            <option value="all">{{ translationService.t('ALL_STATES') }}</option>
            <option value="submitted">{{ translationService.t('SUBMITTED') }}</option>
            <option value="assigned">{{ translationService.t('ASSIGNED') }}</option>
            <option value="in_progress">{{ translationService.t('IN_PROGRESS') }}</option>
            <option value="resolved">{{ translationService.t('RESOLVED') }}</option>
            <option value="escalated">{{ translationService.t('ESCALATED') }}</option>
          </select>
        </div>
      </div>

      <!-- Offline Drafts Status bar -->
      @if (offlineDraftsCount > 0) {
        <div class="p-4 rounded-xl border border-cyan-500/35 bg-cyan-950/20 text-cyan-300 font-mono text-[10px] uppercase tracking-wide flex justify-between items-center shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>{{ offlineDraftsCount }} Offline drafts cached in local node</span>
          </div>
          <button (click)="syncOfflineDrafts()" class="px-2.5 py-1 rounded bg-cyan-500 text-black font-bold text-[9px] hover:bg-cyan-400 transition-colors uppercase cursor-pointer">
            Sync Node
          </button>
        </div>
      }

      <!-- Grievances Feed List -->
      <div data-lenis-prevent class="glass-panel rounded-xl border border-white/10 overflow-hidden max-h-[600px] overflow-y-auto bg-black/40">
        <div class="p-5 border-b border-white/10 flex items-center justify-between">
          <span class="font-mono text-[10px] tracking-widest text-muted-var uppercase text-gray-400">{{ translationService.t('GRIEVANCE_STACK') }} ({{ filteredComplaints.length }})</span>
          
          @if (showRegisterButton) {
            <button (click)="onRegisterClick()" class="py-1.5 px-3 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-[9px] uppercase tracking-wider transition-all duration-300 cursor-pointer">
              {{ translationService.t('REGISTER_TICKET') }}
            </button>
          }
        </div>

        <div class="divide-y divide-white/5">
          @for (complaint of filteredComplaints; track complaint.id) {
            <div (click)="selectComplaint(complaint)" [class.bg-white/3]="selectedComplaint?.id === complaint.id" class="p-5 hover:bg-white/2 transition-colors duration-200 cursor-pointer relative">
              <!-- Glowing active tag border -->
              @if (selectedComplaint?.id === complaint.id) {
                <div class="absolute left-0 top-0 bottom-0 w-[3px] bg-cyan-500"></div>
              }

              <div class="flex justify-between items-start mb-2 font-mono text-[9px] tracking-wider uppercase text-muted-var text-gray-400">
                <span>{{ complaint.id }} // WARD {{ complaint.location.ward }}</span>
                <span class="px-2 py-0.5 rounded text-[8px] border" [ngClass]="{
                  'border-purple-500/30 text-purple-400 bg-purple-950/15': complaint.status === 'submitted',
                  'border-blue-500/30 text-blue-400 bg-blue-950/15': complaint.status === 'assigned',
                  'border-cyan-500/30 text-cyan-400 bg-cyan-950/15': complaint.status === 'in_progress',
                  'border-emerald-500/30 text-emerald-400 bg-emerald-950/15': complaint.status === 'resolved',
                  'border-red-500/30 text-red-400 bg-red-950/15': complaint.status === 'escalated'
                }">{{ translationService.t(complaint.status.toUpperCase()) }}</span>
              </div>

              <h4 class="text-sm font-semibold text-primary-var tracking-wide mb-2 truncate uppercase text-white">{{ complaint.title }}</h4>
              <p class="text-xs text-muted-var line-clamp-2 uppercase font-mono tracking-wide text-gray-400">{{ complaint.description }}</p>

              <div class="mt-4 flex items-center justify-between font-mono text-[9px] text-muted-var uppercase text-gray-400">
                <span>DEPT: {{ departmentName(complaint.department) }}</span>
                <span class="text-red-400 font-semibold">{{ complaint.priority }}</span>
              </div>
            </div>
          } @empty {
            <div class="p-10 text-center font-mono text-xs text-muted-var uppercase text-gray-500">
              No tickets align with filters.
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
export class GrievanceListComponent implements OnInit, OnChanges {
  @Input() complaints: Complaint[] = [];
  @Input() showRegisterButton = false;
  @Output() selected = new EventEmitter<Complaint>();
  @Output() registerClick = new EventEmitter<void>();

  filterStatus = 'all';
  filteredComplaints: Complaint[] = [];
  selectedComplaint: Complaint | null = null;
  offlineDraftsCount = 0;
  departmentsList: Department[] = [];

  public translationService = inject(TranslationService);
  private complaintsService = inject(ComplaintsService);
  private departmentsService = inject(DepartmentsService);

  ngOnInit(): void {
    this.departmentsService.loadDepartments().subscribe(data => {
      this.departmentsList = data;
    });
    this.checkOfflineDrafts();
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.syncOfflineDrafts());
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['complaints']) {
      this.applyFilters();
      if (this.filteredComplaints.length > 0 && !this.selectedComplaint) {
        this.selectComplaint(this.filteredComplaints[0]);
      }
    }
  }

  applyFilters() {
    if (this.filterStatus === 'all') {
      this.filteredComplaints = [...this.complaints];
    } else {
      this.filteredComplaints = this.complaints.filter(c => c.status === this.filterStatus);
    }
  }

  selectComplaint(complaint: Complaint) {
    this.selectedComplaint = complaint;
    this.selected.emit(complaint);
  }

  onRegisterClick() {
    this.registerClick.emit();
  }

  checkOfflineDrafts() {
    if (typeof window === 'undefined') return;
    const draftsStr = localStorage.getItem('offline_complaints');
    if (draftsStr) {
      try {
        const drafts = JSON.parse(draftsStr);
        this.offlineDraftsCount = Array.isArray(drafts) ? drafts.length : 0;
      } catch (e) {
        this.offlineDraftsCount = 0;
      }
    } else {
      this.offlineDraftsCount = 0;
    }
  }

  syncOfflineDrafts() {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    const draftsStr = localStorage.getItem('offline_complaints');
    if (!draftsStr) return;

    try {
      const drafts = JSON.parse(draftsStr);
      if (Array.isArray(drafts) && drafts.length > 0) {
        const draft = drafts[0];
        const formData = new FormData();
        formData.append('title', draft.title);
        formData.append('description', draft.description);
        formData.append('department', draft.department);
        
        const locationObj = {
          address: draft.address,
          ward: draft.ward,
          latitude: draft.lat,
          longitude: draft.lng,
          landmark: draft.landmark
        };
        formData.append('location', JSON.stringify(locationObj));

        if (draft.fileBase64) {
          const file = this.base64ToFile(draft.fileBase64, draft.fileName);
          formData.append('image', file);
        }

        this.complaintsService.createComplaint(formData).subscribe({
          next: () => {
            drafts.shift();
            localStorage.setItem('offline_complaints', JSON.stringify(drafts));
            this.checkOfflineDrafts();
            // Trigger refresh event
            this.syncOfflineDrafts();
          }
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  base64ToFile(base64: string, filename: string): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  departmentName(dept: any): string {
    if (!dept) return 'General Operations';
    if (typeof dept === 'string') {
      const match = this.departmentsList.find(d => d.id === dept || d.name.toLowerCase() === dept.toLowerCase());
      return match?.name ?? dept;
    }
    return dept.name ?? 'General Operations';
  }
}
