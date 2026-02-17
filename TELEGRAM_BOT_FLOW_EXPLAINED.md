# 🤖 Telegram Bot - Complete Flow Explanation

## 📱 **Flow 1: User Starts Bot & Books Appointment**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER OPENS TELEGRAM BOT                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Sends /start command                                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: routes/telegram.js                                              │
│  • bot.onText(/\/start/) handler triggered                               │
│  • resetState(chatId) - clears any previous conversation                 │
│  • Sends welcome message with menu:                                      │
│    - /book - Book appointment                                            │
│    - /reports - View medical reports                                     │
│    - /help - Get help                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Sends /book command                                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: bot.onText(/\/book/) handler                                    │
│  Lines 440-465                                                           │
│                                                                           │
│  Step 1: Store user info in state                                        │
│    state.username = msg.from.username                                    │
│    state.firstName = msg.from.first_name                                 │
│    state.step = 'waiting_patient_type'                                   │
│                                                                           │
│  Step 2: Send inline keyboard with 2 buttons:                            │
│    🆕 New Patient                                                         │
│    👤 Existing Patient                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌─────────────────────┐       ┌─────────────────────┐
        │  USER: Clicks        │       │  USER: Clicks       │
        │  "New Patient"       │       │  "Existing Patient" │
        └─────────────────────┘       └─────────────────────┘
                    │                               │
                    ▼                               ▼
