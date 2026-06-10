import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-chat-message',
  standalone: false,
  template: `
    <article class="chat-message" [class.user]="type === 'user'" [class.assistant]="type === 'assistant'">
      <ng-content></ng-content>
    </article>
  `,
  styles: [
    `
      .chat-message { padding: 10px 12px; border-radius: 12px; margin-bottom: 8px; }
      .chat-message.user { background: #dbeafe; }
      .chat-message.assistant { background: #f3f4f6; }
    `
  ]
})
export class ChatMessageComponent {
  @Input() type: 'user' | 'assistant' = 'assistant';
}
