import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintsService } from '../../core/services/complaints.service';
import { Complaint } from '../../core/services/api.service';
import { GrievanceListComponent } from '../../shared/components/grievance-list/grievance-list.component';
import { GrievanceDetailComponent } from '../../shared/components/grievance-detail/grievance-detail.component';

@Component({
  selector: 'app-admin-complaints',
  standalone: true,
  imports: [CommonModule, GrievanceListComponent, GrievanceDetailComponent],
  template: `
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-12">
      <!-- Left Column: Grievance List and Filters -->
      <div class="xl:col-span-5">
        <app-grievance-list
          [complaints]="allComplaints"
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
export class AdminComplaintsComponent implements OnInit {
  allComplaints: Complaint[] = [];
  selectedComplaint: Complaint | null = null;

  private complaintsService = inject(ComplaintsService);

  ngOnInit(): void {
    this.loadComplaints();
  }

  loadComplaints() {
    this.complaintsService.loadComplaints().subscribe((data) => {
      this.allComplaints = data;
      if (this.selectedComplaint) {
        const updated = this.allComplaints.find(c => c.id === this.selectedComplaint?.id);
        this.selectedComplaint = updated || (this.allComplaints[0] || null);
      } else if (this.allComplaints.length > 0) {
        this.selectedComplaint = this.allComplaints[0];
      }
    });
  }

  onComplaintSelected(complaint: Complaint) {
    this.selectedComplaint = complaint;
  }
}
