require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Department = require('./src/models/Department');
const Complaint = require('./src/models/Complaint');
const Notification = require('./src/models/Notification');
const Feedback = require('./src/models/Feedback');
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
    logger.info('Connecting to MongoDB for DB reset and seeding');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/citizen_grievance');

    logger.info('Dropping test collections (Users, Complaints, Notifications, Feedbacks)...');
    await User.deleteMany({});
    await Complaint.deleteMany({});
    await Notification.deleteMany({});
    await Feedback.deleteMany({});
    
    logger.info('Seeding departments...');
    for (const dept of departmentsList) {
      const code = dept.toUpperCase().replace(/\s+/g, '_').replace(/&/g, 'AND');
      await Department.updateOne(
        { name: dept },
        { $setOnInsert: { name: dept, description: `${dept} Department`, code, status: 'active' } },
        { upsert: true }
      );
    }
    
    const sanitationDept = await Department.findOne({ name: 'Waste Management' });
    const waterDept = await Department.findOne({ name: 'Water Supply' });
    
    const users = [];
    
    // 1 Admin
    users.push({ name: 'System Admin', email: 'admin@janseva.gov.in', password: 'admin123', role: 'admin', activeStatus: true });
    
    // 2 Supervisors
    users.push({ name: 'Sanitation Supervisor', email: 'sup-san@works.janseva.gov.in', password: 'password123', role: 'supervisor', department: sanitationDept._id, employeeId: 'SUP-01', activeStatus: true });
    users.push({ name: 'Water Supervisor', email: 'sup-wat@works.janseva.gov.in', password: 'password123', role: 'supervisor', department: waterDept._id, employeeId: 'SUP-02', activeStatus: true });
    
    // 5 Officers
    users.push({ name: 'Officer San 1', email: 'off-san1@sanitation.janseva.gov.in', password: 'password123', role: 'officer', department: sanitationDept._id, employeeId: 'OFF-01', activeStatus: true });
    users.push({ name: 'Officer San 2', email: 'off-san2@sanitation.janseva.gov.in', password: 'password123', role: 'officer', department: sanitationDept._id, employeeId: 'OFF-02', activeStatus: true });
    users.push({ name: 'Officer San 3', email: 'off-san3@sanitation.janseva.gov.in', password: 'password123', role: 'officer', department: sanitationDept._id, employeeId: 'OFF-03', activeStatus: true });
    users.push({ name: 'Officer Wat 1', email: 'off-wat1@water.janseva.gov.in', password: 'password123', role: 'officer', department: waterDept._id, employeeId: 'OFF-04', activeStatus: true });
    users.push({ name: 'Officer Wat 2', email: 'off-wat2@water.janseva.gov.in', password: 'password123', role: 'officer', department: waterDept._id, employeeId: 'OFF-05', activeStatus: true });
    
    // 3 Citizens
    users.push({ name: 'Citizen One', email: 'citizen1@gmail.com', password: 'password123', role: 'citizen', phone: '9000000001', address: 'Ward 1', activeStatus: true });
    users.push({ name: 'Citizen Two', email: 'citizen2@gmail.com', password: 'password123', role: 'citizen', phone: '9000000002', address: 'Ward 2', activeStatus: true });
    users.push({ name: 'Citizen Three', email: 'citizen3@gmail.com', password: 'password123', role: 'citizen', phone: '9000000003', address: 'Ward 3', activeStatus: true });
    
    for (const u of users) {
      await User.create(u);
      logger.info(`Created user: ${u.email} (${u.role})`);
    }

    logger.info('Database Reset & Seed Complete.');
    process.exit(0);
  } catch (err) {
    logger.error('Error in DB Reset/Seed', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

seed();
