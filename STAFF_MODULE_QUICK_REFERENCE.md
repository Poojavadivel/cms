# Staff Module - Quick Reference Guide

## 🎯 Quick Actions

### View Staff List
```
Navigate to: /admin/staff
```

### Search Staff
```
Search bar → Type: name, ID, department, designation, contact, or staff code
```

### Filter Staff
```
Status Tabs → All | Available | Inactive
More Filters → Department dropdown
```

### Create New Staff
```
Click "New Staff Member" button → Fill form → Submit
```

### View Staff Details
```
Click eye icon (👁️) on any staff row
```

### Edit Staff
```
Click edit icon (✏️) on any staff row
OR
View details → Click "Edit Details" button
```

### Delete Staff
```
Click delete icon (🗑️) → Confirm deletion
```

### Download Report
```
Click download icon (⬇️) on any staff row
- Automatically downloads doctor report for doctors
- Downloads staff report for others
```

---

## 📊 Table Columns

| Column | Description |
|--------|-------------|
| **Staff Code** | Shows avatar + staff code (STF-001) |
| **Staff Name** | Full name of staff member |
| **Designation** | Job title (Doctor, Nurse, etc.) |
| **Department** | Department name |
| **Contact** | Phone number |
| **Status** | Available / On Leave / Busy / Off Duty |
| **Actions** | View, Edit, Delete, Download buttons |

---

## 🎨 Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| **Available** | 🟢 Green | Staff is available for work |
| **On Leave** | 🟡 Amber | Staff is on leave |
| **Busy** | 🔴 Red | Staff is busy |
| **Off Duty** | ⚪ Gray | Staff is off duty |

---

## 📝 Form Fields

### Basic Information
- **Full Name** * (Required)
- **Staff Code** (e.g., STF-001, DOC-102)
- **Designation** * (Required)
- **Department** * (Required - Dropdown)
- **Gender** (Male/Female/Other)
- **Date of Birth**

### Contact Information
- **Phone**
- **Email**
- **Location** (Branch/Clinic)

### Employment Details
- **Status** (Available/On Leave/Off Duty/Busy)
- **Shift** (Morning/Evening/Night/Flexible)
- **Joining Date**
- **Experience (Years)**

### Professional Details
- **Roles** (comma-separated: doctor, supervisor)
- **Qualifications** (comma-separated: MBBS, MD)

---

## 🔍 Search Tips

### What You Can Search
- Staff name
- Staff ID
- Staff code
- Department
- Designation
- Contact number

### Search Examples
```
"John"           → Finds all staff with "John" in name
"Cardiology"     → Finds all staff in Cardiology department
"STF-001"        → Finds staff with code STF-001
"+91"            → Finds all staff with phone starting with +91
"doctor"         → Finds all staff with "doctor" in designation
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Esc` | Close modal |
| `Enter` | Submit form (when focused) |
| `Tab` | Navigate form fields |

---

## 🔔 Notifications

### Success Messages
- ✅ "Staff created successfully"
- ✅ "Staff updated successfully"
- ✅ "Deleted [Staff Name]"
- ✅ "Report downloaded successfully"

### Error Messages
- ❌ "Failed to fetch staff: [error]"
- ❌ "Failed: [error]"
- ❌ "Delete failed"
- ❌ "Error: [error message]"

---

## 🐛 Troubleshooting

### Staff Not Loading
1. Check internet connection
2. Verify authentication token
3. Check browser console for errors
4. Try refreshing the page

### Form Won't Submit
1. Check for validation errors (red borders)
2. Ensure required fields are filled
3. Check email format if provided
4. Try again in a few seconds

### Report Not Downloading
1. Check if popup blocker is enabled
2. Verify staff ID is valid
3. Check browser download settings
4. Try different browser

### Search Not Working
1. Clear search query and try again
2. Check if filters are applied
3. Refresh the page
4. Try different search terms

---

## 💡 Pro Tips

### Efficient Searching
- Use partial names: "John" finds "John Doe", "Johnny", etc.
- Search by code for quick access
- Combine with filters for precise results

### Bulk Management
- Use department filter to manage department-wise
- Use status filter to find available staff quickly
- Download reports during off-peak hours

### Data Entry
- Use tab key to navigate form quickly
- Copy-paste staff codes for consistency
- Use comma-separated format for roles/qualifications

### Report Management
- Download reports at month-end
- Use doctor-specific reports for doctors
- Save reports with meaningful filenames

---

## 📱 Mobile Usage

### Touch Gestures
- **Tap** → Select item
- **Tap & Hold** → Show actions
- **Swipe** → Scroll table
- **Pinch** → Zoom (if needed)

### Mobile-Specific Features
- Full-screen modals
- Touch-friendly buttons
- Responsive table layout
- Collapsible filters

---

## 🔒 Permissions

### Required Permissions
- **View Staff**: Read access to staff data
- **Create Staff**: Write access to create new staff
- **Edit Staff**: Write access to modify staff
- **Delete Staff**: Delete access
- **Download Reports**: Report access

---

## 📞 Support

### Common Issues
| Issue | Solution |
|-------|----------|
| Can't see staff list | Check permissions and login status |
| Form validation error | Check required fields and format |
| Download not working | Check browser settings and try again |
| Status not updating | Refresh the page |

### Contact Support
If issues persist:
1. Note the error message
2. Take a screenshot if possible
3. Contact IT support with details
4. Provide staff ID if relevant

---

## 📖 Related Links

- [Full Documentation](./STAFF_MODULE_REACT_COMPLETE.md)
- [API Documentation](./STAFF_MODULE_API_ANALYSIS.md)
- [Flutter Comparison](./API_CALLS_FLUTTER_VS_REACT_COMPARISON.md)

---

**Last Updated:** December 15, 2024  
**Version:** 1.0.0  
**Status:** Production Ready
