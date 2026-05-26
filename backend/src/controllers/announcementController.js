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

  if (req.query.category) filter.category = req.query.category;
  if (req.query.priority) filter.priority = req.query.priority;
  if (req.query.department) filter.department = req.query.department;
  if (req.query.published === 'true') filter.isPublished = true;

  const savedAnnouncements = await Announcement.find(filter).sort({ publishedDate: -1, createdAt: -1 });

  const data = savedAnnouncements;

  sendSuccess(res, 200, 'Announcements fetched successfully', {
    count: data.length,
    announcements: data,
  });
});

const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw new AppError('Announcement not found', 404);

  sendSuccess(res, 200, 'Announcement fetched successfully', { announcement });
});

const createAnnouncement = asyncHandler(async (req, res) => {
  const payload = {
    ...req.body,
    thumbnailUrl: toThumbnail(req),
    publishedDate: req.body.publishedDate || new Date(),
  };

  const announcement = await Announcement.create(payload);

  sendSuccess(res, 201, 'Announcement created successfully', { announcement });
});

const updateAnnouncement = asyncHandler(async (req, res) => {
  const existing = await Announcement.findById(req.params.id);
  if (!existing) throw new AppError('Announcement not found', 404);

  const payload = {
    ...req.body,
  };

  if (req.file || req.body.thumbnailUrl) {
    payload.thumbnailUrl = toThumbnail(req);
  }

  const announcement = await Announcement.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, 200, 'Announcement updated successfully', { announcement });
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
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
