import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { FooterComponent } from '../shared/components/footer/footer.component';

@Component({
  selector: 'app-transparency-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, FooterComponent],
  templateUrl: './transparency-portal.component.html',
  styleUrls: ['./transparency-portal.component.css']
})
export class TransparencyPortalComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/transparency`;

  stats: any = null;
  departments: any[] = [];
  resolvedComplaints: any[] = [];
  actions: any[] = [];
  impact: any = null;
  civicScores: any[] = [];
  successStories: any[] = [];
  
  activeTab = 'overview';
  loading = true;
  Math = Math;

  ngOnInit() {
    this.fetchAllData();
  }

  async fetchAllData() {
    this.loading = true;
    try {
      const [statsRes, deptsRes, compRes, actRes, impRes, scoresRes, storiesRes] = await Promise.all([
        this.http.get<any>(`${this.apiUrl}/stats`).toPromise(),
        this.http.get<any>(`${this.apiUrl}/departments`).toPromise(),
        this.http.get<any>(`${this.apiUrl}/resolved-complaints`).toPromise(),
        this.http.get<any>(`${this.apiUrl}/actions`).toPromise(),
        this.http.get<any>(`${this.apiUrl}/impact`).toPromise(),
        this.http.get<any>(`${this.apiUrl}/civic-scores`).toPromise(),
        this.http.get<any>(`${this.apiUrl}/success-stories`).toPromise()
      ]);

      this.stats = statsRes.data;
      this.departments = deptsRes.data;
      this.resolvedComplaints = compRes.data;
      this.actions = actRes.data;
      this.impact = impRes.data;
      this.civicScores = scoresRes.data;
      this.successStories = storiesRes.data;
    } catch (e) {
      console.error('Error fetching transparency data', e);
    } finally {
      this.loading = false;
    }
  }

  setTab(tab: string) {
    this.activeTab = tab;
  }
}
