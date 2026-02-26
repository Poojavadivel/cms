# 🚀 Quick Integration Guide

## Step 1: Add Route to Server.js

Open `Server/Server.js` and add this line with your other routes:

```javascript
// Add this line after other route imports
app.use('/api/analytics', require('./routes/apiAnalytics'));
```

Example location in Server.js:
```javascript
// Existing routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/bot', require('./routes/bot'));
app.use('/api/scanner', require('./routes/scanner-enterprise'));

// ADD THIS NEW LINE:
app.use('/api/analytics', require('./routes/apiAnalytics'));
```

---

## Step 2: Test the Logging System

###Start your server:
```bash
cd Server
node Server.js
```

### Test logging with a chat message:
```bash
# Send a test message to chatbot
curl -X POST http://localhost:5000/api/bot/chat \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

### Check if log was created:
```bash
# Get today's usage (requires admin token)
curl http://localhost:5000/api/analytics/today \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

## Step 3: View Analytics Dashboard

### Get Today's Summary:
```
GET http://localhost:5000/api/analytics/today
```

Response:
```json
{
  "success": true,
  "date": "2026-02-21",
  "summary": {
    "totalRequests": 10,
    "totalTokens": 2500,
    "totalCost": 0.05,
    "avgResponseTime": 1650
  }
}
```

---

## Step 4: Update Cost Per Token

Open `Server/utils/apiLogger.js` and update line 68:

```javascript
// Current
costPerToken: options.costPerToken || 0.00002,

// Update to your actual pricing
costPerToken: options.costPerToken || 0.00003,  // Example: $0.00003 per token
```

---

## Step 5: Monitor Usage

### Check user usage:
```javascript
const response = await fetch('/api/analytics/user/USER_ID', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log(`Total cost: $${data.usage.totalCost}`);
```

### Check errors:
```javascript
const response = await fetch('/api/analytics/errors', {
  headers: { 'Authorization': `Bearer ${adminToken}` }
});
const data = await response.json();
console.log('Errors:', data.errors);
```

---

## What Happens Now

### Every API call automatically logs:

1. **Request sent** → Logger starts
2. **Response received** → Log saved to MongoDB
3. **Database entry created** with:
   - ✅ Tokens used
   - ✅ Cost calculated
   - ✅ Response time
   - ✅ User info
   - ✅ Request/response content

### View logs in MongoDB:
```javascript
// Connect to MongoDB
use karur_hms;

// View recent logs
db.apilogs.find().sort({timestamp: -1}).limit(10).pretty();

// View today's total cost
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
      totalCost: { $sum: '$estimatedCost' },
      totalTokens: { $sum: '$totalTokens' },
      totalRequests: { $sum: 1 }
    }
  }
]);
```

---

## Sample Queries

### Find high-cost requests:
```javascript
db.apilogs.find({ estimatedCost: { $gt: 0.01 } }).sort({ estimatedCost: -1 }).limit(10);
```

### Find slow requests (>3 seconds):
```javascript
db.apilogs.find({ responseTimeMs: { $gt: 3000 } }).sort({ responseTimeMs: -1 }).limit(10);
```

### Get user's total usage:
```javascript
db.apilogs.aggregate([
  { $match: { userId: 'user-uuid-123', status: 'success' } },
  { $group: { _id: '$userId', total: { $sum: '$estimatedCost' } } }
]);
```

---

## That's It! 🎉

Your API logging system is now:
- ✅ Tracking every API call
- ✅ Calculating costs automatically
- ✅ Monitoring performance
- ✅ Logging errors
- ✅ Providing analytics endpoints

Check the full documentation: **API_LOGGING_DOCUMENTATION.md**
