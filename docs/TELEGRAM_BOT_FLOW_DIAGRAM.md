# Telegram Bot - Appointment Booking Flow Diagram

## Visual Flow Chart

```
┌─────────────────────────────────────────────────────────────┐
│                    USER STARTS BOT                          │
│                      /start                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              WELCOME MESSAGE                                │
│  🏥 Welcome to Movi Innovations HMS                         │
│  Commands:                                                  │
│  • /book - Book appointment                                 │
│  • /myappointments - View appointments                      │
│  • /help - Get help                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ User sends: /book
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 STEP 1/8: NAME                              │
│  📝 What is your full name?                                 │
│  Input: Text (min 2 characters)                             │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 STEP 2/8: AGE                               │
│  🎂 What is your age?                                       │
│  Input: Number (1-120)                                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 STEP 3/8: GENDER                            │
│  ⚧ What is your gender?                                     │
│  Options: [Male] [Female] [Other]                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 STEP 4/8: PHONE                             │
│  📞 What is your phone number?                              │
│  Input: 10-digit number                                     │
│  Validation: Must be 10 digits                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 STEP 5/8: EMAIL                             │
│  📧 What is your email?                                     │
│  Input: Email or "skip"                                     │
│  Validation: Valid email format or skip                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                 STEP 6/8: REASON                            │
│  📝 What is the reason for your visit?                      │
│  Input: Text (min 5 characters)                             │
│  Example: "Stomach pain and fever"                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          STEP 7/8: DOCTOR SELECTION                         │
│  👨‍⚕️ Select your preferred doctor:                          │
│                                                             │
│  📊 SYSTEM FETCHES ACTIVE DOCTORS                           │
│     ↓                                                       │
│  Query: User.find({ role: 'doctor', is_active: true })     │
│     ↓                                                       │
│  Display:                                                   │
│    1. Dr. Rajesh Kumar - Gastroenterologist                 │
│    2. Dr. Priya Sharma - General Physician                  │
│    3. Dr. Amit Patel - Cardiologist                         │
│                                                             │
│  Input: Number (1, 2, 3, ...)                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Doctor selected
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          STEP 8/8: DATE SELECTION                           │
│  📅 Select appointment date:                                │
│                                                             │
│  Quick options:                                             │
│    [2026-02-15] Today                                       │
│    [2026-02-16] Tomorrow                                    │
│    [2026-02-17] Day After                                   │
│                                                             │
│  Input: YYYY-MM-DD format                                   │
│  Validation: Must be today or future date                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ Date selected
                       ▼
┌─────────────────────────────────────────────────────────────┐
│       🔍 CHECKING DOCTOR AVAILABILITY                       │
│                                                             │
│  Function: getAvailableTimeSlots(doctorId, date)           │
│     ↓                                                       │
│  1. Generate all possible slots (9AM-6PM, 30min each)      │
│     [09:00, 09:30, 10:00, ..., 17:30]                      │
│     ↓                                                       │
│  2. Query existing appointments:                            │
│     Appointment.find({                                      │
│       doctorId: selected_doctor,                            │
│       startAt: selected_date,                               │
│       status: { $nin: ['Cancelled', 'No-Show'] }            │
│     })                                                      │
│     ↓                                                       │
│  3. Filter out booked slots                                 │
│     Available = All slots - Booked slots                    │
│     ↓                                                       │
│  4. Group by time of day                                    │
│     Morning: Before 12 PM                                   │
│     Afternoon: 12 PM - 5 PM                                 │
│     Evening: After 5 PM                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────┴──────────────┐
         │                            │
         │ Slots Available?           │
         │                            │
    ┌────┴────┐                 ┌─────┴────┐
    │   YES   │                 │    NO    │
    └────┬────┘                 └─────┬────┘
         │                            │
         ▼                            ▼
┌─────────────────────┐    ┌──────────────────────┐
│  SHOW AVAILABLE     │    │  NO SLOTS MESSAGE    │
│  TIME SLOTS         │    │                      │
│                     │    │  ⚠️ No available      │
│  🌅 Morning:        │    │  slots for this date │
│  09:00, 09:30,      │    │                      │
│  10:00, 11:30       │    │  Please select       │
│                     │    │  another date        │
│  ☀️ Afternoon:      │    │                      │
│  14:00, 15:00,      │    │  Or /cancel          │
│  16:00              │    └──────┬───────────────┘
│                     │           │
│  🌆 Evening:        │           │ Return to
│  17:00, 17:30       │           │ date selection
│                     │           │
│  Quick select:      │           │
│  [09:00] [10:00]    │           │
│  [14:00] [15:00]    │           │
└──────┬──────────────┘           │
       │                          │
       │ User selects time        │
       ▼                          │
┌─────────────────────────────────┘
│  VALIDATE SLOT STILL AVAILABLE
│  (Prevent race condition)
└──────┬──────────────────────────┐
       │                          │
  ┌────┴────┐              ┌──────┴─────┐
  │  VALID  │              │  TAKEN     │
  └────┬────┘              └──────┬─────┘
       │                          │
       ▼                          ▼
┌──────────────────┐    ┌──────────────────┐
│ CONFIRMATION     │    │ SLOT UNAVAILABLE │
│ SUMMARY          │    │ Please select    │
│                  │    │ another time     │
│ 📋 Review:       │    └──────────────────┘
│                  │
│ 👤 Name          │
│ 🎂 Age           │
│ ⚧ Gender         │
│ 📞 Phone         │
│ 📧 Email         │
│ 📝 Reason        │
│ 👨‍⚕️ Doctor       │
│ 📅 Date          │
│ 🕐 Time (30 min) │
│                  │
│ Confirm?         │
│ [Yes] [No]       │
└──────┬───────────┘
       │
       │ User confirms: Yes
       ▼
┌─────────────────────────────────────────────────────────────┐
│           CREATE APPOINTMENT IN DATABASE                    │
│                                                             │
│  1. Find or Create Patient:                                │
│     Patient.findOne({ phone: user_phone })                 │
│     If not found → Create new patient                       │
│                                                             │
│  2. Create Appointment:                                     │
│     const startAt = new Date(date + time)                   │
│     const endAt = startAt + 30 minutes                      │
│                                                             │
│     Appointment.create({                                    │
│       patientId: patient._id,                               │
│       doctorId: selected_doctor._id,                        │
│       startAt: startAt,                                     │
│       endAt: endAt,                                         │
│       status: 'Scheduled',                                  │
│       bookingSource: 'telegram',                            │
│       metadata: { all user details }                        │
│     })                                                      │
│                                                             │
│  3. Generate appointment code: APT-XXXXX                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              ✅ SUCCESS MESSAGE                              │
│                                                             │
│  🎉 Appointment Booked Successfully!                        │
│                                                             │
│  🎫 Appointment Code: APT-ABC123                            │
│  👤 Patient Code: PAT-001234                                │
│  📅 Date & Time: 2026-02-15 at 10:00                        │
│  ⏱️ Duration: 30 minutes                                    │
│  👨‍⚕️ Doctor: Dr. Rajesh Kumar                               │
│                                                             │
│  Important Notes:                                           │
│  • Arrive 15 minutes early                                  │
│  • Bring medical records                                    │
│  • Carry valid ID                                           │
│                                                             │
│  Thank you! 🏥                                              │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
                 [ END OF FLOW ]
                       │
                       ▼
             User can now use:
             • /myappointments
             • /book (new appointment)
             • /help
```

