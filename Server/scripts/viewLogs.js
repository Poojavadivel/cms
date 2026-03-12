// Server/scripts/viewLogs.js
// Simple CLI tool for developers to view API logs

require('dotenv').config();
const mongoose = require('mongoose');
const { APILog } = require('../Models');

async function viewLogs() {
  try {
    await mongoose.connect(process.env.MANGODB_URL);
    console.log('✅ Connected to MongoDB\n');

    const args = process.argv.slice(2);
    const command = args[0] || 'recent';

    switch(command) {
      case 'recent':
        await showRecentLogs(args[1] || 10);
        break;
      case 'today':
        await showTodayStats();
        break;
      case 'cost':
        await showCostSummary(args[1] || 7);
        break;
      case 'errors':
        await showErrors(args[1] || 7);
        break;
      case 'user':
        await showUserStats(args[1]);
        break;
      case 'slow':
        await showSlowRequests(args[1] || 3000);
        break;
      default:
        showHelp();
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

async function showRecentLogs(limit) {
  console.log(`📋 Last ${limit} API Logs:\n`);
  
  const logs = await APILog.find()
    .sort({ timestamp: -1 })
    .limit(parseInt(limit))
    .select('timestamp userId userRole endpoint requestType totalTokens estimatedCost responseTimeMs status');

  console.table(logs.map(log => ({
    Time: log.timestamp.toLocaleString(),
    User: log.userRole,
    Endpoint: log.endpoint,
    Type: log.requestType,
    Tokens: log.totalTokens,
    Cost: `$${log.estimatedCost.toFixed(6)}`,
    Time_ms: log.responseTimeMs,
    Status: log.status
  })));
}

async function showTodayStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = await APILog.aggregate([
    { $match: { timestamp: { $gte: today }, status: 'success' } },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        totalTokens: { $sum: '$totalTokens' },
        totalCost: { $sum: '$estimatedCost' },
        avgResponseTime: { $avg: '$responseTimeMs' }
      }
    }
  ]);

  const result = stats[0] || { totalRequests: 0, totalTokens: 0, totalCost: 0, avgResponseTime: 0 };

  console.log('📊 Today\'s Statistics:\n');
  console.log(`  Total Requests: ${result.totalRequests}`);
  console.log(`  Total Tokens: ${result.totalTokens.toLocaleString()}`);
  console.log(`  Total Cost: $${result.totalCost.toFixed(4)}`);
  console.log(`  Avg Response Time: ${Math.round(result.avgResponseTime)}ms`);
  console.log('');
}

async function showCostSummary(days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const stats = await APILog.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        status: 'success'
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$timestamp' },
          month: { $month: '$timestamp' },
          day: { $dayOfMonth: '$timestamp' }
        },
        totalCost: { $sum: '$estimatedCost' },
        totalTokens: { $sum: '$totalTokens' },
        requests: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
  ]);

  console.log(`💰 Cost Summary (Last ${days} days):\n`);
  
  console.table(stats.map(s => ({
    Date: `${s._id.year}-${String(s._id.month).padStart(2, '0')}-${String(s._id.day).padStart(2, '0')}`,
    Requests: s.requests,
    Tokens: s.totalTokens.toLocaleString(),
    Cost: `$${s.totalCost.toFixed(4)}`
  })));

  const total = stats.reduce((sum, s) => sum + s.totalCost, 0);
  console.log(`\n  Total Cost: $${total.toFixed(4)}\n`);
}

async function showErrors(days) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  const errors = await APILog.aggregate([
    {
      $match: {
        timestamp: { $gte: startDate },
        status: 'error'
      }
    },
    {
      $group: {
        _id: '$errorMessage',
        count: { $sum: 1 },
        lastOccurrence: { $max: '$timestamp' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  console.log(`❌ Errors (Last ${days} days):\n`);
  
  if (errors.length === 0) {
    console.log('  ✅ No errors found!\n');
    return;
  }

  console.table(errors.map(e => ({
    Error: e._id?.substring(0, 60),
    Count: e.count,
    Last: e.lastOccurrence.toLocaleString()
  })));
}

async function showUserStats(userId) {
  if (!userId) {
    console.log('❌ Please provide userId: node viewLogs.js user <userId>\n');
    return;
  }

  const stats = await APILog.aggregate([
    { $match: { userId, status: 'success' } },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        totalTokens: { $sum: '$totalTokens' },
        totalCost: { $sum: '$estimatedCost' },
        avgResponseTime: { $avg: '$responseTimeMs' }
      }
    }
  ]);

  const result = stats[0] || { totalRequests: 0, totalTokens: 0, totalCost: 0, avgResponseTime: 0 };

  console.log(`👤 User Statistics (${userId}):\n`);
  console.log(`  Total Requests: ${result.totalRequests}`);
  console.log(`  Total Tokens: ${result.totalTokens.toLocaleString()}`);
  console.log(`  Total Cost: $${result.totalCost.toFixed(4)}`);
  console.log(`  Avg Response Time: ${Math.round(result.avgResponseTime)}ms`);
  console.log('');
}

async function showSlowRequests(minTime) {
  const logs = await APILog.find({
    responseTimeMs: { $gt: parseInt(minTime) },
    timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) }
  })
  .sort({ responseTimeMs: -1 })
  .limit(10)
  .select('timestamp endpoint requestType responseTimeMs totalTokens');

  console.log(`🐌 Slow Requests (>${minTime}ms, last 24h):\n`);
  
  if (logs.length === 0) {
    console.log('  ✅ No slow requests found!\n');
    return;
  }

  console.table(logs.map(log => ({
    Time: log.timestamp.toLocaleString(),
    Endpoint: log.endpoint,
    Type: log.requestType,
    Response_ms: log.responseTimeMs,
    Tokens: log.totalTokens
  })));
}

function showHelp() {
  console.log(`
📊 API Logs Viewer - Usage:

Commands:
  node viewLogs.js recent [limit]       Show recent logs (default: 10)
  node viewLogs.js today                Show today's statistics
  node viewLogs.js cost [days]          Show cost summary (default: 7 days)
  node viewLogs.js errors [days]        Show errors (default: 7 days)
  node viewLogs.js user <userId>        Show user statistics
  node viewLogs.js slow [minTime]       Show slow requests (default: >3000ms)

Examples:
  node viewLogs.js recent 20            Last 20 logs
  node viewLogs.js cost 30              Cost for last 30 days
  node viewLogs.js errors 7             Errors in last 7 days
  node viewLogs.js user user-uuid-123   Stats for specific user
  node viewLogs.js slow 5000            Requests slower than 5 seconds
  `);
}

viewLogs();
