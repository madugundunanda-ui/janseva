const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/citizen_grievance').then(async () => {
  const User = require('./src/models/User');
  const Department = require('./src/models/Department');
  const Complaint = require('./src/models/Complaint');
  const Announcement = require('./src/models/Announcement');
  const Feedback = require('./src/models/Feedback');

  // 1. Clean up audit users
  const allUsers = await User.find({}).select('_id email');
  const auditPattern = /^(supervisor_audit_|officer_audit_|citizen_audit_)/;
  const usersToDelete = allUsers.filter(u => auditPattern.test(u.email));
  if (usersToDelete.length > 0) {
    const ids = usersToDelete.map(u => u._id);
    await User.deleteMany({ _id: { $in: ids } });
    console.log('Deleted', usersToDelete.length, 'audit test users');
  } else {
    console.log('No audit test users to clean up');
  }

  // 2. Clean up audit departments
  const deptsDeleted = await Department.deleteMany({
    name: { $in: ['Audit Test Dept', 'Audit Dept Delete', 'Audit Dept Updated'] }
  });
  console.log('Deleted', deptsDeleted.deletedCount, 'audit test departments');

  // 3. Clean up audit complaints
  const complaintsDeleted = await Complaint.deleteMany({
    $or: [
      { title: /Audit test/i },
      { description: /Audit test/i },
      { title: /Road is broken near audit test area/i }
    ]
  });
  console.log('Deleted', complaintsDeleted.deletedCount, 'audit test complaints');

  // 4. Clean up audit announcements
  const announcementsDeleted = await Announcement.deleteMany({
    title: { $in: ['Audit Announcement', 'Updated Audit Announcement'] }
  });
  console.log('Deleted', announcementsDeleted.deletedCount, 'audit test announcements');

  // 5. Clean up audit feedback
  const feedbackDeleted = await Feedback.deleteMany({
    comment: { $in: ['Audit feedback test', 'Confirmed resolution via audit test'] }
  });
  console.log('Deleted', feedbackDeleted.deletedCount, 'audit test feedback');

  process.exit(0);
}).catch(e => {
  console.error('Cleanup failed:', e.message);
  process.exit(1);
});

