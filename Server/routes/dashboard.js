// Server/routes/dashboard.js
// Dashboard API - fetches REAL stats from the database

const express = require('express');
const router = express.Router();
const auth = require('../Middleware/Auth');

// Import models
const Patient = require('../Models/Patient');
const Appointment = require('../Models/Appointment');
const Staff = require('../Models/Staff');
const Bed = require('../Models/Bed');
const Ward = require('../Models/Ward');
const PharmacyRecord = require('../Models/PharmacyRecord');
const LabReport = require('../Models/LabReport');

/**
 * GET /api/dashboard/stats
 * Returns all dashboard statistics from the database
 */
router.get('/stats', auth, async (req, res) => {
  try {
    // Fetch all stats in parallel for performance
    const [
      totalPatients,
      totalAppointments,
      todayAppointments,
      pendingAppointments,
      completedAppointments,
      totalStaff,
      totalBeds,
      availableBeds,
      occupiedBeds,
      cleaningBeds,
      totalWards,
      totalInvoices,
      totalLabReports,
      pendingLabReports
    ] = await Promise.all([
      // Patients
      Patient.countDocuments({ deleted_at: null }),
      
      // All Appointments
      Appointment.countDocuments({ deleted_at: null }),
      
      // Today's Appointments
      Appointment.countDocuments({
        deleted_at: null,
        date: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      
      // Pending Appointments
      Appointment.countDocuments({ deleted_at: null, status: { $in: ['SCHEDULED', 'PENDING', 'scheduled', 'pending'] } }),
      
      // Completed Appointments
      Appointment.countDocuments({ deleted_at: null, status: { $in: ['COMPLETED', 'completed', 'done'] } }),
      
      // Staff
      Staff.countDocuments({ deleted_at: null }),
      
      // Beds - Total
      Bed.countDocuments({ deleted_at: null }),
      
      // Beds - Available
      Bed.countDocuments({ deleted_at: null, status: 'AVAILABLE' }),
      
      // Beds - Occupied
      Bed.countDocuments({ deleted_at: null, status: 'OCCUPIED' }),
      
      // Beds - Cleaning
      Bed.countDocuments({ deleted_at: null, status: 'CLEANING' }),
      
      // Wards
      Ward.countDocuments({ deleted_at: null }),
      
      // Invoices (Pharmacy Records)
      PharmacyRecord.countDocuments({ deleted_at: null }),
      
      // Lab Reports - Total
      LabReport.countDocuments({ deleted_at: null }),
      
      // Lab Reports - Pending
      LabReport.countDocuments({ deleted_at: null, status: { $in: ['PENDING', 'pending', 'processing'] } })
    ]);

    // Calculate occupancy rate
    const occupancyRate = totalBeds > 0 
      ? parseFloat(((occupiedBeds / totalBeds) * 100).toFixed(1)) 
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        // Core stats
        totalPatients,
        totalAppointments,
        todayAppointments,
        pendingAppointments,
        completedAppointments,
        totalStaff,
        totalInvoices,
        
        // Bed stats
        beds: {
          total: totalBeds,
          available: availableBeds,
          occupied: occupiedBeds,
          cleaning: cleaningBeds,
          occupancyRate
        },
        
        // Ward stats
        totalWards,
        
        // Lab stats
        labs: {
          total: totalLabReports,
          pending: pendingLabReports
        },
        
        // Timestamp
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('GET /api/dashboard/stats error:', err.message);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch dashboard stats', 
      error: err.message 
    });
  }
});

/**
 * GET /api/dashboard/stats/quick
 * Quick stats for the main dashboard cards
 */
router.get('/stats/quick', auth, async (req, res) => {
  try {
    const [patients, appointments, staff, beds] = await Promise.all([
      Patient.countDocuments({ deleted_at: null }),
      Appointment.countDocuments({ deleted_at: null }),
      Staff.countDocuments({ deleted_at: null }),
      Bed.find({ deleted_at: null }).lean()
    ]);

    const available = beds.filter(b => b.status === 'AVAILABLE').length;
    const occupied = beds.filter(b => b.status === 'OCCUPIED').length;
    const cleaning = beds.filter(b => b.status === 'CLEANING').length;

    return res.status(200).json({
      success: true,
      data: {
        patients,
        appointments,
        staff,
        beds: {
          total: beds.length,
          available,
          occupied,
          cleaning,
          occupancyRate: beds.length > 0 ? parseFloat(((occupied / beds.length) * 100).toFixed(1)) : 0
        }
      }
    });
  } catch (err) {
    console.error('GET /api/dashboard/stats/quick error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch quick stats' });
  }
});

/**
 * GET /api/dashboard/recent-activity
 * Get recent activity across the system
 */
router.get('/recent-activity', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent activities from various sources
    const [recentPatients, recentAppointments, recentLabReports] = await Promise.all([
      Patient.find({ deleted_at: null })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('firstName lastName createdAt')
        .lean(),
      
      Appointment.find({ deleted_at: null })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('patientId', 'firstName lastName')
        .select('status date createdAt patientId')
        .lean(),
      
      LabReport.find({ deleted_at: null })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('testName status createdAt')
        .lean()
    ]);

    const activities = [];

    // Add patient registrations
    recentPatients.forEach(p => {
      activities.push({
        type: 'patient_registered',
        title: `New patient: ${p.firstName} ${p.lastName || ''}`.trim(),
        timestamp: p.createdAt,
        icon: '👤'
      });
    });

    // Add appointments
    recentAppointments.forEach(a => {
      const patientName = a.patientId 
        ? `${a.patientId.firstName || ''} ${a.patientId.lastName || ''}`.trim()
        : 'Unknown';
      activities.push({
        type: 'appointment',
        title: `Appointment: ${patientName}`,
        status: a.status,
        timestamp: a.createdAt,
        icon: '📅'
      });
    });

    // Add lab reports
    recentLabReports.forEach(l => {
      activities.push({
        type: 'lab_report',
        title: `Lab: ${l.testName || 'Test'}`,
        status: l.status,
        timestamp: l.createdAt,
        icon: '🧪'
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);

    return res.status(200).json({
      success: true,
      data: limitedActivities
    });
  } catch (err) {
    console.error('GET /api/dashboard/recent-activity error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to fetch recent activity' });
  }
});

module.exports = router;
