const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');
const NotificationPreference = require('../src/models/NotificationPreference');
const UserLanguagePreference = require('../src/models/UserLanguagePreference');
const Department = require('../src/models/Department');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/citizen_grievance';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🗑️  Cleaning up existing users and preferences...');
    
    // Delete existing users and preferences
    await User.deleteMany({});
    await NotificationPreference.deleteMany({});
    await UserLanguagePreference.deleteMany({});
    // We preserve complaints and departments

    console.log('✅ Deleted all existing users, notification preferences, and language mappings.');

    // Fetch a department to assign to staff
    let department = await Department.findOne();
    if (!department) {
      department = await Department.create({
        name: 'General Administration',
        code: 'GEN-ADMIN',
        description: 'General Administration',
        category: 'Administration'
      });
      console.log('ℹ️ Created default department for staff assignment.');
    }

    const defaultPassword = 'Password@123';
    
    const usersToCreate = [
      // Admins (2)
      {
        name: 'Admin One',
        email: 'admin1@janseva.gov.in',
        password: defaultPassword,
        role: 'admin',
        phone: '9876543201',
      },
      {
        name: 'Admin Two',
        email: 'admin2@janseva.gov.in',
        password: defaultPassword,
        role: 'admin',
        phone: '9876543202',
      },
      
      // Supervisors (2)
      {
        name: 'Supervisor One',
        email: 'super1@works.janseva.gov.in',
        password: defaultPassword,
        role: 'supervisor',
        phone: '9876543203',
        department: department._id,
      },
      {
        name: 'Supervisor Two',
        email: 'super2@works.janseva.gov.in',
        password: defaultPassword,
        role: 'supervisor',
        phone: '9876543204',
        department: department._id,
      },

      // Officers (3)
      {
        name: 'Officer Water',
        email: 'officer1@water.janseva.gov.in',
        password: defaultPassword,
        role: 'officer',
        phone: '9876543205',
        department: department._id,
      },
      {
        name: 'Officer Roads',
        email: 'officer2@roads.janseva.gov.in',
        password: defaultPassword,
        role: 'officer',
        phone: '9876543206',
        department: department._id,
      },
      {
        name: 'Officer Power',
        email: 'officer3@power.janseva.gov.in',
        password: defaultPassword,
        role: 'officer',
        phone: '9876543207',
        department: department._id,
      },

      // Citizens (3)
      {
        name: 'Citizen Amar',
        email: 'amar.citizen@gmail.com',
        password: defaultPassword,
        role: 'citizen',
        phone: '9876543208',
      },
      {
        name: 'Citizen Bhavna',
        email: 'bhavna.citizen@gmail.com',
        password: defaultPassword,
        role: 'citizen',
        phone: '9876543209',
      },
      {
        name: 'Citizen Chetan',
        email: 'chetan.citizen@gmail.com',
        password: defaultPassword,
        role: 'citizen',
        phone: '9876543210',
      }
    ];

    console.log('\n🌱 Seeding 10 fresh users...');
    
    for (const userData of usersToCreate) {
      // Create user (password will be automatically hashed by the pre-save hook in User model)
      const user = await User.create(userData);
      
      // Seed default preferences for the user
      await NotificationPreference.create({ userId: user._id });
      await UserLanguagePreference.create({ userId: user._id });
      
      console.log(`✅ Created ${user.role}: ${user.email}`);
    }

    console.log('\n=======================================');
    console.log('🎉 Seeding Complete!');
    console.log('Total Users Created: 10');
    console.log('Default Password for all: Password@123');
    console.log('=======================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
