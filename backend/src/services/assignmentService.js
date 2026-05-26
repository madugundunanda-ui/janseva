const AppError = require('../utils/AppError');
const { Complaint, User } = require('../models');

const closedStatuses = ['resolved', 'rejected', 'closed'];

const sameDepartment = (user, departmentId) => {
  if (!user.department || !departmentId) {
    return false;
  }

  return user.department.toString() === departmentId.toString();
};

const getComplaintOrFail = async (complaintId) => {
  const complaint = await Complaint.findById(complaintId).populate('department', 'name description');

  if (!complaint) {
    throw new AppError('Complaint not found', 404);
  }

  if (!complaint.department) {
    throw new AppError('Complaint department not found', 400);
  }

  return complaint;
};

const ensureComplaintCanBeAssigned = (complaint) => {
  if (closedStatuses.includes(complaint.status)) {
    throw new AppError('Closed complaints cannot be reassigned', 400);
  }
};

const getDepartmentTeamForComplaint = async (complaintId, actor) => {
  const complaint = await getComplaintOrFail(complaintId);

  if (actor.role === 'supervisor' && !sameDepartment(actor, complaint.department._id)) {
    throw new AppError('You can only view officers in your department', 403);
  }

  const [officers, supervisors] = await Promise.all([
    User.find({ role: 'officer', department: complaint.department._id }).select('name email phone role department'),
    User.find({ role: 'supervisor', department: complaint.department._id }).select('name email phone role department'),
  ]);

  return {
    complaint: {
      id: complaint._id,
      title: complaint.title,
      department: complaint.department,
      status: complaint.status,
    },
    officers,
    supervisors,
  };
};

const assignOfficerToComplaint = async ({ complaintId, officerId, actor }) => {
  const complaint = await getComplaintOrFail(complaintId);
  ensureComplaintCanBeAssigned(complaint);

  if (actor.role === 'supervisor' && !sameDepartment(actor, complaint.department._id)) {
    throw new AppError('Supervisors can only assign complaints in their department', 403);
  }

  const officer = await User.findOne({
    _id: officerId,
    role: 'officer',
    department: complaint.department._id,
  }).select('name email phone role department');

  if (!officer) {
    throw new AppError('Officer must belong to the complaint department', 400);
  }

  complaint.assignedOfficer = officer._id;
  complaint.status = 'assigned';
  await complaint.save();

  return complaint.populate([
    { path: 'citizen', select: 'firstName lastName email phone currentAddress permanentAddress age gender occupation aadhaarNumber' },
    { path: 'assignedOfficer', select: 'name email phone role' },
    { path: 'department', select: 'name' },
  ]);
};

const assignSupervisorToComplaint = async ({ complaintId, supervisorId, actor, note }) => {
  if (actor.role === 'admin') {
    throw new AppError(
      'Admins cannot assign supervisors directly. Complaints must be assigned to an Officer first.',
      403
    );
  }

  const complaint = await getComplaintOrFail(complaintId);
  ensureComplaintCanBeAssigned(complaint);

  if (actor.role === 'officer') {
    const assignedOfficerId = complaint.assignedOfficer ? complaint.assignedOfficer.toString() : null;

    if (assignedOfficerId !== actor._id.toString()) {
      throw new AppError('Only the assigned officer can escalate this complaint', 403);
    }
  }

  const supervisor = await User.findOne({
    _id: supervisorId,
    role: 'supervisor',
    department: complaint.department._id,
  }).select('name email phone role department');

  if (!supervisor) {
    throw new AppError('Supervisor must belong to the complaint department', 400);
  }

  complaint.assignedSupervisor = supervisor._id;
  complaint.escalationNote = note || complaint.escalationNote;
  complaint.escalatedAt = new Date();
  complaint.status = 'escalated';
  await complaint.save();

  return complaint.populate([
    { path: 'citizen', select: 'firstName lastName email phone currentAddress permanentAddress age gender occupation aadhaarNumber' },
    { path: 'assignedOfficer', select: 'name email phone role' },
    { path: 'assignedSupervisor', select: 'name email phone role' },
    { path: 'department', select: 'name' },
  ]);
};

module.exports = {
  getDepartmentTeamForComplaint,
  assignOfficerToComplaint,
  assignSupervisorToComplaint,
};
