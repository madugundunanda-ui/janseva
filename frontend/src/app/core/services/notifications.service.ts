import { Injectable, signal } from '@angular/core';
import { Subscription, interval, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UpdatesService } from './updates.service';
import { NotificationItem } from '../models/notification.model';
import { GovernanceUpdate } from '../models/update.model';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  readonly notifications = signal<NotificationItem[]>([]);

  private socket: Socket | null = null;
  private pollingSub: Subscription | null = null;
  private reconnectTimeout: any = null;

  constructor(private updatesService: UpdatesService) {}

  connect(): void {
    this.disconnect();

    if (typeof window === 'undefined' || !environment.websocketUrl) {
      this.startPolling();
      return;
    }

    const token = window.localStorage.getItem('token');
    if (!token) {
      this.startPolling();
      return;
    }

    try {
      let wsUrl = environment.websocketUrl;
      // Convert ws:// to http:// since socket.io expects http url
      wsUrl = wsUrl.replace(/^ws:/i, 'http:').replace(/^wss:/i, 'https:');
      
      this.socket = io(wsUrl, {
        auth: {
          token
        },
        transports: ['websocket', 'polling']
      });
      
      this.socket.on('connect', () => {
        this.stopPolling();
      });

      this.socket.on('notification', (payload) => {
        const notifications = this.normalizePayload(payload);
        if (notifications.length > 0) {
          this.mergeNotifications(notifications);
        }
      });

      this.socket.on('disconnect', () => {
        this.startPolling();
        this.scheduleReconnect();
      });

      this.socket.on('connect_error', () => {
        this.startPolling();
        this.scheduleReconnect();
      });
    } catch {
      this.startPolling();
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.stopPolling();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  markRead(notificationId: string): void {
    this.notifications.update((items) =>
      items.map((item) => (item.id === notificationId ? { ...item, read: true } : item))
    );
  }

  clearAll(): void {
    this.notifications.set([]);
  }

  private stopPolling(): void {
    this.pollingSub?.unsubscribe();
    this.pollingSub = null;
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      if (!this.socket || this.socket.disconnected) {
        this.connect();
      }
    }, 15000);
  }

  private startPolling(): void {
    if (this.pollingSub) {
      return;
    }

    this.pollingSub = interval(15000).pipe(
      switchMap(() => this.updatesService.getLiveUpdates())
    ).subscribe({
      next: (updates) => {
        this.mergeNotifications(this.toNotifications(updates));
      },
      error: (err) => {
        console.error('Live updates polling failed:', err);
      }
    });
  }

  private mergeNotifications(items: NotificationItem[]): void {
    this.notifications.update((existing) => {
      const merged = [...items, ...existing];
      const deduped = merged.filter((item, index, array) => array.findIndex((candidate) => candidate.id === item.id) === index);
      return deduped.slice(0, 50);
    });
  }

  private toNotifications(updates: GovernanceUpdate[]): NotificationItem[] {
    return updates.map((update) => ({
      id: update.id,
      kind: this.mapKind(update.severity),
      title: update.department,
      message: update.message,
      timestamp: update.timestamp,
      read: false,
      channel: 'polling',
      targetRole: 'officer',
    }));
  }

  private normalizePayload(payload: unknown): NotificationItem[] {
    // If it's a single object from NotificationService
    if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'title' in payload) {
      const update = payload as any;
      return [{
        id: update.id,
        kind: this.mapKind(update.priority === 'Critical' ? 'critical' : (update.priority === 'High' ? 'warning' : 'info')),
        title: update.title,
        message: update.message,
        timestamp: update.timestamp,
        read: update.read || false,
        channel: 'websocket',
      }];
    }
    
    // Legacy support for arrays (from broadcast)
    if (Array.isArray(payload)) {
      const first = payload[0];
      if (first && typeof first === 'object' && 'message' in first) {
        return (payload as GovernanceUpdate[]).map((update) => ({
          id: update.id,
          kind: this.mapKind(update.severity),
          title: update.department,
          message: update.message,
          timestamp: update.timestamp,
          read: false,
          channel: 'websocket',
        }));
      }
    }
    return [];
  }

  private parsePayload(data: unknown): unknown {
    if (typeof data !== 'string') {
      return data;
    }

    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }

  private mapKind(severity: GovernanceUpdate['severity']): NotificationItem['kind'] {
    if (severity === 'critical') {
      return 'admin_alert';
    }
    if (severity === 'warning') {
      return 'sla_warning';
    }
    return 'officer_update';
  }
}
