# Quick Test Guide: Patient Chatbot

## 🚀 Quick Start

### 1. Start Server
```bash
cd Server
node Server.js
```

Wait for: `🌍 Server is listening on port 3000`

---

## 🧪 Test Scenarios

### Scenario 1: Check if Patients Exist

**Before testing chatbot, verify you have patients in database:**

```bash
# Option 1: Using MongoDB Compass
# Connect to: mongodb+srv://mahasanjit08_db_user:YXW5b2D1QzXIL6ba@cluster0.hjacbky.mongodb.net/test
# Browse to "patients" collection
# Should see patient documents

# Option 2: Using mongosh CLI
mongosh "mongodb+srv://mahasanjit08_db_user:YXW5b2D1QzXIL6ba@cluster0.hjacbky.mongodb.net/test"
db.patients.find().limit(5)
```

**Expected Output:**
```javascript
{
  _id: "some-uuid",
  firstName: "John",
  lastName: "Doe",
  phone: "9876543210",
  email: "john@email.com",
  ...
}
```

---

### Scenario 2: Login and Get JWT Token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@hms.com",
    "password": "doctor123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "doctor@hms.com",
    "role": "doctor"
  }
}
```

**Save the token** for next steps!

---

### Scenario 3: Test Patient Search

Replace `YOUR_JWT_TOKEN` with the token from Step 2.

#### Test 3a: Search by First Name Only
```bash
curl -X POST http://localhost:3000/api/bot/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "Show me patient John",
    "metadata": {
      "userRole": "doctor"
    }
  }'
```

#### Test 3b: Search by Full Name
```bash
curl -X POST http://localhost:3000/api/bot/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "Show details of John Doe",
    "metadata": {
      "userRole": "doctor"
    }
  }'
```

#### Test 3c: Search by Phone Number
```bash
curl -X POST http://localhost:3000/api/bot/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "Find patient with phone 9876543210",
    "metadata": {
      "userRole": "doctor"
    }
  }'
```

#### Test 3d: Search by Email
```bash
curl -X POST http://localhost:3000/api/bot/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "message": "Patient info for john@email.com",
    "metadata": {
      "userRole": "doctor"
    }
  }'
```

---

## 🔍 Check Server Logs

Watch the server console for these debug messages:

### ✅ Successful Search
```
[cid_xxxxx] 🔍 Searching for patient with entity: "John Doe"
[cid_xxxxx] ✅ Found patient: John Doe (ID: uuid-here)
```

### ⚠️ Not Found - Trying Alternative
```
[cid_xxxxx] 🔍 Searching for patient with entity: "John Doe"
[cid_xxxxx] ⚠️ No patient found with simple search, trying full name split...
[cid_xxxxx] 🔍 Trying split search: firstName="John", lastName="Doe"
[cid_xxxxx] ✅ Found patient via split: John Doe
```

### ❌ Not Found
```
[cid_xxxxx] 🔍 Searching for patient with entity: "Nonexistent Name"
[cid_xxxxx] ⚠️ No patient found with simple search, trying full name split...
[cid_xxxxx] ❌ No patient found for entity: "Nonexistent Name"
```

---

## 📊 Expected Response Format

### When Patient Found
```json
{
  "success": true,
  "reply": "Based on the patient records, here's the information for John Doe:\n\n**Patient Details:**\n- Name: John Doe\n- Age: 35 years\n- Gender: Male\n- Blood Group: O+\n- Phone: 9876543210\n- Email: john@email.com\n\n**Recent Prescriptions:**\n- Medicine: Paracetamol 500mg, Dosage: 1-0-1, Duration: 5 days\n\n**Allergies:** Penicillin\n\n**Vitals:**\n- Blood Pressure: 120/80\n- Weight: 70 kg\n- Height: 175 cm\n\nIs there anything specific you'd like to know about this patient?",
  "chatId": "session-uuid",
  "meta": {
    "latencyMs": 2340
  }
}
```

### When Patient Not Found
```json
{
  "success": true,
  "reply": "I couldn't find any patient records matching that name or identifier in the database. Could you please:\n\n1. Check if the name is spelled correctly\n2. Try searching by phone number or patient ID\n3. Verify the patient is registered in the system\n\nWould you like me to help you with something else?",
  "chatId": "session-uuid",
  "meta": {
    "latencyMs": 1520
  }
}
```

---

## 🐛 Troubleshooting

### Problem 1: "Patient not found" but patient exists

**Check:**
```bash
# In MongoDB
db.patients.findOne({ firstName: /john/i })
```

**If patient exists:**
- Check spelling in your query
- Try exact first name
- Try phone number instead
- Check server logs for search attempts

---

### Problem 2: Server returns error 500

**Check server logs for:**
```
[cid_xxxxx] Patient name search error: ...
```

**Common causes:**
- MongoDB connection lost
- Patient model not properly loaded
- Invalid regex in search

**Solution:**
- Restart server
- Check MongoDB connection
- Verify `.env` has correct `MANGODB_URL`

---

### Problem 3: Empty response from chatbot

**Check:**
1. JWT token is valid (not expired)
2. User role is set correctly
3. Gemini API key is valid
4. Check metrics endpoint:
   ```bash
   curl http://localhost:3000/api/bot/metrics
   ```

---

### Problem 4: Slow responses

**Check:**
- Network latency to Google Gemini API
- MongoDB query performance
- Server load

**Typical response times:**
- Simple query: 1-2 seconds
- Patient search: 2-3 seconds
- Complex query: 3-5 seconds

---

## 📝 Create Test Patient (if needed)

If you don't have any patients, create one:

```bash
curl -X POST http://localhost:3000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phone": "9876543210",
    "email": "john@test.com",
    "dateOfBirth": "1990-01-15",
    "gender": "Male",
    "bloodGroup": "O+",
    "age": 35,
    "address": {
      "houseNo": "123",
      "street": "Main Street",
      "city": "Chennai",
      "state": "Tamil Nadu",
      "pincode": "600001"
    },
    "vitals": {
      "heightCm": 175,
      "weightKg": 70,
      "bp": "120/80"
    },
    "allergies": ["Penicillin"],
    "notes": "Regular checkup patient"
  }'
