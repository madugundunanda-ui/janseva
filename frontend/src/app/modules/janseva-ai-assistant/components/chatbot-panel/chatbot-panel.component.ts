import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-chatbot-panel',
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