```

---

## 🆕 **Flow 2A: New Patient Booking Journey**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Clicked "New Patient" button                                      │
│  callback_data: 'patient_type_new'                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: bot.on('callback_query') handler                                │
│  Lines 875-895                                                           │
│                                                                           │
│  • Detects data.startsWith('patient_type_')                              │
│  • Sets state.step = 'waiting_full_name'                                 │
│  • Asks: "Please provide your *full name*:"                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Types "John Doe"                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: bot.on('message') handler - switch(state.step)                  │
│  Lines 467-773                                                           │
│                                                                           │
│  Case: 'waiting_full_name' (Lines 582-590)                               │
│    • state.data.fullName = "John Doe"                                    │
│    • state.data.isExisting = false                                       │
│    • state.step = 'waiting_phone'                                        │
│    • Asks: "Now, please provide your *phone number*:"                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Types "+91-9876543210"                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: Case 'waiting_phone' (Lines 592-620)                            │
│                                                                           │
│  • Validates phone (minimum 10 digits)                                   │
│  • If invalid → asks again                                               │
│  • If valid:                                                             │
│      state.data.phone = "+91-9876543210"                                 │
│      state.step = 'waiting_blood_group'                                  │
│  • Sends inline keyboard with blood group options:                       │
│      [A+] [A-] [B+]                                                      │
│      [B-] [O+] [O-]                                                      │
│      [AB+] [AB-]                                                         │
│      [Don't Know]                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Clicks "O+" button (callback_data: 'blood_O+')                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: callback_query handler (Lines 911-925)                          │
│                                                                           │
│  • Detects data.startsWith('blood_')                                     │
│  • state.data.bloodGroup = "O+"                                          │
│  • state.step = 'waiting_address'                                        │
│  • Asks: "Great! Now, please provide your *address*:"                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Types "123 Main St, Chennai"                                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: Case 'waiting_address' (Lines 622-630)                          │
│  • state.data.address = "123 Main St, Chennai"                          │
│  • state.step = 'waiting_emergency_name'                                 │
│  • Asks: "Please provide your *emergency contact name*:"                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Types "Jane Doe"                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: Case 'waiting_emergency_name' (Lines 632-640)                   │
│  • state.data.emergencyContactName = "Jane Doe"                          │
│  • state.step = 'waiting_emergency_phone'                                │
│  • Asks: "Please provide the *emergency contact phone number*:"          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Types "+91-9876543211"                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: Case 'waiting_emergency_phone' (Lines 642-658)                  │
│  • Validates emergency phone                                             │
│  • state.data.emergencyPhone = "+91-9876543211"                          │
│  • state.step = 'waiting_reason'                                         │
│  • Asks: "What is the *reason for your visit*?"                          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Types "Stomach pain"                                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: Case 'waiting_reason' (Lines 660-673)                           │
│  • state.data.reason = "Stomach pain"                                    │
│  • state.step = 'waiting_datetime'                                       │
│  • Asks: "When would you like to schedule your appointment?"             │
│  • Shows examples:                                                       │
│      "tomorrow at 3pm"                                                   │
│      "next Monday 10:30 AM"                                              │
│      "December 25th at 2pm"                                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Types "tomorrow at 3pm"                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: Case 'waiting_datetime' (Lines 675-720)                         │
│                                                                           │
│  Step 1: Send "Understanding your request..." message                    │
│                                                                           │
│  Step 2: Call parseDateTimeWithGemini(userMessage)                       │
│          Lines 54-108                                                    │
│                                                                           │
│    ┌────────────────────────────────────────────────────────────┐       │
│    │  GEMINI AI PROCESSING                                       │       │
│    │                                                              │       │
│    │  Input Prompt:                                              │       │
│    │  "You are a date/time parser. Extract appointment          │       │
│    │   date and time from: 'tomorrow at 3pm'                    │       │
│    │   Current date: Saturday, February 15, 2026                │       │
│    │   Current time: 5:00 PM                                    │       │
│    │                                                              │       │
│    │   Return JSON: { date, time, success }"                    │       │
│    │                                                              │       │
│    │  Gemini Response:                                           │       │
│    │  {                                                          │       │
│    │    "date": "2026-02-16",                                   │       │
│    │    "time": "15:00",                                        │       │
│    │    "success": true                                         │       │
│    │  }                                                          │       │
│    └────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  Step 3: Parse JSON response                                             │
│    • parsed.date = "2026-02-16"                                          │
│    • parsed.time = "15:00"                                               │
│                                                                           │
│  Step 4: Validate date is not in the past                                │
│                                                                           │
│  Step 5: Store in state                                                  │
│    • state.data.dateTime = Date object (2026-02-16T15:00:00)            │
│    • state.data.dateStr = "Sunday, February 16, 2026"                   │
│    • state.data.timeStr = "03:00 PM"                                     │
│    • state.step = 'waiting_confirmation'                                 │
│                                                                           │
│  Step 6: Get doctor info                                                 │
│    • const doctor = await getDefaultDoctor()                             │
│    • Finds first available doctor from User collection                   │
│                                                                           │
│  Step 7: Build confirmation message with all details:                    │
│    ✅ Perfect! Please review your appointment details:                   │
│                                                                           │
│    👤 Name: John Doe                                                     │
│    📱 Phone: +91-9876543210                                              │
│    🩸 Blood Group: O+                                                    │
│    📍 Address: 123 Main St, Chennai                                      │
│    🚨 Emergency Contact: Jane Doe (+91-9876543211)                       │
│    📝 Reason: Stomach pain                                               │
│                                                                           │
│    📅 Date: Sunday, February 16, 2026                                    │
│    🕐 Time: 03:00 PM                                                     │
│    👨‍⚕️ Doctor: Dr. Kumar                                                │
│    🏥 Location: Movi Innovations                                         │
│                                                                           │
│    Is everything correct?                                                │
│                                                                           │
│  Step 8: Send inline keyboard:                                           │
│    [✅ Confirm & Book]                                                   │
│    [❌ Cancel]                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Clicks "✅ Confirm & Book" button                                 │
│  callback_data: 'confirm_appointment'                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: callback_query handler - 'confirm_appointment'                  │
│  Lines 938-973                                                           │
│                                                                           │
│  Step 1: Show "Creating your appointment..." message                     │
│                                                                           │
│  Step 2: Call createAppointment(chatId, telegramUserId, state.data)     │
│          Lines 183-289                                                   │
│                                                                           │
│    ┌────────────────────────────────────────────────────────────┐       │
│    │  APPOINTMENT CREATION LOGIC                                 │       │
│    │                                                              │       │
│    │  A. Get Doctor                                              │       │
│    │     const doctor = await getDefaultDoctor()                 │       │
│    │     • Finds first doctor from User collection               │       │
│    │                                                              │       │
│    │  B. Generate Patient Code                                   │       │
│    │     const generatePatientCode = () => {                     │       │
│    │       const timestamp = Date.now().toString(36).toUpperCase()│      │
│    │       const random = Math.random().toString(36)...          │       │
│    │       return `PAT-TG-${timestamp}-${random}`                │       │
│    │     }                                                        │       │
│    │     Result: "PAT-TG-LX8K2M-A4F7"                            │       │
│    │                                                              │       │
│    │  C. Create Patient Document (Lines 225-256)                 │       │
│    │     const nameParts = "John Doe".split(' ')                 │       │
│    │     const patient = new Patient({                           │       │
│    │       patientCode: "PAT-TG-LX8K2M-A4F7",                    │       │
│    │       firstName: "John",                                    │       │
│    │       lastName: "Doe",                                      │       │
│    │       age: 0,                                               │       │
│    │       gender: "Other",                                      │       │
│    │       phone: "+91-9876543210",                              │       │
│    │       email: "telegram_123456789@telegram.user",            │       │
│    │       bloodGroup: "O+",                                     │       │
│    │       address: {                                            │       │
│    │         line1: "123 Main St, Chennai",                      │       │
│    │         houseNo: "",                                        │       │
│    │         street: "",                                         │       │
│    │         city: "",                                           │       │
│    │         state: "",                                          │       │
│    │         pincode: "",                                        │       │
│    │         country: "India"                                    │       │
│    │       },                                                    │       │
│    │       emergencyContact: {                                   │       │
│    │         name: "Jane Doe",                                   │       │
│    │         phone: "+91-9876543211",                            │       │
│    │         relationship: "Emergency Contact"                   │       │
│    │       },                                                    │       │
│    │       telegramUserId: "123456789",                          │       │
│    │       telegramUsername: "johndoe",                          │       │
│    │       metadata: {                                           │       │
│    │         source: "telegram",                                 │       │
│    │         createdViaBot: true                                 │       │
│    │       }                                                     │       │
│    │     })                                                      │       │
│    │     await patient.save()                                    │       │
│    │                                                              │       │
│    │  D. Check for Duplicate Appointments                        │       │
│    │     const isDuplicate = await checkDuplicateAppointment(...)│       │
│    │     • Searches Appointment collection for same user + time  │       │
│    │     • If found → return error                               │       │
│    │                                                              │       │
│    │  E. Create Appointment Document (Lines 260-274)             │       │
│    │     const appointment = new Appointment({                   │       │
│    │       patientId: patient._id,  // MongoDB ObjectId          │       │
│    │       doctorId: doctor._id,                                 │       │
│    │       appointmentType: "Consultation",                      │       │
│    │       startAt: Date(2026-02-16T15:00:00),                  │       │
│    │       endAt: Date(2026-02-16T15:30:00), // +30 min         │       │
│    │       location: "Movi Innovations",                         │       │
│    │       status: "Scheduled",                                  │       │
│    │       notes: "Reason: Stomach pain\nBooked via Telegram Bot"│      │
│    │       telegramUserId: "123456789",                          │       │
│    │       telegramChatId: "987654321",                          │       │
│    │       bookingSource: "telegram"                             │       │
│    │     })                                                      │       │
│    │     await appointment.save()                                │       │
│    │                                                              │       │
│    │     • appointmentCode auto-generated: "APT-LX8K3N-B5G8"    │       │
│    │                                                              │       │
│    │  F. Return Success                                          │       │
│    │     return {                                                │       │
│    │       success: true,                                        │       │
│    │       appointmentCode: "APT-LX8K3N-B5G8",                   │       │
│    │       doctorName: "Dr. Kumar",                              │       │
│    │       patientName: "John Doe",                              │       │
│    │       dateTime: Date object                                 │       │
│    │     }                                                        │       │
│    └────────────────────────────────────────────────────────────┘       │
│                                                                           │
│  Step 3: Send success message:                                           │
│    ✅ Appointment Booked Successfully!                                   │
│                                                                           │
│    🎫 Appointment Code: APT-LX8K3N-B5G8                                  │
│    👤 Patient: John Doe                                                  │
│    📅 Date: Sunday, February 16, 2026                                    │
│    🕐 Time: 03:00 PM                                                     │
│    👨‍⚕️ Doctor: Dr. Kumar                                                │
│    📍 Location: Movi Innovations                                         │
│                                                                           │
│    Please save your appointment code for reference.                      │
│    We'll see you at your appointment!                                    │
│                                                                           │
│  Step 4: resetState(chatId) - clear conversation state                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         ✅ BOOKING COMPLETE                              │
│                                                                           │
│  MongoDB Collections Updated:                                            │
│  • Patient collection → New document with telegram info                  │
│  • Appointment collection → New appointment linked to patient            │
│                                                                           │
│  User can now:                                                           │
│  • Use /book to create another appointment                               │
│  • Use /reports to view medical reports (after visit)                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 👤 **Flow 2B: Existing Patient Booking Journey**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Clicked "Existing Patient" button                                 │
│  callback_data: 'patient_type_existing'                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: callback_query handler (Lines 897-909)                          │
│  • state.step = 'waiting_patient_id'                                     │
│  • Asks: "Please provide your *phone number* or *patient ID*"            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Types "+91-9876543210" (their registered phone)                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: Case 'waiting_patient_id' (Lines 546-580)                       │
│                                                                           │
│  Step 1: Show "🔍 Searching for your record..." message                  │
│                                                                           │
│  Step 2: Database lookup                                                 │
│    let patient = await Patient.findOne({                                 │
│      $or: [                                                              │
│        { phone: "+91-9876543210" },                                      │
│        { _id: (if valid MongoDB ObjectId) }                              │
│      ]                                                                   │
│    })                                                                    │
│                                                                           │
│  Step 3: If patient NOT found:                                           │
│    • Send error: "❌ Patient record not found."                          │
│    • Ask to check phone/ID or use /book to register as new               │
│    • STOP HERE                                                           │
│                                                                           │
│  Step 4: If patient FOUND:                                               │
│    • Store in state temporarily:                                         │
│        state.data.patientId = patient._id                                │
│        state.data.age = patient.age                                      │
│        state.data.gender = patient.gender                                │
│        state.data.phone = patient.phone                                  │
│        state.data.email = patient.email                                  │
│        state.data.bloodGroup = patient.bloodGroup                        │
│        state.data.isExisting = true                                      │
│                                                                           │
│    • state.step = 'waiting_patient_name'                                 │
│                                                                           │
│    • Send confirmation:                                                  │
│      "✅ Patient Record Found!                                           │
│       📱 Phone: +91-9876543210                                           │
│       Please confirm your *full name*:"                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Types "John Doe"                                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: Case 'waiting_patient_name' (Lines 572-580)                     │
│  • state.data.fullName = "John Doe"                                      │
│  • state.step = 'waiting_reason'                                         │
│  • Asks: "What is the *reason for your visit*?"                          │
│                                                                           │
│  NOTE: Skips all personal details collection since patient exists!       │
│  (No phone, blood group, address, emergency contact needed)              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Types "Follow-up consultation"                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: Case 'waiting_reason' → waiting_datetime → confirmation         │
│  (Same flow as new patient from here)                                    │
│                                                                           │
│  When createAppointment() is called:                                     │
│  • Lines 196-218: SKIPS patient creation                                 │
│  • Uses existing patient record (patientData.patientId)                  │
│  • Updates telegram info if not set:                                     │
│      patient.telegramUserId = "123456789"                                │
│      patient.telegramUsername = "johndoe"                                │
│      await patient.save()                                                │
│  • Creates appointment linked to existing patient                        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 **Flow 3: View Medical Reports**

```
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Sends /reports command                                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: bot.onText(/\/reports/) handler (Lines 347-439)                 │
│                                                                           │
│  Step 1: Get user's telegram ID                                          │
│    const telegramUserId = msg.from.id  // e.g., 123456789                │
│                                                                           │
│  Step 2: Find patient by telegram ID                                     │
│    const patient = await Patient.findOne({                               │
│      telegramUserId: telegramUserId.toString()                           │
│    })                                                                    │
│                                                                           │
│  Step 3: Security Check - Patient Exists?                                │
│    ┌─────────────────────────────────────────────────────┐              │
│    │  IF patient NOT FOUND:                               │              │
│    │    Send: "❌ No Patient Record Found                │              │
│    │           You need to book an appointment first."    │              │
│    │    STOP HERE                                         │              │
│    └─────────────────────────────────────────────────────┘              │
│                                                                           │
│  Step 4: Check if patient has any appointments                           │
│    const hasAppointments = await Appointment.countDocuments({            │
│      patientId: patient._id                                              │
│    })                                                                    │
│                                                                           │
│    ┌─────────────────────────────────────────────────────┐              │
│    │  IF hasAppointments === 0:                           │              │
│    │    Send: "📋 No Appointments Yet                    │              │
│    │           Hi John! You haven't had any appointments."│              │
│    │    STOP HERE                                         │              │
│    └─────────────────────────────────────────────────────┘              │
│                                                                           │
│  Step 5: Find all medical reports for this patient                       │
│    const reports = await PatientPDF.find({                               │
│      patientId: patient._id                                              │
│    })                                                                    │
│    .sort({ uploadedAt: -1 })  // newest first                           │
│    .limit(10)                   // max 10 reports                        │
│    .lean()                                                               │
│                                                                           │
│  Step 6: Check if reports exist                                          │
│    ┌─────────────────────────────────────────────────────┐              │
│    │  IF reports.length === 0:                            │              │
│    │    Send: "📋 No Medical Reports Found               │              │
│    │           Reports will appear after your visits."    │              │
│    │    STOP HERE                                         │              │
│    └─────────────────────────────────────────────────────┘              │
│                                                                           │
│  Step 7: Build report list with inline keyboard buttons                  │
│    const reportButtons = reports.map((report, index) => {                │
│      const date = new Date(report.uploadedAt)                            │
│                   .toLocaleDateString('en-IN', {...})                    │
│      const title = report.title || 'Medical Report'                      │
│      const size = (report.size / 1024).toFixed(1) + 'KB'                │
│                                                                           │
│      return [{                                                           │
│        text: `${index+1}. ${title} - ${date} (${size})`,                │
│        callback_data: `download_${report._id}`                           │
│      }]                                                                  │
│    })                                                                    │
│                                                                           │
│    Example buttons:                                                      │
│    [1. Blood Test Report - 12 Feb 2026 (145.2KB)]                       │
│    [2. X-Ray Report - 10 Feb 2026 (832.7KB)]                            │
│    [3. Lab Report - 08 Feb 2026 (256.4KB)]                              │
│                                                                           │
│  Step 8: Send message with report list                                   │
│    "📋 Your Medical Reports                                              │
│     Found 3 report(s). Select one to download:"                          │
│    (with inline keyboard)                                                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Clicks "1. Blood Test Report - 12 Feb 2026 (145.2KB)"            │
│  callback_data: 'download_507f1f77bcf86cd799439011' (MongoDB ObjectId)   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  SERVER: callback_query handler (Lines 789-873)                          │
│                                                                           │
│  Step 1: Detect callback data starts with 'download_'                    │
│    const reportId = data.replace('download_', '')                        │
│    // reportId = "507f1f77bcf86cd799439011"                              │
│                                                                           │
│  Step 2: Fetch report from database                                      │
│    const report = await PatientPDF.findById(reportId)                    │
│                                                                           │
│    ┌─────────────────────────────────────────────────────┐              │
│    │  IF report NOT FOUND:                                │              │
│    │    Send callback alert: "❌ Report not found"        │              │
│    │    STOP HERE                                         │              │
│    └─────────────────────────────────────────────────────┘              │
│                                                                           │
│  Step 3: SECURITY CHECK - Verify patient owns this report                │
│    const patient = await Patient.findOne({                               │
│      _id: report.patientId,          // Report's patient ID              │
│      telegramUserId: query.from.id.toString()  // User's telegram ID     │
│    })                                                                    │
│                                                                           │
│    ┌─────────────────────────────────────────────────────┐              │
│    │  IF patient NOT FOUND (ownership mismatch):          │              │
│    │    Send callback alert: "⚠️ Access denied"           │              │
│    │    Log: "Unauthorized download attempt by user X"    │              │
│    │    STOP HERE - PREVENTS UNAUTHORIZED ACCESS!         │              │
│    └─────────────────────────────────────────────────────┘              │
│                                                                           │
│  Step 4: Send preparing message                                          │
│    Send callback: "⏳ Preparing your report..."                          │
│    Send message: "⏳ Downloading your report...\nPlease wait..."          │
│                                                                           │
│  Step 5: Check file size (Telegram limit = 50MB)                         │
│    const fileSizeMB = report.size / (1024 * 1024)                        │
│                                                                           │
│    ┌─────────────────────────────────────────────────────┐              │
│    │  IF fileSizeMB > 50:                                 │              │
│    │    Send: "❌ File too large                          │              │
│    │           This report is 52.4MB which exceeds        │              │
│    │           Telegram's 50MB limit."                    │              │
│    │    STOP HERE                                         │              │
│    └─────────────────────────────────────────────────────┘              │
│                                                                           │
│  Step 6: Send the PDF document                                           │
│    await bot.sendDocument(chatId, report.data, {                         │
│      caption: `                                                          │
│        📄 Blood Test Report                                              │
│        📅 Uploaded: 12 February 2026                                     │
│        📊 Size: 145.20 KB                                                │
│        📝 File: blood_test_report.pdf                                    │
│      `,                                                                  │
│      filename: report.fileName,                                          │
│      parse_mode: 'Markdown'                                              │
│    }, {                                                                  │
│      contentType: report.mimeType || 'application/pdf'                   │
│    })                                                                    │
│                                                                           │
│  Step 7: Send success confirmation                                       │
│    "✅ Report sent successfully!                                         │
│     💡 You can download it from the file above.                          │
│     Use /reports to view more reports."                                  │
│                                                                           │
│  Step 8: Log successful download                                         │
│    console.log(`✅ Report downloaded: ${reportId} by patient ${patientId}`)│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  USER: Receives PDF file in Telegram chat                                │
│  • Can download to device                                                │
│  • Can forward to another chat                                           │
│  • Can open in PDF viewer                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Backend Infrastructure Flow**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SERVER STARTUP (Server.js)                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 1: Load environment variables (.env file)                          │
│    • TELEGRAM_BOT_TOKEN = "123456:ABC-DEF..."                            │
│    • Gemi_Api_Key = "AIzaSy..."                                          │
│    • MONGODB_URI = "mongodb://localhost:27017/karur_hms"                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 2: Initialize Express app                                          │
│    const app = express()                                                 │
│    app.use(cors())                                                       │
│    app.use(express.json())                                               │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 3: Connect to MongoDB (Line 43 of Server.js)                       │
│    await connectMongo()                                                  │
│    • Connects to database                                                │
│    • Loads models: Patient, Appointment, PatientPDF, User                │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 4: Mount Telegram route (Line 46 of Server.js)                     │
│    app.use('/api/telegram', require('./routes/telegram'))                │
│    console.log('✅ Telegram Bot activated and running...')               │
│                                                                           │
│    This triggers routes/telegram.js initialization:                      │
│    ┌────────────────────────────────────────────────────────────┐       │
│    │  routes/telegram.js (Lines 1-27)                            │       │
│    │                                                              │       │
│    │  1. const bot = new TelegramBot(token, { polling: ... })   │       │
│    │     • Starts long-polling to Telegram servers               │       │
│    │     • Checks for new messages every 1 second                │       │
│    │                                                              │       │
│    │  2. const genAI = new GoogleGenerativeAI(apiKey)            │       │
│    │     • Initializes Gemini AI client                          │       │
│    │                                                              │       │
│    │  3. const conversationState = new Map()                     │       │
│    │     • In-memory storage for active chats                    │       │
│    │     • Structure: Map<chatId, { step, data, lastActivity }> │       │
│    │                                                              │       │
│    │  4. Register bot command handlers:                          │       │
│    │     • bot.onText(/\/start/) → welcome                       │       │
│    │     • bot.onText(/\/book/) → booking flow                   │       │
│    │     • bot.onText(/\/reports/) → report listing              │       │
│    │     • bot.on('message') → handle text input                 │       │
│    │     • bot.on('callback_query') → handle button clicks       │       │
│    │                                                              │       │
│    │  5. Start cleanup interval (every 30 minutes)               │       │
│    │     • Removes stale conversations (inactive > 30 min)       │       │
│    └────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  Step 5: Server starts listening on port 5000                            │
│    app.listen(5000, () => {                                              │
│      console.log('🚀 Server is listening on port 5000')                  │
│    })                                                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         🤖 BOT NOW ACTIVE                                │
│                                                                           │
│  Telegram Bot:                                                           │
│  • Polling Telegram API every 1 second                                   │
│  • Waiting for user messages                                             │
│  • Ready to process commands                                             │
│                                                                           │
│  When user sends message to bot:                                         │
│  Telegram → Node.js polling → routes/telegram.js handlers                │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ **Database Schema & Relationships**

