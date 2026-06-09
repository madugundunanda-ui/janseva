/**
 * Duplicate Complaint Detection Service
 * Detects similar/duplicate complaints using image, text, and location analysis
 */

const axios = require('axios');
const Pool = require('pg').Pool;
const logger = require('../utils/logger');

// Database pool (from config)
const pool = require('../config/db');

// Similarity thresholds
const SIMILARITY_THRESHOLDS = {
  IMAGE_SIMILARITY: 0.75,      // 75% image match
  TEXT_SIMILARITY: 0.70,        // 70% text match
  LOCATION_PROXIMITY: 100,      // 100 meters radius
  COMBINED_THRESHOLD: 0.65      // 65% combined score
};

/**
 * Check for duplicate complaints
 * @param {object} complaintData - New complaint data {imageFile, description, location, department, category}
 * @param {string} language - Language code
 * @returns {Promise<{duplicatesFound: boolean, similarComplaints: array, recommendation: string}>}
 */
const checkForDuplicates = async (complaintData, language = 'en-IN') => {
  try {
    logger.info('Checking for duplicate complaints...');

    const similarComplaints = [];
    
    // Step 1: Get existing complaints in same area and category
    const recentComplaints = await getRecentComplaintsInArea(
      complaintData.location,
      complaintData.department,
      complaintData.category
    );

    if (recentComplaints.length === 0) {
      return {
        duplicatesFound: false,
        similarComplaints: [],
        recommendation: 'No similar complaints found. Safe to create new complaint.'
      };
    }

    // Step 2: Compare with each recent complaint
    for (const existing of recentComplaints) {
      const scores = await compareComplaints(complaintData, existing, language);
      
      if (scores.combinedScore >= SIMILARITY_THRESHOLDS.COMBINED_THRESHOLD) {
        similarComplaints.push({
          complaintId: existing.id,
          complaintNumber: existing.complaint_number,
          createdAt: existing.created_at,
          status: existing.status,
          imageScore: scores.imageScore,
          textScore: scores.textScore,
          locationScore: scores.locationScore,
          combinedScore: scores.combinedScore,
          reasons: scores.reasons
        });
      }
    }

    // Sort by similarity score
    similarComplaints.sort((a, b) => b.combinedScore - a.combinedScore);

    return {
      duplicatesFound: similarComplaints.length > 0,
      similarComplaints: similarComplaints.slice(0, 3), // Top 3 matches
      recommendation: similarComplaints.length > 0 
        ? 'Similar complaints found. Consider joining existing complaint.'
        : 'No similar complaints found. Safe to create new complaint.'
    };
  } catch (error) {
    logger.error(`Duplicate check error: ${error.message}`);
    return {
      duplicatesFound: false,
      similarComplaints: [],
      recommendation: 'Unable to check for duplicates. Proceeding with new complaint.',
      error: error.message
    };
  }
};

/**
 * Get recent complaints in the same geographic area
 * @private
 */
const getRecentComplaintsInArea = async (location, department, category) => {
  try {
    const query = `
      SELECT id, complaint_number, description, image_path, location, department, 
             category, severity, status, created_at, coordinates
      FROM complaints
      WHERE 
        department = $1 
        AND category = $2
        AND status NOT IN ('closed', 'rejected')
        AND created_at >= NOW() - INTERVAL '30 days'
        AND coordinates IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 20
    `;

    const result = await pool.query(query, [department, category]);
    return result.rows || [];
  } catch (error) {
    logger.error(`Error fetching recent complaints: ${error.message}`);
    return [];
  }
};

/**
 * Compare two complaints for similarity
 * @private
 */
const compareComplaints = async (newComplaint, existingComplaint, language) => {
  try {
    const scores = {
      imageScore: 0,
      textScore: 0,
      locationScore: 0,
      combinedScore: 0,
      reasons: []
    };

    // Compare images
    if (newComplaint.imagePath && existingComplaint.image_path) {
      scores.imageScore = await compareImages(newComplaint.imagePath, existingComplaint.image_path);
      if (scores.imageScore > 0.7) {
        scores.reasons.push(`Similar image (${Math.round(scores.imageScore * 100)}% match)`);
      }
    }

    // Compare descriptions
    if (newComplaint.description && existingComplaint.description) {
      scores.textScore = await compareText(newComplaint.description, existingComplaint.description, language);
      if (scores.textScore > 0.65) {
        scores.reasons.push(`Similar description (${Math.round(scores.textScore * 100)}% match)`);
      }
    }

    // Compare locations
    if (newComplaint.location && existingComplaint.coordinates) {
      scores.locationScore = await compareLocations(newComplaint.location, existingComplaint.coordinates);
      if (scores.locationScore > 0.8) {
        scores.reasons.push('Same location or very close');
      }
    }

    // Calculate combined score (weighted average)
    const weights = {
      imageScore: 0.4,
      textScore: 0.35,
      locationScore: 0.25
    };

    scores.combinedScore = 
      (scores.imageScore * weights.imageScore) +
      (scores.textScore * weights.textScore) +
      (scores.locationScore * weights.locationScore);

    return scores;
  } catch (error) {
    logger.error(`Error comparing complaints: ${error.message}`);
    return {
      imageScore: 0,
      textScore: 0,
      locationScore: 0,
      combinedScore: 0,
      reasons: []
    };
  }
};

