import { Injectable, inject } from '@angular/core';
import { ConversationService } from './conversation.service';
import { SpeechService } from './speech.service';

@Injectable({
  providedIn: 'root'
})
export class AIAssistantPlatformService {
  public conversation = inject(ConversationService);
  public speech = inject(SpeechService);
}
