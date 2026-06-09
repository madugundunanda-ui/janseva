# JanSeva AI Voice Assistant - Deployment & Integration Guide

## Quick Start Guide

### Prerequisites
- Node.js 18+
- Angular 20
- PostgreSQL 12+
- Azure Speech Services account (or local speech service)

### Backend Setup

1. **Install Dependencies**
```bash
cd backend
npm install
```

2. **Database Setup**
```bash
# Run migrations
psql -U postgres -d janseva -f migrations/001-janseva-ai-assistant-schema.sql
```

3. **Configure Environment**
```bash
# Copy and configure .env file
cp .env.example .env
# Edit .env with your configurations
```

4. **Start Backend Server**
```bash
npm run dev     # Development
npm run start   # Production
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install
```

2. **Configure Environment**
```bash
# Update environment.ts and environment.prod.ts
# Set apiUrl to your backend server
```

3. **Add Module to App**
```typescript
// app.module.ts
import { JanSevaAiAssistantModule } from './modules/janseva-ai-assistant/janseva-ai-assistant.module';

@NgModule({
  imports: [
    // ... other imports
    JanSevaAiAssistantModule
  ]
})
export class AppModule { }
```

4. **Add Floating Assistant to Layout**
```html
<!-- app.component.html -->
<app-floating-assistant></app-floating-assistant>

<!-- Or in any specific page -->
<app-floating-assistant></app-floating-assistant>
```

5. **Build & Serve**
```bash
npm run serve   # Development
npm run build   # Production
```

## Integration Points

### 1. Homepage Citizen Dashboard

**File:** `frontend/src/app/pages/citizen-dashboard/citizen-dashboard.component.html`

```html
<div class="dashboard-container">
  <!-- Prominent "Talk to JanSeva" button -->
  <button mat-raised-button color="primary" (click)="activateAssistant()">
    <mat-icon>support_agent</mat-icon>
    {{ 'TALK_TO_JANSEVA' | translate }}
  </button>

  <!-- Floating Assistant -->
  <app-floating-assistant></app-floating-assistant>
</div>
```

### 2. Raise Complaint Module

**File:** `frontend/src/app/pages/raise-complaint/raise-complaint.component.ts`

```typescript
export class RaiseComplaintComponent {
  constructor(
    private aiAssistant: AiAssistantService,
    private stateService: StateManagementService
  ) {}

  ngOnInit() {
    // When user initiates complaint
    this.startAssistantWorkflow('RAISE_COMPLAINT');
  }

  private startAssistantWorkflow(intent: string) {
    this.stateService.setCurrentIntent(intent);
    // Assistant will automatically guide user through the workflow
  }
}
```

### 3. Track Complaint Module

**File:** `frontend/src/app/pages/track-complaint/track-complaint.component.ts`

```typescript
// Similar integration pattern
this.stateService.setCurrentIntent('TRACK_COMPLAINT');
// Assistant will ask for complaint number via voice or text
```

### 4. Government Updates Module

**File:** `frontend/src/app/pages/government-updates/government-updates.component.ts`

```typescript
this.stateService.setCurrentIntent('GOVERNMENT_UPDATES');
// Assistant will help discover schemes
```

### 5. Emergency Help Module

**File:** `frontend/src/app/pages/emergency-help/emergency-help.component.ts`

```typescript
this.stateService.setCurrentIntent('EMERGENCY_HELP');
// Assistant will provide quick access to emergency services
```

### 6. Officer Portal

**File:** `frontend/src/app/pages/officer-portal/officer-portal.component.ts`

```typescript
// Same floating assistant but with officer-specific workflows
// Officer can search complaints and assign via voice
```

### 7. Supervisor Dashboard

**File:** `frontend/src/app/pages/supervisor-dashboard/supervisor-dashboard.component.ts`

```typescript
// Same floating assistant but with analytics queries
// Supervisor can ask about department performance
```

## API Integration Checklist

Backend needs these endpoints:

- ✓ `POST /api/ai-assistant/init-session`
- ✓ `POST /api/ai-assistant/process-voice`
- ✓ `POST /api/ai-assistant/classify-intent`
- ✓ `POST /api/ai-assistant/generate-speech`
- ✓ `POST /api/ai-assistant/workflow/raise-complaint`
- ✓ `POST /api/ai-assistant/workflow/:id/analyze-image`
- ✓ `GET /api/ai-assistant/workflow/:id/analysis-status`
- ✓ `POST /api/ai-assistant/workflow/:id/check-duplicates`
- ✓ `POST /api/ai-assistant/close-session`

