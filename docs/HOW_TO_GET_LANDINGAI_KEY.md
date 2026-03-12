# 🔑 How to Get a Valid LandingAI API Key

## Step-by-Step Guide

### 1. **Go to LandingAI Website**
Visit: https://landing.ai/

### 2. **Sign Up / Login**
- If new: Click "Sign Up" and create an account
- If existing: Click "Login"

### 3. **Access ADE (Advanced Document Extraction)**
- Navigate to "Products" → "Document Extraction (ADE)"
- Or go directly to: https://app.landing.ai/

### 4. **Get API Key**
- Go to "Settings" or "API Keys" section
- Click "Create New API Key" or "Generate API Key"
- Copy the key (it should look like: `sk-live-...` or similar format)

### 5. **Update Your Code**

**Option A: Environment Variable (Recommended)**

Add to `Server/.env`:
```env
LANDINGAI_API_KEY=sk-live-your-actual-key-here
```

**Option B: Direct in Code**

Edit `Server/utils/landingai_scanner.js` line 18:
```javascript
API_KEY: process.env.LANDINGAI_API_KEY || 'sk-live-your-actual-key-here'
```

### 6. **Restart Server**
```bash
cd Server
npm start
```

---

## 🔍 Why the Old Key Failed

The key you had: `ZHpvajlwZDk3ZHI2NGhvNG51aDNtOjM5Zk5NU21GOXpxblNoOWhVVFVuQTc0d1VUNWtRY0ZL`

LandingAI says: **"Missing user record with apikey"**

This means:
- ❌ The key doesn't exist in their system
- ❌ It may have been from a demo/trial
- ❌ It may have been generated for a different account
- ❌ It may have expired

---

## 💡 Important Notes

1. **Free Trial**: LandingAI usually offers a free trial with limited requests
2. **Paid Plans**: Check pricing at https://landing.ai/pricing
3. **Key Format**: Valid keys usually start with `sk-live-` or `sk-test-`
4. **Keep it Secret**: Don't share your API key publicly

---

## ✅ Test Your New Key

After getting the new key, test it with:

```bash
cd Server
node test_landingai_api.js
```

You should see:
```
✅ Test 1: API Key Format
   ✓ API key looks valid

🔐 Test 2: Testing Authentication Methods
   Method 1: Authorization: Bearer <key>
   ✓ SUCCESS with Bearer token

📋 Summary:
   ✅ LandingAI API is working correctly!
```

---

## 🆘 Need Help?

- **Documentation**: https://docs.landing.ai/ade/
- **Support**: support@landing.ai
- **Community**: https://community.landing.ai/

---

**Once you have a valid key, paste it here and I'll update the code immediately!** 🚀
