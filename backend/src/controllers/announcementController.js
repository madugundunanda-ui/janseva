const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { Announcement } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');

const toThumbnail = (req) => {
  if (req.file) {
    return `/uploads/${req.file.filename}`;
  }
  return req.body.thumbnailUrl || '';
};

const getAnnouncements = asyncHandler(async (req, res) => {
  const filter = {};

  const tenantId = req.user?.tenantId || req.query.tenantId || 'default-municipality';
  filter.tenantId = tenantId;

  // Exact Match Filters
  if (req.query.category) filter.category = req.query.category;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.state && req.query.state !== 'ALL') filter.state = req.query.state;
  if (req.query.district) filter.district = req.query.district;
  if (req.query.city) filter.city = req.query.city;
  if (req.query.published === 'true') filter.isPublished = true;
  
  // Severity / Priority Filter
  if (req.query.severity) {
    if (req.query.severity === 'Emergency Only') {
      filter.severity = { $in: ['Critical', 'Emergency'] };
    } else {
      filter.severity = req.query.severity;
    }
  } else if (req.query.priority) {
    filter.priority = req.query.priority;
  }

  // Date Range Filter (e.g., 'Last 7 Days')
  if (req.query.dateRange) {
    const today = new Date();
    if (req.query.dateRange === 'Last 7 Days') {
      filter.publishedDate = { $gte: new Date(today.setDate(today.getDate() - 7)) };
    } else if (req.query.dateRange === 'Last 30 Days') {
      filter.publishedDate = { $gte: new Date(today.setDate(today.getDate() - 30)) };
    }
  }

  // Keyword Search
  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { shortSummary: { $regex: req.query.search, $options: 'i' } },
      { mediumSummary: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const savedAnnouncements = await Announcement.find(filter).sort({ publishedDate: -1, createdAt: -1 }).limit(100);

  const data = savedAnnouncements;

  sendSuccess(res, 200, 'Announcements fetched successfully', {
    count: data.length,
    announcements: data,
  });
});

const getAnnouncementById = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || req.query.tenantId || 'default-municipality';
  const announcement = await Announcement.findOne({ _id: req.params.id, tenantId });
  if (!announcement) throw new AppError('Announcement not found', 404);

  sendSuccess(res, 200, 'Announcement fetched successfully', { announcement });
});

const createAnnouncement = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const payload = {
    ...req.body,
    thumbnailUrl: toThumbnail(req),
    publishedDate: req.body.publishedDate || new Date(),
    tenantId,
  };

  const announcement = await Announcement.create(payload);

  sendSuccess(res, 201, 'Announcement created successfully', { announcement });
});

const updateAnnouncement = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const existing = await Announcement.findOne({ _id: req.params.id, tenantId });
  if (!existing) throw new AppError('Announcement not found', 404);

  const payload = {
    ...req.body,
  };

  if (req.file || req.body.thumbnailUrl) {
    payload.thumbnailUrl = toThumbnail(req);
  }

  const announcement = await Announcement.findOneAndUpdate(
    { _id: req.params.id, tenantId },
    payload,
    { new: true, runValidators: true }
  );

  sendSuccess(res, 200, 'Announcement updated successfully', { announcement });
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || 'default-municipality';
  const announcement = await Announcement.findOne({ _id: req.params.id, tenantId });
  if (!announcement) throw new AppError('Announcement not found', 404);

  await announcement.deleteOne();
  sendSuccess(res, 200, 'Announcement deleted successfully', { id: req.params.id });
});

module.exports = {
  getAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
