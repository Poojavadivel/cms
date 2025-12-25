# 🐛 AutoFocus Cursor Jump Bug - FIXED

## Problem Description
When typing in the Age field (or any input field), after entering just 1 character, the cursor would automatically jump back to the first field (Name field) in the current step.

## Root Cause
The `autoFocus` HTML attribute was added to the first input field of each step:
- Step 1: First Name field had `autoFocus`
- Step 2: Phone Number field had `autoFocus`
- Step 3: Known Conditions field had `autoFocus`
- Step 4: Height field had `autoFocus`

### Why This Caused the Bug
When you typed in ANY field, React would re-render the component due to state updates (formData changes). On each re-render, the browser would re-focus the element with the `autoFocus` attribute, causing the cursor to jump from wherever you were typing back to the first field.

### The Flow:
1. User clicks on Age field
2. User types "1"
3. React state updates (formData.age = "1")
4. Component re-renders
5. Browser sees `autoFocus` on First Name field
6. Cursor jumps to First Name field ❌

## Solution
Removed all `autoFocus` attributes from all input fields in the component.

### Files Changed
- `/react/hms/src/components/patient/addpatient.jsx`

### Changes Made
Removed `autoFocus` from 4 locations:
1. Line ~493: First Name input (Step 1)
2. Line ~567: Phone Number input (Step 2)
3. Line ~611: Known Conditions input (Step 3)
4. Line ~643: Height input (Step 4)

## Testing
✅ Verified: No `autoFocus` attributes remain in the file
✅ Expected behavior: Users can now type in any field without cursor jumping
✅ Users can still naturally tab between fields or click to focus

## User Experience Impact
### Before Fix:
- ❌ Frustrating typing experience
- ❌ Cannot complete Age field (or any field) in one go
- ❌ Had to keep clicking back to the field after each character

### After Fix:
- ✅ Smooth typing experience
- ✅ Cursor stays in the field where user is typing
- ✅ Natural tab navigation between fields
- ✅ Can complete any field without interruption

## Why AutoFocus Was There Initially
The `autoFocus` attribute is useful for focusing the first field when:
- A modal/dialog first opens
- Moving to a new step

However, it causes issues in React because:
- State changes trigger re-renders
- Re-renders re-apply the autoFocus
- This creates the cursor jump behavior

## Alternative Solutions (Not Needed Here)
If we wanted to keep auto-focus on step change:
1. Use `useEffect` with refs to programmatically focus only on step change
2. Use `autoFocus` but with a conditional based on whether it's initial render
3. Use a library like `react-focus-lock`

For this use case, removing autoFocus entirely is the best solution as:
- Users can click/tab to fields naturally
- No interruption during typing
- Simpler code without side effects

## Verification Command
```bash
Select-String -Path "src\components\patient\addpatient.jsx" -Pattern "autoFocus"
```
Should return: No matches (0 results)

---

**Status:** ✅ FIXED
**Verified:** 2025-12-25
**Impact:** High - Major UX improvement