```
┌────────────────────────────────────────────────────────────────────────┐
│                          MONGODB COLLECTIONS                            │
└────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PATIENT Collection (Models/Patient.js)                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  {                                                                        │
│    _id: ObjectId("507f1f77bcf86cd799439011"),                           │
│    patientCode: "PAT-TG-LX8K2M-A4F7",    ← Auto-generated                │
│    firstName: "John",                                                    │
│    lastName: "Doe",                                                      │
│    age: 0,                                                               │
│    gender: "Other",                                                      │
│    phone: "+91-9876543210",                                              │
│    email: "telegram_123456789@telegram.user",                            │
│    bloodGroup: "O+",                                                     │
│    address: {                                                            │
│      line1: "123 Main St, Chennai",                                     │
│      houseNo: "", street: "", city: "", state: "", pincode: "",         │
│      country: "India"                                                    │
│    },                                                                    │
│    emergencyContact: {                                                   │
│      name: "Jane Doe",                                                   │
│      phone: "+91-9876543211",                                            │
│      relationship: "Emergency Contact"                                   │
│    },                                                                    │
│    telegramUserId: "123456789",          ← Links to Telegram user       │
│    telegramUsername: "johndoe",          ← Telegram @username           │
│    metadata: {                                                           │
│      source: "telegram",                                                 │
│      createdViaBot: true                                                 │
│    },                                                                    │
│    createdAt: ISODate("2026-02-15T17:00:00Z"),                          │
│    updatedAt: ISODate("2026-02-15T17:00:00Z")                           │
│  }                                                                        │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Referenced by
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  APPOINTMENT Collection (Models/Appointment.js)                          │
├─────────────────────────────────────────────────────────────────────────┤
│  {                                                                        │
│    _id: ObjectId("507f1f77bcf86cd799439012"),                           │
│    appointmentCode: "APT-LX8K3N-B5G8",   ← Auto-generated                │
│    patientId: ObjectId("507f1f77bcf86cd799439011"),  ← Links to Patient │
│    doctorId: ObjectId("507f1f77bcf86cd799439013"),   ← Links to User    │
│    appointmentType: "Consultation",                                      │
│    startAt: ISODate("2026-02-16T15:00:00Z"),                            │
│    endAt: ISODate("2026-02-16T15:30:00Z"),                              │
│    location: "Movi Innovations",                                         │
│    status: "Scheduled",                                                  │
│    notes: "Reason: Stomach pain\nBooked via Telegram Bot",               │
│    telegramUserId: "123456789",          ← For duplicate checking        │
│    telegramChatId: "987654321",          ← For sending notifications     │
│    bookingSource: "telegram",            ← Tracks booking channel        │
│    createdAt: ISODate("2026-02-15T17:00:00Z"),                          │
│    updatedAt: ISODate("2026-02-15T17:00:00Z")                           │
│  }                                                                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  USER Collection (Models/User.js) - Stores Doctors/Staff                 │
├─────────────────────────────────────────────────────────────────────────┤
│  {                                                                        │
│    _id: ObjectId("507f1f77bcf86cd799439013"),                           │
│    email: "dr.kumar@hospital.com",                                       │
│    password: "$2b$10$...",  ← Hashed                                     │
│    role: "doctor",                                                       │
│    firstName: "Kumar",                                                   │
│    lastName: "Sharma",                                                   │
│    phone: "+91-9876543212",                                              │
│    is_active: true,                                                      │
│    createdAt: ISODate("2026-01-01T00:00:00Z")                           │
│  }                                                                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│  PATIENTPDF Collection (Models/PatientPDF.js) - Medical Reports          │
├─────────────────────────────────────────────────────────────────────────┤
│  {                                                                        │
│    _id: ObjectId("507f1f77bcf86cd799439014"),                           │
│    patientId: ObjectId("507f1f77bcf86cd799439011"),  ← Links to Patient │
│    title: "Blood Test Report",                                           │
│    fileName: "blood_test_report.pdf",                                    │
│    mimeType: "application/pdf",                                          │
│    size: 148685,  ← Bytes (145.2 KB)                                     │
│    data: Buffer(<PDF binary data>),  ← Actual file stored in DB         │
│    uploadedAt: ISODate("2026-02-12T10:00:00Z"),                         │
│    metadata: { ... }                                                     │
│  }                                                                        │
└─────────────────────────────────────────────────────────────────────────┘

RELATIONSHIP DIAGRAM:

    USER (Doctor)
        ↓ doctorId
    APPOINTMENT ← telegramUserId/chatId for notifications
        ↓ patientId
    PATIENT ← telegramUserId links to Telegram user
        ↓ patientId
    PATIENTPDF (Reports) ← downloaded via Telegram bot
```