## State Machine Diagram

```
                    ┌──────────────┐
                    │     IDLE     │
                    │   (waiting)  │
                    └──────┬───────┘
                           │
                    User: /book
                           │
                           ▼
                    ┌──────────────┐
                    │ BOOKING_NAME │────────┐
                    └──────┬───────┘        │
                           │                │
                    Valid name              │ /cancel
                           │                │
                           ▼                │
                    ┌──────────────┐        │
                    │ BOOKING_AGE  │────────┤
                    └──────┬───────┘        │
                           │                │
                    Valid age               │
                           │                │
                           ▼                │
                    ┌──────────────┐        │
                    │BOOKING_GENDER│────────┤
                    └──────┬───────┘        │
                           │                │
                    Valid gender            │
                           │                │
                           ▼                │
                    ┌──────────────┐        │
                    │BOOKING_PHONE │────────┤
                    └──────┬───────┘        │
                           │                │
                    Valid phone             │
                           │                │
                           ▼                │
                    ┌──────────────┐        │
                    │BOOKING_EMAIL │────────┤
                    └──────┬───────┘        │
                           │                │
                    Valid/skip email        │
                           │                │
                           ▼                │
                    ┌──────────────┐        │
                    │BOOKING_REASON│────────┤
                    └──────┬───────┘        │
                           │                │
                    Valid reason            │
                           │                │
                           ▼                │
                    ┌──────────────┐        │
                    │BOOKING_DOCTOR│────────┤
                    └──────┬───────┘        │
                           │                │
                    Doctor selected         │
                           │                │
                           ▼                │
                    ┌──────────────┐        │
                    │ BOOKING_DATE │────────┤
                    └──────┬───────┘        │
                           │                │
                    Date selected           │
                    + slots available       │
                           │                │
                           ▼                │
                    ┌──────────────┐        │
                    │ BOOKING_TIME │────────┤
                    └──────┬───────┘        │
                           │                │
                    Time selected           │
                           │                │
                           ▼                │
                    ┌──────────────┐        │
                    │BOOKING_CONFIRM│───────┤
                    └──────┬───────┘        │
                           │                │
                    User: "Yes"             │
                           │                │
                           ▼                │
                    [Create Appointment]    │
                           │                │
                           ▼                │
                    ┌──────────────┐        │
                    │     IDLE     │◄───────┘
                    │  (reset)     │
                    └──────────────┘
```

