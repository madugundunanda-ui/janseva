/**
 * AI Assistant WebSocket Handler
 * Real-time streaming of analysis results and conversation
 */

const logger = require('../utils/logger');
const aiServiceIntegration = require('../services/aiServiceIntegration');

/**
 * Setup WebSocket handlers for AI Assistant
 * @param {Server} io - Socket.io server instance
 */
const setupWebSocketHandlers = (io) => {
  const namespace = io.of('/ai-assistant');

  namespace.on('connection', (socket) => {
    logger.info(`User connected to AI Assistant WebSocket: ${socket.id}`);

    /**
     * Event: user joins session
     */
    socket.on('join-session', (data) => {
      const { sessionId, userId, language } = data;
      
      // Store session info with socket
      socket.data.sessionId = sessionId;
      socket.data.userId = userId;
      socket.data.language = language;
      
      // Join room
      socket.join(`session-${sessionId}`);
      logger.info(`User joined session: ${sessionId}`);

      socket.emit('session-joined', {
        sessionId,
        language,
        timestamp: new Date()
      });
    });

    /**
     * Event: user sends text message
     */
    socket.on('send-message', async (data) => {
      const { sessionId, text, language } = data;

      try {
        logger.info(`Message received in session ${sessionId}: ${text}`);

        // Broadcast to all users in session
        namespace.to(`session-${sessionId}`).emit('message', {
          type: 'user',
          content: text,
          timestamp: new Date()
        });

        // Process message asynchronously
        // Results will be sent back via separate events
      } catch (error) {
        logger.error(`Error processing message: ${error.message}`);
        socket.emit('error', { message: 'Failed to process message' });
      }
    });

    /**
     * Event: stream image analysis results
     */
    socket.on('analyze-image', async (data) => {
      const { workflowId, imagePath, language } = data;
      const sessionId = socket.data.sessionId;

      try {
        logger.info(`Image analysis started for workflow ${workflowId}`);

        socket.emit('analysis-started', {
          workflowId,
          timestamp: new Date()
        });

        // Read image file
        const fs = require('fs').promises;
        const imageBuffer = await fs.readFile(imagePath);

        // Define progress callback to stream results
        const progressCallback = (type, value, confidence) => {
          namespace.to(`session-${sessionId}`).emit('analysis-progress', {
            workflowId,
            type, // 'department', 'category', 'severity'
            value,
            confidence,
            timestamp: new Date()
          });

          logger.info(`Analysis progress - ${type}: ${value} (${confidence})`);
        };

        // Start async analysis
        const result = await aiServiceIntegration.analyzeComplaintImage(
          imageBuffer,
          language,
          progressCallback
        );

        // Send final result
        socket.emit('analysis-complete', {
          workflowId,
          result,
          timestamp: new Date()
        });

        namespace.to(`session-${sessionId}`).emit('analysis-complete', {
          workflowId,
          department: result.department,
          category: result.category,
          severity: result.severity,
          explanation: result.explanation
        });

        logger.info(`Image analysis completed for workflow ${workflowId}`);
      } catch (error) {
        logger.error(`Image analysis error: ${error.message}`);
        socket.emit('analysis-error', {
          workflowId,
          message: error.message,
          timestamp: new Date()
        });
      }
    });

    /**
     * Event: voice input streaming
     */
    socket.on('voice-chunk', async (data) => {
      const { sessionId, audioChunk, chunkIndex, totalChunks, isLast } = data;

      try {
        // Store in session buffer
        if (!socket.data.voiceBuffer) {
          socket.data.voiceBuffer = [];
        }

        socket.data.voiceBuffer.push({
          chunk: audioChunk,
          index: chunkIndex
        });

        // When all chunks received, process
        if (isLast) {
          const chunks = socket.data.voiceBuffer
            .sort((a, b) => a.index - b.index)
            .map(item => item.chunk);

          const audioBuffer = Buffer.concat(chunks);

          // Process voice
          const result = await aiServiceIntegration.processVoiceInput(
            audioBuffer,
            socket.data.language,
            sessionId
          );

          socket.emit('voice-processed', {
            sessionId,
            text: result.processed.text,
            intent: result.processed.intent,
            confidence: result.processed.confidence
          });

          // Broadcast to session
          namespace.to(`session-${sessionId}`).emit('user-message', {
            type: 'voice',
            content: result.processed.text,
            timestamp: new Date()
          });

          // Clear buffer
          socket.data.voiceBuffer = [];
        }

        logger.debug(`Voice chunk ${chunkIndex}/${totalChunks} received`);
      } catch (error) {
        logger.error(`Voice processing error: ${error.message}`);
        socket.emit('voice-error', { message: error.message });
      }
    });

    /**
     * Event: text-to-speech streaming
     */
    socket.on('generate-speech', async (data) => {
      const { sessionId, text, language } = data;

      try {
        logger.info(`Generating speech: ${text.substring(0, 50)}...`);

        const voiceService = require('../services/voiceService');
        const ttsResult = await voiceService.textToSpeech(text, language);

        // Stream audio in chunks
        const CHUNK_SIZE = 64 * 1024; // 64KB chunks
        for (let i = 0; i < ttsResult.audioBuffer.length; i += CHUNK_SIZE) {
          const chunk = ttsResult.audioBuffer.slice(i, i + CHUNK_SIZE);
          socket.emit('speech-chunk', {
            chunk: chunk.toString('base64'),
            chunkIndex: i / CHUNK_SIZE,
            isLast: (i + CHUNK_SIZE) >= ttsResult.audioBuffer.length
          });
        }

        socket.emit('speech-complete', {
          duration: ttsResult.duration,
          format: ttsResult.format
        });

        logger.info('Speech generation completed');
      } catch (error) {
        logger.error(`TTS error: ${error.message}`);
        socket.emit('tts-error', { message: error.message });
      }
    });

    /**
     * Event: user leaves session
     */
    socket.on('leave-session', (data) => {
      const { sessionId } = data;
      socket.leave(`session-${sessionId}`);
      logger.info(`User left session: ${sessionId}`);

      socket.emit('session-left', { sessionId });
    });

    /**
     * Event: disconnect
     */
    socket.on('disconnect', () => {
      logger.info(`User disconnected from AI Assistant: ${socket.id}`);
      
      // Cleanup
      socket.data.voiceBuffer = null;
    });

    /**
     * Event: error
     */
    socket.on('error', (error) => {
      logger.error(`WebSocket error: ${error}`);
    });
  });

  return namespace;
};

module.exports = {
  setupWebSocketHandlers
};
