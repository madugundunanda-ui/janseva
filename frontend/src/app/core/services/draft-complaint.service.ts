import { Injectable } from '@angular/core';

export interface LocationDraft {
  address?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface ComplaintDraft {
  title?: string;
  description?: string;
  category?: string;
  department?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical' | 'urgent';
  location?: LocationDraft;
  images?: string[];
  audioUrl?: string;
  lastSavedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class DraftComplaintService {
  private STORAGE_KEY = 'janseva_complaint_draft';

  saveDraft(draft: Partial<ComplaintDraft>): void {
    if (typeof window === 'undefined') return;
    const existing = this.getDraft() || {};
    const fullDraft: ComplaintDraft = {
      ...existing,
      ...draft,
      lastSavedAt: new Date().toISOString()
    };
    window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(fullDraft));
  }

  getDraft(): ComplaintDraft | null {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  hasDraft(): boolean {
    return this.getDraft() !== null;
  }

  clearDraft(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(this.STORAGE_KEY);
  }
}
