# Telegram Bot Module - Enterprise Architecture

## Overview
Enterprise-grade Telegram Bot for hospital appointment booking with Gemini AI integration. Refactored from monolithic 1,081-line `telegram.js` into 11 modular components.

**Note:** This module is directly imported in Server.js. All code resides within this telegram/ folder.

## Server.js Integration

```javascript
// In Server.js
app.use('/api/telegram', require('./routes/telegram/routes'));
```

## Architecture

```
telegram/
├── config.js                # Configuration & environment variables
├── botInstance.js           # Telegram Bot initialization
├── geminiService.js         # Gemini AI integration
├── stateManager.js          # Conversation state management
├── appointmentService.js    # Appointment booking logic
├── commandHandlers.js       # Command handlers (/start, /book, etc.)
├── messageHandler.js        # Text message handler
├── callbackHandler.js       # Inline button callback handler
├── botInitializer.js        # Bot initialization orchestrator
├── routes.js                # Express routes (MAIN ENTRY)
├── index.js                 # Centralized exports
├── README.md                # This file
└── telegram.js.backup       # Original 1,081-line file
```

## Module Responsibilities

### 1. **config.js** - Configuration
- Telegram Bot API token
- Gemini AI API key
- Polling configuration
- Conversation timeout settings
- Default appointment duration

### 2. **botInstance.js** - Bot Instance
- Initialize Telegram Bot with polling
- Error handling for polling errors
- Graceful shutdown on SIGINT/SIGTERM
- Dummy bot object fallback if initialization fails

### 3. **geminiService.js** - AI Service
- Gemini AI model initialization
- Natural language date/time parsing
- Handles various date formats (tomorrow, next Monday, etc.)
- Returns structured JSON with date, time, and validation

### 4. **stateManager.js** - State Management
- In-memory conversation state storage
- State CRUD operations (get, reset, update)
- Automatic cleanup of stale conversations (30 min timeout)
- Conversation step tracking

### 5. **appointmentService.js** - Appointments
- Find available doctors
- Check for duplicate appointments
- Create appointments with patient data
- Get user appointment history
- Generate patient codes for new patients

### 6. **commandHandlers.js** - Commands
- `/start` - Welcome message
- `/help` - Help documentation
- `/book` - Start booking flow
- `/myappointments` - View appointments
- `/records` - View medical records
- `/cancel` - Cancel current booking

### 7. **messageHandler.js** - Messages
- Handle conversational text messages
- Process multi-step booking flow
- Validate patient ID/phone
- Validate phone numbers
- Parse date/time with Gemini AI
- Display confirmation summary

### 8. **callbackHandler.js** - Callbacks
- Handle inline keyboard button clicks
- New/existing patient selection
- Blood group selection
- Booking confirmation/cancellation
- Clean up inline keyboards after interaction

### 9. **botInitializer.js** - Initialization
- Register all command handlers
- Register message handlers
- Register callback handlers
- Start cleanup interval
- Orchestrate bot setup

### 10. **routes.js** - Express Routes
- POST /webhook - Webhook endpoint (for webhook mode)
- GET /health - Health check endpoint

### 11. **index.js** - Centralized Exports
- Export all services and handlers
- Single import point for the module

## Features

### 🤖 Conversational AI
- Natural language date/time parsing with Gemini AI
- Multi-step conversation flow
- Context-aware responses
- Automatic state cleanup

### 📅 Appointment Booking
- New patient registration
- Existing patient lookup
- Duplicate prevention
- Doctor assignment
- Automatic appointment codes

### 👤 Patient Management
- Create new patients via Telegram
- Link Telegram users to existing patients
- Store Telegram metadata
- Patient record validation

### 💬 Interactive UI
- Inline keyboard buttons
- Quick replies
- Step-by-step guidance
- Confirmation prompts

## Conversation Flow