---

## 🔐 **Security Flow**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SECURITY MECHANISMS                               │
└─────────────────────────────────────────────────────────────────────────┘

1. PATIENT OWNERSHIP VERIFICATION (Report Downloads)
   ────────────────────────────────────────────────────
   User clicks download → Extract reportId
                       ↓
   Fetch report from DB → Check report.patientId
                       ↓
   Find patient WHERE:
      • _id = report.patientId  (report belongs to this patient)
      • telegramUserId = user's telegram ID  (patient is this user)
                       ↓
   If match → ALLOW download
   If no match → DENY with "Access denied" + log attempt

2. DUPLICATE APPOINTMENT PREVENTION
   ────────────────────────────────
   Before creating appointment:
   Check if Appointment exists WHERE:
      • telegramUserId = user's ID
      • startAt = requested time
      • status IN ['Scheduled', 'Rescheduled']
                       ↓
   If exists → Reject with "You already have an appointment at this time"
   If not → Proceed with creation

3. TELEGRAM USER LINKING
   ────────────────────────
   When patient created:
      • Store msg.from.id as telegramUserId
      • Store msg.from.username as telegramUsername
   This creates permanent link between Telegram user and patient record

4. DATA VALIDATION
   ────────────────
   • Phone number: Must be 10+ digits with regex pattern
   • Date/time: Must not be in the past (validated after Gemini parsing)
   • Blood group: Restricted to predefined options via inline keyboard
   • File size: Max 50MB for Telegram document sending

