# Telegram Bot Enhanced Appointment Flow

## Summary of Changes

The Telegram bot has been enhanced to provide a better patient experience with doctor selection and intelligent appointment scheduling based on availability.

## Key Features Implemented

### 1. **Patient Chooses Their Doctor**
- Patients no longer get automatically assigned to a default doctor
- The bot displays a list of all active doctors with their specializations
- Patients can select their preferred doctor from the list
- Doctor information includes name and specialty/department

### 2. **Smart Appointment Scheduling (30-Minute Slots)**
- Each appointment is allocated a 30-minute time slot
- The system automatically checks doctor availability before showing available slots
- Prevents double-booking by querying existing appointments
- Shows only genuinely available time slots to patients

### 3. **Availability Checking System**
- **Working Hours**: 9:00 AM to 6:00 PM (configurable)
- **Time Slots**: Every 30 minutes (9:00, 9:30, 10:00, 10:30, etc.)
- **Real-time Check**: Queries database for existing appointments
- **Smart Display**: Groups slots by morning, afternoon, and evening

## Updated Booking Flow

The new booking process follows this sequence:

1. **Name** - Patient's full name
2. **Age** - Patient's age (1-120)
3. **Gender** - Male/Female/Other
4. **Phone** - 10-digit mobile number
5. **Email** - Email address (can skip)
6. **Reason** - Reason for visit/symptoms
7. **Doctor Selection** - Choose from available doctors
8. **Date Selection** - Choose appointment date (today or future)
9. **Time Selection** - Choose from available 30-minute slots
10. **Confirmation** - Review and confirm appointment

## Technical Implementation

### Functions Added

#### `getAvailableTimeSlots(doctorId, date)`
```javascript
// Checks doctor's existing appointments for a given date
// Returns array of available 30-minute time slots
// Filters out: Cancelled and No-Show appointments
// Working hours: 9:00 AM - 6:00 PM
```

#### `formatTimeSlotsForDisplay(slots)`
```javascript
// Groups time slots by time of day:
// 🌅 Morning: Before 12:00 PM
// ☀️ Afternoon: 12:00 PM - 5:00 PM  
// 🌆 Evening: 5:00 PM onwards
```

### Database Schema Updates

Appointments are now created with proper `startAt` and `endAt` fields:
- `startAt`: Appointment start time (Date object)
- `endAt`: Appointment end time (start + 30 minutes)
- `bookingSource`: 'telegram' to track booking origin
- `metadata`: Enhanced with patient details and reason

### Appointment Creation
```javascript
const appointmentStart = new Date(selectedDate);
appointmentStart.setHours(hours, minutes, 0, 0);

const appointmentEnd = new Date(appointmentStart);
appointmentEnd.setMinutes(appointmentEnd.getMinutes() + 30);
```

## User Experience Improvements

### Before
❌ All patients assigned to first available doctor  
❌ No visibility into doctor availability  
❌ Risk of double-booking  
❌ No time slot management  

### After
✅ Patients choose their preferred doctor  
✅ See doctor specializations  
✅ View only available time slots  
✅ Automatic 30-minute slot allocation  
✅ Zero double-booking risk  
✅ Better appointment management  

## Example Bot Conversation

