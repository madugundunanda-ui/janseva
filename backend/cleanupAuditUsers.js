const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/citizen_grievance').then(async () => {
  const User = require('./src/models/User');
  // Find all audit-related users by email patterns
  const all = await User.find({}).select('_id email role');
  const auditPattern = /^(supervisor_audit_|officer_audit_|citizen_audit_)/;
  const toDelete = all.filter(u => auditPattern.test(u.email));
  if (toDelete.length > 0) {
    const ids = toDelete.map(u => u._id);
    await User.deleteMany({ _id: { $in: ids } });
    console.log('Deleted', toDelete.length, 'audit test users:', toDelete.map(u => u.email));
  } else {
    console.log('No audit test users to clean up');
  }
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