5. ERROR HANDLING & RECOVERY
   ──────────────────────────
   • Circuit breaker pattern for AI API calls
   • Graceful error messages (no sensitive data exposed)
   • Conversation state cleanup (prevents memory leaks)
   • Polling error auto-recovery
```

---

## 🎯 **Key Technical Points**

### **State Management**
```javascript
conversationState = Map {
  chatId: 987654321 => {
    step: 'waiting_datetime',     // Current position in flow
    data: {                        // Accumulated user data
      fullName: 'John Doe',
      phone: '+91-9876543210',
      bloodGroup: 'O+',
      address: '123 Main St',
      emergencyContactName: 'Jane Doe',
      emergencyPhone: '+91-9876543211'
    },
    username: 'johndoe',           // Telegram username
    firstName: 'John',             // Telegram first name
    lastActivity: 1708016429714    // Timestamp for cleanup
  }
}
```

### **Gemini AI Integration**
```javascript
// User says: "tomorrow at 3pm"
parseDateTimeWithGemini(userMessage) {
  ↓
  Gemini API Call with prompt:
  "Extract date/time from: 'tomorrow at 3pm'
   Current: Saturday, Feb 15, 2026, 5:00 PM"
  ↓
  Gemini Response:
  { date: "2026-02-16", time: "15:00", success: true }
  ↓
  Validation: Check if date > now
  ↓
  Return parsed result
}
```

### **Inline Keyboard Pattern**
```javascript
bot.sendMessage(chatId, "Select blood group:", {
  reply_markup: {
    inline_keyboard: [
      [
        { text: 'A+', callback_data: 'blood_A+' },
        { text: 'A-', callback_data: 'blood_A-' }
      ],
      [
        { text: 'B+', callback_data: 'blood_B+' },
        { text: 'B-', callback_data: 'blood_B-' }
      ]
    ]
  }
})

// When user clicks button:
bot.on('callback_query', (query) => {
  if (query.data.startsWith('blood_')) {
    const bloodGroup = query.data.replace('blood_', '')
    // bloodGroup = 'A+' or 'B-', etc.
  }
})
```

---

This is the complete end-to-end flow of how your Telegram bot works! 🚀
