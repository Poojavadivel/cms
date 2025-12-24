# HMS React - Quick Reference Card

## 🚀 Essential Commands

```bash
# Development
npm start                    # Start dev server (localhost:3000)
npm run build               # Build for production
npx serve -s build          # Test production build locally

# Testing & Debugging
node scripts/test-backend.js         # Test backend connectivity
npm test                             # Run tests
scripts\CLEAR_CACHE.bat              # Clear build cache

# Deployment
git add .
git commit -m "message"
git push origin main
# Then deploy on Render.com
```

## 📂 Project Structure

```
hms/
├── src/          → Source code
├── public/       → Static files
├── docs/         → All documentation (18 files)
├── scripts/      → Utility scripts (5 files)
├── build/        → Production build (generated)
└── node_modules/ → Dependencies
```

## 🔑 Key Files

| File | Purpose |
|------|---------|
| `render.yaml` | Render.com deployment config |
| `.env.production` | Production environment vars |
| `DEPLOYMENT_CHECKLIST.md` | Pre-deployment checklist |
| `DEPLOYMENT_SUMMARY.md` | Complete project summary |
| `docs/README.md` | Documentation index |

## 🌐 URLs

| Environment | URL |
|------------|-----|
| Development | http://localhost:3000 |
| Production API | https://hms-dev.onrender.com/api |
| Production App | (Your Render URL) |

## 🔐 Login

```
Email: banu@karurgastro.com
Password: (your password)
```

## 📊 Status

- ✅ ESLint Warnings: 0
- ✅ Build: Success
- ✅ Staff Filter: Fixed
- ✅ Docs: Organized (18 files)
- ✅ Ready: Production

## 📚 Documentation

| Topic | Location |
|-------|----------|
| Complete Guide | `docs/README.md` |
| Deployment | `DEPLOYMENT_CHECKLIST.md` |
| API Setup | `docs/API_FIX_COMPLETE.md` |
| Troubleshooting | `docs/STAFF_DEBUG_GUIDE.md` |
| Staff Filter Fix | `docs/STAFF_FILTER_FIX.md` |

## 🔧 Environment Variables

```env
# Required
REACT_APP_API_URL=https://hms-dev.onrender.com/api

# Optional
REACT_APP_NAME=HMS - Hospital Management System
REACT_APP_VERSION=1.0.0
REACT_APP_ENABLE_DEBUG=false
GENERATE_SOURCEMAP=false
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails | `rm -rf node_modules && npm install` |
| White screen | Check console, verify API_URL |
| API errors | Run `node scripts/test-backend.js` |
| Filter not working | Check browser console for debug logs |
| Cache issues | Run `scripts\CLEAR_CACHE.bat` |

## 📦 Recent Fixes

1. ✅ Fixed 28 ESLint warnings → 0 warnings
2. ✅ Fixed staff Active/Inactive filter
3. ✅ Organized 18 docs in docs/ folder
4. ✅ Created render.yaml deployment config
5. ✅ Added intelligent status filtering

## 🚢 Deploy to Render

1. Push to GitHub: `git push origin main`
2. Go to Render.com
3. New Web Service → Connect repo
4. Render detects `render.yaml` automatically
5. Click "Apply" and deploy! 🎉

## 📞 Quick Links

- [Main README](README.md)
- [Documentation Index](docs/README.md)
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [Full Summary](DEPLOYMENT_SUMMARY.md)
- [File Analysis](docs/FILE_CLEANUP_ANALYSIS.md)

---

**Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** December 16, 2025
