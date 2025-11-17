# 🚀 Production Deployment Guide

## ✅ Deployment Status
- **Frontend**: https://scholarstream-v3.vercel.app/
- **Backend**: https://scholarstream-backend.onrender.com/

---

## 🔧 Backend Configuration (Render)

### 1. Service Settings
- **Root Directory**: `backend`
- **Start Command**: `gunicorn app.main:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT`
- **Python Version**: 3.11.0

### 2. Required Environment Variables

Add these in Render Dashboard → Environment:

```bash
# Firebase Admin SDK (from Firebase Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID=scholarstream-i4i
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@scholarstream-i4i.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_X509_CERT_URL=your_cert_url

# Google Gemini AI (from Google AI Studio)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Upstash Redis (from Upstash Console)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token_here

# Cloudinary (from Cloudinary Dashboard)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# CORS Configuration - CRITICAL FOR FRONTEND CONNECTION
CORS_ORIGINS=https://scholarstream-v3.vercel.app,http://localhost:5173,http://localhost:3000

# Server Configuration
DEBUG=False
ENVIRONMENT=production
RATE_LIMIT_PER_MINUTE=60
GEMINI_RATE_LIMIT_PER_HOUR=1000
SCHOLARSHIP_CACHE_TTL_HOURS=24
AI_ENRICHMENT_CACHE_TTL_HOURS=168
```

---

## 🌐 Frontend Configuration (Vercel)

### 1. Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Backend API - Points to your Render backend
VITE_API_BASE_URL=https://scholarstream-backend.onrender.com

# Firebase Web App Config (from Firebase Console > Project Settings > Your apps > Web app)
VITE_FIREBASE_API_KEY=your_web_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=scholarstream-i4i.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=scholarstream-i4i
VITE_FIREBASE_STORAGE_BUCKET=scholarstream-i4i.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 2. Build Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

---

## 🧪 Post-Deployment Verification

### 1. Backend Health Check
```bash
curl https://scholarstream-backend.onrender.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "environment": "production",
  "version": "1.0.0"
}
```

### 2. API Documentation
Visit: https://scholarstream-backend.onrender.com/docs

### 3. Test CORS
Open browser console on https://scholarstream-v3.vercel.app/ and run:
```javascript
fetch('https://scholarstream-backend.onrender.com/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

**Success**: You should see the health check response
**Failure**: Check CORS_ORIGINS in Render environment variables

### 4. Test Frontend-Backend Connection
1. Visit https://scholarstream-v3.vercel.app/
2. Open Developer Tools → Network tab
3. Sign up or log in
4. Verify API calls to `scholarstream-backend.onrender.com` succeed with status 200

---

## 🔒 Security Checklist

- [ ] `DEBUG=False` in production backend
- [ ] Firebase Admin SDK private key is properly escaped with `\n`
- [ ] All API keys are set as environment variables (not hardcoded)
- [ ] CORS_ORIGINS only includes your frontend domain (no wildcards)
- [ ] Rate limiting is enabled (default: 60 req/min)
- [ ] Firebase security rules are configured in Firebase Console

---

## 🐛 Troubleshooting

### CORS Errors
**Symptom**: `Access-Control-Allow-Origin` errors in browser console

**Fix**:
1. Verify `CORS_ORIGINS` in Render includes: `https://scholarstream-v3.vercel.app`
2. No trailing slashes in URLs
3. Restart Render service after updating env vars

### Backend 500 Errors
**Check Render Logs**:
1. Render Dashboard → Your Service → Logs
2. Look for missing environment variables
3. Verify Firebase credentials format (private key must have `\n` properly escaped)

### Frontend Not Connecting
**Check**:
1. `VITE_API_BASE_URL` is set correctly in Vercel
2. No trailing slash in backend URL
3. Backend is running (check health endpoint)
4. Redeploy frontend after env var changes

### Render Free Tier Sleep
**Note**: Free tier sleeps after 15 minutes of inactivity
- First request may take 30-60 seconds to wake up
- Consider upgrading for production traffic

---

## 📊 Monitoring

### Backend Monitoring
- **Logs**: Render Dashboard → Logs
- **Metrics**: Render Dashboard → Metrics (CPU, Memory, Response Time)
- **Health Endpoint**: Monitor `/health` for uptime

### Frontend Monitoring
- **Deployments**: Vercel Dashboard → Deployments
- **Analytics**: Vercel Dashboard → Analytics
- **Logs**: Vercel Dashboard → Logs

---

## 🔄 Deployment Workflow

### Backend Updates
1. Push changes to GitHub
2. Render automatically deploys from `main` branch
3. Verify deployment in Render Dashboard
4. Test health endpoint

### Frontend Updates
1. Push changes to GitHub
2. Vercel automatically deploys from `main` branch
3. Preview deployment is created for each push
4. Production deployment on merge to main

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Firebase Docs**: https://firebase.google.com/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com/

---

Alhamdulillah! 🎉 Your full-stack app is now production-ready!
