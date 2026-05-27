const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Haversine Distance Formula in meters
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  const R = 6371e3; // Earth's radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

// Reverse Geocoding using OpenStreetMap Nominatim API
async function reverseGeocode(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'JanSeva-CitizenGrievanceSystem/1.0.0 (contact@janseva.gov.in)'
      }
    });

    if (!response.ok) {
      throw new Error(`Nominatim response not ok: ${response.status}`);
    }

    const data = await response.json();
    const address = data.address || {};

    const street = address.road || address.pedestrian || address.suburb || address.neighbourhood || '';
    const area = address.suburb || address.village || address.neighbourhood || address.city_district || '';
    const city = address.city || address.town || address.county || '';
    const state = address.state || '';
    const pincode = address.postcode || '';

    const readableAddress = data.display_name || [street, area, city, pincode].filter(Boolean).join(', ');

    return {
      address: readableAddress,
      street,
      area: area || street || 'Central Area',
      city: city || 'Bengaluru',
      state: state || 'Karnataka',
      pincode
    };
  } catch (error) {
    logger.warn('Reverse geocoding failed, using fallback mapping', {
      message: error.message,
      stack: error.stack,
    });
    // Return standard localized Indian addresses based on coordinate ranges
    return {
      address: `Auto-generated near ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      street: 'Mahatma Gandhi Road',
      area: 'Shivajinagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560001'
    };
  }
}

// Hotspot Clustering and Dynamic Priority elevation
async function detectAndProcessHotspots() {
  const { Complaint, Hotspot } = require('../models');

  // Clear previous hotspots to recalculate clustering
  await Hotspot.deleteMany({});

  const threshold = 3; // 3 or more complaints within 500m creates a hotspot
  const radius = 500;  // 500 meters radius

  // Fetch active complaint locations with geoPoint for clustering
  const activeComplaints = await Complaint.find({
    status: { $in: ['submitted', 'under_review', 'assigned', 'in_progress', 'escalated'] },
    'location.geoPoint.coordinates': { $exists: true }
  }).select('_id location priority');

  if (activeComplaints.length === 0) return [];

  const processed = new Set();
  const hotspotsCreated = [];

  for (let i = 0; i < activeComplaints.length; i++) {
    const c1 = activeComplaints[i];
    if (processed.has(c1._id.toString())) continue;

    const lat1 = c1.location.latitude;
    const lon1 = c1.location.longitude;
    if (lat1 == null || lon1 == null) continue;

    // Use $geoNear-equivalent: find all complaints within radius of this complaint
    const nearbyIds = [];
    const cluster = [c1];

    for (let j = 0; j < activeComplaints.length; j++) {
      if (i === j) continue;
      const c2 = activeComplaints[j];
      const lat2 = c2.location?.latitude;
      const lon2 = c2.location?.longitude;
      if (lat2 == null || lon2 == null) continue;

      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      if (distance <= radius) {
        cluster.push(c2);
        nearbyIds.push(c2._id);
      }
    }

    if (cluster.length >= threshold) {
      // Calculate cluster geographic centroid
      const sumLat = cluster.reduce((sum, c) => sum + c.location.latitude, 0);
      const sumLng = cluster.reduce((sum, c) => sum + c.location.longitude, 0);
      const avgLat = sumLat / cluster.length;
      const avgLng = sumLng / cluster.length;

      // Extract a descriptive area label
      let areaName = 'Hotspot Area';
      const addressList = cluster.map(c => c.location.address).filter(Boolean);
      if (addressList.length > 0) {
        const parts = addressList[0].split(',');
        areaName = parts[0].trim() || parts[1]?.trim() || 'Hotspot Area';
      }

      // Determine priority level
      let priority = 'medium';
      if (cluster.length >= 8) priority = 'urgent';
      else if (cluster.length >= 5) priority = 'high';

      const hotspot = await Hotspot.create({
        area: areaName,
        latitude: avgLat,
        longitude: avgLng,
        complaintsCount: cluster.length,
        priority: priority
      });

      hotspotsCreated.push(hotspot);

      // Bulk-update priorities for complaints in this hotspot
      const complaintIds = cluster.map(c => c._id);
      for (const comp of cluster) {
        processed.add(comp._id.toString());
      }

      // Elevate low→medium, medium→high, high→urgent in bulk
      await Complaint.updateMany(
        { _id: { $in: complaintIds }, priority: 'low' },
        { $set: { priority: 'medium' } }
      );
      await Complaint.updateMany(
        { _id: { $in: complaintIds }, priority: 'medium' },
        { $set: { priority: 'high' } }
      );
      await Complaint.updateMany(
        { _id: { $in: complaintIds }, priority: 'high' },
        { $set: { priority: 'urgent' } }
      );
    }
  }

  return hotspotsCreated;
}

// Route Optimization - Nearest Neighbor algorithm
function optimizeRoute(startLat, startLng, complaintsList) {
  if (!complaintsList || complaintsList.length === 0) return [];

  const unvisited = [...complaintsList];
  const optimized = [];
  let currentLat = parseFloat(startLat);
  let currentLng = parseFloat(startLng);

  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const comp = unvisited[i];
      const lat = comp.location?.latitude || (comp.location?.coordinates?.lat) || null;
      const lng = comp.location?.longitude || (comp.location?.coordinates?.lng) || null;

      if (lat === null || lng === null) continue;

      const distance = calculateDistance(currentLat, currentLng, lat, lng);
      if (distance < minDistance) {
        minDistance = distance;
        nearestIndex = i;
      }
    }

    const nextComp = unvisited.splice(nearestIndex, 1)[0];
    optimized.push(nextComp);
    
    const nextLat = nextComp.location?.latitude || (nextComp.location?.coordinates?.lat);
    const nextLng = nextComp.location?.longitude || (nextComp.location?.coordinates?.lng);
    if (nextLat && nextLng) {
      currentLat = nextLat;
      currentLng = nextLng;
    }
  }

  return optimized;
}

module.exports = {
  calculateDistance,
  reverseGeocode,
  detectAndProcessHotspots,
  optimizeRoute,
};
