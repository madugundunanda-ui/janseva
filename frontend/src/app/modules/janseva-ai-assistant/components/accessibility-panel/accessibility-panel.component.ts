import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-accessibility-panel',
  standalone: false,
  template: `
    <div class="accessibility-panel">
      <button type="button" (click)="toggleLargeText()">Large Text</button>
      <button type="button" (click)="toggleHighContrast()">High Contrast</button>
    </div>
  `,
  styles: [
    `
      .accessibility-panel { display: flex; gap: 8px; flex-wrap: wrap; }
      button { padding: 10px 12px; border-radius: 10px; border: 1px solid #d1d5db; background: #fff; }
    `
  ]
})
export class AccessibilityPanelComponent {
  @Output() largeTextToggled = new EventEmitter<void>();
  @Output() highContrastToggled = new EventEmitter<void>();

  toggleLargeText(): void {
    this.largeTextToggled.emit();
  }

  toggleHighContrast(): void {
    this.highContrastToggled.emit();
  }
}
