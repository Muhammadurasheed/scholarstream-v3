# 🚀 ScholarStream Deployment Guide

## Critical Configuration for Production

### Frontend (Vercel)

The frontend is deployed at: `https://scholarstream-v3.vercel.app/`

**Environment Variables** (Set in Vercel Dashboard):
```bash
VITE_FIREBASE_API_KEY=AIzaSyDaR2t8zhg9c7GiB35ad11wwrYjLOePseE
VITE_FIREBASE_AUTH_DOMAIN=scholarstream-i4i.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=scholarstream-i4i
VITE_FIREBASE_STORAGE_BUCKET=scholarstream-i4i.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=1086434452502
VITE_FIREBASE_APP_ID=1:1086434452502:web:18f8e8068b2006b1278137

# Backend API URL - CRITICAL
VITE_API_BASE_URL=https://scholarstream-backend.onrender.com
```

### Backend (Render)

The backend is deployed at: `https://scholarstream-backend.onrender.com`

**Environment Variables** (Set in Render Dashboard):
```bash
# CORS - Allow frontend origins
CORS_ORIGINS=https://scholarstream-v3.vercel.app,http://localhost:5173

# Firebase Admin SDK - Required for database access
FIREBASE_CREDENTIALS=<paste-your-firebase-service-account-json>

# Google Gemini AI - Required for chat assistant
GEMINI_API_KEY=<your-gemini-api-key>
GEMINI_MODEL=gemini-2.0-flash-exp

# Optional: Redis for caching
UPSTASH_REDIS_URL=<your-upstash-url>
UPSTASH_REDIS_TOKEN=<your-upstash-token>

# Application Config
PORT=8000
ENVIRONMENT=production
LOG_LEVEL=INFO
```

## Firebase Firestore Rules

**IMPORTANT**: Apply these rules in Firebase Console → Firestore Database → Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can read/write their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Onboarding drafts - users can read/write their own drafts
    match /onboarding_drafts/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Scholarships collection - authenticated users can read all
    match /scholarships/{scholarshipId} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend can write scholarships
    }
    
    // User matches - users can read their own matches
    match /user_matches/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only backend can write matches
    }
    
    // Discovery jobs - users can read their own jobs
    match /discovery_jobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend can write jobs
    }
    
    // Applications collection - users can read/write their own applications
    match /applications/{applicationId} {
      allow read: if request.auth != null && 
                     resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && 
                       request.resource.data.user_id == request.auth.uid;
      allow update, delete: if request.auth != null && 
                               resource.data.user_id == request.auth.uid;
    }
    
    // Saved scholarships - users can read/write their own saved items
    match /saved_scholarships/{docId} {
      allow read: if request.auth != null && 
                     resource.data.user_id == request.auth.uid;
      allow create: if request.auth != null && 
                       request.resource.data.user_id == request.auth.uid;
      allow delete: if request.auth != null && 
                       resource.data.user_id == request.auth.uid;
    }
    
    // Chat history - users can read/write their own chat
    match /chat_history/{userId}/messages/{messageId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default: deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Deployment Checklist

### Before Deploying:

- [ ] Update `VITE_API_BASE_URL` in Vercel to point to Render backend
- [ ] Set all Firebase credentials in Render environment variables
- [ ] Set Gemini API key in Render
- [ ] Configure CORS origins in Render to include Vercel URL
- [ ] Apply Firestore security rules in Firebase Console
- [ ] Test Firebase Authentication works
- [ ] Verify backend can connect to Firebase

### Testing Production:

1. **Test Authentication:**
   ```bash
   # Visit https://scholarstream-v3.vercel.app/login
   # Sign up with email/password
   # Should redirect to onboarding
   ```

2. **Test Onboarding:**
   ```bash
   # Complete all onboarding steps
   # Check browser console for errors
   # Verify profile saved to Firebase
   ```

3. **Test Discovery:**
   ```bash
   # After onboarding, dashboard should load
   # Check Network tab for API calls to Render
   # Should see opportunities within 10 seconds
   ```

4. **Test Chat Assistant:**
   ```bash
   # Click chat button on dashboard
   # Send message: "Find urgent hackathons"
   # Should get AI response within 5 seconds
   ```

5. **Test Saved Opportunities:**
   ```bash
   # Click bookmark icon on any opportunity
   # Navigate to /saved
   # Should see saved opportunity
   ```

## Common Issues & Fixes

### Issue: Dashboard shows skeleton loading forever
**Cause:** Backend URL not set or incorrect
**Fix:** Set `VITE_API_BASE_URL=https://scholarstream-backend.onrender.com` in Vercel

### Issue: Chat assistant doesn't respond
**Cause:** GEMINI_API_KEY not set in Render
**Fix:** Add Gemini API key to Render environment variables

### Issue: "Permission denied" errors during onboarding
**Cause:** Firestore rules not applied
**Fix:** Copy rules from above and apply in Firebase Console

### Issue: Backend returns 500 errors
**Cause:** Firebase credentials not set correctly
**Fix:** Copy entire service account JSON to `FIREBASE_CREDENTIALS` in Render

### Issue: CORS errors in browser console
**Cause:** Frontend origin not in CORS_ORIGINS
**Fix:** Add `https://scholarstream-v3.vercel.app` to CORS_ORIGINS in Render

## Monitoring

### Backend Logs (Render):
```bash
# View logs in Render dashboard
# Look for:
# - "Scrapers initialized"
# - "Discovery request received"
# - "Chat request received"
```

### Frontend Logs (Browser):
```javascript
// Check console for:
console.log('✅ Backend response:', data);
console.log('🔍 Fetching scholarships from backend');
console.log('🤖 Sending chat message');
```

## Performance Expectations

- **Initial Discovery:** 5-10 seconds
- **Dashboard Load (cached):** 1-2 seconds  
- **Chat Response:** 2-5 seconds
- **Save/Unsave:** <1 second

---

**Bismillah - May Allah (SWT) grant success to this project. Ameen.** 🤲