/**
 * Compare two images for similarity
 * @private
 */
const compareImages = async (imagePath1, imagePath2) => {
  try {
    const imageServiceEndpoint = process.env.IMAGE_SERVICE_ENDPOINT || 'http://localhost:5003/compare-images';
    
    const response = await axios.post(
      imageServiceEndpoint,
      {
        image1Path: imagePath1,
        image2Path: imagePath2
      },
      {
        timeout: 10000
      }
    );

    return Math.min(response.data.similarity || 0, 1.0);
  } catch (error) {
    logger.warn(`Image comparison failed: ${error.message}`);
    return 0;
  }
};

/**
 * Compare two text descriptions for similarity
 * @private
 */
const compareText = async (text1, text2, language) => {
  try {
    const nlpServiceEndpoint = process.env.NLP_SERVICE_ENDPOINT || 'http://localhost:5002/text-similarity';
    
    const response = await axios.post(
      nlpServiceEndpoint,
      {
        text1: text1,
        text2: text2,
        language: language
      },
      {
        timeout: 5000
      }
    );

    return Math.min(response.data.similarity || 0, 1.0);
  } catch (error) {
    logger.warn(`Text comparison failed: ${error.message}`);
    
    // Fallback to basic cosine similarity
    return basicTextSimilarity(text1, text2);
  }
};

/**
 * Basic text similarity using word overlap (fallback)
 * @private
 */
const basicTextSimilarity = (text1, text2) => {
  const normalize = (text) => text.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  
  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size; // Jaccard similarity
};

/**
 * Compare two geographic locations
 * @private
 */
const compareLocations = async (location1, coordinates2) => {
  try {
    // Calculate distance using Haversine formula
    if (!location1.coordinates || !coordinates2) {
      return 0;
    }

    const distance = calculateDistance(
      location1.coordinates.lat,
      location1.coordinates.lng,
      coordinates2.lat || coordinates2[0],
      coordinates2.lng || coordinates2[1]
    );

    // Convert distance to similarity score (100m = 0, 1000m = 0)
    const similarity = Math.max(0, 1 - (distance / SIMILARITY_THRESHOLDS.LOCATION_PROXIMITY));
    return Math.min(similarity, 1.0);
  } catch (error) {
    logger.warn(`Location comparison failed: ${error.message}`);
    return 0;
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @private
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c * 1000; // Return distance in meters
};

/**
 * Record duplicate check result
 * @param {integer} newComplaintId - New complaint ID
 * @param {array} similarComplaintIds - IDs of similar complaints
 * @param {object} scores - Similarity scores
 * @returns {Promise<{checkId: integer}>}
 */
const recordDuplicateCheck = async (newComplaintId, similarComplaintIds, scores) => {
  try {
    const query = `
      INSERT INTO duplicate_complaint_checks 
      (new_complaint_id, similar_complaint_ids, image_similarity_scores, 
       description_similarity_scores, location_proximity_scores, check_details)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const imageScores = similarComplaintIds.map(() => scores.imageScore || 0);
    const textScores = similarComplaintIds.map(() => scores.textScore || 0);
    const locationScores = similarComplaintIds.map(() => scores.locationScore || 0);

    const result = await pool.query(query, [
      newComplaintId,
      similarComplaintIds,
      imageScores,
      textScores,
      locationScores,
      JSON.stringify(scores)
    ]);

    return {
      checkId: result.rows[0].id
    };
  } catch (error) {
    logger.error(`Error recording duplicate check: ${error.message}`);
    throw error;
  }
};

/**
 * Update duplicate check with user action
 * @param {integer} checkId - Check ID
 * @param {string} action - 'create_new' or 'join_existing'
 * @param {integer} selectedComplaintId - Selected complaint ID (if joining)
 * @returns {Promise<void>}
 */
const updateDuplicateCheckAction = async (checkId, action, selectedComplaintId = null) => {
  try {
    const query = `
      UPDATE duplicate_complaint_checks
      SET user_action = $1, selected_complaint_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;

    await pool.query(query, [action, selectedComplaintId, checkId]);
  } catch (error) {
    logger.error(`Error updating duplicate check: ${error.message}`);
    throw error;
  }
};

/**
 * Get duplicate check details
 * @param {integer} checkId - Check ID
 * @returns {Promise<object>}
 */
const getDuplicateCheckDetails = async (checkId) => {
  try {
    const query = `
      SELECT * FROM duplicate_complaint_checks WHERE id = $1
    `;

    const result = await pool.query(query, [checkId]);
    return result.rows[0] || null;
  } catch (error) {
    logger.error(`Error fetching duplicate check: ${error.message}`);
    throw error;
  }
};

module.exports = {
  checkForDuplicates,
  recordDuplicateCheck,
  updateDuplicateCheckAction,
  getDuplicateCheckDetails,
  SIMILARITY_THRESHOLDS
};
