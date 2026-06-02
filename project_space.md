Project Overview
JANSEVA is a citizen grievance redressal platform with AI-powered complaint analysis and voice assistance. The current prototype works but has major gaps. To build an outstanding, competition-ready system, we will overhaul the AI pipeline and finish key features:

Replace Slow Image Analysis: Remove the current custom vision model that takes too long. Instead, integrate a fast, reliable Vision AI API (e.g. OpenAI’s GPT-4o Vision, Google Cloud Vision, Microsoft Azure Computer Vision, Anthropic Claude Vision, Google Gemini, Bing Visual Search, Clarifai, or FlyPix AI). The chosen model must return structured JSON (category, department, severity) in a single inference.
Multilingual Voice Chatbot: Add a chatbot on the citizen dashboard that follows the defined flow (language selection → menu → complaint tracking, etc.). This assistant will use speech recognition and intent classification to guide the user through the complaint process in their chosen language.
Complete Missing UI Sections: Implement all remaining public features:
Government Departments: Add a page or section listing each department (Roads, Water Supply, Electricity, Sanitation, Health, Transport, etc.) with a brief description of their functions and complaint types.
Footer: Create a professional footer with quick links (Home, Departments, File Complaint, Track Complaint, Transparency Portal), contact info (support email, hotline), and a copyright.
Government News/Updates: Display unique, up-to-date announcements and alerts (past 30 days). Each news card shows title, summary, date, and a “Read More” link. Avoid duplicates.
Citizen Empowerment: Instead of a blank map, include a visual workflow or infographic showing how JANSEVA empowers citizens (report issue → AI classification → resolution → feedback). Show key metrics (complaints resolved, average resolution time, etc.).
Localization: Ensure the UI is fully localized. After selecting a language, all labels, help texts, department descriptions, news, etc. appear in that language.
AI Content Pipeline: Add missing AI-driven features:
AI Resolution Verification: After a complaint is marked resolved, allow uploading "after" photos and use AI to verify that the issue was actually fixed (compare before/after images, output a confidence score).
Complaint Clustering: Analyze and group similar complaints to identify recurring civic issues and hotspots.
Predictive Alerts (Optional): Use analytics (e.g., rising complaint trends, weather data) to predict and alert departments to potential future problems.
SaaS Structure: Design the system to support multiple organizations/municipalities. Introduce a tenantId field for users, complaints, and dashboards. Implement an admin onboarding flow for setting up a new city or agency environment.
AI Image Analysis Overhaul
Task: Replace existing slow ViT/CLIP pipeline with a high-performance Vision API.
Candidates: Evaluate options:
GPT-4o Vision (OpenAI): Can return structured JSON with categories, labels, severity, explanations.
Google Cloud Vision API: Fast object and text detection.
Microsoft Azure Computer Vision: Strong image analysis and OCR.
Anthropic Claude Vision / Google Gemini: Advanced multimodal models.
Bing Visual Search / Clarifai / FlyPix AI: Specialized vision APIs.
Criteria: We will benchmark each for:
Latency under load (aim <4 sec per image inference).
Accuracy on civic images (potholes, garbage, drains, etc.).
Ease of integration and cost.
Integration: Whichever API we choose, the backend will:
Upload the user’s image and call the API.
Parse the JSON response for department, category, severity, priority.
Return these to the frontend in a REST response or stream.
Local Rule Layer: Apply simple rules after the AI result:
Map detected issue to the correct department (e.g., “pothole” → Roads Dept).
Check confidence; if low, do not autofill and flag manual review.
Cache results for duplicate images (hash-based) to speed up repeat issues.
Performance Goals:
Aim for total AI response <4 seconds (should not exceed 8s).
Ensure fallback triggers correctly if AI is slow.
Log timings and errors for monitoring.
Voice Chatbot Implementation
Chatbot Integration: Add a voice-enabled assistant on the citizen dashboard:
Language Prompt: Prompt for language selection as per guidelines.
Intent Menu: Use intent classification for "Raise Complaint", "Track Complaint", "Government Updates", "Emergency Help".
Guided Flow: For “Raise Complaint”, the bot will guide the citizen to upload an image (or audio description), then confirm AI suggestions, then accept additional spoken details, and finally submit. For “Track Complaint”, it will ask for a complaint ID. For “Government Updates”, it will summarize recent news. For “Emergency Help”, it provides emergency contacts.
Technology: Use Web Speech API or Whisper for speech-to-text, and a lightweight intent engine (could use Dialogflow or Rasa) for robustness. Text-to-speech should use native voices in each language.
Dialog Content: Script all prompts and questions in all four languages. Ensure the bot always speaks in the locked language.
Error Handling: If speech recognition fails or user is silent, prompt to repeat. After 3 failures, switch to a manual form input option.
Testing: Conduct user tests with speakers of each language to confirm the flow feels natural and translations are correct.
Implementation Roadmap
Code Audit: Review the current GitHub repo (https://github.com/madugundunanda-ui/janseva) to understand existing endpoints, response formats, and identify where the image analysis is invoked.
Benchmark Vision APIs: Write a quick test script to send a variety of civic images to each candidate API (GPT-4o, Google Vision, Azure, etc.). Measure inference time and inspect output quality.
Design Async Pipeline: Refactor backend to use a job queue (e.g., BullMQ) for AI tasks. Ensure /api/ai/analyze returns immediately with a job ID, and a streaming or polling /api/ai/stream/:jobId provides incremental results.
Implement New AI Client: Write a module to call the selected Vision API. Preprocess images (resize/compress) before upload. Parse and validate the API response.
Frontend Integration: Update Angular code:
Upon image upload, call the new backend route.
Connect to the streaming endpoint to update fields live.
Show loading indicators and fallback messages as needed.
Voice Assistant: Develop the chatbot UI component. Integrate speech SDKs. Code the four-intent workflow. Localize all bot messages.
UI Enhancements: Create new pages/sections for Departments, News, Footer, Empowerment content. Fill with real or placeholder civic data. Localize these sections.
Testing & Tuning: With the new AI in place, test with real images. Adjust confidence thresholds, fix any misclassifications. Ensure the form never locks up.
Deployment & Monitoring: Deploy updated services (consider Vercel/Render for frontend/backend). Add health checks for the AI service. Log performance metrics. Plan fallback in case the Vision API quota is exhausted.
Success Metrics
Performance: Image analysis completes in <5 seconds on average, <8s worst-case.
Accuracy: AI correctly identifies the civic issue category ≥90% on a test set.
User Experience: Citizen can complete the complaint form without any freezing or error. The voice assistant flows smoothly in each language.
Completion: All UI sections (chatbot, news, footer, etc.) are fully implemented and functional.
Stability: No uncaught errors, and fallback modes work as intended.
This plan will transform JANSEVA into a fast, user-friendly, multilingual civic platform ready for competition demos and real-world testing.