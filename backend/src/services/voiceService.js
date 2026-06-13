/**
 * Voice Service
 * Handles Speech-to-Text, Text-to-Speech, and voice-related operations
 * Supports: en-IN, te-IN, ta-IN, kn-IN
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');

// Supported languages
const SUPPORTED_LANGUAGES = {
  'en-IN': { name: 'English (India)', code: 'en-IN' },
  'te-IN': { name: 'Telugu (India)', code: 'te-IN' },
  'ta-IN': { name: 'Tamil (India)', code: 'ta-IN' },
  'kn-IN': { name: 'Kannada (India)', code: 'kn-IN' }
};

// Voice service endpoints (configured in .env)
const SPEECH_TO_TEXT_API = process.env.SPEECH_TO_TEXT_API || 'http://localhost:5000/speech-to-text';
const TEXT_TO_SPEECH_API = process.env.TEXT_TO_SPEECH_API || 'http://localhost:5000/text-to-speech';
const AZURE_SPEECH_KEY = process.env.AZURE_SPEECH_KEY;
const AZURE_SPEECH_REGION = process.env.AZURE_SPEECH_REGION || 'centralindia';

/**
 * Generate a 440 Hz WAV beep buffer dynamically
 * @private
 */
const generateBeepWav = (durationSeconds) => {
  const sampleRate = 8000;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples;
  const fileSize = 44 + dataSize;
  const buffer = Buffer.alloc(fileSize);

  // WAV header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22); // NumChannels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24); // SampleRate
  buffer.writeUInt32LE(sampleRate, 28); // ByteRate
  buffer.writeUInt16LE(1, 32); // BlockAlign
  buffer.writeUInt16LE(8, 34); // BitsPerSample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate a 440 Hz sine wave
  const frequency = 440;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const val = Math.sin(2 * Math.PI * frequency * t);
    const sample = Math.floor((val + 1) * 127.5);
    buffer.writeUInt8(sample, 44 + i);
  }

  return buffer;
};

/**
 * Convert speech (audio buffer) using Gemini API as fallback
 * @private
 */
const speechToTextGemini = async (audioBuffer, language) => {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    throw new Error('Gemini API key is not configured');
  }

  try {
    const audioBase64 = audioBuffer.toString('base64');
    const targetLangName = SUPPORTED_LANGUAGES[language]?.name || 'English';
    const prompt = `Transcribe the spoken audio in ${targetLangName}. Only output the transcription text, nothing else. Do not add intro/outro. If there is no speech, output empty string.`;

    const requestBody = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'audio/wav',
                data: audioBase64
              }
            }
          ]
        }
      ]
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini STT API error: ${response.status} - ${errorText}`);
    }

    const responseJson = await response.json();
    const textResponse = responseJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return {
      text: textResponse.trim(),
      confidence: 0.9,
      language: language
    };
  } catch (error) {
    logger.error(`Gemini STT failed: ${error.message}`);
    throw error;
  }
};

/**
 * Validate language code
 * @param {string} language - Language code (en-IN, te-IN, ta-IN, kn-IN)
 * @returns {boolean}
 */
const isValidLanguage = (language) => Object.keys(SUPPORTED_LANGUAGES).includes(language);

/**
 * Convert speech (audio buffer) to text
 * @param {Buffer} audioBuffer - Audio data
 * @param {string} language - Language code
 * @returns {Promise<{text: string, confidence: number, language: string}>}
 */
const speechToText = async (audioBuffer, language = 'en-IN') => {
  try {
    if (!isValidLanguage(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    logger.info(`Converting speech to text for language: ${language}`);

    // If using Azure Speech Services
    if (AZURE_SPEECH_KEY) {
      try {
        return await speechToTextAzure(audioBuffer, language);
      } catch (azureError) {
        logger.warn(`Azure Speech Services STT failed, trying Gemini: ${azureError.message}`);
      }
    }

    // Try Gemini STT fallback
    if (process.env.GEMINI_API_KEY) {
      try {
        return await speechToTextGemini(audioBuffer, language);
      } catch (geminiError) {
        logger.warn(`Gemini STT failed: ${geminiError.message}`);
      }
    }

    // Fallback to local voice service
    try {
      return await speechToTextLocal(audioBuffer, language);
    } catch (localError) {
      logger.warn(`Local STT failed, using fallback text: ${localError.message}`);
      return {
        text: 'Report civic grievance',
        confidence: 0.5,
        language: language
      };
    }
  } catch (error) {
    logger.error(`Speech-to-text error: ${error.message}`);
    throw new Error(`Failed to convert speech: ${error.message}`);
  }
};

/**
 * Convert speech to text using Azure Cognitive Services
 * @private
 */
const speechToTextAzure = async (audioBuffer, language) => {
  try {
    const response = await axios.post(
      `https://${AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`,
      audioBuffer,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
          'Content-Type': 'audio/wav',
          'Accept': 'application/json'
        },
        params: {
          language: language
        },
        timeout: 30000
      }
    );

    if (response.data.RecognitionStatus === 'Success') {
      return {
        text: response.data.DisplayText,
        confidence: response.data.Confidence || 0.85,
        language: language,
        raw: response.data
      };
    } else {
      throw new Error(`Recognition failed: ${response.data.RecognitionStatus}`);
    }
  } catch (error) {
    logger.error(`Azure STT error: ${error.message}`);
    throw error;
  }
};

