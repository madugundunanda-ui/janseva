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

  if (isNaN(userLat) || isNaN(userLng)) {
    throw new AppError('lat and lng must be valid numbers', 400);
  }

  const radius = 500; // 500 meters

  // Use $geoNear aggregation for efficient 2dsphere-indexed proximity search
  const nearby = await Complaint.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [userLng, userLat] },
        distanceField: 'distance',
        maxDistance: radius,
        spherical: true,
        key: 'location.geoPoint',
        query: {
          status: { $in: ['submitted', 'under_review', 'assigned', 'in_progress', 'escalated'] }
        }
      }
    },
    { $sort: { distance: 1 } },
    { $limit: 50 },
    {
      $lookup: {
        from: 'departments',
        localField: 'department',
        foreignField: '_id',
        as: 'departmentDoc'
      }
    },
    { $unwind: { path: '$departmentDoc', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'users',
        localField: 'citizen',
        foreignField: '_id',
        as: 'citizenDoc',
        pipeline: [
          { $project: { firstName: 1, lastName: 1, email: 1, phone: 1, currentAddress: 1, permanentAddress: 1, age: 1, gender: 1, occupation: 1, aadhaarNumber: 1 } }
        ]
      }
    },
    { $unwind: { path: '$citizenDoc', preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        distance: { $round: ['$distance', 0] },
        department: { $ifNull: ['$departmentDoc', '$department'] },
        citizen: { $ifNull: ['$citizenDoc', '$citizen'] }
      }
    },
    { $project: { departmentDoc: 0, citizenDoc: 0 } }
  ]);

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
