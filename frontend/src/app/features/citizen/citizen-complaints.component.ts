import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintsService } from '../../core/services/complaints.service';
import { AuthService } from '../../core/services/auth.service';
import { Complaint } from '../../core/services/api.service';
import { GrievanceListComponent } from '../../shared/components/grievance-list/grievance-list.component';
import { GrievanceDetailComponent } from '../../shared/components/grievance-detail/grievance-detail.component';
import { NewComplaintModalComponent } from '../../shared/modals/new-complaint/new-complaint.component';

@Component({
  selector: 'app-citizen-complaints',
  standalone: true,
  imports: [CommonModule, GrievanceListComponent, GrievanceDetailComponent, NewComplaintModalComponent],
  template: `
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-12">
      <!-- Left Column: Grievance List and Filters -->
      <div class="xl:col-span-5">
        <app-grievance-list
          [complaints]="myComplaints"
          [showRegisterButton]="true"
          (selected)="onComplaintSelected($event)"
          (registerClick)="openNewComplaintModal()">
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

    <!-- Modal: Register New Complaint -->
    @if (showNewComplaintModal) {
      <app-new-complaint-modal
        (close)="closeNewComplaintModal()"
        (success)="onComplaintCreated()">
      </app-new-complaint-modal>
    }
  `
})
export class CitizenComplaintsComponent implements OnInit {
  myComplaints: Complaint[] = [];
  selectedComplaint: Complaint | null = null;
  showNewComplaintModal = false;

  private complaintsService = inject(ComplaintsService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.loadComplaints();
  }

  loadComplaints() {
    const user = this.authService.currentUser();
    if (user) {
      this.complaintsService.loadComplaints().subscribe((data) => {
        this.myComplaints = data.filter(c => c.citizen?.id === user.id || c.citizen?.name === user.name);
        // Retain selection if valid
        if (this.selectedComplaint) {
          const updated = this.myComplaints.find(c => c.id === this.selectedComplaint?.id);
          this.selectedComplaint = updated || (this.myComplaints[0] || null);
        } else if (this.myComplaints.length > 0) {
          this.selectedComplaint = this.myComplaints[0];
        }
      });
    }
  }

  onComplaintSelected(complaint: Complaint) {
    this.selectedComplaint = complaint;
  }

  openNewComplaintModal() {
    this.showNewComplaintModal = true;
  }

  closeNewComplaintModal() {
    this.showNewComplaintModal = false;
  }

  onComplaintCreated() {
    this.showNewComplaintModal = false;
    this.loadComplaints();
  }
}
