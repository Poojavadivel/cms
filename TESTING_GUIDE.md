# Staff Module Testing Guide

## Quick Test Checklist

### 1. API Connection Test
```bash
# Test if API is accessible
curl https://hms-dev.onrender.com/api/staff

# Expected: 200 OK with staff data or 401 (needs auth)
# NOT Expected: 404 Not Found
```

### 2. Manual UI Testing Steps

#### A. Staff List View
1. Navigate to Staff page in admin module
2. Verify staff list loads without 404 errors
3. Check that all columns are visible
4. Ensure no horizontal scrollbar appears
5. Verify pagination controls work
6. Test search functionality (type in search box)
7. Test department filter dropdown
8. Test status filter tabs (All, Active, Inactive)
9. Check that avatars display correctly based on gender

**Expected Results**:
- ✅ Staff list loads successfully
- ✅ No console errors
- ✅ No 404 API errors
- ✅ Table fits screen width
- ✅ All 4 action buttons visible in each row

#### B. Create New Staff
1. Click "+ New Staff Member" button
2. Verify form modal opens
3. Fill in required fields:
   - Name: "Test Staff Member"
   - Email: "test@hospital.com"
   - Contact: "+91 9876543210"
   - Gender: Select from dropdown
   - Designation: "Nurse"
   - Department: "Emergency"
4. Click "Save & Close"
5. Verify new staff appears in list

**Expected Results**:
- ✅ Form opens without errors
- ✅ All fields are editable
- ✅ Gender dropdown has options
- ✅ Validation works
- ✅ Success notification appears
- ✅ New staff added to list

#### C. Edit Staff
1. Click Edit icon (pencil) on any staff row
2. Verify form opens with existing data
3. Change department to different value
4. Click "Save & Close"
5. Verify changes are saved

**Expected Results**:
- ✅ Form opens with pre-filled data
- ✅ All fields are editable
- ✅ Save works without errors
- ✅ Changes reflect in list

#### D. View Staff Details
1. Click Eye icon on any staff row
2. Verify detail modal opens
3. Check all tabs (Overview, Schedule, Credentials, Activity, Files)
4. Verify staff information is complete
5. Test primary action buttons (Call, Message, Email, Schedule)
6. Click Edit button in detail view
7. Verify inline editing works
8. Click Close button

**Expected Results**:
- ✅ Detail modal opens in separate page/modal (NOT alert)
- ✅ All information displays correctly
- ✅ Tabs are clickable
- ✅ Avatar displays based on gender
- ✅ Status badge shows correct color
- ✅ Edit mode works
- ✅ No scrollbars visible
- ✅ Modal properly sized (95% width on desktop)

#### E. Delete Staff
1. Click Delete icon (trash) on any staff row
2. Verify confirmation dialog appears
3. Click "Cancel" - nothing happens
4. Click Delete icon again
5. Click "OK" in confirmation
6. Verify staff is removed from list
7. Verify success notification

**Expected Results**:
- ✅ Confirmation dialog shows
- ✅ Cancel works
- ✅ Delete works
- ✅ Optimistic UI update (instant removal)
- ✅ Success message shown

#### F. Download Reports
1. Click Download icon on a doctor staff member
2. Verify download starts
3. Check that PDF downloads successfully
4. Click Download icon on non-doctor staff
5. Verify different report format downloads

**Expected Results**:
- ✅ Download button shows loading state
- ✅ PDF file downloads to browser
- ✅ Doctor reports use doctor endpoint
- ✅ Regular staff use staff endpoint
- ✅ Success notification appears

---

### 3. Responsive Design Test

#### Desktop (>1200px)
- [ ] Table shows all columns
- [ ] Action buttons fit in cell
- [ ] Modals are 95% width
- [ ] No horizontal scroll

#### Tablet (768px - 1199px)
- [ ] Table remains scrollable
- [ ] Modals adapt to screen size
- [ ] Buttons remain accessible

#### Mobile (<768px)
- [ ] Table scrolls horizontally (expected)
- [ ] Modals go full-screen
- [ ] Touch targets are adequate
- [ ] No layout breaks

---

### 4. Browser Compatibility Test

#### Chrome/Edge (Chromium)
- [ ] All features work
- [ ] No scrollbars visible
- [ ] Smooth animations

#### Firefox
- [ ] All features work
- [ ] scrollbar-width: none works
- [ ] Layout correct

#### Safari
- [ ] All features work
- [ ] -webkit-scrollbar hiding works
- [ ] Modal rendering correct

---

### 5. Error Handling Test

#### Network Errors
1. Disable network
2. Try to load staff list
3. Verify error message shows
4. Re-enable network
5. Try again

**Expected**:
- ✅ User-friendly error message
- ✅ No app crash
- ✅ Retry works

#### Validation Errors
1. Open create staff form
2. Leave required fields empty
3. Try to save

**Expected**:
- ✅ Validation errors shown
- ✅ Form doesn't submit
- ✅ Error messages clear

#### API Errors
1. Create staff with invalid data
2. Delete non-existent staff

**Expected**:
- ✅ Error caught gracefully
- ✅ User notified
- ✅ UI recovers correctly

---

### 6. Performance Test

