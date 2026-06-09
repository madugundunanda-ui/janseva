/**
 * JanSeva AI Assistant Angular Module
 * Main module for integrating the AI voice assistant throughout the platform
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatExpansionModule } from '@angular/material/expansion';
import { TranslateModule } from '@ngx-translate/core';

// Components
import { FloatingAssistantComponent } from './components/floating-assistant/floating-assistant.component';
import { ChatbotPanelComponent } from './components/chatbot-panel/chatbot-panel.component';
import { ComplaintAssistantComponent } from './components/complaint-assistant/complaint-assistant.component';
import { LanguageSelectionComponent } from './components/language-selection/language-selection.component';
import { VoiceInputComponent } from './components/voice-input/voice-input.component';
import { ChatMessageComponent } from './components/chat-message/chat-message.component';
import { AccessibilityPanelComponent } from './components/accessibility-panel/accessibility-panel.component';

// Services
import { AiAssistantService } from './services/ai-assistant.service';
import { VoiceService } from './services/voice.service';
import { TranslationService } from './services/translation.service';
import { StateManagementService } from './services/state-management.service';
import { LocalStorageService } from './services/local-storage.service';

@NgModule({
  declarations: [
    FloatingAssistantComponent,
    ChatbotPanelComponent,
    ComplaintAssistantComponent,
    LanguageSelectionComponent,
    VoiceInputComponent,
    ChatMessageComponent,
    AccessibilityPanelComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatExpansionModule
  ],
  providers: [
    AiAssistantService,
    VoiceService,
    TranslationService,
    StateManagementService,
    LocalStorageService
  ],
  exports: [
    FloatingAssistantComponent,
    ChatbotPanelComponent,
    ComplaintAssistantComponent,
    VoiceInputComponent
  ]
})
export class JanSevaAiAssistantModule { }