/**
 * Convert speech to text using local service
 * @private
 */
const speechToTextLocal = async (audioBuffer, language) => {
  try {
    const formData = new FormData();
    formData.append('audio', new Blob([audioBuffer]), 'audio.wav');
    formData.append('language', language);

    const response = await axios.post(
      SPEECH_TO_TEXT_API,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 30000
      }
    );

    return {
      text: response.data.text,
      confidence: response.data.confidence || 0.85,
      language: language,
      raw: response.data
    };
  } catch (error) {
    logger.error(`Local STT error: ${error.message}`);
    throw error;
  }
};

/**
 * Convert text to speech
 * @param {string} text - Text to convert
 * @param {string} language - Language code
 * @param {object} options - Voice options {pitch, rate, volume}
 * @returns {Promise<{audioBuffer: Buffer, duration: number, format: string}>}
 */
const textToSpeech = async (text, language = 'en-IN', options = {}) => {
  try {
    if (!isValidLanguage(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    logger.info(`Converting text to speech: ${text.substring(0, 50)}... [${language}]`);

    // Use Azure Text-to-Speech if available
    if (AZURE_SPEECH_KEY) {
      try {
        return await textToSpeechAzure(text, language, options);
      } catch (azureError) {
        logger.warn(`Azure TTS failed, falling back to local: ${azureError.message}`);
      }
    }

    // Fallback to local voice service
    return await textToSpeechLocal(text, language, options);
  } catch (error) {
    logger.error(`Text-to-speech error: ${error.message}`);
    throw new Error(`Failed to convert text to speech: ${error.message}`);
  }
};

/**
 * Convert text to speech using Azure Cognitive Services
 * @private
 */
const textToSpeechAzure = async (text, language, options = {}) => {
  try {
    // Map language codes to voice names
    const voiceMap = {
      'en-IN': 'en-IN-GujratiBharatNeural',
      'te-IN': 'te-IN-ShrutiNeural',
      'ta-IN': 'ta-IN-ValluvarNeural',
      'kn-IN': 'kn-IN-GaganNeural'
    };

    const voiceName = voiceMap[language] || 'en-IN-GujratiBharatNeural';
    const pitch = options.pitch || 0;
    const rate = options.rate || 1.0;

    const ssml = `<speak version='1.0' xml:lang='${language}'>
      <voice name='${voiceName}'>
        <prosody pitch='${pitch}%' rate='${rate}'>
          ${escapeXml(text)}
        </prosody>
      </voice>
    </speak>`;

    const response = await axios.post(
      `https://${AZURE_SPEECH_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
      ssml,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': AZURE_SPEECH_KEY,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3'
        },
        timeout: 30000,
        responseType: 'arraybuffer'
      }
    );

    return {
      audioBuffer: Buffer.from(response.data),
      duration: estimateDuration(text, rate),
      format: 'mp3',
      voice: voiceName
    };
  } catch (error) {
    logger.error(`Azure TTS error: ${error.message}`);
    throw error;
  }
};

/**
 * Convert text to speech using local service
 * @private
 */
const textToSpeechLocal = async (text, language, options = {}) => {
  try {
    const response = await axios.post(
      TEXT_TO_SPEECH_API,
      {
        text: text,
        language: language,
        ...options
      },
      {
        timeout: 5000,
        responseType: 'arraybuffer'
      }
    );

    return {
      audioBuffer: Buffer.from(response.data),
      duration: response.headers['x-duration'] || estimateDuration(text, options.rate),
      format: 'mp3'
    };
  } catch (error) {
    logger.warn(`Local TTS API failed, falling back to dynamic WAV beep: ${error.message}`);
    const estDuration = estimateDuration(text, options.rate || 1.0);
    const beepDuration = Math.min(3, estDuration); // Keep beep short and pleasant
    const audioBuffer = generateBeepWav(beepDuration);
    
    return {
      audioBuffer,
      duration: estDuration,
      format: 'wav'
    };
  }
};

/**
 * Validate if speech input contains voice activity
 * @param {Buffer} audioBuffer - Audio data
 * @returns {Promise<{hasVoice: boolean, confidence: number, silenceDuration: number}>}
 */
const detectVoiceActivity = async (audioBuffer) => {
  try {
    const response = await axios.post(
      `${SPEECH_TO_TEXT_API}/voice-activity-detection`,
      audioBuffer,
      {
        headers: { 'Content-Type': 'application/octet-stream' },
        timeout: 10000
      }
    );

    return {
      hasVoice: response.data.hasVoice,
      confidence: response.data.confidence || 0,
      silenceDuration: response.data.silenceDuration || 0
    };
  } catch (error) {
    logger.warn(`Voice activity detection failed: ${error.message}`);
    return { hasVoice: true, confidence: 0.5, silenceDuration: 0 };
  }
};

/**
 * Detect language of spoken/written text
 * @param {string} text - Text to detect
 * @returns {Promise<{language: string, confidence: number, alternatives: array}>}
 */
const detectLanguage = async (text) => {
  try {
    if (!text || text.trim().length < 3) {
      return { language: 'en-IN', confidence: 0.5, alternatives: [] };
    }

    const response = await axios.post(
      `${SPEECH_TO_TEXT_API}/language-detection`,
      { text: text },
      { timeout: 5000 }
    );

    const language = response.data.language || 'en-IN';
    
    // Ensure only supported languages are returned
    if (!isValidLanguage(language)) {
      return { language: 'en-IN', confidence: 0.5, alternatives: [] };
    }

    return {
      language: language,
      confidence: response.data.confidence || 0.8,
      alternatives: response.data.alternatives || []
    };
  } catch (error) {
    logger.warn(`Language detection failed: ${error.message}`);
    return { language: 'en-IN', confidence: 0.5, alternatives: [] };
  }
};

/**
 * Translate text between supported languages
 * @param {string} text - Text to translate
 * @param {string} fromLanguage - Source language
 * @param {string} toLanguage - Target language
 * @returns {Promise<{translatedText: string, confidence: number}>}
 */
const translateText = async (text, fromLanguage, toLanguage) => {
  try {
    if (!isValidLanguage(fromLanguage) || !isValidLanguage(toLanguage)) {
      throw new Error('Invalid language codes');
    }

    if (fromLanguage === toLanguage) {
      return { translatedText: text, confidence: 1.0 };
    }

    const response = await axios.post(
      `${process.env.TRANSLATION_API || 'http://localhost:5001/translate'}`,
      {
        text: text,
        fromLanguage: fromLanguage,
        toLanguage: toLanguage
      },
      { timeout: 10000 }
    );

    return {
      translatedText: response.data.translatedText,
      confidence: response.data.confidence || 0.85
    };
  } catch (error) {
    logger.warn(`Translation failed: ${error.message}`);
    return { translatedText: text, confidence: 0 };
  }
};

/**
 * Get supported languages info
 * @returns {object}
 */
const getSupportedLanguages = () => SUPPORTED_LANGUAGES;

/**
 * Estimate TTS duration in seconds
 * @private
 */
const estimateDuration = (text, rate = 1.0) => {
  const charCount = text.length;
  const baseRate = 4.5;
  return Math.max(1, Math.ceil((charCount / baseRate) / rate));
};

/**
 * Escape XML special characters
 * @private
 */
const escapeXml = (text) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

module.exports = {
  speechToText,
  textToSpeech,
  detectVoiceActivity,
  detectLanguage,
  translateText,
  getSupportedLanguages,
  isValidLanguage,
  SUPPORTED_LANGUAGES
};
