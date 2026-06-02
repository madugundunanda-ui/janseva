Chatbot Language & Menu
Language Selection: On first launch, prompt the user to choose a language:
English
తెలుగు (Telugu)
தமிழ் (Tamil)
ಕನ್ನಡ (Kannada)
Language Lock: Once a language is selected, the assistant locks into that language for the entire session. All spoken responses, text menus, labels, and messages must appear only in the chosen language. Adjust speech recognition to the selected language as well.
Main Menu Options (localized): After language selection, present a main menu. Example in English and Telugu:
English:
Raise Complaint
Track Complaint
Government Updates
Emergency Help
తెలుగు:
ఫిర్యాదు నమోదు చేయండి
ఫిర్యాదు స్థితి తెలుసుకోండి
ప్రభుత్వ అప్డేట్లు
అత్యవసర సహాయం
Conversation Constraints
Governance-Only Assistance: The assistant must strictly handle only the intended governance tasks. It should refuse or redirect any off-topic or casual requests. This is not a general-purpose chatbot.
Irrelevant Query Handling: If the user asks anything unrelated (e.g. "tell me a joke", "who is the PM", etc.), the assistant must politely decline and re-display the menu. For example:
English:
"Sorry, I can only help with government-related services. Please choose:

Raise Complaint
Track Complaint
Government Updates
Emergency Help."
తెలుగు:
"క్షమించండి. నేను ప్రభుత్వ సేవలకు సంబంధించిన సహాయం మాత్రమే చేయగలను. దయచేసి ఎంపికను చెప్పండి."

தமிழ்:
"மன்னிக்கவும். அரசு சேவைகள் தொடர்பான உதவிகளை மட்டுமே வழங்க முடியும்."

ಕನ್ನಡ:
"ಕ್ಷಮಿಸಿ. ನಾನು ಸರ್ಕಾರದ ಸೇವೆಗಳ ಸಹಾಯವನ್ನು ಮಾತ್ರ ನೀಡಬಹುದು."

No Open Chat Mode: Do not invoke a free-form conversational AI model. Instead, use an intent-driven workflow. Only the four service intents (Raise Complaint, Track Complaint, Government Updates, Emergency Help) should be recognized. Any other intents should trigger the refusal above.
Voice Assistant Architecture
Processing Flow: Implement a pipeline such as: Speech Input → Speech-to-Text → Language Detection → Intent Classification → Workflow Router → Action Execution → Localized Text Response → Text-to-Speech. Each step should be fast and reliable.
Fast Response: The assistant should respond promptly to speech, with minimal delay. Consider using real-time APIs or on-device models for speech and intent recognition.
Stable Behavior: After language lock, all responses and UI updates must be in that language. No mixing of languages should occur at any time.
Main Menu Re-Prompt: If at any point the conversation ends without completing an action, the assistant should re-read the main menu options (in the locked language).
Complaint Form & AI Analysis
Instant Upload Acknowledgment: When a citizen uploads or captures an issue image, immediately display “✓ Image uploaded successfully” (or equivalent in chosen language). Do not make the user wait for analysis before continuing.
Progressive Autocomplete: Run AI analysis asynchronously. As each piece of information is ready, populate the form fields (department, category, severity) one by one. The user can type or speak additional details while AI processing continues in background.
Timeout & Fallback: If AI analysis takes longer than 8 seconds (or fails), do not block the form. Instead:
Show a message: “AI suggestions are taking longer than expected” (localized).
Allow the user to manually select or type the complaint category and department.
Proceed with submission without waiting for AI.
Confidence Handling: If the AI model is not confident in its prediction, do not force an incorrect autofill. Instead, leave fields blank or indicate uncertainty, letting the user correct them manually.
No UI Blocking: At no point should the interface freeze due to AI processing. All form controls (typing, voice input, GPS capture, etc.) must remain active.
Translation & Localization
Full Localization: All textual content on the site (menus, buttons, labels, messages, department descriptions, footers, etc.) must be translated into the selected language. After switching languages, verify that every visible string is in that language.
Number and Date Formats: Ensure any dates, times, or numbers are also formatted appropriately for the locale.
Data Handling & Privacy
Explicit Consent: Inform users if any personal data (voice, location, etc.) is being used. The assistant should mention this in the privacy notice.
Privacy Preservation: Do not log or transmit more personal data than necessary. Use standard security practices for any stored complaints.
Reliability & Support
Fallback Options: If any feature (AI analysis, voice recognition, third-party API) is unavailable, the system should gracefully degrade. For example, if voice fails, allow manual text entry.
Error Messages: If an error occurs, display a clear, polite error message (in the user’s language) and guide them back to a safe state (e.g., the main menu or complaint form).
Monitor Performance: The system should track AI processing times and failures. If issues occur repeatedly, show an “AI temporarily unavailable” notice and fall back to manual mode.