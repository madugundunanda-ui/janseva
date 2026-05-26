require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./src/models/Department');
const logger = require('./src/utils/logger');

const departmentsList = [
  "Water Supply", "Electricity", "Roads & Transport", "Sanitation",
  "Waste Management", "Drainage", "Public Health", "Public Safety",
  "Street Lighting", "Sewage", "Parks & Recreation", "Building Maintenance",
  "Traffic Management", "Fire & Emergency Services", "Pollution Control",
  "Animal Control", "Smart City Infrastructure", "Education Services",
  "Welfare Services", "Urban Development", "Housing & Civic Services",
  "Environment Protection", "Disaster Management", "Digital Services",
  "Public Grievance Cell"
];

async function seed() {
  try {
    logger.info('Connecting to MongoDB for department seeding');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jan-sewa');
    logger.info('Seeding departments');
    for (const dept of departmentsList) {
      const code = dept.toUpperCase().replace(/\s+/g, '_').replace(/&/g, 'AND');
      await Department.updateOne(
        { name: dept },
        { $setOnInsert: { name: dept, description: `${dept} Department`, code, status: 'active' } },
        { upsert: true }
      );
    }
    logger.info('Departments seeded successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Error seeding departments', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

seed();