## Data Flow Diagram

```
┌─────────────┐
│   TELEGRAM  │
│    USER     │
└──────┬──────┘
       │
       │ Sends message
       ▼
┌──────────────────────┐
│   TELEGRAM BOT API   │
│  (node-telegram-bot) │
└──────┬───────────────┘
       │
       │ Webhook/Polling
       ▼
┌────────────────────────────┐
│  CONVERSATION HANDLER      │
│  (State Machine)           │
│  • Tracks chat state       │
│  • Validates input         │
│  • Manages flow            │
└──────┬─────────────────────┘
       │
       │ State: BOOKING_DOCTOR
       ▼
┌────────────────────────────┐
│  FETCH DOCTORS             │
│  User.find({               │
│    role: 'doctor',         │
│    is_active: true         │
│  })                        │
└──────┬─────────────────────┘
       │
       │ State: BOOKING_DATE
       ▼
┌────────────────────────────┐
│  CHECK AVAILABILITY        │
│  getAvailableTimeSlots()   │
│     ↓                      │
│  Appointment.find({        │
│    doctorId: xxx,          │
│    startAt: date           │
│  })                        │
│     ↓                      │
│  Calculate free slots      │
└──────┬─────────────────────┘
       │
       │ State: BOOKING_CONFIRM
       ▼
┌────────────────────────────┐
│  CREATE APPOINTMENT        │
│  1. Find/Create Patient    │
│  2. Create Appointment     │
│  3. Generate codes         │
└──────┬─────────────────────┘
       │
       ▼
┌────────────────────────────┐
│   MONGODB DATABASE         │
│   • Patients collection    │
│   • Appointments collection│
│   • Users collection       │
└────────────────────────────┘
```

## Legend

📝 Text input  
🔢 Number input  
☑️ Selection/button  
🔍 Database query  
✅ Success  
❌ Error  
⚠️ Warning  
→ Flow direction  
◄ Return/Reset  

## Key Decision Points

1. **Doctor Availability**: System checks if doctor has any open slots before showing date options
2. **Slot Validation**: Before confirming, system re-checks if slot is still available (race condition protection)
3. **Patient Creation**: If phone number exists, use existing patient; otherwise create new
4. **Time Calculation**: Automatically calculates end time as start time + 30 minutes

## Error Handling

All steps include validation and error messages:
- Invalid input → Show error, stay in same state
- /cancel command → Reset to IDLE state
- Database error → Show error message, reset conversation
- No doctors available → Cannot proceed, show contact info
- No slots available → Go back to date selection
