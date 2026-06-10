import { Component } from '@angular/core';

@Component({
  selector: 'app-chatbot-panel',
  standalone: false,
  template: `
    <section class="chatbot-panel">
      <ng-content></ng-content>
    </section>
  `,
  styles: [
    `
      .chatbot-panel { display: block; width: 100%; }
    `
  ]
})
export class ChatbotPanelComponent {}