```

**Expected Response:**
```json
{
  "_id": "generated-uuid",
  "firstName": "John",
  "lastName": "Doe",
  ...
}
```

Now test chatbot with: "Show me patient John Doe"

---

## ✅ Success Criteria

- [ ] Server starts without errors
- [ ] Can login and get JWT token
- [ ] Can create test patient (if needed)
- [ ] Patient search by first name works
- [ ] Patient search by full name works
- [ ] Patient search by phone works
- [ ] Server logs show search attempts
- [ ] Chatbot returns patient details
- [ ] Response includes name, age, vitals
- [ ] Response time < 5 seconds

---

## 🎯 Test Different User Roles

### Doctor Role (Medical Focus)
```json
{
  "message": "Show patient John Doe's medical history",
  "metadata": { "userRole": "doctor" }
}
```

Expected: Medical details, prescriptions, allergies

### Admin Role (Administrative Focus)
```json
{
  "message": "Show patient statistics",
  "metadata": { "userRole": "admin" }
}
```

Expected: Patient counts, metrics

### Pharmacist Role (Medicine Focus)
```json
{
  "message": "Show John Doe's prescriptions",
  "metadata": { "userRole": "pharmacist" }
}
```

Expected: Prescription details, medicine list

---

## 📞 Quick Commands Reference

```bash
# Start server
cd Server && node Server.js

# Login as doctor
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@hms.com","password":"doctor123"}'

# Test patient search
curl -X POST http://localhost:3000/api/bot/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message":"Show patient John","metadata":{"userRole":"doctor"}}'

# Check bot health
curl http://localhost:3000/api/bot/health

# Check bot metrics
curl http://localhost:3000/api/bot/metrics

# List all patients (in mongosh)
db.patients.find().pretty()

# Count patients
db.patients.countDocuments()
```

---

## 🎉 Success Example

**Query:**
```
"Show me the details of patient John Doe"
```

**Server Logs:**
```
[cid_abc123] 🔍 Searching for patient with entity: "John Doe"
[cid_abc123] ⚠️ No patient found with simple search, trying full name split...
[cid_abc123] 🔍 Trying split search: firstName="John", lastName="Doe"
[cid_abc123] ✅ Found patient via split: John Doe
[cid_abc123] User role: doctor
[cid_abc123] Extracted intent: patient_info, entity: John Doe
[cid_abc123] Calling Gemini API with model: gemini-1.5-flash, maxTokens=1500
--- BOT CHAT END [cid_abc123] latency=2134ms session=uuid-here ---
```

**Response:**
```
Based on the records, here are the details for patient John Doe:

**Demographics:**
- Age: 35 years
- Gender: Male
- Blood Group: O+
- Contact: 9876543210

**Recent Vitals:**
- BP: 120/80 mmHg
- Weight: 70 kg
- Height: 175 cm

**Allergies:** Penicillin

**Recent Prescriptions:**
- Paracetamol 500mg (1-0-1 for 5 days)

Would you like more details about this patient?
```

---

**Status**: ✅ Ready for Testing  
**Next**: Run the test scenarios above  
**Support**: Check PATIENT_SEARCH_FIX.md for detailed troubleshooting
