const asyncHandler = require('../utils/asyncHandler');
const { User, Department } = require('../models');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');

/**
 * @desc    Onboard a new municipality (SaaS Tenancy initialization)
 * @route   POST /api/admin/onboard-municipality
 * @access  Private/Admin
 */
const onboardMunicipality = asyncHandler(async (req, res) => {
  const { tenantId, name, adminEmail, adminPassword, district, ward } = req.body;

  if (!tenantId || !name || !adminEmail || !adminPassword) {
    throw new AppError('tenantId, name, adminEmail, and adminPassword are required', 400);
  }

  // Sanitize tenantId (alphanumeric and dashes only)
  const sanitizedTenantId = tenantId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (!sanitizedTenantId) {
    throw new AppError('Invalid tenantId structure', 400);
  }

  // 1. Check if tenant already exists
  const existingTenantAdmin = await User.findOne({ tenantId: sanitizedTenantId, role: 'admin' });
  if (existingTenantAdmin) {
    throw new AppError(`Municipality tenant '${sanitizedTenantId}' is already onboarded.`, 409);
  }

  // 2. Check if admin email is already in use globally
  const emailExists = await User.findOne({ email: adminEmail.toLowerCase() });
  if (emailExists) {
    throw new AppError('Email address is already in use by another account node.', 409);
  }

  // 3. Create Tenant Admin Account
  const tenantAdmin = await User.create({
    name: `${name} Admin`,
    email: adminEmail.toLowerCase(),
    password: adminPassword,
    role: 'admin',
    tenantId: sanitizedTenantId,
    district: district || name,
    ward: ward || 'Ward 1',
    activeStatus: true,
  });

  // 4. Create standard default departments for this tenant
  const defaultDepts = [
    { name: 'Roads & Transport', code: 'RT', description: 'Road maintenance, potholes, street lights, and traffic signs.' },
    { name: 'Water Supply', code: 'WS', description: 'Water leakage, contaminated water, and drainage systems.' },
    { name: 'Electricity & Power', code: 'EP', description: 'Power cuts, open wires, transformers, and electrical hazards.' },
    { name: 'Sanitation & Waste', code: 'SW', description: 'Garbage dump clearance, public toilet hygiene, and open sewers.' },
    { name: 'Public Health', code: 'PH', description: 'Epidemic reporting, mosquito control, and local clinic complaints.' }
  ];

  const createdDepartments = [];
  for (const dept of defaultDepts) {
    const createdDept = await Department.create({
      name: `${dept.name} (${name})`,
      code: `${dept.code}`,
      description: dept.description,
      tenantId: sanitizedTenantId,
    });
    createdDepartments.push(createdDept);
  }

  // 5. Bootstrap default staff for the first department (Roads & Transport) to allow immediate intake
  const firstDept = createdDepartments[0];
  const supervisorEmail = `supervisor.${sanitizedTenantId}@works.janseva.gov.in`;
  const officerEmail = `officer.${sanitizedTenantId}@${sanitizedTenantId}.janseva.gov.in`;

  // Check if staff email already exists
  const staffEmailExists = await User.findOne({ 
    $or: [{ email: supervisorEmail }, { email: officerEmail }] 
  });

  let supervisor = null;
  let officer = null;

  if (!staffEmailExists) {
    supervisor = await User.create({
      name: `${name} Roads Supervisor`,
      email: supervisorEmail,
      password: adminPassword, // Use the same default password initially
      role: 'supervisor',
      department: firstDept._id,
      tenantId: sanitizedTenantId,
      district: district || name,
      ward: ward || 'Ward 1',
    });

    officer = await User.create({
      name: `${name} Roads Officer`,
      email: officerEmail,
      password: adminPassword,
      role: 'officer',
      department: firstDept._id,
      tenantId: sanitizedTenantId,
      district: district || name,
      ward: ward || 'Ward 1',
    });

    // Link officer to the department
    firstDept.officers.push(officer._id);
    await firstDept.save();
  }

  sendSuccess(res, 201, 'Municipality tenant onboarded successfully', {
    tenantId: sanitizedTenantId,
    name,
    admin: {
      id: tenantAdmin._id,
      email: tenantAdmin.email,
    },
    departments: createdDepartments.map(d => ({ id: d._id, name: d.name, code: d.code })),
    bootstrapStaff: supervisor && officer ? {
      supervisor: { email: supervisor.email },
      officer: { email: officer.email }
    } : null
  });
});

module.exports = {
  onboardMunicipality
};
