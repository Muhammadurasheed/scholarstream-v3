# 🚀 ScholarStream Deployment Guide

## Quick Start (Local Development)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment (if not exists)
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
# Fill in Firebase credentials and Gemini API key

# Start backend
python run.py
```

**Expected Output:**
```
🚀 Starting ScholarStream FastAPI Backend...
✅ Environment variables loaded from .env
✅ Firebase initialized successfully
✅ Gemini AI Service initialized
✅ All scrapers initialized successfully
✨ Bismillah ir-Rahman ir-Rahim
Server will run at: http://localhost:8000
```

---

### 2. Frontend Setup

```bash
# From project root
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:8000" > .env

# Start frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

### 3. Test the Integration

1. Open http://localhost:5173
2. Sign up with a new account
3. Complete onboarding (all 6 steps)
4. Watch backend logs for discovery
5. Dashboard should show 80-90 opportunities within 10 seconds

---

## Environment Variables

### Backend `.env`
```bash
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True
ENVIRONMENT=development

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com

# Google Gemini AI
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.5-flash

# Redis (for caching)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
GEMINI_RATE_LIMIT_PER_HOUR=1000
```

### Frontend `.env`
```bash
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000

# Firebase (if using Firebase Auth)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## Production Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel deploy --prod
```

**Environment Variables in Vercel:**
- `VITE_API_BASE_URL` = Your Railway backend URL

#### Backend (Railway)
1. Connect GitHub repo to Railway
2. Select `backend` folder as root
3. Add environment variables from `.env`
4. Railway auto-deploys on push

---

### Option 2: Render (Both Frontend & Backend)

#### Backend Service
1. New Web Service → Connect repo
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `python run.py`
5. Add environment variables

#### Frontend Service
1. New Static Site → Connect repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add `VITE_API_BASE_URL` environment variable

---

### Option 3: Docker Deployment

#### Build Backend Image
```bash
cd backend
docker build -t scholarstream-backend .
docker run -p 8000:8000 --env-file .env scholarstream-backend
```

#### Build Frontend Image
```bash
# Create Dockerfile in root
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "3000"]
EXPOSE 3000

# Build and run
docker build -t scholarstream-frontend .
docker run -p 3000:3000 -e VITE_API_BASE_URL=http://backend:8000 scholarstream-frontend
```

#### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    env_file:
      - ./backend/.env
    restart: always

  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - VITE_API_BASE_URL=http://backend:8000
    depends_on:
      - backend
    restart: always
```

---

## Troubleshooting

### Backend Won't Start

**Error:** "GEMINI_API_KEY not configured"
**Solution:** Add `GEMINI_API_KEY` to `backend/.env`

**Error:** "Firebase initialization failed"
**Solution:** Check Firebase credentials in `.env` are correct

**Error:** "Port 8000 already in use"
**Solution:** Kill process or change PORT in `.env`

---

### Frontend Can't Reach Backend

**Error:** "Failed to fetch"
**Solution:** 
1. Check backend is running
2. Verify `VITE_API_BASE_URL` in `.env`
3. Check CORS settings in `backend/app/main.py`

**Error:** "CORS policy blocked"
**Solution:** Add frontend URL to `CORS_ORIGINS` in backend `.env`

---

### Discovery Returns No Opportunities

**Error:** Backend logs show "Scraper failed"
**Solution:**
1. Check internet connection (scrapers need external access)
2. Test if Devpost/MLH sites are accessible
3. Check Firebase connection

**Error:** All scrapers return 0 results
**Solution:**
1. Check scraper classes are properly imported
2. Verify `scraper_service.py` is using real scrapers
3. Test individual scrapers manually

---

## Health Checks

### Backend Health
```bash
curl http://localhost:8000/health
```

**Expected:**
```json
{
  "status": "healthy",
  "environment": "development",
  "version": "1.0.0"
}
```

### API Endpoints Test
```bash
# Test discovery
curl -X POST http://localhost:8000/api/scholarships/discover \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test", "profile": {"name": "Test", "academic_status": "Undergraduate", "school": "Test", "major": "CS", "interests": ["AI"]}}'
```

---

## Performance Monitoring

### Backend Metrics to Watch:
- Discovery time: Should be < 10 seconds
- Scraper success rate: > 80%
- Firebase write latency: < 500ms
- API response time: < 2 seconds

### Frontend Metrics to Watch:
- Initial page load: < 3 seconds
- Time to interactive: < 5 seconds
- API call latency: < 2 seconds
- Dashboard render time: < 1 second

---

## Security Checklist

- [ ] All API keys in environment variables (not in code)
- [ ] Firebase private key stored securely
- [ ] CORS configured correctly (not `*` in production)
- [ ] Rate limiting enabled
- [ ] HTTPS enabled in production
- [ ] Database rules configured (RLS/security rules)
- [ ] Authentication required for sensitive endpoints
- [ ] Input validation on all API endpoints
- [ ] Error messages don't expose sensitive info

---

## Maintenance

### Daily:
- Check backend logs for errors
- Monitor scraper success rates
- Check Firebase usage/limits

### Weekly:
- Review discovered opportunities quality
- Check database growth (Firestore)
- Test end-to-end discovery flow
- Update scraper selectors if sites changed

### Monthly:
- Review API usage and costs
- Update dependencies (security patches)
- Review and optimize slow queries
- Backup Firebase database

---

**Deploy with confidence! Alhamdulillah.** 🤲
