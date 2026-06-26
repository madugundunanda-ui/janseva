import { Injectable } from '@angular/core';
import { Message } from '../models/ai-assistant.model';

@Injectable({
  providedIn: 'root'
})
export class ConversationPersistenceService {
  private readonly STORAGE_KEY = 'janseva_ai_messages';

  saveConversation(messages: Message[]): void {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages));
      } catch (e) {
        console.error('Failed to save conversation to storage', e);
      }
    }
  }

  loadConversation(): Message[] {
    if (typeof window !== 'undefined') {
      try {
        const data = window.localStorage.getItem(this.STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          // Convert string timestamps back to Date objects
          return parsed.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp)
          }));
        }
      } catch (e) {
        console.error('Failed to load conversation from storage', e);
      }
    }
    return [];
  }

  clearConversation(): void {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(this.STORAGE_KEY);
      } catch (e) {
        console.error('Failed to clear conversation from storage', e);
      }
    }
  }
}
