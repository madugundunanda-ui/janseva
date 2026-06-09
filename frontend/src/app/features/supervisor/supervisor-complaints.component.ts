import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintsService } from '../../core/services/complaints.service';
import { AuthService } from '../../core/services/auth.service';
import { Complaint } from '../../core/services/api.service';
import { GrievanceListComponent } from '../../shared/components/grievance-list/grievance-list.component';
import { GrievanceDetailComponent } from '../../shared/components/grievance-detail/grievance-detail.component';

@Component({
  selector: 'app-supervisor-complaints',
  standalone: true,
  imports: [CommonModule, GrievanceListComponent, GrievanceDetailComponent],
  template: `
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-12">
      <!-- Left Column: Grievance List and Filters -->
      <div class="xl:col-span-5">
        <app-grievance-list
          [complaints]="deptComplaints"
          [showRegisterButton]="false"
          (selected)="onComplaintSelected($event)">
        </app-grievance-list>
      </div>

      <!-- Right Column: Grievance Details View -->
      <div class="xl:col-span-7">
        <app-grievance-detail
          [complaint]="selectedComplaint"
          (refresh)="loadComplaints()">
        </app-grievance-detail>
      </div>
    </div>
  `
})
export class SupervisorComplaintsComponent implements OnInit {
  deptComplaints: Complaint[] = [];
  selectedComplaint: Complaint | null = null;

  private complaintsService = inject(ComplaintsService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.loadComplaints();
  }

  loadComplaints() {
    const user = this.authService.currentUser();
    const userDeptId = this.getDepartmentId();

    if (user) {
      this.complaintsService.loadComplaints().subscribe((data) => {
        this.deptComplaints = data.filter(c => {
          const compDeptId = typeof c.department === 'object' && c.department !== null ? (c.department as any).id || (c.department as any)._id : c.department;
          return compDeptId === userDeptId;
        });

        if (this.selectedComplaint) {
          const updated = this.deptComplaints.find(c => c.id === this.selectedComplaint?.id);
          this.selectedComplaint = updated || (this.deptComplaints[0] || null);
        } else if (this.deptComplaints.length > 0) {
          this.selectedComplaint = this.deptComplaints[0];
        }
      });
    }
  }

  onComplaintSelected(complaint: Complaint) {
    this.selectedComplaint = complaint;
  }

  getDepartmentId(): string {
    const user = this.authService.currentUser();
    if (!user) return '';
    if (typeof user.department === 'object' && user.department !== null) {
      return (user.department as any).id || (user.department as any)._id || '';
    }
    return String(user.department || '');
  }
}
