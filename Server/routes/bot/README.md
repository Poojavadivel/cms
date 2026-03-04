# Bot Module - Enterprise Architecture

## Overview
This folder contains the complete modularized chatbot system, fully self-contained with all code, backups, and documentation.

**Note:** This module is directly imported in Server.js - there is no bot.js file in the routes/ folder anymore. All code resides within this bot/ folder.

## Server.js Integration

```javascript
// In Server.js (line 39)
app.use('/api/bot', require('./routes/bot/routes'));
```

The bot module is self-contained - everything is in this folder!

## Architecture

```
bot/
├── config.js                 # Configuration & environment variables
├── systemPrompts.js         # Role-based AI system prompts
├── circuitBreaker.js        # Circuit breaker pattern & metrics
├── aiService.js             # OpenAI API integration with retries
├── intentExtractor.js       # Intent & entity extraction
├── contextBuilder.js        # Enhanced context building
├── entitySearch.js          # Database search for entities
├── responseGenerator.js     # AI response generation
├── sessionManager.js        # Chat session management
├── chatController.js        # Main chat orchestration
├── routes.js                # API route definitions
├── utils.js                 # Utility functions
└── README.md                # This file
```

## Module Responsibilities

### 1. **config.js** (54 lines)
- Centralizes all environment variables
- API configuration (URL, key, model)
- Retry and timeout settings
- Circuit breaker parameters
- Default response templates

**Key Exports:**
- `API_KEY`, `API_URL`, `MODEL_NAME`
- `MAX_RETRIES`, `DEFAULT_MAX_COMPLETION_TOKENS`
- `CIRCUIT_BREAKER_FAILURES`, `CIRCUIT_BREAKER_COOLDOWN_MS`

### 2. **systemPrompts.js** (241 lines)
- Role-based system prompts for AI
- Supports: doctor, admin, pharmacist, pathologist, default
- Context-aware response formatting
- Medical domain expertise

**Key Exports:**
- `getSystemPrompt(role)` - Get prompt for specific role
- `ENTERPRISE_SYSTEM_PROMPTS` - All prompts object

### 3. **circuitBreaker.js** (71 lines)
- Implements circuit breaker pattern
- Prevents cascading failures
- Tracks comprehensive metrics
- Auto-recovery mechanism

**Key Exports:**
- `circuitIsOpen()` - Check if circuit is open
- `recordFailure()` - Record API failure
- `recordSuccess()` - Record API success
- `metrics` - Performance metrics object

### 4. **aiService.js** (157 lines)
- Core OpenAI API integration
- Retry logic with exponential backoff
- Circuit breaker integration
- API logging and analytics
- Token management

**Key Exports:**
- `callGeminiChatWithRetries(messages, temperature, maxTokens, loggerOptions)`

### 5. **intentExtractor.js** (138 lines)
- AI-powered intent extraction
- Fallback rule-based extraction
- Entity recognition
- Date extraction

**Key Exports:**
- `extractIntent(message, user, chatId)` - Extract intent from message

**Supported Intents:**
- `appointments_today`, `appointments`, `patient_info`, `patient_history`
- `lab_reports`, `pending_labs`, `prescriptions`, `diagnosis`
- `vitals`, `allergies`, `medicines`, `staff_info`
- `billing`, `admissions`, `analytics`

### 6. **contextBuilder.js** (342 lines)
- Role-specific context building
- Database query orchestration
- Aggregates data from multiple models
- Supports all user roles

**Key Exports:**
- `buildEnhancedContext(entity, userRole, intent, userId)`

**Data Sources:**
- Appointments, Patients, Lab Reports, Prescriptions
- Medical History, Billing, Staff, Medicines

### 7. **entitySearch.js** (121 lines)
- Multi-field patient search
- Staff/user search
- Fuzzy matching support
- Name splitting logic

**Key Exports:**
- `searchEntities(entity)` - Search patients and staff
- `buildEntityContexts(patientDoc, staffDoc)` - Build safe contexts

**Search Fields:**
- Patient: ID, firstName, lastName, email, phone, telegramUsername
- Staff: firstName, lastName, email, phone, metadata.name

### 8. **responseGenerator.js** (145 lines)
- Greeting response handler
- No-data response formatting
- AI response generation with context
- Structured response formatting

**Key Exports:**
- `generateGreetingResponse(message)` - Handle greetings
- `generateNoDataResponse(extraction)` - No data found response
- `generateAIResponse(userMessage, fullContext, userRole, user, chatId, extraction)`

### 9. **sessionManager.js** (124 lines)
- Bot session lifecycle management
- Chat history persistence
- Message appending
- Session creation/retrieval

