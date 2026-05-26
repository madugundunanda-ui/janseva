const asyncHandler = require('../utils/asyncHandler');
const { Announcement, Complaint } = require('../models');

const getLiveUpdates = asyncHandler(async (req, res) => {
  // Fetch recent announcements and complaints
  const [announcements, complaints] = await Promise.all([
    Announcement.find({ isPublished: true }).sort({ publishedDate: -1, createdAt: -1 }).limit(10),
    Complaint.find().sort({ createdAt: -1 }).limit(10).populate('department', 'name')
  ]);

  const items = [];

  // Map announcements to standard GovernanceUpdate format
  announcements.forEach((a) => {
    items.push({
      id: a._id.toString(),
      timestamp: a.publishedDate || a.createdAt,
      department: a.department || 'General Governance',
      message: `${a.title}: ${a.description}`,
      severity: a.priority.toLowerCase() === 'critical' || a.priority.toLowerCase() === 'emergency' 
        ? 'critical' 
        : (a.priority.toLowerCase() === 'important' ? 'warning' : 'info'),
      source: 'announcements'
    });
  });

  // Map complaints to standard GovernanceUpdate format
  complaints.forEach((c) => {
    const deptName = typeof c.department === 'object' && c.department ? c.department.name : (c.department || 'General');
    items.push({
      id: c._id.toString(),
      timestamp: c.createdAt,
      department: deptName,
      message: `Grievance filed: "${c.title}" at ${c.location?.address || 'Ward ' + (c.location?.ward || 'Unknown')}`,
      severity: c.priority === 'critical' || c.priority === 'urgent' ? 'warning' : 'info',
      ward: c.location?.ward,
      source: 'complaints'
    });
  });

  // Sort unified feed by timestamp descending
  items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  res.status(200).json({
    success: true,
    message: 'Live updates fetched successfully',
    data: {
      items: items.slice(0, 15),
      lastUpdated: new Date().toISOString()
    }
  });
});

module.exports = { getLiveUpdates };
