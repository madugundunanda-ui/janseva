const asyncHandler = require('../utils/asyncHandler');
const { Notification, NotificationPreference } = require('../models');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ recipientId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50);

  res.status(200).json({
    success: true,
    data: notifications
  });
});

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipientId: req.user._id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found or unauthorized');
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipientId: req.user._id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read'
  });
});

// @desc    Get user notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
const getPreferences = asyncHandler(async (req, res) => {
  let prefs = await NotificationPreference.findOne({ userId: req.user._id });
  if (!prefs) {
    prefs = await NotificationPreference.create({ userId: req.user._id });
  }

  res.status(200).json({
    success: true,
    data: prefs
  });
});

// @desc    Update notification preferences
// @route   PATCH /api/notifications/preferences
// @access  Private
const updatePreferences = asyncHandler(async (req, res) => {
  const { inAppEnabled, emailEnabled, smsEnabled, whatsappEnabled } = req.body;

  let prefs = await NotificationPreference.findOne({ userId: req.user._id });
  if (!prefs) {
    prefs = new NotificationPreference({ userId: req.user._id });
  }

  if (inAppEnabled !== undefined) prefs.inAppEnabled = inAppEnabled;
  if (emailEnabled !== undefined) prefs.emailEnabled = emailEnabled;
  if (smsEnabled !== undefined) prefs.smsEnabled = smsEnabled;
  if (whatsappEnabled !== undefined) prefs.whatsappEnabled = whatsappEnabled;

  await prefs.save();

  res.status(200).json({
    success: true,
    data: prefs
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreferences
};
