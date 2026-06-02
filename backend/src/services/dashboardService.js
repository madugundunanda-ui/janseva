const mongoose = require('mongoose');
const departmentsSeed = require('../data/departments');
const { Complaint, Department } = require('../models');

const normalize = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const statusMap = {
  submitted: 'open',
  under_review: 'open',
  assigned: 'in_progress',
  in_progress: 'in_progress',
  escalated: 'escalated',
  resolved: 'resolved',
  rejected: 'closed',
  closed: 'closed',
};

const getDashboardStats = async (user) => {
  const filter = {};

  const tenantId = user?.tenantId || 'default-municipality';
  filter.tenantId = tenantId;

  if (user) {
    if (user.role === 'citizen') {
      filter.citizen = user._id;
    } else if (user.role === 'officer') {
      filter.assignedOfficer = user._id;
    } else if (user.role === 'supervisor') {
      filter.department = user.department;
    }
  }

  const [totalComplaints, breakdown] = await Promise.all([
    Complaint.countDocuments(filter),
    Complaint.aggregate([
      { $match: filter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const mapped = {
    total: totalComplaints,
    resolved: 0,
    pending: 0,
    inProgress: 0,
    escalated: 0,
  };

  breakdown.forEach((item) => {
    const normalized = statusMap[item._id] || 'open';
    if (normalized === 'resolved') mapped.resolved += item.count;
    else if (normalized === 'in_progress') mapped.inProgress += item.count;
    else if (normalized === 'escalated') mapped.escalated += item.count;
    else mapped.pending += item.count;
  });

  if (user && user.role === 'admin') {
    const { User, Announcement } = require('../models');
    const [officers, supervisors, departments, recentComplaints, recentAnnouncements, mostAffectedIssues, problematicAreas, spamCount, blockedCount, totalCitizens, trustedCount, normalCount, warningCount, restrictedCount] = await Promise.all([
      User.countDocuments({ role: 'officer', activeStatus: true, tenantId }),
      User.countDocuments({ role: 'supervisor', activeStatus: true, tenantId }),
      Department.countDocuments({ status: 'active', tenantId }),
      Complaint.find(filter).sort({ createdAt: -1 }).limit(5).populate('citizen', 'firstName lastName email phone currentAddress permanentAddress age gender occupation aadhaarNumber').populate('department', 'name'),
      Announcement.find({ tenantId }).sort({ createdAt: -1 }).limit(5),
      Complaint.find(filter).sort({ affectedCitizens: -1, createdAt: -1 }).limit(5).populate('citizen', 'firstName lastName email phone currentAddress permanentAddress age gender occupation aadhaarNumber').populate('department', 'name'),
      Complaint.aggregate([
        { $match: { status: { $in: ['submitted', 'under_review', 'assigned', 'in_progress', 'escalated'] }, tenantId } },
        {
          $group: {
            _id: { $ifNull: ['$location.address', 'Unknown Area'] },
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]),
      Complaint.countDocuments({ 'spamAnalysis.isSpam': true, tenantId }),
      User.countDocuments({ role: 'citizen', restricted: true, tenantId }),
      User.countDocuments({ role: 'citizen', tenantId }),
      User.countDocuments({ role: 'citizen', trustScore: { $gte: 95 }, tenantId }),
      User.countDocuments({ role: 'citizen', trustScore: { $gte: 70, $lt: 95 }, tenantId }),
      User.countDocuments({ role: 'citizen', trustScore: { $gte: 40, $lt: 70 }, tenantId }),
      User.countDocuments({ role: 'citizen', trustScore: { $lt: 40 }, tenantId })
    ]);

    const citizensTotal = totalCitizens || 1;
    const trustedPct = Math.round((trustedCount / citizensTotal) * 100) || 75;
    const normalPct = Math.round((normalCount / citizensTotal) * 100) || 15;
    const warningPct = Math.round((warningCount / citizensTotal) * 100) || 7;
    const restrictedPct = Math.round((restrictedCount / citizensTotal) * 100) || 3;
    
    mapped.activeOfficers = officers;
    mapped.activeSupervisors = supervisors;
    mapped.totalDepartments = departments;
    mapped.recentComplaints = recentComplaints;
    mapped.recentAnnouncements = recentAnnouncements;
    mapped.mostAffectedIssues = mostAffectedIssues;
    mapped.problematicAreas = problematicAreas.map(item => {
      const parts = item._id.split(',');
      return {
        area: parts[0].trim() || parts[1]?.trim() || 'Central Zone',
        count: item.count
      };
    });

    mapped.spamMetrics = {
      spamCount: spamCount || 0,
      blockedCount: blockedCount || 0,
      distribution: {
        trusted: trustedPct,
        normal: normalPct,
        warning: warningPct,
        restricted: restrictedPct
      }
    };
  }

  return mapped;
};

const resolveDepartmentId = async (inputDepartment) => {
  if (!inputDepartment) return null;

  if (mongoose.Types.ObjectId.isValid(inputDepartment)) {
    const existing = await Department.findById(inputDepartment).select('_id');
    if (existing) return existing._id;
  }

  const normalizedInput = normalize(inputDepartment);

  let dept = await Department.findOne({
    $expr: {
      $eq: [{ $toLower: '$name' }, normalizedInput],
    },
  });

  if (!dept) {
    const seedMatch = departmentsSeed.find((d) => normalize(d.name) === normalizedInput || normalize(d.name).includes(normalizedInput));
    if (seedMatch) {
      dept = await Department.findOneAndUpdate(
        { name: seedMatch.name },
        { $setOnInsert: { name: seedMatch.name, description: seedMatch.description } },
        { upsert: true, new: true }
      );
    }
  }

  return dept ? dept._id : null;
};

module.exports = {
  getDashboardStats,
  resolveDepartmentId,
};
