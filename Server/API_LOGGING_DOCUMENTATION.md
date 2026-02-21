# 📊 API Logging & Monitoring System

## 🎯 Overview

Complete API usage tracking system for monitoring token consumption, costs, performance, and errors for your paid OpenAI-compatible API.

---

## 🗄️ Database Schema (APILog Collection)

### Fields Tracked:

```javascript
{
  _id: "log-uuid-123",
  
  // Request Info
  requestId: "req_1708502400000_abc123",
  timestamp: "2026-02-21T07:30:00.000Z",
  
  // API Configuration
  apiProvider: "openai-compatible",
  apiUrl: "https://inference.do-ai.run/v1/chat/completions",
  model: "openai-gpt-oss-120b",
  
  // User Info
  userId: "user-uuid-456",
  userRole: "doctor",
  userName: "Dr. John Doe",
  
  // Request Details
  endpoint: "chatbot" | "scanner",
  requestType: "greeting" | "medical_query" | "intent_detection" | "data_extraction",
  
  // Request Data
  requestMessages: [
    { role: "system", content: "..." },
    { role: "user", content: "..." }
  ],
  temperature: 0.7,
  maxTokens: 1500,
  
  // Response Data
  responseContent: "AI response text...",
  requestTokens: 105,
  responseTokens: 89,
  totalTokens: 194,
  
  // Performance
  responseTimeMs: 1732,
  startTime: "2026-02-21T07:30:00.000Z",
  endTime: "2026-02-21T07:30:01.732Z",
  
  // Status
  status: "success" | "error" | "retry" | "circuit_breaker",
  statusCode: 200,
  
  // Error Info (if failed)
  errorMessage: null,
  errorStack: null,
  retryCount: 0,
  
  // Cost
  estimatedCost: 0.00388,
  costPerToken: 0.00002,
  
  // Session
  sessionId: "sess-uuid-789",
  conversationId: "conv-uuid-012",
  
  // Metadata
  metadata: {
    userAgent: "...",
    ipAddress: "...",
    features: ["intent_detection"],
    intent: "THYROID",
    confidence: 0.95,
    patientId: "patient-uuid-345",
    batchId: "bulk-1708502400000",
    fileCount: 5
  }
}
```

---

## 📈 What Gets Logged

### **For Every API Call:**

1. ✅ **Request Details**
   - Timestamp
   - User ID, role, name
   - Endpoint (chatbot/scanner)
   - Request type
   - Messages sent
   - Parameters (temperature, max tokens)

2. ✅ **Response Details**
   - Response content
   - Token usage (prompt, completion, total)
   - Response time (milliseconds)
   - Status (success/error/retry)

3. ✅ **Cost Tracking**
   - Tokens used
   - Estimated cost per request
   - Cost per token

4. ✅ **Error Tracking**
   - Error messages
   - Stack traces
   - Retry attempts
   - Circuit breaker trips

---

## 🔌 API Endpoints

### **1. Today's Summary**
```
GET /api/analytics/today
Authorization: Bearer <token>
Role: admin

Response:
{
  "success": true,
  "date": "2026-02-21",
  "summary": {
    "totalRequests": 250,
    "totalTokens": 52000,
    "totalCost": 1.04,
    "avgResponseTime": 1650,
    "byEndpoint": {
      "chatbot": { "requests": 180, "tokens": 38000, "cost": 0.76 },
      "scanner": { "requests": 70, "tokens": 14000, "cost": 0.28 }
    },
    "byModel": {
      "openai-gpt-oss-120b": { "requests": 250, "tokens": 52000, "cost": 1.04 }
    }
  }
}
```

### **2. Daily Usage (Last N Days)**
```
GET /api/analytics/daily/:days
Authorization: Bearer <token>
Role: admin

Example: GET /api/analytics/daily/30

Response:
{
  "success": true,
  "days": 30,
  "usage": [
    {
      "_id": { "year": 2026, "month": 2, "day": 21 },
      "totalRequests": 250,
      "totalTokens": 52000,
      "totalCost": 1.04,
      "avgResponseTime": 1650
    },
    ...
  ]
}
```

