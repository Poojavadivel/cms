// Server/routes/apiAnalytics.js
// API usage analytics and monitoring endpoints

const express = require('express');
const router = express.Router();
const auth = require('../Middleware/Auth');
const { APILog } = require('../Models');
const { analytics } = require('../utils/apiLogger');

// Middleware to check admin role
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    success: false, 
    message: 'Access denied. Admin only.' 
  });
};

/**
 * GET /api/analytics/today
 * Get today's API usage summary
 */
router.get('/today', auth, adminOnly, async (req, res) => {
  try {
    const summary = await analytics.getTodayUsage();
    
    if (!summary) {
      return res.status(500).json({
        success: false,
        message: 'Failed to get today summary'
      });
    }

    return res.json({
      success: true,
      date: new Date().toISOString().split('T')[0],
      summary
    });
  } catch (error) {
    console.error('[API Analytics] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/daily/:days
 * Get daily usage for last N days
 */
router.get('/daily/:days?', auth, adminOnly, async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    
    if (days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: 'Days must be between 1 and 365'
      });
    }

    const dailyUsage = await analytics.getDailyUsage(days);

    return res.json({
      success: true,
      days,
      usage: dailyUsage
    });
  } catch (error) {
    console.error('[API Analytics] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/user/:userId
 * Get API usage for specific user
 */
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    // Users can only see their own data unless they're admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const usage = await analytics.getUserUsage(userId, start, end);

    return res.json({
      success: true,
      userId,
      startDate: start,
      endDate: end,
      usage
    });
  } catch (error) {
    console.error('[API Analytics] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/models
 * Get usage by model
 */
router.get('/models', auth, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const modelUsage = await analytics.getModelUsage(start, end);

    return res.json({
      success: true,
      startDate: start,
      endDate: end,
      models: modelUsage
    });
  } catch (error) {
    console.error('[API Analytics] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/errors
 * Get error statistics
 */
router.get('/errors', auth, adminOnly, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const errorStats = await analytics.getErrorStats(start, end);

    return res.json({
      success: true,
      startDate: start,
      endDate: end,
      errors: errorStats
    });
  } catch (error) {
    console.error('[API Analytics] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/logs
 * Get recent API logs with filters
 */
router.get('/logs', auth, adminOnly, async (req, res) => {
  try {
    const { 
      limit = 100, 
      page = 1, 
      status, 
      userId, 
      endpoint, 
      startDate, 
      endDate 
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (userId) query.userId = userId;
    if (endpoint) query.endpoint = endpoint;
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const logs = await APILog.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select('-requestMessages -responseContent -errorStack') // Exclude large fields
      .lean();

    const total = await APILog.countDocuments(query);

    return res.json({
      success: true,
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('[API Analytics] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/log/:id
 * Get specific log details
 */
router.get('/log/:id', auth, adminOnly, async (req, res) => {
  try {
    const log = await APILog.findById(req.params.id).lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log not found'
      });
    }

    return res.json({
      success: true,
      log
    });
  } catch (error) {
    console.error('[API Analytics] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/summary
 * Get comprehensive summary
 */
router.get('/summary', auth, adminOnly, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum);
    const endDate = new Date();

    // Get all stats in parallel
    const [totalUsage, modelUsage, dailyUsage, errorStats, todayUsage] = await Promise.all([
      APILog.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate, $lte: endDate },
            status: 'success'
          }
        },
        {
          $group: {
            _id: null,
            totalRequests: { $sum: 1 },
            totalTokens: { $sum: '$totalTokens' },
            totalCost: { $sum: '$estimatedCost' },
            avgResponseTime: { $avg: '$responseTimeMs' }
          }
        }
      ]),
      analytics.getModelUsage(startDate, endDate),
      analytics.getDailyUsage(daysNum),
      analytics.getErrorStats(startDate, endDate),
      analytics.getTodayUsage()
    ]);

    return res.json({
      success: true,
      period: {
        days: daysNum,
        startDate,
        endDate
      },
      overall: totalUsage[0] || {
        totalRequests: 0,
        totalTokens: 0,
        totalCost: 0,
        avgResponseTime: 0
      },
      today: todayUsage,
      byModel: modelUsage,
      daily: dailyUsage,
      errors: errorStats
    });
  } catch (error) {
    console.error('[API Analytics] Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;
