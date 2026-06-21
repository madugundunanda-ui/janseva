require('dotenv').config();
const mongoose = require('mongoose');
const { Department } = require('./src/models');

const normalize = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const dedupeByName = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = normalize(item.name || '');
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

async function test() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/citizen_grievance');
  console.log('Connected to DB');

  const savedDepartments = await Department.find({}).populate('officers', 'name email role');
  
  console.log('savedDepartments length:', savedDepartments.length);
  if (savedDepartments.length > 0) {
    console.log('Sample tenantId:', savedDepartments[0].tenantId);
  }
  
  const data = dedupeByName(savedDepartments);
  console.log('dedupeByName length:', data.length);
  
  console.log('First 2 data items:', data.slice(0, 2).map(d => d.toJSON()));

  process.exit(0);
}

test();
