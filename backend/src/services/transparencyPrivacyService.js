const logger = require('../utils/logger');

class TransparencyPrivacyService {
  /**
   * Obfuscates an exact coordinate to approximately 111 meters accuracy.
   * This ensures public maps can show clusters without revealing specific house locations.
   */
  static obfuscateCoordinates(lat, lng) {
    if (lat === null || lng === null) return { lat: null, lng: null };
    return {
      lat: Number(parseFloat(lat).toFixed(3)),
      lng: Number(parseFloat(lng).toFixed(3))
    };
  }

  /**
   * Sanitizes text strings using Regex to remove Aadhaar, Phone, and Email formats.
   */
  static sanitizeText(text) {
    if (!text || typeof text !== 'string') return text;
    let sanitized = text;
    // Aadhaar format
    sanitized = sanitized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[REDACTED_ID]');
    // Phone numbers (Indian/Generic 10-digit)
    sanitized = sanitized.replace(/(\+91[\-\s]?)?\b[6-9]\d{9}\b/g, '[REDACTED_PHONE]');
    // Emails
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED_EMAIL]');
    return sanitized;
  }

  /**
   * Removes PII and internal notes from a Complaint document.
   */
  static anonymizeComplaint(complaint) {
    if (!complaint) return null;
    
    // Safely clone if it's a mongoose document
    const c = complaint.toObject ? complaint.toObject() : { ...complaint };

    // Strip Identifiers
    delete c.citizen;
    delete c.assignedOfficer;
    delete c.assignedSupervisor;
    delete c.validators;
    delete c.validatorDetails;
    delete c.joinedCitizens;
    delete c.comments;

    // Strip internal AI/spam notes
    const isAiVerified = c.aiVerification?.verificationStatus === 'Verified';
    delete c.aiVerification;
    delete c.spamAnalysis;
    delete c.escalationNote;

    // We keep resolutionNote but perhaps in the future we might scrub it if it contains names
    // For now, resolution notes are considered public government action logs.
    if (c.resolutionNote) c.resolutionNote = this.sanitizeText(c.resolutionNote);

    // STRICT PRIVACY-BY-DEFAULT
    // Everything is hidden unless explicitly approved for public transparency
    if (!c.publicVisibilityApproved) {
      // Hide images
      delete c.beforeImage;
      delete c.afterImage;
      delete c.supportingImages;
      
      // Hide citizen text completely
      c.title = `Resolved ${c.category || 'Issue'}`;
      delete c.description;

      // Hide all coordinates completely
      if (c.location) {
        delete c.location.address;
        delete c.location.latitude;
        delete c.location.longitude;
        delete c.location.coordinates;
        delete c.location.geoPoint;
      }
    } else {
      // Images still require AI Verification even if approved
      if (!isAiVerified) {
        delete c.beforeImage;
        delete c.afterImage;
        delete c.supportingImages;
      }

      // Sanitize Text
      c.title = this.sanitizeText(c.title);
      c.description = this.sanitizeText(c.description);

      // Obfuscate Location
      if (c.location) {
        delete c.location.address; // Always delete exact address
        if (c.location.latitude && c.location.longitude) {
          const obf = this.obfuscateCoordinates(c.location.latitude, c.location.longitude);
          c.location.latitude = obf.lat;
          c.location.longitude = obf.lng;
          if (c.location.coordinates) {
            c.location.coordinates.lat = obf.lat;
            c.location.coordinates.lng = obf.lng;
          }
        }
        if (c.location.geoPoint && c.location.geoPoint.coordinates) {
          const obfLng = Number(parseFloat(c.location.geoPoint.coordinates[0]).toFixed(3));
          const obfLat = Number(parseFloat(c.location.geoPoint.coordinates[1]).toFixed(3));
          c.location.geoPoint.coordinates = [obfLng, obfLat];
        }
      }
    }

    return c;
  }

  /**
   * Anonymize an array of complaints
   */
  static anonymizeComplaints(complaints) {
    if (!Array.isArray(complaints)) return [];
    return complaints.map(c => this.anonymizeComplaint(c));
  }

  /**
   * Scrub Intelligence Alerts or Government Actions
   */
  static anonymizeAction(action) {
    if (!action) return null;
    const a = action.toObject ? action.toObject() : { ...action };
    // Assuming we might have officer names attached to actions, we'd strip them here.
    return a;
  }
}

module.exports = TransparencyPrivacyService;