## Translation File Setup

1. **Create translation files in `frontend/src/assets/i18n/`**

```
i18n/
├── en-IN.json
├── te-IN.json
├── ta-IN.json
└── kn-IN.json
```

2. **Initialize TranslateModule in AppModule**

```typescript
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  imports: [
    HttpClientModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en-IN',
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ]
})
export class AppModule { }
```

## WebSocket Integration

The backend includes WebSocket support for real-time analysis streaming:

```typescript
// In your main server file
const express = require('express');
const { Server } = require('socket.io');
const { setupWebSocketHandlers } = require('./src/websocket/aiAssistantWebSocket');

const app = express();
const io = new Server(app, { cors: { origin: '*' } });

// Setup AI Assistant WebSocket handlers
setupWebSocketHandlers(io);

const server = app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## AI Services Configuration

### Azure Speech Services Setup

1. Create account at https://azure.microsoft.com/services/cognitive-services/speech-to-text/
2. Get your API key and region
3. Set in `.env`:
```
AZURE_SPEECH_ENABLED=true
AZURE_SPEECH_KEY=your_key
AZURE_SPEECH_REGION=centralindia
```

### Local AI Services (Alternative)

If not using Azure, configure local services:

```
LOCAL_VOICE_SERVICE_ENABLED=true
SPEECH_TO_TEXT_API=http://localhost:5000/speech-to-text
TEXT_TO_SPEECH_API=http://localhost:5000/text-to-speech
INTENT_CLASSIFIER_API=http://localhost:5002/classify-intent
IMAGE_ANALYSIS_API=http://localhost:5003/analyze-image
```

## Testing

### Backend Tests

```bash
# Unit tests
npm run test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e
```

### Frontend Tests

```bash
# Unit tests
ng test

# E2E tests
ng e2e
```

### Load Testing

```bash
# Using k6 (if available in load-tests/)
k6 run load-tests/k6-assistant.js
```

## Monitoring & Logging

### Application Logs

Logs are stored in `backend/logs/` directory configured by LOG_DESTINATION and LOG_FILE_PATH.

### Analytics

Track these metrics:
- Session count & duration
- Intent distribution
- Error rates
- AI accuracy
- Response times
- User satisfaction

### Health Check

```bash
GET /health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2026-06-09T10:00:00Z",
  "database": "connected",
  "aiServices": "operational"
}
```

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set strong API keys
- [ ] Enable CORS appropriately
- [ ] Use JWT for authentication
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Log security events
- [ ] Regular security audits
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets

## Performance Optimization

### Frontend
- Lazy load components
- Tree-shake unused code
- Minify and compress assets
- Use CDN for static files
- Enable caching headers

### Backend
- Use connection pooling
- Cache AI results
- Index database queries
- Load balance AI services
- Optimize API responses

### Expected Performance
- Page load: < 3 seconds
- API response: < 2 seconds
- AI analysis: < 8 seconds (timeout)
- Speech recognition: < 3 seconds

## Troubleshooting

### Common Issues

**1. Microphone Access Denied**
- Check browser permissions
- Ensure HTTPS in production
- User consent required

**2. Speech Recognition Not Working**
- Check speech language setting
- Ensure compatible browser
- Check microphone connection

**3. AI Services Timeout**
- Check service availability
- Verify network connection
- Check timeout configuration

**4. Session Expired**
- Reinitialize session
- Check SESSION_MAX_DURATION config
- Clear browser cache

### Debug Mode

Enable debug logging:
```
DEBUG=true
VERBOSE_LOGGING=true
LOG_LEVEL=debug
```

## Production Deployment

### Using Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment-Specific Config

Create separate `.env` files:
- `.env.development`
- `.env.staging`
- `.env.production`

### CI/CD Pipeline

Setup automated:
- Tests
- Linting
- Security scans
- Build
- Deployment

## Support & Maintenance

### Regular Tasks
- Monitor logs daily
- Check error rates
- Update dependencies monthly
- Security patches immediately
- Performance reviews quarterly

### Backup Strategy
- Database: Daily
- File uploads: Daily
- Configuration: On change
- Retention: 30 days minimum

### Disaster Recovery
- Backup procedure documented
- Recovery tested quarterly
- RPO: 1 hour
- RTO: 4 hours

---

**For questions or issues, contact the JanSeva development team.**