#### Load Time
- [ ] Staff list loads in <2 seconds
- [ ] Search responds instantly
- [ ] Filters apply immediately
- [ ] Modals open smoothly

#### Pagination
- [ ] Page changes are instant
- [ ] No lag when switching pages
- [ ] Navigation buttons responsive

#### Concurrent Actions
- [ ] Multiple rapid clicks handled
- [ ] No duplicate API calls
- [ ] Loading states prevent double-submit

---

### 7. Accessibility Test

#### Keyboard Navigation
- [ ] Tab through all interactive elements
- [ ] Enter key submits forms
- [ ] Escape key closes modals
- [ ] Arrow keys work in dropdowns

#### Screen Reader
- [ ] All buttons have labels
- [ ] Forms have proper labels
- [ ] Error messages announced
- [ ] Loading states announced

#### Color Contrast
- [ ] Text readable on backgrounds
- [ ] Status badges have good contrast
- [ ] Error messages visible
- [ ] Links distinguishable

---

### 8. Data Integrity Test

#### CRUD Cycle
1. Create staff member with specific data
2. Edit and change one field
3. View details - verify change persisted
4. Delete staff member
5. Verify removal from list
6. Refresh page - verify no longer exists

**Expected**:
- ✅ All operations succeed
- ✅ Data persists across operations
- ✅ No data loss
- ✅ Optimistic updates work correctly

---

### 9. Edge Cases Test

#### Empty State
- [ ] Empty search results show message
- [ ] Empty staff list shows message
- [ ] No errors with empty data

#### Large Dataset
- [ ] 100+ staff members load correctly
- [ ] Pagination works properly
- [ ] Search remains fast
- [ ] No memory leaks

#### Special Characters
- [ ] Names with apostrophes work
- [ ] Email validation correct
- [ ] Phone numbers formatted properly
- [ ] Unicode characters supported

#### Long Text
- [ ] Long names truncate with ellipsis
- [ ] Long departments wrap correctly
- [ ] Notes field handles paragraphs
- [ ] No layout breaks

---

### 10. Security Test

#### Authentication
- [ ] Requires valid auth token
- [ ] 401 errors handled gracefully
- [ ] Token refresh works
- [ ] Logout clears cache

#### Authorization
- [ ] Only authorized users see staff module
- [ ] Role-based access enforced
- [ ] Sensitive data protected
- [ ] API calls include auth headers

---

## Automated Testing (Future)

### Unit Tests Needed
```javascript
// staffService.test.js
describe('staffService', () => {
  test('fetchStaffs returns array', async () => {
    const staff = await staffService.fetchStaffs();
    expect(Array.isArray(staff)).toBe(true);
  });
  
  test('createStaff returns created object', async () => {
    const newStaff = { name: 'Test' };
    const created = await staffService.createStaff(newStaff);
    expect(created).toHaveProperty('id');
  });
});

// Staff.test.jsx
describe('Staff Component', () => {
  test('renders staff list', () => {
    render(<Staff />);
    expect(screen.getByText('Staff Management')).toBeInTheDocument();
  });
  
  test('opens form on add button click', () => {
    render(<Staff />);
    fireEvent.click(screen.getByText('New Staff Member'));
    expect(screen.getByText('Add New Staff')).toBeInTheDocument();
  });
});
```

### Integration Tests Needed
- Complete CRUD workflow
- Form validation flow
- Error recovery flow
- Pagination and filtering

### E2E Tests Needed (Cypress/Playwright)
- User journey: Create → Edit → View → Delete
- Search and filter workflow
- Multi-page navigation
- Modal interactions

---

## Bug Report Template

If you find a bug, use this template:

```markdown
### Bug Title
Brief description of the issue

**Environment**:
- Browser: Chrome 120 / Firefox 121 / Safari 17
- OS: Windows 11 / macOS / Linux
- Screen Size: 1920x1080
- Date: 2024-12-15

**Steps to Reproduce**:
1. Go to Staff page
2. Click on ...
3. See error

**Expected Behavior**:
What should happen

**Actual Behavior**:
What actually happened

**Screenshots**:
[Attach if applicable]

**Console Errors**:
```
[Paste console errors here]
```

**Additional Context**:
Any other relevant information
```

---

## Success Criteria

### All Tests Pass ✅
- [ ] All UI tests pass
- [ ] No console errors
- [ ] No 404 API errors
- [ ] No horizontal scrollbars
- [ ] All action buttons accessible
- [ ] Modals properly sized
- [ ] Responsive design works
- [ ] Cross-browser compatible
- [ ] Error handling works
- [ ] Performance acceptable

### Ready for Production ✅
When all checkboxes above are checked, the module is ready for production deployment.

---

## Post-Deployment Monitoring

### Week 1
- Monitor error logs daily
- Check API response times
- Gather user feedback
- Fix critical bugs immediately

### Week 2-4
- Review analytics data
- Identify usage patterns
- Plan UX improvements
- Schedule v1.1 features

---

## Contact for Issues

**Module Owner**: Development Team
**Last Updated**: December 15, 2024
**Version**: 1.0.0

Report bugs via:
- GitHub Issues
- Support Slack Channel
- Email: support@example.com