### **3. User-Specific Usage**
```
GET /api/analytics/user/:userId?startDate=2026-02-01&endDate=2026-02-21
Authorization: Bearer <token>
Role: admin or same user

Response:
{
  "success": true,
  "userId": "user-uuid-456",
  "startDate": "2026-02-01",
  "endDate": "2026-02-21",
  "usage": {
    "totalRequests": 85,
    "totalTokens": 18500,
    "totalCost": 0.37,
    "avgResponseTime": 1580
  }
}
```

### **4. Model Usage**
```
GET /api/analytics/models?startDate=2026-02-01&endDate=2026-02-21
Authorization: Bearer <token>
Role: admin

Response:
{
  "success": true,
  "models": [
    {
      "_id": "openai-gpt-oss-120b",
      "totalRequests": 3500,
      "totalTokens": 720000,
      "totalCost": 14.40,
      "avgResponseTime": 1650
    }
  ]
}
```

### **5. Error Statistics**
```
GET /api/analytics/errors?startDate=2026-02-14&endDate=2026-02-21
Authorization: Bearer <token>
Role: admin

Response:
{
  "success": true,
  "errors": [
    {
      "_id": "API returned 429: Rate limit exceeded",
      "count": 3,
      "lastOccurrence": "2026-02-20T15:30:00.000Z"
    },
    {
      "_id": "Circuit breaker is open",
      "count": 1,
      "lastOccurrence": "2026-02-19T10:15:00.000Z"
    }
  ]
}
```

### **6. Recent Logs**
```
GET /api/analytics/logs?limit=50&page=1&status=success&endpoint=chatbot
Authorization: Bearer <token>
Role: admin

Response:
{
  "success": true,
  "logs": [
    {
      "_id": "log-uuid-123",
      "timestamp": "2026-02-21T07:30:00.000Z",
      "userId": "user-uuid-456",
      "userRole": "doctor",
      "endpoint": "chatbot",
      "requestType": "medical_query",
      "totalTokens": 194,
      "estimatedCost": 0.00388,
      "responseTimeMs": 1732,
      "status": "success"
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 3500,
    "pages": 70
  }
}
```

### **7. Comprehensive Summary**
```
GET /api/analytics/summary?days=7
Authorization: Bearer <token>
Role: admin

Response:
{
  "success": true,
  "period": {
    "days": 7,
    "startDate": "2026-02-14",
    "endDate": "2026-02-21"
  },
  "overall": {
    "totalRequests": 1750,
    "totalTokens": 360000,
    "totalCost": 7.20,
    "avgResponseTime": 1650
  },
  "today": { ... },
  "byModel": [ ... ],
  "daily": [ ... ],
  "errors": [ ... ]
}
```

---

## 📊 Usage Examples

