# 📊 Developer Quick Reference - API Logs

## 🚀 **Quick Commands (Backend Only)**

### **Method 1: CLI Tool (Easiest)**

```bash
cd Server

# View last 10 logs
node scripts/viewLogs.js recent

# View last 50 logs
node scripts/viewLogs.js recent 50

# Today's stats
node scripts/viewLogs.js today

# Cost for last 30 days
node scripts/viewLogs.js cost 30

# Show errors
node scripts/viewLogs.js errors

# User stats
node scripts/viewLogs.js user user-uuid-123

# Slow requests (>3 seconds)
node scripts/viewLogs.js slow 3000

# Help
node scripts/viewLogs.js
```

---

### **Method 2: MongoDB Shell**

```bash
mongosh "your-connection-string"

use karur_hms

# Today's total
db.apilogs.aggregate([
  { $match: { 
      timestamp: { $gte: new Date(new Date().setHours(0,0,0,0)) },
      status: 'success'
  }},
  { $group: { 
      _id: null, 
      cost: { $sum: '$estimatedCost' },
      tokens: { $sum: '$totalTokens' },
      requests: { $sum: 1 }
  }}
])

# Recent 10
db.apilogs.find().sort({timestamp: -1}).limit(10).pretty()

# Errors only
db.apilogs.find({ status: 'error' }).sort({timestamp: -1}).limit(10)

# High cost requests
db.apilogs.find({ estimatedCost: { $gt: 0.01 } }).sort({estimatedCost: -1})
```

---

### **Method 3: Postman/Thunder Client**

```
GET http://localhost:5000/api/analytics/today
GET http://localhost:5000/api/analytics/daily/30
GET http://localhost:5000/api/analytics/logs?limit=100
GET http://localhost:5000/api/analytics/errors

Headers:
  Authorization: Bearer ADMIN_TOKEN
```

---

## 📋 **What Gets Logged**

Every API call logs:
- ✅ **Tokens**: Prompt + Completion + Total
- ✅ **Cost**: Calculated automatically
- ✅ **Time**: Response time in milliseconds
- ✅ **User**: ID, role, name
- ✅ **Status**: Success/error/retry
- ✅ **Endpoint**: Chatbot or scanner
- ✅ **Request/Response**: Full content

---

## 💰 **Cost Monitoring**

```bash
# Today's cost
node scripts/viewLogs.js today

# Last 30 days cost breakdown
node scripts/viewLogs.js cost 30

# Find expensive requests
db.apilogs.find({ estimatedCost: { $gt: 0.01 } }).sort({estimatedCost: -1}).limit(10)
```

---

## 🔍 **Common Queries**

### **Total spent this month:**
```javascript
db.apilogs.aggregate([
  {
    $match: {
      timestamp: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      },
      status: 'success'
    }
  },
  {
    $group: {
      _id: null,
      totalCost: { $sum: '$estimatedCost' }
    }
  }
])
```

### **Top 10 users by cost:**
```javascript
db.apilogs.aggregate([
  { $match: { status: 'success' } },
  { $group: { 
      _id: '$userId', 
      total: { $sum: '$estimatedCost' },
      tokens: { $sum: '$totalTokens' }
  }},
  { $sort: { total: -1 } },
  { $limit: 10 }
])
```

### **Average response time today:**
```javascript
db.apilogs.aggregate([
  {
    $match: {
      timestamp: { $gte: new Date(new Date().setHours(0,0,0,0)) },
      status: 'success'
    }
  },
  {
    $group: {
      _id: null,
      avgTime: { $avg: '$responseTimeMs' }
    }
  }
])
```

---

## 🎯 **No Frontend Needed!**

All monitoring is done via:
- ✅ MongoDB Compass (GUI)
- ✅ CLI tool (Terminal)
- ✅ MongoDB shell (Command line)
- ✅ API endpoints (Postman/curl)

**No UI required** - Everything accessible from backend! 🚀

---

## 📂 **Files Location**

- **Logs**: MongoDB `apilogs` collection
- **CLI Tool**: `Server/scripts/viewLogs.js`
- **API Routes**: `Server/routes/apiAnalytics.js`
- **Model**: `Server/Models/APILog.js`

---

## ⚡ **Quick Examples**

```bash
# Check if logging is working
node scripts/viewLogs.js recent 5

# Monitor today's spending
node scripts/viewLogs.js today

# Check for errors
node scripts/viewLogs.js errors

# Weekly cost report
node scripts/viewLogs.js cost 7
```

---

**That's it!** No frontend, everything in backend for developers only! ✅
