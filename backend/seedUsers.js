const mongoose = require('mongoose');
require('dotenv').config();
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/citizen_grievance');
    console.log('Connected to MongoDB');

    const users = [
      {
        name: 'Citizen Nanda',
        email: 'nandakishore.christ@gmail.com',
        password: 'password123',
        role: 'citizen',
        phoneNumber: '9876543210'
      },
      {
        name: 'Admin User',
        email: 'admin@janseva.gov.in',
        password: 'password123',
        role: 'admin',
        phoneNumber: '9876543211'
      }
    ];

    for (const user of users) {
      const existing = await User.findOne({ email: user.email });
      if (!existing) {
        await User.create(user);
        console.log(`Created user: ${user.email} (${user.role})`);
      } else {
        console.log(`User already exists: ${user.email}`);
      }
    }

    console.log('Seeding complete. Default password is: password123');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedUsers();
