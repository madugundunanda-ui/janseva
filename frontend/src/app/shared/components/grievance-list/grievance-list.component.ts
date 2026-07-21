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
    <div class="space-y-4">
      
      <!-- Toolbar & Filters -->
      <div class="card-surface p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        <!-- Search Input & Status Select -->
        <div class="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div class="relative flex-1 max-w-xs">
            <input type="text" 
                   [(ngModel)]="searchQuery" 
                   (ngModelChange)="applyFilters()" 
                   class="input-field text-xs pl-8" 
                   placeholder="Search grievances by ID, title, or ward...">
            <span class="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
          </div>

          <select [(ngModel)]="filterStatus" (change)="applyFilters()" class="select-field text-xs w-auto">
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        @if (showRegisterButton) {
          <button (click)="onRegisterClick()" class="btn-primary text-xs py-2 px-4 w-full sm:w-auto">
            + File Grievance
          </button>
        }
      </div>

      <!-- Offline Drafts Bar -->
      @if (offlineDraftsCount > 0) {
        <div class="p-3 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex justify-between items-center font-medium">
          <span>⚡ {{ offlineDraftsCount }} Offline drafts cached in browser storage</span>
          <button (click)="syncOfflineDrafts()" class="btn-primary text-xs py-1 px-3">Sync Now</button>
        </div>
      }

      <!-- High-Density Data Table / Stack List -->
      <div class="card-surface overflow-hidden">
        <div class="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Grievances Stack ({{ filteredComplaints.length }})
          </span>
        </div>

        <div class="divide-y divide-slate-100">
          @for (complaint of filteredComplaints; track complaint.id) {
            <div (click)="selectComplaint(complaint)" 
                 [class.bg-indigo-50\/50]="selectedComplaint?.id === complaint.id" 
                 class="p-4 hover:bg-slate-50 transition-colors cursor-pointer relative">
              
              @if (selectedComplaint?.id === complaint.id) {
                <div class="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>
              }

              <div class="flex items-center justify-between gap-2 text-xs font-medium text-slate-500 mb-1">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-slate-700 font-semibold">{{ complaint.id }}</span>
                  <span>•</span>
                  <span>Ward {{ complaint.location.ward || '01' }}</span>
                </div>

                <span class="badge-status" [ngClass]="{
                  'badge-pending': complaint.status === 'submitted',
                  'badge-progress': complaint.status === 'in_progress' || complaint.status === 'assigned',
                  'badge-resolved': complaint.status === 'resolved',
                  'badge-danger': complaint.status === 'escalated'
                }">
                  {{ complaint.status | uppercase }}
                </span>
              </div>

              <h4 class="text-sm font-semibold text-slate-900 truncate mb-1">{{ complaint.title }}</h4>
              <p class="text-xs text-slate-600 line-clamp-2 leading-relaxed">{{ complaint.description }}</p>

              <div class="mt-3 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Dept: {{ departmentName(complaint.department) }}</span>
                <span class="font-semibold" [ngClass]="{
                  'text-rose-600': complaint.priority === 'critical' || complaint.priority === 'high',
                  'text-amber-600': complaint.priority === 'medium',
                  'text-slate-600': complaint.priority === 'low'
                }">{{ complaint.priority | uppercase }} Priority</span>
              </div>
            </div>
          } @empty {
            <!-- Clean Empty State -->
            <div class="p-12 text-center space-y-3">
              <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center text-xl mx-auto">📋</div>
              <h3 class="text-sm font-semibold text-slate-700">No Grievances Found</h3>
              <p class="text-xs text-slate-500 max-w-xs mx-auto">No records align with the active search or filter criteria.</p>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class GrievanceListComponent implements OnInit, OnChanges {
  @Input() complaints: Complaint[] = [];
  @Input() showRegisterButton = false;
  @Output() selected = new EventEmitter<Complaint>();
  @Output() registerClick = new EventEmitter<void>();

  searchQuery = '';
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
    let result = [...this.complaints];

    if (this.filterStatus !== 'all') {
      result = result.filter(c => c.status === this.filterStatus);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(c => 
        (c.id && c.id.toLowerCase().includes(q)) ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q)) ||
        (c.location && c.location.address && c.location.address.toLowerCase().includes(q))
      );
    }

    this.filteredComplaints = result;
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