```
User: /book
Bot: Are you new or existing patient? [Buttons]
    ↓
User: [New Patient]
Bot: What's your full name?
User: John Doe
    ↓
Bot: What's your phone number?
User: +91 1234567890
    ↓
Bot: What's your blood group? [Buttons]
User: [A+]
    ↓
Bot: What's the reason for visit?
User: Regular checkup
    ↓
Bot: When would you like to schedule?
User: tomorrow at 3pm
    ↓
Bot: [Confirmation summary with buttons]
User: [✅ Confirm]
    ↓
Bot: ✅ Appointment confirmed! [Details]
```

## Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message and main menu |
| `/book` | Start appointment booking |
| `/myappointments` | View your appointments |
| `/records` | View medical records |
| `/cancel` | Cancel current booking |
| `/help` | Show help message |

## API Endpoints

### Webhook
```
POST /webhook
Body: Telegram update object
```

### Health Check
```
GET /health
Response: {
  status: "running",
  bot: "polling" | "stopped",
  conversations: number,
  timestamp: Date
}
```

## Configuration

Environment variables:
```env
Telegram_API=your_telegram_bot_token
Gemi_Api_Key=your_gemini_api_key
```

## Usage Examples

### Import Router
```javascript
// In Server.js
const telegramRouter = require('./routes/telegram/routes');
app.use('/api/telegram', telegramRouter);
```

### Access Bot Instance
```javascript
const { bot } = require('./routes/telegram');
bot.sendMessage(chatId, 'Hello!');
```

### Use Services
```javascript
const { geminiService, appointmentService } = require('./routes/telegram');

// Parse date/time
const result = await geminiService.parseDateTimeWithGemini('tomorrow 3pm');

// Get appointments
const appointments = await appointmentService.getUserAppointments(userId);
```

## State Machine

```
idle
  ↓ /book
waiting_patient_type
  ↓ new/existing
waiting_full_name OR waiting_patient_id
  ↓
waiting_phone OR waiting_patient_name
  ↓
waiting_blood_group
  ↓
waiting_reason
  ↓
waiting_datetime
  ↓
confirming
  ↓ confirm
✅ Appointment created
```

## Error Handling

- Polling connection errors (auto-recover)
- Invalid date/time input (retry with guidance)
- Patient not found (suggest alternatives)
- Duplicate appointments (prevent creation)
- Conversation timeout (cleanup after 30 min)

## Security

- ✅ Telegram user ID validation
- ✅ Phone number format validation
- ✅ Duplicate appointment prevention
- ✅ State isolation per user
- ✅ Automatic cleanup of stale data

## Performance

- In-memory state (fast access)
- Automatic cleanup (prevents memory leaks)
- Lean database queries
- Async/await throughout
- Efficient date parsing with AI

## Statistics

| Metric | Value |
|--------|-------|
| **Original File** | 1,081 lines |
| **New Routes Entry** | 35 lines |
| **Total Modules** | 11 files |
| **Average Module Size** | 98 lines |
| **Largest Module** | commandHandlers.js (176 lines) |
| **Total Documentation** | This README |

## Benefits

✅ **Modular** - Each file has single responsibility  
✅ **Testable** - Independent unit testing  
✅ **Maintainable** - Easy to locate code  
✅ **Scalable** - Simple to add features  
✅ **Documented** - Comprehensive guide  
✅ **Self-contained** - Everything in telegram/ folder  
✅ **AI-Powered** - Natural language understanding  

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Bot not responding | Check Telegram_API in .env |
| Date parsing fails | Check Gemi_Api_Key in .env |
| Conversation stuck | Use /cancel to reset |
| No doctors found | Add doctor users in database |
| Polling errors | Auto-recovers, just wait |

## Support

- **Documentation**: This README
- **Code**: Check specific module for implementation
- **Backup**: telegram.js.backup for reference

---

**Last Updated:** 2026-03-04  
**Version:** 2.0.0 (Modularized)  
**Module Count:** 11 files
