const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const geoService = require('../services/geoService');
const { Hotspot, Complaint } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');

const reverseGeocode = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  if (lat === undefined || lng === undefined) {
    throw new AppError('lat and lng are required', 400);
  }

  const result = await geoService.reverseGeocode(parseFloat(lat), parseFloat(lng));
  sendSuccess(res, 200, 'Coordinates reverse geocoded successfully', result);
});

const getHotspots = asyncHandler(async (req, res) => {
  const hotspots = await Hotspot.find().sort({ complaintsCount: -1 });
  sendSuccess(res, 200, 'Hotspots fetched successfully', { hotspots });
});

const getNearbyIssues = asyncHandler(async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    throw new AppError('lat and lng query parameters are required', 400);
  }

  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);

  // Fetch active/open complaints
  const activeComplaints = await Complaint.find({
    status: { $in: ['submitted', 'under_review', 'assigned', 'in_progress', 'escalated'] },
    'location.latitude': { $ne: null },
    'location.longitude': { $ne: null }
  }).populate('department', 'name').populate('citizen', 'firstName lastName email phone currentAddress permanentAddress age gender occupation aadhaarNumber');

  const radius = 500; // 500 meters
  const nearby = [];

  for (const c of activeComplaints) {
    const cLat = c.location.latitude;
    const cLng = c.location.longitude;
    const distance = geoService.calculateDistance(userLat, userLng, cLat, cLng);

    if (distance <= radius) {
      const cObj = c.toObject();
      cObj.distance = Math.round(distance);
      nearby.push(cObj);
    }
  }

  // Sort by distance (nearest first)
  nearby.sort((a, b) => a.distance - b.distance);

  sendSuccess(res, 200, 'Nearby active complaints fetched successfully', {
    count: nearby.length,
    complaints: nearby
  });
});

const triggerClustering = asyncHandler(async (req, res) => {
  const hotspots = await geoService.detectAndProcessHotspots();
  sendSuccess(res, 200, 'Hotspot clustering executed successfully', {
    hotspotsCount: hotspots.length,
    hotspots
  });
});

module.exports = {
  reverseGeocode,
  getHotspots,
  getNearbyIssues,
  triggerClustering
};
