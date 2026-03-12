# Telegram Bot - Quick Reference Card

## 🚀 Quick Start

```bash
# Start the bot
cd Server
node Bot/telegram_bot.js
```

## 📋 What Changed

### Before
❌ All patients auto-assigned to first doctor  
❌ No slot management  
❌ Risk of double-booking  

### After
✅ Patients choose their doctor  
✅ 30-minute time slots  
✅ Real-time availability checking  
✅ Zero double-booking  

## 🔄 New Booking Flow

```
Name → Age → Gender → Phone → Email → 
Reason → DOCTOR → DATE → TIME → Confirm
```

## ⚙️ Configuration

### Working Hours
Location: `Server/Bot/telegram_bot.js` line ~96
```javascript
const workingHours = { start: 9, end: 18 }; // 9 AM - 6 PM
```

### Slot Duration
Location: `Server/Bot/telegram_bot.js` line ~565
```javascript
appointmentEnd.setMinutes(appointmentEnd.getMinutes() + 30); // 30 minutes
```

## 🧪 Testing

```bash
# Test availability logic
node Server/test_appointment_availability.js

# Test bot loads correctly
node -e "require('./Bot/telegram_bot.js')"
```

## 📊 Database Queries

### View Telegram Appointments
```javascript
db.appointments.find({ bookingSource: 'telegram' })
```

### Check Doctor Schedule
```javascript
db.appointments.find({ 
  doctorId: 'doctor_id_here',
  startAt: { $gte: new Date() }
}).sort({ startAt: 1 })
```

### List Active Doctors
```javascript
db.users.find({ role: 'doctor', is_active: true })
```

## 🐛 Troubleshooting

### No Doctors Showing
```javascript
// Make doctors active
db.users.updateMany(
  { role: 'doctor' },
  { $set: { is_active: true } }
)
```

### No Available Slots
- Check if date is in the past
- Verify working hours configuration
- See if doctor is fully booked

### Bot Not Starting
- Check TELEGRAM_BOT_TOKEN environment variable
- Verify MongoDB connection
- Review bot logs for errors

## 📚 Documentation

| File | Purpose |
|------|---------|
| `TELEGRAM_BOT_ENHANCED_FLOW.md` | Detailed features & examples |
| `TELEGRAM_BOT_ADMIN_GUIDE.md` | Admin configuration guide |
| `TELEGRAM_BOT_FLOW_DIAGRAM.md` | Visual flow diagrams |
| `TELEGRAM_IMPLEMENTATION_COMPLETE.md` | Implementation summary |

## 🎯 Key Functions

### `getAvailableTimeSlots(doctorId, date)`
Returns available 30-minute slots for a doctor on a specific date.

### `formatTimeSlotsForDisplay(slots)`
Groups slots by Morning/Afternoon/Evening for better UX.

### `handleBookingDoctor(chatId, text)`
Handles doctor selection and shows available dates.

### `handleBookingDate(chatId, text)`
Checks availability and displays free time slots.

## 💡 Tips

1. **Always have active doctors** - Bot shows only doctors with `is_active: true`
2. **Add specializations** - Store in `metadata.specialization` field
3. **Monitor logs** - Check for booking errors or double-bookings
4. **Use PM2 in production** - For auto-restart and monitoring
5. **Redis for scale** - Replace in-memory conversation state

## 🔐 Environment Variables

```env
TELEGRAM_BOT_TOKEN=your_bot_token
MONGODB_URI=mongodb://localhost:27017/karur_hms
Gemi_Api_Key=your_gemini_key (optional)
```

## 📞 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Welcome message |
| `/book` | Book appointment |
| `/myappointments` | View appointments (future) |
| `/help` | Show help |
| `/cancel` | Cancel current operation |

## 📈 Monitoring

```javascript
// Check conversation states
console.log(conversations.size); // Active conversations

// Check appointment count today
db.appointments.countDocuments({
  startAt: { 
    $gte: new Date(new Date().setHours(0,0,0,0)) 
  },
  bookingSource: 'telegram'
})
```

## 🎨 Customization Examples

### Add Lunch Break (1-2 PM)
```javascript
for (let hour = workingHours.start; hour < workingHours.end; hour++) {
  if (hour === 13) continue; // Skip 1 PM hour
  for (let minute of [0, 30]) {
    allSlots.push(`${hour}:${minute}`);
  }
}
```

### Change to 15-minute Slots
```javascript
for (let minute of [0, 15, 30, 45]) { // Instead of [0, 30]
  allSlots.push(`${hour}:${minute}`);
}
```

### Different Hours per Doctor
```javascript
// Store in User.metadata.workingHours
const doctor = await User.findById(doctorId);
const workingHours = doctor.metadata?.workingHours || { start: 9, end: 18 };
```

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Bot crashes | Use PM2: `pm2 start Bot/telegram_bot.js` |
| Slow response | Add database indexes |
| Memory leak | Use Redis for conversation state |
| Time zone issues | Store dates in UTC, display in local |

## ✅ Deployment Checklist

- [ ] MongoDB running and accessible
- [ ] Active doctors in database
- [ ] TELEGRAM_BOT_TOKEN configured
- [ ] Test booking flow works
- [ ] Monitor logs for errors
- [ ] Set up PM2 or similar process manager
- [ ] Configure alerts for downtime
- [ ] Document for support team

## 📞 Support

For issues or questions:
1. Check bot logs
2. Review documentation files
3. Test with `test_appointment_availability.js`
4. Contact development team

---

**Version:** 2.0 (Enhanced Flow)  
**Date:** February 15, 2026  
**Status:** ✅ Production Ready
