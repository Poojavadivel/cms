# Migration Guide - bot.js Refactoring

## Overview
The monolithic `bot.js` file (1,561 lines) has been refactored into a modular architecture with 12 specialized files in the `bot/` folder.

## What Changed

### Before
```javascript
// routes/bot.js (1,561 lines)
const express = require("express");
// ... all code in one file
module.exports = router;
```

### After
```javascript
// routes/bot.js (23 lines)
const botRouter = require('./bot/routes');
module.exports = botRouter;
```

## File Structure

```
Server/routes/
├── bot.js (NEW - entry point, 23 lines)
├── bot.js.backup (BACKUP - original file)
└── bot/
    ├── README.md (NEW - documentation)
    ├── config.js (configuration)
    ├── systemPrompts.js (AI prompts)
    ├── circuitBreaker.js (resilience)
    ├── aiService.js (API calls)
    ├── intentExtractor.js (intent extraction)
    ├── contextBuilder.js (data aggregation)
    ├── entitySearch.js (database search)
    ├── responseGenerator.js (response formatting)
    ├── sessionManager.js (chat persistence)
    ├── chatController.js (orchestration)
    ├── routes.js (API endpoints)
    └── utils.js (utilities)
```

## Import Changes

### Old Way (Monolithic)
```javascript
// Everything was in bot.js
// No imports needed
```

### New Way (Modular)
```javascript
// To use specific functionality
const { extractIntent } = require('./bot/intentExtractor');
const { buildEnhancedContext } = require('./bot/contextBuilder');
const { callGeminiChatWithRetries } = require('./bot/aiService');
```

## API Endpoints (No Changes)

All API endpoints remain exactly the same:

```
POST   /api/bot/chat              - Send chat message
GET    /api/bot/chats             - List all chats
GET    /api/bot/chats/:id         - Get specific chat
DELETE /api/bot/chats/:id         - Archive chat
POST   /api/bot/feedback          - Submit feedback
GET    /api/bot/health            - Health check
GET    /api/bot/metrics           - System metrics
```

**No changes required in frontend or API consumers!**

## Configuration Changes

### Old Way
```javascript
// Config hardcoded in bot.js
const API_KEY = process.env.OPENAI_API_KEY || "default_key";
```

### New Way
```javascript
// Centralized in bot/config.js
const config = require('./bot/config');
console.log(config.API_KEY);
```

## Function Mapping

### Where did my functions go?

| Original Function | New Location | New Import |
|------------------|--------------|------------|
| `makeCid()` | `utils.js` | `const { makeCid } = require('./bot/utils')` |
| `sleep()` | `utils.js` | `const { sleep } = require('./bot/utils')` |
| `safeParseJsonLike()` | `utils.js` | `const { safeParseJsonLike } = require('./bot/utils')` |
| `circuitIsOpen()` | `circuitBreaker.js` | `const { circuitIsOpen } = require('./bot/circuitBreaker')` |
| `callGeminiChatWithRetries()` | `aiService.js` | `const { callGeminiChatWithRetries } = require('./bot/aiService')` |
| `buildEnhancedContext()` | `contextBuilder.js` | `const { buildEnhancedContext } = require('./bot/contextBuilder')` |
| `findOrCreateSessionForUser()` | `sessionManager.js` | `const { findOrCreateSessionForUser } = require('./bot/sessionManager')` |
| `saveAndReturnChat()` | `sessionManager.js` | `const { saveAndReturnChat } = require('./bot/sessionManager')` |
| `extractIntent()` | `intentExtractor.js` | `const { extractIntent } = require('./bot/intentExtractor')` |
| `searchEntities()` | `entitySearch.js` | `const { searchEntities } = require('./bot/entitySearch')` |

## Environment Variables (No Changes)

