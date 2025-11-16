# Gemini Chatbot API Testing Guide

## 🚀 Quick Start

### 1. Start the Server
```bash
cd Server
node Server.js
```

Expected output:
```
✅ Mongoose: Connected to MongoDB successfully
Admin user already exists.
...
🌍 Server is listening on port 3000
```

## 🧪 API Testing Examples

### Test 1: Health Check
```bash
curl http://localhost:3000/api/bot/health
```

Expected Response:
```json
{
  "success": true,
  "message": "bot route healthy",
  "cid": "cid_xxxxx_xxxxx"
}
```

### Test 2: Check Metrics
```bash
curl http://localhost:3000/api/bot/metrics
```

Expected Response:
```json
{
  "success": true,
  "metrics": {
    "calls": 0,
    "successes": 0,
    "failures": 0,
    "emptyResponses": 0,
    "retries": 0,
    "circuitBreakersTripped": 0
  },
  "circuit": {
    "failures": 0,
    "state": "CLOSED",
    "openedAt": null
  }
}
```

### Test 3: Send Chat Message (with authentication)

First, login to get JWT token:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hms.com",
    "password": "doctor123"
  }'
```

Then use the token to chat:
```bash
curl -X POST http://localhost:3000/api/bot/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "message": "Hello, I need help with patient records",
    "metadata": {
      "userRole": "doctor"
    }
  }'
```

Expected Response:
```json
{
  "success": true,
  "reply": "Hello! I'm MedGPT, your medical assistant...",
  "chatId": "uuid-session-id",
  "meta": {
    "latencyMs": 1234
  }
}
```

## 📋 Test Scenarios

### Scenario 1: Doctor Role - Patient Query
```json
{
  "message": "Show me the details of patient John Doe",
  "metadata": {
    "userRole": "doctor"
  }
}
```

### Scenario 2: Admin Role - Analytics Query
```json
{
  "message": "What is the hospital occupancy rate today?",
  "metadata": {
    "userRole": "admin"
  }
}
```

### Scenario 3: Pharmacist Role - Medicine Query
```json
{
  "message": "Check stock level for Paracetamol",
  "metadata": {
    "userRole": "pharmacist"
  }
}
```

### Scenario 4: Pathologist Role - Lab Report Query
```json
{
  "message": "Show recent lab reports for patient code P12345",
  "metadata": {
    "userRole": "pathologist"
  }
}
```

### Scenario 5: Multi-turn Conversation
First message:
```json
{
  "message": "Hello",
  "metadata": {
    "userRole": "doctor"
  }
}
```

Second message (use chatId from first response):
```json
{
  "message": "Can you help me find patient records?",
  "chatId": "uuid-from-first-response",
  "metadata": {
    "userRole": "doctor"
  }
}
```

## 🔍 Monitoring & Debugging

### Check Server Logs
Look for these log patterns:
```
[bot.js] WARNING: Gemini API key missing...  ❌ (if API key not set)
[cid_xxxxx] Calling Gemini API with model: gemini-1.5-flash...  ✅
[cid_xxxxx] Gemini API error: ...  ⚠️ (if error occurs)
[cid_xxxxx] User role: doctor  ℹ️
[cid_xxxxx] Extracted intent: patient_info, entity: John  ℹ️
```

### Monitor Metrics
Periodically check `/api/bot/metrics` to see:
- Total API calls
- Success rate
- Failure count
- Retry attempts
- Circuit breaker status

### Circuit Breaker States
- **CLOSED** (Normal): API calls are allowed ✅
- **OPEN** (Tripped): API calls are blocked after 6 failures ❌
- After 60 seconds, circuit automatically resets to CLOSED

## 🎯 Expected Behavior

### Greeting Detection
Input: `"Hi"`, `"Hello"`, `"Hey"`, `"Thanks"`
- Should return quick greeting response (150-300 tokens)
- No database queries executed

### Intent Extraction
The bot automatically detects:
- `patient_info` - Patient queries
- `staff_info` - Staff/doctor queries
- `appointments` - Appointment-related
- `medicines` - Pharmacy/drug queries
- `lab_reports` - Lab/pathology queries
- `analytics` - Admin analytics
- `unknown` - General queries

### Context Building
Based on user role, the bot fetches:
- **Doctor**: Recent appointments, diagnoses
- **Admin**: Staff counts, metrics
- **Pharmacist**: Medicine inventory
- **Pathologist**: Lab reports

### Error Handling
- API failures trigger automatic retries (up to 3 attempts)
- Exponential backoff between retries
- Circuit breaker opens after 6 consecutive failures
- Fallback responses on persistent errors

## 📊 Performance Benchmarks

### Expected Response Times
- **Greeting**: ~500-1000ms
- **Simple Query**: ~1-2 seconds
- **Complex Query with DB lookup**: ~2-4 seconds
- **Multi-turn Conversation**: ~1-3 seconds

### Token Usage (Approximate)
- **Greeting**: 50-100 tokens
- **Simple Answer**: 200-500 tokens
- **Detailed Medical Response**: 500-1500 tokens
- **Max Response**: 7500 tokens (configurable)

## 🛠️ Troubleshooting

### Issue: "Gemini API key missing"
**Solution**: Verify `.env` file has `Gemi_Api_Key=YOUR_API_KEY`

### Issue: "Circuit breaker is open"
**Solution**: 
1. Wait 60 seconds for automatic reset
2. Check Gemini API quota/limits
3. Review recent error logs

### Issue: Empty responses
**Solution**:
- Bot automatically retries with increased max tokens
- Check if Gemini API is rate limiting
- Verify API key is valid

### Issue: Slow responses
**Solution**:
- Consider using `gemini-1.5-flash` for faster responses
- Reduce `MAX_COMPLETION_TOKENS` for quicker generation
- Check network latency to Google APIs

## 🔐 User Roles & Credentials

For testing different roles, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hms.com | 12332112 |
| Doctor | doctor@hms.com | doctor123 |
| Pharmacist | pharmacist@hms.com | 12332112 |
| Pathologist | pathologist@hms.com | 12332112 |

## ✅ Success Checklist

- [ ] Server starts without errors
- [ ] `/api/bot/health` returns success
- [ ] Login works for all user roles
- [ ] Simple greeting returns response
- [ ] Patient query works (doctor role)
- [ ] Multi-turn conversation maintains context
- [ ] Metrics show successful API calls
- [ ] Circuit breaker remains CLOSED
- [ ] Response times are acceptable
- [ ] No API key errors in logs

## 📞 Support

If you encounter issues:
1. Check server logs for error messages
2. Verify `.env` configuration
3. Test API key with simple curl command
4. Monitor metrics for patterns
5. Review Gemini API console for usage/errors

---
**Happy Testing! 🎉**
