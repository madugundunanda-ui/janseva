const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

const expectedUsers = [
  { email: 'admin1@janseva.gov.in', role: 'admin' },
  { email: 'admin2@janseva.gov.in', role: 'admin' },
  { email: 'super1@works.janseva.gov.in', role: 'supervisor' },
  { email: 'super2@works.janseva.gov.in', role: 'supervisor' },
  { email: 'officer1@water.janseva.gov.in', role: 'officer' },
  { email: 'officer2@roads.janseva.gov.in', role: 'officer' },
  { email: 'officer3@power.janseva.gov.in', role: 'officer' },
  { email: 'amar.citizen@gmail.com', role: 'citizen' },
  { email: 'bhavna.citizen@gmail.com', role: 'citizen' },
  { email: 'chetan.citizen@gmail.com', role: 'citizen' }
];

const defaultPassword = 'Password@123';

const verify = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/citizen_grievance';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for audit verification.\n');

    let allPassed = true;

    for (const expected of expectedUsers) {
      console.log(`Auditing User: ${expected.email}`);
      const user = await User.findOne({ email: expected.email.toLowerCase() }).select('+password');

      if (!user) {
        console.log(`  ✗ User Exists: User not found in database!`);
        allPassed = false;
        continue;
      }
      console.log(`  ✓ User Exists`);

      // Password Valid Check
      let isPasswordValid = false;
      if (user.password) {
        isPasswordValid = await bcrypt.compare(defaultPassword, user.password);
      }
      if (isPasswordValid) {
        console.log(`  ✓ Password Valid`);
      } else {
        console.log(`  ✗ Password Valid: Hash does not match expected password.`);
        allPassed = false;
      }

      // Role Valid Check
      if (user.role === expected.role) {
        console.log(`  ✓ Role Valid`);
      } else {
        console.log(`  ✗ Role Valid: Expected role "${expected.role}", found "${user.role}".`);
        allPassed = false;
      }

      // Account Active Check
      if (user.activeStatus === true) {
        console.log(`  ✓ Account Active`);
      } else {
        console.log(`  ✗ Account Active: User account activeStatus is not true.`);
        allPassed = false;
      }

      // Email Format Check (Role-based Validation Audit)
      let emailFormatValid = false;
      const val = user.email;
      if (user.role === 'admin') {
        emailFormatValid = /^[a-zA-Z0-9._%+-]+@janseva\.gov\.in$/.test(val);
      } else if (user.role === 'officer') {
        emailFormatValid = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+\.janseva\.gov\.in$/.test(val);
      } else if (user.role === 'supervisor') {
        emailFormatValid = /^[a-zA-Z0-9._%+-]+@works\.janseva\.gov\.in$/.test(val);
      } else if (user.role === 'citizen') {
        // Citizen email policy: must end with @gmail.com
        emailFormatValid = /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(val);
      }

      if (emailFormatValid) {
        console.log(`  ✓ Email Format Valid`);
      } else {
        console.log(`  ✗ Email Format Valid: Email does not follow security policy for role ${user.role}.`);
        allPassed = false;
      }
      console.log(''); // spacer
    }

    if (allPassed) {
      console.log('🎉 Seed User Integrity Verification Passed successfully!');
      process.exit(0);
    } else {
      console.log('❌ Seed User Integrity Verification Failed. Please check the audit logs above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('✗ Verification script crashed:', error);
    process.exit(1);
  }
};

verify();
