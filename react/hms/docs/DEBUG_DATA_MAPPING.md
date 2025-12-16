# Data Mapping Debug Guide

## Expected Backend Response Structure

Based on `Server/Models/Patient.js`:

```json
{
  "_id": "uuid",
  "firstName": "John",
  "lastName": "Doe",
  "age": 35,
  "gender": "Male",
  "bloodGroup": "O+",
  "phone": "1234567890",
  "email": "john@example.com",
  "address": {
    "houseNo": "123",
    "street": "Main Street",
    "city": "New York",
    "state": "NY",
    "pincode": "10001",
    "country": "USA"
  },
  "vitals": {
    "heightCm": 175,
    "weightKg": 70,
    "bmi": 22.9,
    "bp": "120/80",
    "temp": 98.6,
    "pulse": 72,
    "spo2": 98
  },
  "metadata": {
    "emergencyContactName": "Jane Doe",
    "emergencyContactPhone": "0987654321",
    "insuranceNumber": "INS123456",
    "expiryDate": "2025-12-31",
    "avatarUrl": "/path/to/avatar.jpg",
    "medicalHistory": ["Diabetes", "Hypertension"]
  },
  "allergies": ["Peanuts", "Penicillin"],
  "notes": "Patient notes...",
  "doctorId": {
    "_id": "doctor-uuid",
    "firstName": "Dr. Jane",
    "lastName": "Smith",
    "email": "drjane@example.com"
  }
}
```

## React Model Extraction (Patients.js)

### Current Implementation

```javascript
// Address extraction
const addressObj = json.address && typeof json.address === 'object' ? json.address : {};

houseNo: addressObj.houseNo?.toString() || json.houseNo?.toString() || '',
street: addressObj.street?.toString() || json.street?.toString() || '',
city: addressObj.city?.toString() || json.city?.toString() || '',
state: addressObj.state?.toString() || json.state?.toString() || '',
pincode: addressObj.pincode?.toString() || json.pincode?.toString() || '',
country: addressObj.country?.toString() || json.country?.toString() || '',

// Vitals extraction (using _extractVital helper)
weight: PatientDetails._extractVital(json, 'weightKg', 'weight'),
height: PatientDetails._extractVital(json, 'heightCm', 'height'),
bmi: PatientDetails._extractVital(json, 'bmi', 'bmi'),
oxygen: PatientDetails._extractVital(json, 'spo2', 'oxygen'),

// Metadata extraction
const metadata = json.metadata && typeof json.metadata === 'object' ? json.metadata : {};

emergencyContactName: metadata.emergencyContactName?.toString() || json.emergencyContactName?.toString() || '',
emergencyContactPhone: metadata.emergencyContactPhone?.toString() || json.emergencyContactPhone?.toString() || '',
insuranceNumber: metadata.insuranceNumber?.toString() || json.insuranceNumber?.toString() || '',
expiryDate: metadata.expiryDate?.toString() || json.expiryDate?.toString() || '',
```

## Debugging Steps

1. **Check Browser Console** for logs:
   ```
   🔍 [PatientDetails.fromJSON] Raw data: {...}
   📦 [PatientDetails] Extracted metadata: {...}
   📦 [PatientDetails] Extracted addressObj: {...}
   ```

2. **Check Server Logs** for GET /api/patients/:id:
   ```
   📤 [PATIENT GET] Sending patient data:
      Patient ID: ...
      Has metadata: true/false
      Has vitals: true/false
   ```

3. **Check Network Tab**:
   - Request: GET /api/patients/:id
   - Response: Should contain address, vitals, metadata objects

## Common Issues

### Issue 1: Fields appear blank
**Cause**: Backend not returning nested objects
**Solution**: Check if data exists in database

### Issue 2: Address not showing
**Cause**: Address stored as flat fields instead of object
**Fix**: Run migration or update patient record

### Issue 3: Emergency contact blank
**Cause**: Data stored in wrong location (root vs metadata)
**Fix**: React model checks both locations (already implemented)

## Testing Queries

### Check MongoDB data structure:
```javascript
db.patients.findOne({ _id: 'patient-id' })
```

### Expected vs Actual:
- Check if `address` is object or string
- Check if `vitals` is object or individual fields
- Check if `metadata` contains emergency/insurance data

## Fix Actions

If data is blank:

1. **Check if patient has data in DB**
   - Use MongoDB Compass or command line
   - Verify address, vitals, metadata objects exist

2. **Add sample data for testing**:
   ```javascript
   await Patient.updateOne(
     { _id: 'patient-id' },
     {
       $set: {
         address: {
           houseNo: '123',
           street: 'Test Street',
           city: 'Test City',
           state: 'TS',
           pincode: '12345',
           country: 'India'
         },
         vitals: {
           heightCm: 170,
           weightKg: 65,
           bmi: 22.5,
           spo2: 98
         },
         metadata: {
           emergencyContactName: 'Emergency Contact',
           emergencyContactPhone: '9876543210',
           insuranceNumber: 'INS123456',
           expiryDate: '2025-12-31'
         }
       }
     }
   );
   ```

3. **Enable detailed logging**:
   - Already added in Patients.js model
   - Check console for extraction logs

4. **Verify API response**:
   - Open DevTools > Network
   - Find GET patients/:id request
   - Check Response tab for actual data structure
