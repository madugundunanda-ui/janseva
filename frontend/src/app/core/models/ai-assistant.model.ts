export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  url: string;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'user' | 'assistant' | 'system';
  type: 'text' | 'image' | 'card' | 'suggestions';
  content: string;
  timestamp: Date;
  status: 'pending' | 'success' | 'error';
  language?: string;
  attachments?: MessageAttachment[];
  retryCount?: number;
  isEdited?: boolean;
  metadata?: any;
}