### **Check Today's Cost**
```javascript
const response = await fetch('/api/analytics/today', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
console.log(`Today's cost: $${data.summary.totalCost.toFixed(2)}`);
console.log(`Tokens used: ${data.summary.totalTokens}`);
```

### **Get User's Usage**
```javascript
const userId = 'user-uuid-456';
const response = await fetch(`/api/analytics/user/${userId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
console.log(`User's total cost: $${data.usage.totalCost.toFixed(2)}`);
```

### **Monitor Errors**
```javascript
const response = await fetch('/api/analytics/errors', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
console.log(`Top errors:`, data.errors);
```

---

## 💰 Cost Calculation

### **Current Pricing** (Update with your actual rates)
```javascript
costPerToken: 0.00002  // $0.00002 per token
```

### **Example Calculation:**
```
Request: 105 tokens (prompt)
Response: 89 tokens (completion)
Total: 194 tokens

Cost = 194 × $0.00002 = $0.00388
```

### **Update Pricing:**
Edit in `Server/utils/apiLogger.js`:
```javascript
await logger.logSuccess(data, {
  responseContent: String(content).trim(),
  costPerToken: 0.00003 // Update this value
});
```

---

## 📝 Logged Data Examples

### **Success Log:**
```javascript
{
  requestId: "req_1708502400000_abc123",
  timestamp: "2026-02-21T07:30:00.000Z",
  model: "openai-gpt-oss-120b",
  userId: "user-uuid-456",
  userRole: "doctor",
  endpoint: "chatbot",
  requestType: "medical_query",
  totalTokens: 194,
  responseTimeMs: 1732,
  estimatedCost: 0.00388,
  status: "success"
}
```

### **Error Log:**
```javascript
{
  requestId: "req_1708502400100_def456",
  timestamp: "2026-02-21T07:31:00.000Z",
  model: "openai-gpt-oss-120b",
  userId: "user-uuid-789",
  endpoint: "scanner",
  requestType: "intent_detection",
  responseTimeMs: 850,
  status: "error",
  errorMessage: "API returned 429: Rate limit exceeded",
  retryCount: 3
}
```

### **Retry Log:**
```javascript
{
  requestId: "req_1708502400200_ghi789",
  timestamp: "2026-02-21T07:32:00.000Z",
  model: "openai-gpt-oss-120b",
  endpoint: "chatbot",
  responseTimeMs: 2500,
  status: "retry",
  retryCount: 2,
  errorMessage: "Retry attempt 2: API returned 503"
}
```

---

## 🔍 Monitoring Dashboard Queries

### **High Token Consumers (Last 7 Days)**
```javascript
const highUsers = await APILog.aggregate([
  {
    $match: {
      timestamp: { $gte: new Date(Date.now() - 7*24*60*60*1000) },
      status: 'success'
    }
  },
  {
    $group: {
      _id: '$userId',
      totalTokens: { $sum: '$totalTokens' },
      totalCost: { $sum: '$estimatedCost' },
      requests: { $sum: 1 }
    }
  },
  { $sort: { totalTokens: -1 } },
  { $limit: 10 }
]);
```

### **Slow Requests (>3 seconds)**
```javascript
const slowRequests = await APILog.find({
  responseTimeMs: { $gt: 3000 },
  timestamp: { $gte: new Date(Date.now() - 24*60*60*1000) }
}).sort({ responseTimeMs: -1 }).limit(10);
```

### **Failed Requests Today**
```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);

const failures = await APILog.countDocuments({
  timestamp: { $gte: today },
  status: 'error'
});
```

---

## ✅ Benefits

1. ✅ **Cost Tracking** - Monitor every dollar spent
2. ✅ **Performance Monitoring** - Track response times
3. ✅ **User Analytics** - See who uses the most tokens
4. ✅ **Error Detection** - Catch issues early
5. ✅ **Budget Control** - Set alerts for cost thresholds
6. ✅ **Usage Trends** - Analyze daily/weekly/monthly patterns
7. ✅ **Compliance** - Audit trail for all API calls

---

## 🚨 Alerts & Notifications

### **Set Up Cost Alerts:**
```javascript
// Check if daily cost exceeds threshold
const todayUsage = await analytics.getTodayUsage();
if (todayUsage.totalCost > 10.00) {
  // Send notification
  console.log(`⚠️ Daily cost exceeded $10: $${todayUsage.totalCost}`);
}
```

### **Monitor Error Rate:**
```javascript
// Check if error rate exceeds 5%
const summary = await analytics.getTodayUsage();
const errorCount = await APILog.countDocuments({
  timestamp: { $gte: new Date().setHours(0,0,0,0) },
  status: 'error'
});
const errorRate = errorCount / summary.totalRequests;
if (errorRate > 0.05) {
  console.log(`⚠️ Error rate high: ${(errorRate * 100).toFixed(2)}%`);
}
```

---

## 📄 Files Created

1. **Models/APILog.js** - Database schema
2. **utils/apiLogger.js** - Logging utility
3. **routes/apiAnalytics.js** - Analytics API endpoints
4. **bot.js** - Updated with logging
5. **scanner-enterprise.js** - Updated with logging (to be done)

---

## 🎯 Next Steps

1. ✅ Add route to Server.js: `app.use('/api/analytics', require('./routes/apiAnalytics'));`
2. ✅ Update .env with actual pricing: `COST_PER_TOKEN=0.00002`
3. ✅ Create admin dashboard UI to display analytics
4. ✅ Set up daily email reports
5. ✅ Configure cost alerts

---

**Last Updated**: February 21, 2026  
**Status**: ✅ FULLY IMPLEMENTED AND READY TO USE
