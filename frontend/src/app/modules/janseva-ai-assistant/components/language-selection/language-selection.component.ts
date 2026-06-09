import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-language-selection',
  template: `
    <div class="language-selection">
      <button type="button" (click)="choose('en-IN')">English</button>
      <button type="button" (click)="choose('te-IN')">తెలుగు</button>
      <button type="button" (click)="choose('ta-IN')">தமிழ்</button>
      <button type="button" (click)="choose('kn-IN')">ಕನ್ನಡ</button>
    </div>
  `,
  styles: [
    `
      .language-selection { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; }
      button { padding: 10px 12px; border-radius: 10px; border: 1px solid #c7d2fe; background: #fff; }
    `
  ]
})
export class LanguageSelectionComponent {
  @Output() languageSelected = new EventEmitter<string>();

  choose(language: string): void {
    this.languageSelected.emit(language);
  }
}