**Key Exports:**
- `findOrCreateSessionForUser(userId, sessionId)`
- `appendMessagesToSession(botDoc, sessionId, newMessages)`
- `saveAndReturnChat(cid, tStart, sessionId, user, userMessage, botReply, res)`

### 10. **chatController.js** (121 lines)
- Main orchestration logic
- Request validation
- Error handling
- Response coordination

**Key Exports:**
- `handleChatRequest(req, res)` - Main chat handler

**Flow:**
1. Validate user and message
2. Check for greetings
3. Extract intent
4. Build context
5. Search entities
6. Generate response
7. Save and return

### 11. **routes.js** (243 lines)
- Express router configuration
- All API endpoints
- Authentication middleware
- Error handling

**Endpoints:**
- `GET /api/bot/health` - Health check
- `GET /api/bot/metrics` - System metrics
- `POST /api/bot/chat` - Main chat endpoint
- `GET /api/bot/chats` - List chat sessions
- `GET /api/bot/chats/:id` - Get specific chat
- `DELETE /api/bot/chats/:id` - Archive chat
- `POST /api/bot/feedback` - Record feedback

### 12. **utils.js** (136 lines)
- Shared utility functions
- JSON parsing helpers
- Context builders
- ID generators

**Key Exports:**
- `makeCid()` - Generate conversation ID
- `sleep(ms)` - Async sleep
- `safeParseJsonLike(text)` - Safe JSON parsing
- `buildPatientContext(patient)` - Build patient context
- `buildStaffContext(staff)` - Build staff context

## Data Flow

```
User Request
    ↓
routes.js (Authentication & Routing)
    ↓
chatController.js (Orchestration)
    ↓
    ├→ intentExtractor.js (Intent Extraction)
    ├→ contextBuilder.js (Context Building)
    ├→ entitySearch.js (Database Search)
    ├→ responseGenerator.js (Response Generation)
    │       ↓
    │   aiService.js (API Call)
    │       ↓
    │   circuitBreaker.js (Health Check)
    ↓
sessionManager.js (Save Chat)
    ↓
Response to User
```

## Error Handling

1. **Circuit Breaker**: Prevents API overload
2. **Retry Logic**: Exponential backoff for transient errors
3. **Fallback Intent**: Rule-based when AI fails
4. **Graceful Degradation**: Useful error messages to users

## Performance Optimizations

1. **Lazy Loading**: Models loaded only when needed
2. **Lean Queries**: MongoDB lean() for better performance
3. **Pagination**: Limited results for large datasets
4. **Caching**: Circuit breaker and metrics in memory
5. **Connection Pooling**: Mongoose connection reuse

## Security Features

1. **Authentication**: All routes protected with auth middleware
2. **Input Validation**: Message and parameter validation
3. **SQL Injection Prevention**: Mongoose parameterized queries
4. **XSS Protection**: JSON responses, no HTML rendering
5. **Rate Limiting**: Circuit breaker prevents abuse

## Monitoring & Analytics

- Request/response logging via `apiLogger`
- Circuit breaker metrics tracking
- Success/failure rates
- Average latency monitoring
- Retry statistics

## Configuration

Environment variables (set in `.env`):
```env
OPENAI_API_KEY=your_api_key
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

## Adding New Features

### Add a New Intent
1. Update `intentExtractor.js` fallback patterns
2. Add handling in `contextBuilder.js` for the role
3. Update system prompts in `systemPrompts.js` if needed

### Add a New Role
1. Add system prompt in `systemPrompts.js`
2. Add context builder function in `contextBuilder.js`
3. Test with role-specific queries

### Add a New Route
1. Add route definition in `routes.js`
2. Create handler function (or add to `chatController.js`)
3. Add authentication if needed

## Testing

Run tests with:
```bash
npm test
```

Test individual modules:
```bash
node -e "const { extractIntent } = require('./intentExtractor'); extractIntent('show me patient John').then(console.log)"
```

## Maintenance

- **Code Quality**: ESLint configured
- **Documentation**: JSDoc comments on all functions
- **Version Control**: Git history preserved
- **Backup**: Original `bot.js` saved as `bot.js.backup`

## Migration Notes

Original `bot.js` was **1561 lines** - now split into **12 modules** averaging **142 lines** each.

Benefits:
- ✅ Easier to test individual components
- ✅ Clearer separation of concerns
- ✅ Faster onboarding for new developers
- ✅ Reduced merge conflicts
- ✅ Better code reusability
- ✅ Simplified debugging

## Support

For issues or questions, contact the development team.

---

**Last Updated:** 2026-03-04
**Version:** 2.0.0 (Modularized)
**Maintained by:** HMS Development Team
