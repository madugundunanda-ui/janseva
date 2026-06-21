export type NotificationChannel = 'websocket' | 'polling' | 'system' | 'api';
export type NotificationKind = 'citizen_alert' | 'officer_update' | 'admin_alert' | 'sla_warning' | 'complaint_update';

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  targetRole?: string;
  channel: NotificationChannel;
}
