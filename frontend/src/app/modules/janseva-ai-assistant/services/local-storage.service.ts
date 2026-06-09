/**
 * Local Storage Service
 * Handles persistent storage for user preferences and session data
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly PREFIX = 'janseva_ai_';

  /**
   * Set item in local storage
   */
  setItem(key: string, value: any): void {
    try {
      const prefixedKey = this.PREFIX + key;
      localStorage.setItem(prefixedKey, JSON.stringify(value));
    } catch (error) {
      console.error(`Error saving to local storage: ${key}`, error);
    }
  }

  /**
   * Get item from local storage
   */
  getItem(key: string): any {
    try {
      const prefixedKey = this.PREFIX + key;
      const value = localStorage.getItem(prefixedKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error reading from local storage: ${key}`, error);
      return null;
    }
  }

  /**
   * Remove item from local storage
   */
  removeItem(key: string): void {
    try {
      const prefixedKey = this.PREFIX + key;
      localStorage.removeItem(prefixedKey);
    } catch (error) {
      console.error(`Error removing from local storage: ${key}`, error);
    }
  }

  /**
   * Clear all JanSeva AI items
   */
  clear(): void {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing local storage', error);
    }
  }

  /**
   * Save user preferences
   */
  saveUserPreferences(preferences: any): void {
    this.setItem('user_preferences', preferences);
  }

  /**
   * Get user preferences
   */
  getUserPreferences(): any {
    return this.getItem('user_preferences');
  }

  /**
   * Save session data
   */
  saveSessionData(sessionId: string, data: any): void {
    this.setItem(`session_${sessionId}`, data);
  }

  /**
   * Get session data
   */
  getSessionData(sessionId: string): any {
    return this.getItem(`session_${sessionId}`);
  }

  /**
   * Save consent preferences
   */
  saveConsentPreferences(consents: { voice: boolean; location: boolean }): void {
    this.setItem('consent_preferences', {
      ...consents,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get consent preferences
   */
  getConsentPreferences(): any {
    return this.getItem('consent_preferences');
  }

  /**
   * Check consent
   */
  hasConsent(type: 'voice' | 'location'): boolean {
    const consents = this.getConsentPreferences();
    return consents ? consents[type] === true : false;
  }

  /**
   * Save language preference
   */
  saveLanguagePreference(language: string): void {
    this.setItem('language_preference', language);
  }

  /**
   * Get language preference
   */
  getLanguagePreference(): string | null {
    return this.getItem('language_preference');
  }

  /**
   * Save district preference
   */
  saveDistrictPreference(district: string): void {
    this.setItem('district_preference', district);
  }

  /**
   * Get district preference
   */
  getDistrictPreference(): string | null {
    return this.getItem('district_preference');
  }

  /**
   * Save workflow progress
   */
  saveWorkflowProgress(workflowId: number, progress: any): void {
    this.setItem(`workflow_${workflowId}`, progress);
  }

  /**
   * Get workflow progress
   */
  getWorkflowProgress(workflowId: number): any {
    return this.getItem(`workflow_${workflowId}`);
  }

  /**
   * Save offline complaint queue
   */
  saveOfflineComplaintQueue(queue: any[]): void {
    this.setItem('offline_complaint_queue', queue);
  }

  /**
   * Get offline complaint queue
   */
  getOfflineComplaintQueue(): any[] {
    return this.getItem('offline_complaint_queue') || [];
  }

  /**
   * Clear offline complaint queue
   */
  clearOfflineComplaintQueue(): void {
    this.removeItem('offline_complaint_queue');
  }

  /**
   * Save accessibility settings
   */
  saveAccessibilitySettings(settings: any): void {
    this.setItem('accessibility_settings', settings);
  }

  /**
   * Get accessibility settings
   */
  getAccessibilitySettings(): any {
    return this.getItem('accessibility_settings');
  }
}
