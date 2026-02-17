# Availability Checker UI - Visual Guide

## 📍 Where to Find the UI

The Availability Checker UI is automatically displayed in:

1. **New Appointment Form** (`/admin/appointments` → "New Appointment" button)
2. **Edit Appointment Form** (Click edit icon on any appointment)

The UI appears automatically when you fill in:
- ✅ Patient
- ✅ Doctor
- ✅ Date
- ✅ Time

## 🎨 UI States & Visual Appearance

### 1. ✅ **AVAILABLE STATE** (Green)
```
┌─────────────────────────────────────────────┐
│ ✓ Available                                 │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                             │
│   ✓ Doctor      Available                  │
│   ✓ Patient     Available                  │
│                                             │
└─────────────────────────────────────────────┘
```
- **Border Color**: Green (#10b981)
- **Background**: Light green gradient
- **Checkmark Icon**: Green ✓
- **Status**: "Available"
- **Action**: User can proceed to book

---

### 2. ⚠️ **CONFLICT STATE** (Yellow/Orange)
```
┌─────────────────────────────────────────────┐
│ ⚠ Conflicts Detected                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                             │
│   ✗ Doctor      Busy                        │
│   ✓ Patient     Available                  │
│                                             │
│ Conflicts                                   │
│ ───────────                                 │
│ ⚠ Doctor has 2 appointment(s) during time  │
│                                             │
│   🕒 John Doe                               │
│      Feb 5, 10:00 AM - 10:30 AM            │
│      Confirmed                              │
│                                             │
│   🕒 Jane Smith                             │
│      Feb 5, 10:15 AM - 10:45 AM            │
│      Scheduled                              │
│                                             │
│ 📅 Available Time Slots                     │
│ ───────────────────────                     │
│   🕒 11:00 AM - 12:00 PM (60 minutes)      │
│   🕒 02:00 PM - 03:00 PM (60 minutes)      │
│   🕒 03:30 PM - 04:30 PM (60 minutes)      │
│                                             │
│ Recommendations                             │
│ ───────────────                             │
│ → Consider selecting a different time slot │
│ → Review the suggested available slots     │
│                                             │
└─────────────────────────────────────────────┘
```
- **Border Color**: Yellow/Orange (#f59e0b)
- **Background**: Light yellow gradient
- **Warning Icon**: ⚠️
- **Status**: "Conflicts Detected"
- **Shows**: Conflicting appointments with details
- **Suggests**: Alternative available time slots
- **Action**: User must select different time

---

### 3. 🔄 **CHECKING STATE** (Blue)
```
┌─────────────────────────────────────────────┐
│ ⏳ Checking availability...                 │
│                                             │
│   [Animated spinner]                        │
│                                             │
└─────────────────────────────────────────────┘
```
- **Border Color**: Blue (#3b82f6)
- **Background**: Light blue gradient
- **Animation**: Rotating spinner
- **Duration**: ~500ms (debounced)

---

### 4. ❌ **ERROR STATE** (Red)
```
┌─────────────────────────────────────────────┐
│ ✗ Failed to check availability             │
│                                             │
│   [Retry Button]                            │
│                                             │
└─────────────────────────────────────────────┘
```
- **Border Color**: Red (#ef4444)
- **Background**: Light red gradient
- **Error Icon**: ✗
- **Action**: Shows retry button

---

## 📊 Example Scenarios

### Scenario 1: Doctor is Busy
**User Action:**
1. Selects Dr. Smith
2. Selects Patient: John Doe
3. Selects Date: Feb 5, 2024
4. Selects Time: 10:00 AM

**UI Shows:**
```
⚠ Conflicts Detected
  ✗ Doctor - Busy
  ✓ Patient - Available

Conflicts:
  Doctor has 1 appointment(s) during this time
  • Jane Wilson
    Feb 5, 10:00 AM - 10:30 AM
    Confirmed

Available Time Slots:
  • 11:00 AM - 12:00 PM (60 min)
  • 02:00 PM - 03:00 PM (60 min)
```

**Submit Button:** DISABLED (grayed out)
**Button Text:** "Time Slot Not Available"

---

### Scenario 2: Patient is Busy
**User Action:**
1. Selects Dr. Smith
2. Selects Patient: John Doe (who already has appointment)
3. Selects Date: Feb 5, 2024
4. Selects Time: 10:00 AM

**UI Shows:**
```
⚠ Conflicts Detected
  ✓ Doctor - Available
  ✗ Patient - Has Appointment

Conflicts:
  Patient has 1 appointment(s) during this time
  • Dr. Jones
    Feb 5, 10:00 AM - 10:30 AM
    Confirmed
```

---

### Scenario 3: Both Available
**User Action:**
1. Selects Dr. Smith
2. Selects Patient: John Doe
3. Selects Date: Feb 5, 2024
4. Selects Time: 11:00 AM

**UI Shows:**
```
✓ Available
  ✓ Doctor - Available
  ✓ Patient - Available
```

**Submit Button:** ENABLED (blue)
**Button Text:** "Save Appointment"

---

## 🎯 UI Elements Breakdown

### Main Container
```css
- Border Radius: 12px
- Padding: 16px
- Margin: 16px 0
- Shadow: Subtle drop shadow
- Transition: Smooth color/size changes
```

### Status Header
```css
- Icon Size: 24px
- Font Size: 16px
- Font Weight: 600 (Semi-bold)
- Gap: 12px between icon and text
```

### Availability Items
```css
- Background: Light gray (rgba(248, 250, 252, 0.5))
- Padding: 12px
- Border Radius: 8px
- Gap: 12px between items
```

### Conflict Section
```css
- Background: Light red (#fef2f2)
- Border Left: 4px solid red
- Border Radius: 6px
- Padding: 12px
```

### Suggestion Section
```css
- Background: Light green (#f0fdf4)
- Border Left: 4px solid green
- Border Radius: 6px
- Padding: 12px
- Hoverable slots with animation
```

### Time Slots
```css
- Clickable cards
- Hover Effect: Transform translateX(4px)
- Background: White
- Border: 1px solid light green
- Hover Background: Extra light green
```

---

## 🔧 Component Location in Forms

### New Appointment Form
**File:** `src/modules/admin/appointments/components/NewAppointmentForm.jsx`

**Position:** After "Assigned Doctor" section, before "Appointment Details"
```jsx
<h3>Assigned Doctor</h3>
<select>...</select>

{/* Availability Checker appears here */}
<AvailabilityChecker ... />

<h3>Appointment Details</h3>
<input type="text" placeholder="Reason" />
```

### Edit Appointment Form
**File:** `src/modules/admin/appointments/components/EditAppointmentForm.jsx`

**Position:** After "Appointment Details" section, before "Clinical Notes"
```jsx
<FormSection title="Appointment Details">
  <input type="date" />
  <input type="time" />
  <input placeholder="Reason" />
</FormSection>

{/* Availability Checker appears here */}
<AvailabilityChecker ... />

<FormSection title="Clinical Notes">
  <textarea>...</textarea>
</FormSection>
```

---

## 📱 Responsive Behavior

### Desktop (> 640px)
- Full width display
- All sections expanded
- Side-by-side doctor/patient status

### Mobile (< 640px)
- Stacked layout
- Reduced padding (12px)
- Vertical doctor/patient status
- Smaller fonts
- Touch-friendly click areas

---

## 🎬 Animation & Interactions

### Auto-Check (Debounced)
- User selects/changes doctor → Wait 500ms → Check availability
- User selects/changes date → Wait 500ms → Check availability
- User selects/changes time → Wait 500ms → Check availability

### Visual Feedback
- **Checking**: Spinning loader animation
- **Success**: Smooth fade-in with green border
- **Conflict**: Smooth fade-in with yellow border, shake animation
- **Error**: Smooth fade-in with red border

### Button States
```javascript
if (checking) {
  // Button shows: "Checking..."
  // Button: Disabled
}
else if (!available) {
  // Button shows: "Time Slot Not Available"
  // Button: Disabled, opacity 0.6
}
else if (saving) {
  // Button shows: "Saving..."
  // Button: Disabled
}
else {
  // Button shows: "Save Appointment"
  // Button: Enabled, blue background
}
```

---

## 🚀 Testing the UI

### Test Case 1: See Conflicts
1. Go to Appointments page
2. Click "New Appointment"
3. Select a doctor who has appointments
4. Select a patient
5. Select today's date
6. Select a time when doctor is busy (e.g., 10:00 AM)
7. **Expected**: Yellow warning box with conflict details

### Test Case 2: See Available
1. Same as above
2. But select a time when doctor is free (e.g., 4:00 PM)
3. **Expected**: Green success box

### Test Case 3: See Suggestions
1. When conflict appears
2. **Expected**: List of 5 available time slots
3. Click a suggested slot → Should auto-fill time field

### Test Case 4: Button Behavior
1. When available: Button is blue and clickable
2. When not available: Button is grayed out and shows "Time Slot Not Available"
3. Try to submit when not available: Alert message appears

---

## 💡 Tips for Users

1. **Wait for the check**: Component automatically checks availability after 500ms
2. **Review conflicts**: Click on conflicting appointments to see details
3. **Use suggestions**: Click suggested time slots for quick rebooking
4. **Edit mode**: When editing, current appointment is excluded from conflict check
5. **Real-time**: Changes update immediately as you modify date/time

---

## 📞 User Workflow

```
1. User opens New Appointment form
   ↓
2. Selects Patient
   ↓
3. Selects Doctor
   ↓
4. Selects Date & Time
   ↓
5. [AUTO] Availability Checker appears
   ↓
6. [AUTO] Checks availability (500ms debounce)
   ↓
7. Shows result:
   - ✅ Green = Can book
   - ⚠️ Yellow = Conflict (shows alternatives)
   - ❌ Red = Error
   ↓
8. If available:
   → User clicks "Save Appointment" ✓
   
9. If not available:
   → User selects suggested time slot
   → Or picks different doctor/date
   → Re-checks automatically
```

---

## 🎨 Color Palette Reference

```css
/* Success/Available */
--success-green: #10b981;
--success-bg: #ecfdf5;
--success-border: #d1fae5;

/* Warning/Conflict */
--warning-yellow: #f59e0b;
--warning-bg: #fffbeb;
--warning-border: #fef3c7;

/* Error */
--error-red: #ef4444;
--error-bg: #fef2f2;
--error-border: #fee2e2;

/* Info/Checking */
--info-blue: #3b82f6;
--info-bg: #eff6ff;
--info-border: #dbeafe;

/* Neutral */
--gray-50: #f9fafb;
--gray-200: #e5e7eb;
--gray-500: #6b7280;
--gray-700: #374151;
--gray-900: #111827;
```

---

## 🔍 Troubleshooting

### UI doesn't appear
✓ Check all fields are filled (doctor, patient, date, time)
✓ Check console for errors
✓ Verify availability service is imported

### Shows "Checking..." forever
✓ Check API endpoint is running
✓ Check network tab for failed requests
✓ Verify authentication token

### Conflicts not showing
✓ Verify appointments exist in database
✓ Check appointment status (cancelled appointments are excluded)
✓ Verify correct doctor/patient IDs

---

**🎉 The UI is now fully integrated and ready to use!**
