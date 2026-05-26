const express = require('express');

const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const complaintRoutes = require('./complaintRoutes');
const departmentRoutes = require('./departmentRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const aiRoutes = require('./aiRoutes');
const announcementRoutes = require('./announcementRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const geoRoutes = require('./geoRoutes');
const adminRoutes = require('./adminRoutes');
const updateRoutes = require('./updateRoutes');
const governanceRoutes = require('./governanceRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/complaints', complaintRoutes);
router.use('/departments', departmentRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/feedbacks', feedbackRoutes);
router.use('/ai', aiRoutes);
router.use('/announcements', announcementRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/geo', geoRoutes);
router.use('/admin', adminRoutes);
router.use('/updates', updateRoutes);
router.use('/governance', governanceRoutes);

module.exports = router;
