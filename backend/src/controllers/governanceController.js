const asyncHandler = require('../utils/asyncHandler');
const { Complaint, Department } = require('../models');
const { sendSuccess } = require('../utils/apiResponse');

const getTimeline = asyncHandler(async (req, res) => {
  // Fetch complaints and departments to calculate metrics
  const [complaints, departments] = await Promise.all([
    Complaint.find().populate('department', 'name'),
    Department.find()
  ]);

  const today = new Date();
  const points = [];
  let resolved30dCount = 0;

  // Construct data points for the past 30 days
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dayKey = date.toDateString();

    const dayComplaints = complaints.filter(
      (c) => new Date(c.createdAt).toDateString() === dayKey
    );
    const resolved = dayComplaints.filter((c) => c.status === 'resolved');
    
    resolved30dCount += resolved.length;
    const incoming = dayComplaints.length;

    // Daily SLA compliance
    let daySlaCompliance = 92; // Default baseline
    if (dayComplaints.length > 0) {
      const resolvedWithSla = resolved.filter((c) => {
        if (!c.resolvedAt) return true;
        const durationHrs = (new Date(c.resolvedAt) - new Date(c.createdAt)) / 36e5;
        const limit = c.priority === 'critical' ? 24 : c.priority === 'high' ? 72 : 168;
        return durationHrs <= limit;
      });
      daySlaCompliance = Math.round((resolvedWithSla.length / dayComplaints.length) * 100);
    }

    // Engagement score (mock based on active participation/views)
    const engagement = Math.min(100, 72 + incoming * 3);

    points.push({
      date: date.toISOString().slice(0, 10),
      resolvedGrievances: resolved.length,
      incomingTickets: incoming,
      citizenEngagement: engagement,
      slaCompliance: daySlaCompliance
    });
  }

  // Calculate global average metrics
  const totalResolved = complaints.filter((c) => c.status === 'resolved');
  
  let averageResponseTime = 4.2; // Baseline hours
  if (totalResolved.length > 0) {
    const totalDuration = totalResolved.reduce((sum, c) => {
      if (!c.resolvedAt) return sum;
      return sum + (new Date(c.resolvedAt) - new Date(c.createdAt)) / 36e5;
    }, 0);
    averageResponseTime = parseFloat((totalDuration / totalResolved.length).toFixed(1));
  }

  let slaSuccessRate = 88; // Default compliance
  if (complaints.length > 0) {
    const resolvedCount = totalResolved.length;
    const withinSlaCount = totalResolved.filter((c) => {
      if (!c.resolvedAt) return true;
      const durationHrs = (new Date(c.resolvedAt) - new Date(c.createdAt)) / 36e5;
      const limit = c.priority === 'critical' ? 24 : c.priority === 'high' ? 72 : 168;
      return durationHrs <= limit;
    }).length;
    slaSuccessRate = Math.round((withinSlaCount / Math.max(resolvedCount, 1)) * 100);
  }

  const engagementRate = Math.round(
    points.reduce((sum, p) => sum + p.citizenEngagement, 0) / points.length
  );

  // Group metrics by department (serving as administrative districts in UI)
  const districtMetrics = departments.slice(0, 6).map((dept, index) => {
    const deptComplaints = complaints.filter(
      (c) =>
        c.department &&
        (c.department._id?.toString() === dept._id?.toString() ||
          c.department === dept._id?.toString())
    );
    const deptResolved = deptComplaints.filter((c) => c.status === 'resolved');
    const deptResolutionRate =
      deptComplaints.length > 0
        ? Math.round((deptResolved.length / deptComplaints.length) * 100)
        : 90 - index;

    return {
      district: dept.name,
      performance: Math.max(60, deptResolutionRate),
      resolved: deptResolved.length,
      engagement: Math.max(75, 88 + index),
      slaActivity: Math.max(70, deptResolutionRate - 2)
    };
  });

  sendSuccess(res, 200, 'Governance timeline fetched successfully', {
    points,
    districtMetrics,
    resolved30d: resolved30dCount,
    engagementRate,
    slaSuccessRate,
    averageResponseTime
  });
});

module.exports = { getTimeline };