```
Patient: /book

Bot: 📅 New Appointment Booking
Step 1/8: What is your full name?

Patient: John Doe

Bot: ✅ Name: John Doe
Step 2/8: What is your age?

Patient: 35

Bot: ✅ Age: 35
Step 3/8: What is your gender?
[Male] [Female] [Other]

Patient: Male

Bot: ✅ Gender: Male
Step 4/8: What is your phone number?

Patient: 9876543210

Bot: ✅ Phone: 9876543210
Step 5/8: What is your email address?

Patient: john@example.com

Bot: ✅ Email: john@example.com
Step 6/8: What is the reason for your visit?

Patient: Regular checkup and stomach pain

Bot: ✅ Reason: Regular checkup and stomach pain
Step 7/8: Select your preferred doctor:

1. Dr. Rajesh Kumar - Gastroenterologist
2. Dr. Priya Sharma - General Physician
3. Dr. Amit Patel - Cardiologist

Reply with the number (1, 2, 3...)

Patient: 1

Bot: ✅ Selected Doctor: Dr. Rajesh Kumar
Step 8/8: Select your preferred appointment date:
[2026-02-15]
[2026-02-16]
[2026-02-17]

Patient: 2026-02-15

Bot: ✅ Date: 2026-02-15
📅 Available time slots for Dr. Rajesh Kumar:

🌅 Morning: 09:00, 09:30, 10:00, 11:00, 11:30
☀️ Afternoon: 14:00, 14:30, 15:00, 16:00
🌆 Evening: 17:00, 17:30

Each appointment is 30 minutes. Select your preferred time:
[09:00] [09:30] [10:00]
[14:00] [14:30] [15:00]

Patient: 10:00

Bot: 📋 Appointment Summary

👤 Name: John Doe
🎂 Age: 35
⚧ Gender: Male
📞 Phone: 9876543210
📧 Email: john@example.com
📝 Reason: Regular checkup and stomach pain
👨‍⚕️ Doctor: Dr. Rajesh Kumar
📅 Date: 2026-02-15
🕐 Time: 10:00 (30 minutes)

Is this information correct?
Reply "yes" to confirm or "no" to cancel.
[Yes] [No]

Patient: Yes

Bot: ✅ Appointment Booked Successfully!

🎫 Appointment Code: APT-XYZ123
👤 Patient Code: PAT-001234
📅 Date & Time: 2026-02-15 at 10:00
⏱️ Duration: 30 minutes
👨‍⚕️ Doctor: Dr. Rajesh Kumar

Important Notes:
• Please arrive 15 minutes early
• Bring any relevant medical records
• Carry a valid ID proof
• Your appointment slot is reserved for 30 minutes

Thank you for choosing Movi Innovations! 🏥
```

## Configuration

### Working Hours (Customizable)
Edit the `getAvailableTimeSlots` function to change working hours:
```javascript
const workingHours = {
  start: 9,   // 9 AM
  end: 18     // 6 PM
};
```

### Slot Duration
Currently set to 30 minutes. To change:
```javascript
appointmentEnd.setMinutes(appointmentEnd.getMinutes() + 30); // Change 30 to desired duration
```

### Time Slot Intervals
Currently generates slots every 30 minutes. Modify the loop:
```javascript
for (let minute of [0, 30]) {  // Change to [0, 15, 30, 45] for 15-min slots
```

## Benefits

1. **Better Patient Experience**
   - Choice and control over doctor selection
   - Transparency in availability
   - No waiting for unavailable slots

2. **Efficient Scheduling**
   - Automatic slot management
   - Prevention of overbooking
   - Optimized doctor schedules

3. **Data Accuracy**
   - Proper startAt/endAt times
   - Better reporting and analytics
   - Accurate appointment durations

4. **Scalability**
   - Can handle multiple doctors
   - Works across different dates
   - Easy to extend with more features

## Future Enhancements

1. **Doctor Profiles**: Add photos, qualifications, ratings
2. **Recurring Appointments**: Support weekly/monthly bookings
3. **Reminders**: Send automated appointment reminders
4. **Cancellation**: Allow patients to cancel/reschedule
5. **Wait List**: Add patients to waiting list if no slots available
6. **Video Consultations**: Support for telemedicine appointments
7. **Custom Working Hours**: Different hours per doctor
8. **Break Times**: Support for lunch breaks, meeting times
9. **Emergency Slots**: Reserved slots for urgent cases
10. **Multi-language**: Support for regional languages

## Testing

To test the new flow:
1. Start the bot: `node Server/Bot/telegram_bot.js`
2. Open Telegram and search for your bot
3. Send `/start` command
4. Send `/book` command
5. Follow the interactive prompts
6. Verify appointment is created with correct times
7. Try booking same doctor/time - should show slot as unavailable

## Files Modified

- `Server/Bot/telegram_bot.js` - Main bot logic with enhanced flow

## Notes

- Appointments are stored with proper Date objects in `startAt` and `endAt` fields
- The bot validates slot availability in real-time
- Keyboard shortcuts make selection faster and easier
- Error handling ensures graceful failure recovery
- Conversation state is maintained in memory (use Redis in production)
