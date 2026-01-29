# Pharmacy Module - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- React HMS application set up
- Backend API running

### Installation
```bash
cd react/hms
npm install
```

### Running the Application
```bash
npm start
```
The application will open at `http://localhost:3000`

## 📱 Accessing Pharmacy Module

### Login
1. Navigate to login page
2. Use pharmacist credentials:
   - Email: `pharmacist@hms.com`
   - Password: (your pharmacist password)

### Navigation
After login, you'll see the Pharmacist Root page with sidebar navigation:

1. **Dashboard** - `/pharmacist/dashboard`
   - View statistics
   - See low stock alerts
   - Monitor expiring batches
   - Quick actions

2. **Medicines** - `/pharmacist/medicines`
   - View all medicines
   - Search and filter
   - Check stock levels
   - Manage inventory

3. **Prescriptions** - `/pharmacist/prescriptions`
   - View pending prescriptions
   - Search by patient
   - Filter by date
   - Dispense medications

## 🎯 Features Overview

### Dashboard Features
- **Statistics Cards**
  - Total Medicines count
  - Low Stock alerts
  - Out of Stock items
  - Expiring Batches (90 days)

- **Low Stock Alert Panel**
  - Shows medicines below reorder level
  - Medicine name and SKU
  - Current stock quantity
  - Visual indicators

- **Expiring Batches Panel**
  - Batches expiring within 90 days
  - Batch number and medicine name
  - Days until expiry
  - Color-coded alerts

- **Quick Actions**
  - Add Medicine
  - Add Batch
  - New Prescription
  - Search Medicine

- **System Status**
  - Database connection
  - API status
  - Total inventory value

### Medicines/Inventory Features
- **Search**
  - By medicine name
  - By SKU
  - By category
  - By manufacturer

- **Filters**
  - All medicines
  - In Stock only
  - Low Stock only
  - Out of Stock only

- **Table View**
  - Medicine name and strength
  - Category
  - SKU
  - Stock quantity
  - Status badges

- **Pagination**
  - 10 items per page
  - Previous/Next navigation
  - Page counter

### Prescriptions Features
- **Statistics**
  - Today's prescriptions
  - This week's count
  - Total prescriptions
  - Filtered count

- **Search**
  - By patient name
  - By phone number
  - By prescription notes

- **Filters**
  - All time
  - Today only
  - This week
  - This month

- **Sorting**
  - Newest first
  - Oldest first
  - By patient name

- **View Modes**
  - List view
  - Grid view

- **Prescription Cards**
  - Patient information
  - Prescription date/time
  - Medicine list
  - Notes section
  - Dispense button

## 🎨 UI Components

### Color Coding
- **Blue** (#4f46e5) - Primary actions, In Stock
- **Green** (#10b981) - Success, Good status
- **Orange** (#f97316) - Warning, Low Stock
- **Red** (#ef4444) - Danger, Out of Stock
- **Yellow** (#eab308) - Alert, Expiring Soon

### Icons
- 💊 Medicine/Pharmacy
- ⚠️ Warning/Low Stock
- 🚫 Out of Stock
- 📅 Calendar/Expiring
- 💰 Money/Value
- 🔄 Refresh
- 🔔 Notifications
- ✅ Success/In Stock

## 🔧 Customization

### Changing Reorder Level
Default reorder level is 20 units. To change:
1. Update in backend database
2. Medicine table `reorderLevel` field

### Adjusting Expiry Alert Days
Default is 90 days. To change in code:
```javascript
// In Dashboard.jsx
const daysUntilExpiry = Math.floor((expiryDate - now) / (1000 * 60 * 60 * 24));
if (daysUntilExpiry > 0 && daysUntilExpiry <= 90) { // Change 90 to desired days
  expiringBatches++;
}
```

### Modifying Items Per Page
Default is 10 items. To change:
```javascript
// In Medicines.jsx
const itemsPerPage = 10; // Change to desired number
```

## 🐛 Troubleshooting

### Issue: No medicines showing
**Solution:**
1. Check if backend API is running
2. Verify API endpoint: `/api/pharmacy/medicines`
3. Check browser console for errors
4. Ensure proper authentication token

### Issue: Search not working
**Solution:**
1. Clear search input
2. Check if medicines data is loaded
3. Verify search query is not empty
4. Try refreshing the page

### Issue: Statistics showing zero
**Solution:**
1. Check if data is loaded
2. Verify backend has medicine/batch data
3. Check console for API errors
4. Try refreshing dashboard

### Issue: Styling looks broken
**Solution:**
1. Clear browser cache
2. Check if CSS files are loaded
3. Inspect console for CSS errors
4. Verify no conflicting global styles

## 📊 Performance Tips

### Optimize Loading
- Medicines load limit: 100 items (adjustable)
- Batches load limit: 100 items (adjustable)
- Prescriptions load: All pending (filtered in frontend)

### Improve Search
- Search debounce: 300ms recommended
- Client-side filtering for small datasets
- Server-side search for large datasets (>1000 items)

### Caching
- Consider adding caching for:
  - Medicines list (refresh every 5 minutes)
  - Dashboard stats (refresh every 2 minutes)
  - Prescriptions (refresh on action)

## 🔒 Security Notes

### Authentication Required
- All pharmacy endpoints require authentication
- JWT token must be valid
- Role must be 'pharmacist'

### Data Protection
- Patient information is sensitive
- Prescription data is confidential
- Medicine inventory is business-critical

## 📚 API Endpoints Used

```javascript
// Medicines
GET    /api/pharmacy/medicines
GET    /api/pharmacy/medicines/:id
POST   /api/pharmacy/medicines
PUT    /api/pharmacy/medicines/:id
DELETE /api/pharmacy/medicines/:id

// Batches
GET    /api/pharmacy/batches
POST   /api/pharmacy/batches

// Prescriptions
GET    /api/pharmacy/pending-prescriptions
GET    /api/pharmacy/prescriptions/:id
POST   /api/pharmacy/prescriptions/:id/dispense
```

## 📖 Further Reading

- [Flutter Pharmacy Module](../../lib/Modules/Pharmacist/) - Original implementation
- [API Documentation](../server/docs/API.md) - Backend API reference
- [React Patterns](https://reactpatterns.com/) - React best practices
- [Material Design](https://material.io/) - Design guidelines

## 💡 Tips & Tricks

### Keyboard Shortcuts
- `Ctrl + F` - Focus search input
- `Esc` - Clear search
- `F5` - Refresh page/data

### Quick Navigation
- Click logo to return to dashboard
- Use sidebar for direct navigation
- Browser back/forward work as expected

### Data Management
- Refresh button updates all data
- Search is case-insensitive
- Filters can be combined with search
- Pagination resets on new search/filter

## 🎓 Training Resources

### For New Users
1. Start with Dashboard overview
2. Explore Medicines inventory
3. Review Prescriptions list
4. Practice search and filters
5. Try different view modes

### For Developers
1. Review component structure
2. Understand state management
3. Learn API integration
4. Study CSS architecture
5. Follow React patterns

## 📞 Support

### Getting Help
- Check documentation first
- Review error messages
- Check browser console
- Contact development team

### Reporting Issues
Include:
- Browser and version
- Steps to reproduce
- Error messages
- Screenshots if applicable

---

**Last Updated:** January 2026
**Version:** 1.0.0
**Status:** Production Ready

Happy Pharmacy Management! 💊✨
