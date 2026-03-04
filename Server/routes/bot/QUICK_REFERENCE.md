# Bot Module - Quick Reference Card

## 🚀 Quick Start

```javascript
// Option 1: Use the router directly (recommended)
const botRouter = require('./bot/routes');
app.use('/api/bot', botRouter);

// Option 2: Import specific functions
const { extractIntent, buildEnhancedContext } = require('./bot');

// Option 3: Import from specific module
const { callGeminiChatWithRetries } = require('./bot/aiService');
```

## 📂 Module Index

| Module | Purpose | Key Exports |
|--------|---------|-------------|
| **config.js** | Configuration | `API_KEY`, `MODEL_NAME`, `MAX_RETRIES` |
| **systemPrompts.js** | AI Prompts | `getSystemPrompt(role)` |
| **circuitBreaker.js** | Resilience | `circuitIsOpen()`, `metrics` |
| **aiService.js** | API Calls | `callGeminiChatWithRetries()` |
| **intentExtractor.js** | NLP | `extractIntent(message, user, chatId)` |
| **contextBuilder.js** | Data | `buildEnhancedContext(entity, role, intent, userId)` |
| **entitySearch.js** | Search | `searchEntities(entity)` |
| **responseGenerator.js** | Responses | `generateAIResponse(...)` |
| **sessionManager.js** | Persistence | `saveAndReturnChat(...)` |
| **chatController.js** | Orchestration | `handleChatRequest(req, res)` |
| **routes.js** | API Routes | Express Router |
| **utils.js** | Helpers | `makeCid()`, `sleep()`, `safeParseJsonLike()` |

## 🔌 API Endpoints

```
POST   /api/bot/chat              Send chat message
GET    /api/bot/chats             List all chats
GET    /api/bot/chats/:id         Get specific chat
DELETE /api/bot/chats/:id         Archive chat
POST   /api/bot/feedback          Submit feedback
GET    /api/bot/health            Health check
GET    /api/bot/metrics           System metrics
```

## 💡 Common Code Snippets

### Extract Intent
```javascript
const { extractIntent } = require('./bot/intentExtractor');

const extraction = await extractIntent('show me patient John', user, chatId);
// { intent: 'patient_info', entity: 'John', date: null }
```

### Build Context
```javascript
const { buildEnhancedContext } = require('./bot/contextBuilder');

const context = await buildEnhancedContext('John', 'doctor', 'patient_info', userId);
// { role, intent, data: {...}, summary: [...] }
```

### Call AI API
```javascript
const { callGeminiChatWithRetries } = require('./bot/aiService');

const messages = [
  { role: 'system', content: 'You are a helpful assistant' },
  { role: 'user', content: 'Hello!' }
];
const reply = await callGeminiChatWithRetries(messages, 1, 500);
```

### Search Entities
```javascript
const { searchEntities, buildEntityContexts } = require('./bot/entitySearch');

const { patientDoc, staffDoc } = await searchEntities('John Doe');
const { safePatient, safeStaff } = buildEntityContexts(patientDoc, staffDoc);
```

### Generate Response
```javascript
const { generateAIResponse } = require('./bot/responseGenerator');

const reply = await generateAIResponse(
  userMessage,
  fullContext,
  userRole,
  user,
  chatId,
  extraction
);
```

## 🎯 Supported Intents

```
appointments_today    - Today's appointments
appointments          - All appointments
patient_info          - Patient information
patient_history       - Medical history
lab_reports           - Lab test reports
pending_labs          - Pending lab tests
prescriptions         - Prescription history
diagnosis             - Diagnosis information
vitals                - Vital signs
allergies             - Patient allergies
medicines             - Medicine inventory
staff_info            - Staff information
billing               - Billing records
admissions            - Admission records
analytics             - Analytics and metrics
unknown               - Fallback intent
```

## 👥 Supported Roles

```
doctor         - Medical professional
admin          - Hospital administrator
pharmacist     - Pharmacy staff
pathologist    - Laboratory staff
default        - General staff/patient
```

## 🔧 Configuration

### Environment Variables
```env
OPENAI_API_KEY=your_api_key_here
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4
MAX_RETRIES=3
MAX_COMPLETION_TOKENS=1500
MAX_COMPLETION_TOKENS_MAX=7500
RETRY_BACKOFF_BASE_MS=500
CIRCUIT_BREAKER_FAILURES=6
CIRCUIT_BREAKER_COOLDOWN_MS=60000
TEMPERATURE=1
```

## 📊 Monitoring

### Check Health
```bash
curl http://localhost:3000/api/bot/health
```

### Check Metrics
```bash
curl http://localhost:3000/api/bot/metrics
```

### Response
```json
{
  "metrics": {
    "calls": 1250,
    "successes": 1200,
    "failures": 50,
    "successRate": "96.00%",
    "averageLatency": "432.15ms"
  },
  "circuit": {
    "state": "CLOSED",
    "failures": 0,
    "isHealthy": true
  }
}
```

## 🐛 Debugging

### Enable Debug Logs
```javascript
// In any module
console.debug(`[${cid}] Debug message here`);
```

### Check Circuit Breaker Status
```javascript
const { circuitIsOpen, metrics } = require('./bot/circuitBreaker');

if (circuitIsOpen()) {
  console.log('Circuit breaker is OPEN - API calls are blocked');
}
console.log('Metrics:', metrics);
```

## 🧪 Testing

### Unit Test Example
```javascript
const { extractIntent } = require('./bot/intentExtractor');

describe('Intent Extractor', () => {
  it('should extract patient info intent', async () => {
    const result = await extractIntent('tell me about John', user, chatId);
    expect(result.intent).toBe('patient_info');
    expect(result.entity).toBe('John');
  });
});
```

## 📝 Adding Features

### Add New Intent
1. **intentExtractor.js** (line 74) - Add pattern
2. **contextBuilder.js** (line 44) - Add context logic
3. **systemPrompts.js** - Update prompts (optional)

### Add New Endpoint
1. **routes.js** - Add route definition
```javascript
router.get('/my-endpoint', auth, async (req, res) => {
  // Handler code
});
```

### Add New Role
1. **systemPrompts.js** - Add role prompt
2. **contextBuilder.js** - Add context builder
3. Test with role-specific queries

## 🔒 Security

- ✅ All routes protected with `auth` middleware
- ✅ Input validation on all parameters
- ✅ SQL injection prevention (Mongoose)
- ✅ Rate limiting via circuit breaker
- ✅ Error messages sanitized

## 📚 Documentation

- **README.md** - Full architecture documentation
- **MIGRATION.md** - Migration guide from old bot.js
- **QUICK_REFERENCE.md** - This file
- **JSDoc** - Inline function documentation

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Circuit breaker open | Wait 60s or check API status |
| Intent not extracted | Check fallback rules in intentExtractor.js |
| Empty AI response | Increase MAX_COMPLETION_TOKENS |
| Patient not found | Check search query in entitySearch.js |
| Session not saved | Check MongoDB connection |

## 📞 Support

- **Read Docs**: Start with README.md
- **Check Logs**: Enable debug logging
- **Review Code**: Check specific module
- **Contact Team**: Development support

---

**Quick Reference Version:** 1.0  
**Last Updated:** 2026-03-04  
**Module Count:** 12 + index.js