Same `.env` variables:
```env
OPENAI_API_KEY=your_key
OPENAI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-4
MAX_RETRIES=3
MAX_COMPLETION_TOKENS=1500
CIRCUIT_BREAKER_FAILURES=6
CIRCUIT_BREAKER_COOLDOWN_MS=60000
TEMPERATURE=1
```

## Testing Changes

### Old Way
```bash
# Test entire bot.js
node test/bot.test.js
```

### New Way
```bash
# Test individual modules
npm test bot/config
npm test bot/aiService
npm test bot/intentExtractor

# Or test all
npm test bot
```

## Debugging Changes

### Old Way
```javascript
// Set breakpoint in bot.js line 500
// Hard to find specific logic
```

### New Way
```javascript
// Set breakpoint in specific module
// bot/intentExtractor.js line 50
// Clear separation of concerns
```

## Adding New Features

### Example: Add New Intent

#### Old Way (Monolithic)
1. Scroll to line 800+ in bot.js
2. Add intent to extraction logic
3. Scroll to line 1200+ in bot.js
4. Add context building logic
5. Risk breaking existing code

#### New Way (Modular)
1. Open `intentExtractor.js` - add intent pattern (line 74)
2. Open `contextBuilder.js` - add context logic (line 44)
3. Open `systemPrompts.js` - update prompts if needed
4. Each change is isolated and safe

## Common Tasks

### Task 1: Modify AI Response Format
**File:** `responseGenerator.js`  
**Function:** `generateAIResponse()`  
**Lines:** 81-139

### Task 2: Add New Database Query
**File:** `contextBuilder.js`  
**Function:** `buildDoctorContext()` or create new function  
**Lines:** 44-237

### Task 3: Change Retry Logic
**File:** `aiService.js`  
**Function:** `callGeminiChatWithRetries()`  
**Lines:** 19-153

### Task 4: Add New API Endpoint
**File:** `routes.js`  
**Location:** Bottom of file before `module.exports`  
**Example:**
```javascript
router.get('/my-endpoint', auth, async (req, res) => {
  // Your code here
});
```

### Task 5: Modify System Prompts
**File:** `systemPrompts.js`  
**Object:** `ENTERPRISE_SYSTEM_PROMPTS`  
**Lines:** 6-238

## Rollback Plan

If issues arise, rollback is simple:

```bash
# Restore original bot.js
cp bot.js.backup bot.js

# Remove bot folder (optional)
rm -rf bot/
```

## Performance Impact

**No performance degradation** - in fact, performance may improve due to:
- Better code organization
- Easier to optimize individual modules
- Clearer bottleneck identification

## Benefits Summary

✅ **Maintainability**: 158 lines per file vs 1,561 lines  
✅ **Testability**: Test individual modules  
✅ **Collaboration**: Multiple developers can work simultaneously  
✅ **Debugging**: Faster issue identification  
✅ **Scalability**: Easy to add features  
✅ **Documentation**: Each module documented  
✅ **Code Review**: Smaller, focused PRs  

## Breaking Changes

**None!** All existing functionality preserved.

## Migration Checklist

- [x] Original `bot.js` backed up as `bot.js.backup`
- [x] New `bot.js` entry point created (23 lines)
- [x] All 12 modules created in `bot/` folder
- [x] All functions migrated and tested
- [x] Documentation created (README.md + this guide)
- [x] No API endpoint changes
- [x] No environment variable changes
- [x] No database schema changes

## Support

If you encounter issues:

1. **Check bot/README.md** for module documentation
2. **Review this migration guide** for mapping
3. **Check bot.js.backup** for original implementation
4. **Contact development team** for assistance

## Next Steps

1. ✅ Review the new structure in `bot/` folder
2. ✅ Read `bot/README.md` for detailed documentation
3. ✅ Update your local development environment
4. ✅ Run tests to ensure everything works
5. ✅ Start using modular structure for new features

---

**Migration Date:** 2026-03-04  
**Version:** 2.0.0 (Modularized)  
**Status:** ✅ Complete
