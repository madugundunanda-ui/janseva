const fs = require('fs');
const VisionProvider = require('./VisionProvider');
const logger = require('../../utils/logger');
const AppError = require('../../utils/AppError');

class GeminiVisionProvider extends VisionProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.model = 'gemini-1.5-flash';
  }

  async analyzeImage(file) {
    if (!this.apiKey) {
      throw new AppError('Gemini API key is not configured', 500);
    }

    try {
      const imageBase64 = fs.readFileSync(file.path).toString('base64');
      const mimeType = file.mimetype || 'image/jpeg';
      
      const prompt = `
        You are a smart civic grievance analyzer for the JANSEVA platform.
        Analyze this image showing a local civic issue and return a structured JSON response.
        
        The JSON object MUST contain exactly these keys:
        {
          "title": "A short, concise title summarizing the issue (maximum 60 characters)",
          "description": "A detailed explanation of the issue shown in the image",
          "category": "Must be exactly one of: Garbage / Waste, Road Damage, Water Leakage, Drainage Issue, Electricity Problem, Street Light Failure, Illegal Dumping, Traffic Obstruction, Public Health Hazard, Sanitation Issue, Broken Infrastructure, Emergency Hazard",
          "department": "Must be exactly one of: Waste Management, Roads & Transport, Water Supply, Drainage, Electricity, Street Lighting, Public Health, Sanitation, Public Safety",
          "severity": "Must be exactly one of: low, medium, high, urgent",
          "priority": "Must be exactly one of: low, medium, high, urgent",
          "reasons": ["A list of 2-3 reasons justifying this department and severity mapping"],
          "confidence": 0 to 100 number indicating confidence in this classification,
          "low_confidence": boolean (set to true if the image is blurry, off-topic, non-civic, a selfie, an indoor room, documents, etc.),
          "broad_category": "Must be exactly one of: sanitation, roads, water, drainage, electricity, emergency"
        }
        
        If low_confidence is true:
        - Set "title" to ""
        - Set "description" to "Unable to confidently identify issue type. Please select the category and fill details manually."
        - Set "department" to "General Inquiry"
        - Set "confidence" to 0
        - Set "category" and "broad_category" to ""
        - Set "priority" and "severity" to "low"

        Ensure the output is valid JSON and nothing else. Do not wrap it in markdown code blocks.
      `;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: imageBase64
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json'
        }
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const responseJson = await response.json();
      const textResponse = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error('Empty response from Gemini API');
      }

      const results = JSON.parse(textResponse.trim());
      logger.info('Gemini Vision analysis completed', { jobId: file.filename, results });
      return results;

    } catch (err) {
      logger.error('Gemini Vision analysis failed, falling back', { error: err.message });
      throw new AppError(`Gemini Vision failed: ${err.message}`, 502);
    }
  }
}

module.exports = GeminiVisionProvider;
