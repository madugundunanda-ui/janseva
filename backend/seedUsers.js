require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Department = require('./src/models/Department');
const logger = require('./src/utils/logger');

async function seed() {
  try {
    logger.info('Connecting to MongoDB for user seeding');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/citizen_grievance');

    // Retrieve departments
    const sanitationDept = await Department.findOne({ name: 'Waste Management' });

    if (!sanitationDept) {
      logger.error('Required department (Waste Management) not found. Run seedDepartments.js first.');
      process.exit(1);
    }

    const testUsers = [
      {
        name: 'System Admin',
        email: 'admin@janseva.gov.in',
        password: 'admin123',
        role: 'admin',
        activeStatus: true,
      },
      {
        name: 'Gov Supervisor',
        email: 'supervisor@works.janseva.gov.in',
        password: 'super123',
        role: 'supervisor',
        department: sanitationDept._id, // Match officer department
        employeeId: 'EMP-SUP-01',
        activeStatus: true,
      },
      {
        name: 'Civic Officer',
        email: 'officer@sanitation.janseva.gov.in',
        password: 'off123',
        role: 'officer',
        department: sanitationDept._id,
        employeeId: 'EMP-OFF-01',
        activeStatus: true,
        latitude: 12.9716,
        longitude: 77.5946,
      },
      {
        name: 'John Citizen',
        email: 'citizen@gmail.com',
        password: 'cit123',
        role: 'citizen',
        aadhaarNumber: '123456789012',
        phone: '9876543210',
        address: '123, J.P. Nagar, Ward 4',
        activeStatus: true,
      }
    ];

    logger.info('Upserting test users');
    for (const u of testUsers) {
      const user = await User.findOne({ email: u.email });
      if (user) {
        user.password = u.password;
        user.name = u.name;
        user.role = u.role;
        user.department = u.department || null;
        if (u.employeeId) user.employeeId = u.employeeId;
        if (u.aadhaarNumber) user.aadhaarNumber = u.aadhaarNumber;
        await user.save();
        logger.info(`Updated existing user: ${u.email} (${u.role})`);
      } else {
        await User.create(u);
        logger.info(`Created user: ${u.email} (${u.role})`);
      }
    }

    logger.info('Test users seeded successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Error seeding test users', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

seed();
