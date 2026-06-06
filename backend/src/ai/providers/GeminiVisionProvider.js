const fs = require('fs');
const path = require('path');
const BaseVisionProvider = require('./BaseVisionProvider');
const logger = require('../../utils/logger');
const AppError = require('../../utils/AppError');

class GeminiVisionProvider extends BaseVisionProvider {
  constructor(apiKey) {
    super();
    this.apiKey = apiKey;
    this.model = 'gemini-2.5-flash';
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
          "category": "Must be exactly one of: Garbage / Waste, Road Damage, Water Leakage, Drainage Issue, Electricity Problem, Street Light Failure, Illegal Dumping, Traffic Obstruction, Public Health Hazard, Sanitation Issue, Broken Infrastructure, Emergency Hazard",
          "department": "Must be exactly one of: Roads & Highways, Water Supply, Electricity, Sanitation, Public Health, Revenue, Transport, Smart City Operations, Rural Development, Emergency Response",
          "severity": "Must be exactly one of: low, medium, high, urgent",
          "priority": "Must be exactly one of: low, medium, high, urgent",
          "confidence": 0 to 100 number indicating confidence in this classification,
          "emergency": boolean (set to true if the image represents an immediate threat to life/safety, such as exposed high-voltage wires, active transformer fire, raw sewage flooding, major road collapse, water contamination, public danger),
          "explanation": ["A list of 2-3 explainability reasons justifying this department, severity, and emergency mapping"]
        }
        
        Rules:
        - The department mapping must strictly match one of the ten supported departments.
        - If the image does not contain a clear civic grievance or is off-topic (e.g. blurry, a selfie, indoor room, document, random object), set confidence to a very low number (e.g. < 40), emergency to false, category to "Emergency Hazard", department to "Emergency Response", priority/severity to "low", title to "", and explanation to ["Blurry or off-topic image"].
        - Ensure the output is valid JSON and nothing else. Do not wrap it in markdown code blocks.
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
      
      logger.info('[AI_REQUEST] Sending image analysis request to Gemini API', { jobId: file.filename || file.originalname });

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
      logger.info('[AI_RESPONSE] Gemini Vision analysis completed successfully', { jobId: file.filename || file.originalname, results });
      return results;

    } catch (err) {
      logger.error('Gemini Vision analysis failed', { error: err.message });
      throw new AppError(`Gemini Vision failed: ${err.message}`, 502);
    }
  }

  async compareImages(beforeImagePath, afterFile) {
    if (!this.apiKey) {
      throw new AppError('Gemini API key is not configured', 500);
    }

    try {
      const relativeBeforePath = beforeImagePath.replace(/^\/uploads\//, '/src/uploads/');
      const absBeforePath = path.isAbsolute(relativeBeforePath) 
        ? relativeBeforePath 
        : path.resolve(path.join(__dirname, '../../..', relativeBeforePath));

      if (!fs.existsSync(absBeforePath)) {
        throw new Error(`Original complaint image not found on disk at: ${absBeforePath}`);
      }

      if (!fs.existsSync(afterFile.path)) {
        throw new Error(`Resolution proof image not found on disk at: ${afterFile.path}`);
      }

      const beforeBase64 = fs.readFileSync(absBeforePath).toString('base64');
      const afterBase64 = fs.readFileSync(afterFile.path).toString('base64');

      const prompt = `
        You are an AI civic grievance resolution verifier for the JANSEVA platform.
        Compare these two images: the first image shows the reported civic issue (BEFORE), and the second image shows the resolved status (AFTER).
        Assess whether the issue shown in the BEFORE image has been resolved in the AFTER image.

        Return a structured JSON response with exactly these keys:
        {
          "status": "Must be exactly one of: Verified, Partially Resolved, Not Resolved",
          "confidence": 0 to 100 number indicating confidence in this verification,
          "differenceScore": 0 to 100 number indicating the visual delta / difference score between the two states,
          "result": "A short summary message explaining the resolution status",
          "reasons": ["A list of 2-3 reasons explaining why the issue is considered verified, partially resolved, or unresolved"]
        }

        Ensure the output is valid JSON and nothing else. Do not wrap it in markdown code blocks.
      `;

      const requestBody = {
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: beforeBase64
                }
              },
              {
                inlineData: {
                  mimeType: afterFile.mimetype || 'image/jpeg',
                  data: afterBase64
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
        throw new Error(`Gemini API error during image comparison: ${response.status} - ${errorText}`);
      }

      const responseJson = await response.json();
      const textResponse = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error('Empty response from Gemini API during image comparison');
      }

      const results = JSON.parse(textResponse.trim());
      logger.info('Gemini image comparison verification completed', { results });
      return results;

    } catch (err) {
      logger.error('Gemini image comparison failed', { error: err.message });
      throw new AppError(`Gemini image comparison failed: ${err.message}`, 502);
    }
  }
}

module.exports = GeminiVisionProvider;
