const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { Feedback, Complaint } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');

const normalizeFeedback = (feedback) => ({
  id: feedback._id,
  rating: feedback.rating,
  comment: feedback.comment || '',
  anonymous: !!feedback.anonymous,
  approved: !!feedback.approved,
  complaintId: feedback.complaint?._id || feedback.complaint || '',
  complaintTitle: feedback.complaint?.title || 'Complaint',
  department: feedback.complaint?.department?.name || '',
  citizenName: feedback.anonymous ? 'Anonymous Citizen' : (feedback.citizen?.name || 'Citizen'),
  city: feedback.anonymous ? '' : (feedback.citizen?.address || ''),
  createdAt: feedback.createdAt,
});

const fetchFeedbackList = async (filter = {}) => Feedback.find(filter)
  .populate({ path: 'complaint', populate: { path: 'department', select: 'name' } })
  .populate('citizen', 'name address')
  .sort({ createdAt: -1 });

const createFeedback = asyncHandler(async (req, res) => {
  const { complaintId, rating, comment = '', anonymous = false } = req.body;

  if (!complaintId) throw new AppError('complaintId is required', 400);
  if (rating === undefined || rating === null || rating === '') throw new AppError('rating is required', 400);
  if (String(comment).trim().length < 10) throw new AppError('comment must be at least 10 characters', 400);

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) throw new AppError('Complaint not found', 404);
  if (String(complaint.citizen) !== String(req.user._id)) throw new AppError('You can only submit feedback for your own complaint', 403);
  if (complaint.status !== 'resolved') throw new AppError('Feedback allowed only for resolved complaints', 400);
  if (complaint.feedbackGiven) throw new AppError('Feedback already submitted for this complaint', 400);

  const feedback = await Feedback.create({
    citizen: req.user._id,
    complaint: complaintId,
    rating: Number(rating),
    comment: String(comment).trim(),
    anonymous: !!anonymous,
  });

  complaint.feedbackGiven = true;
  complaint.feedback = feedback._id;
  await complaint.save();

  await feedback.populate([
    { path: 'complaint', populate: { path: 'department', select: 'name' } },
    { path: 'citizen', select: 'name address' },
  ]);

  sendSuccess(res, 201, 'Feedback submitted successfully', {
    feedback: normalizeFeedback(feedback),
  });
});

const getMyFeedback = asyncHandler(async (req, res) => {
  const feedbacks = await fetchFeedbackList({ citizen: req.user._id });
  sendSuccess(res, 200, 'My feedback fetched successfully', {
    feedback: feedbacks.map(normalizeFeedback),
  });
});

const getPublicFeedback = asyncHandler(async (req, res) => {
  const feedbacks = await fetchFeedbackList({ approved: true });
  sendSuccess(res, 200, 'Public feedback fetched successfully', {
    feedback: feedbacks.map(normalizeFeedback),
  });
});

const getAllFeedback = asyncHandler(async (req, res) => {
  const feedbacks = await fetchFeedbackList();
  sendSuccess(res, 200, 'Feedback fetched successfully', {
    feedback: feedbacks.map(normalizeFeedback),
  });
});

const getFeedbackStats = asyncHandler(async (req, res) => {
  const feedbacks = await fetchFeedbackList({ approved: true });
  const ratings = feedbacks.map((item) => Number(item.rating) || 0);
  const total = ratings.length;
  const averageRating = total ? ratings.reduce((sum, value) => sum + value, 0) / total : 0;
  const positiveCount = ratings.filter((value) => value >= 4).length;
  const positivePercentage = total ? (positiveCount / total) * 100 : 0;

  sendSuccess(res, 200, 'Feedback statistics fetched successfully', {
    total,
    averageRating,
    positivePercentage,
  });
});

const approveFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw new AppError('Feedback not found', 404);
  feedback.approved = true;
  await feedback.save();
  await feedback.populate([
    { path: 'complaint', populate: { path: 'department', select: 'name' } },
    { path: 'citizen', select: 'name address' },
  ]);
  sendSuccess(res, 200, 'Feedback approved successfully', { feedback: normalizeFeedback(feedback) });
});

const rejectFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw new AppError('Feedback not found', 404);
  feedback.approved = false;
  await feedback.save();
  await feedback.populate([
    { path: 'complaint', populate: { path: 'department', select: 'name' } },
    { path: 'citizen', select: 'name address' },
  ]);
  sendSuccess(res, 200, 'Feedback rejected successfully', { feedback: normalizeFeedback(feedback) });
});

const deleteFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.findById(req.params.id);
  if (!feedback) throw new AppError('Feedback not found', 404);
  await Complaint.findByIdAndUpdate(feedback.complaint, { $set: { feedbackGiven: false, feedback: null } });
  await feedback.deleteOne();
  sendSuccess(res, 200, 'Feedback deleted successfully');
});

module.exports = {
  createFeedback,
  getMyFeedback,
  getPublicFeedback,
  getAllFeedback,
  getFeedbackStats,
  approveFeedback,
  rejectFeedback,
  deleteFeedback,
};
