# 🎓 ScholarStream Backend Setup Guide

**بسم الله الرحمن الرحيم - Allahu Musta'an**

Complete step-by-step guide to set up and run the ScholarStream FastAPI backend.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] Python 3.11+ installed
- [ ] Miniconda or Anaconda installed (recommended)
- [ ] Firebase account (free tier works)
- [ ] Google Cloud account (for Gemini API - free tier available)
- [ ] Git installed
- [ ] Text editor (VS Code recommended)

## 🔥 Part 1: Firebase Setup (15 minutes)

### Step 1.1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Project name: `ScholarStream` (or your preferred name)
4. Disable Google Analytics (not needed for this project)
5. Click **"Create project"**

### Step 1.2: Enable Firestore Database

1. In Firebase Console, click **"Firestore Database"** in left sidebar
2. Click **"Create database"**
3. Choose **"Start in production mode"**
4. Select location: `us-central` (or closest to your users)
5. Click **"Enable"**

### Step 1.3: Set Up Firestore Security Rules

1. In Firestore, go to **"Rules"** tab
2. Replace default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Scholarships collection (public read, admin write)
    match /scholarships/{scholarshipId} {
      allow read: if true;
      allow write: if false; // Only backend can write
    }
    
    // User matches
    match /user_matches/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Applications
    match /applications/{applicationId} {
      allow read, write: if request.auth != null;
    }
    
    // Discovery jobs
    match /discovery_jobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend can write
    }
  }
}
```

3. Click **"Publish"**

### Step 1.4: Enable Authentication

1. Click **"Authentication"** in left sidebar
2. Click **"Get started"**
3. Select **"Email/Password"** sign-in method
4. Enable it and click **"Save"**
5. Optional: Enable **"Google"** sign-in provider

### Step 1.5: Generate Service Account Credentials

1. Click the **gear icon** (⚙️) → **"Project settings"**
2. Go to **"Service accounts"** tab
3. Click **"Generate new private key"**
4. Click **"Generate key"** in the confirmation dialog
5. A JSON file will download - **SAVE IT SECURELY**
6. **DO NOT commit this file to Git!**

The JSON file looks like:
```json
{
  "type": "service_account",
  "project_id": "scholarstream-xxxxx",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-xxxxx@scholarstream-xxxxx.iam.gserviceaccount.com",
  ...
}
```

## 🤖 Part 2: Google Gemini API Setup (5 minutes)

### Step 2.1: Get Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Create API key"**
3. Select your Firebase project (or create new Google Cloud project)
4. Click **"Create API key in existing project"**
5. **Copy the API key** - you'll need it for `.env`

### Step 2.2: Enable Gemini API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **"APIs & Services" → "Library"**
4. Search for **"Generative Language API"**
5. Click **"Enable"**

## 🐍 Part 3: Backend Installation (10 minutes)

### Step 3.1: Clone & Navigate

```bash
# If you haven't cloned the project yet
git clone <your-repo-url>
cd scholarstream

# Navigate to backend directory
cd backend
```

### Step 3.2: Create Conda Environment

```bash
# Create new environment with Python 3.11
conda create -n scholarstream python=3.11 -y

# Activate environment
conda activate scholarstream

# Verify Python version
python --version
# Should show: Python 3.11.x
```

### Step 3.3: Install Dependencies

```bash
# Install all required packages
pip install -r requirements.txt

# This will install:
# - FastAPI and Uvicorn (web framework)
# - Firebase Admin SDK (database)
# - Google Generative AI (Gemini)
# - BeautifulSoup4 (web scraping)
# - Redis (caching)
# - And more...
```

## 🔧 Part 4: Configuration (10 minutes)

### Step 4.1: Create .env File

```bash
# Copy example file
cp .env.example .env

# Open in your editor
code .env  # VS Code
# or
nano .env  # Terminal editor
```

### Step 4.2: Fill in Firebase Credentials

Open the JSON file you downloaded from Firebase and copy values to `.env`:

```env
# From Firebase Service Account JSON
FIREBASE_PROJECT_ID=scholarstream-xxxxx
FIREBASE_PRIVATE_KEY_ID=abc123def456...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...(copy entire key)...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@scholarstream-xxxxx.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk...
```

**IMPORTANT**: For `FIREBASE_PRIVATE_KEY`, keep the entire string including `\n` characters in one line, wrapped in double quotes.

### Step 4.3: Add Gemini API Key

```env
GEMINI_API_KEY=AIzaSy...your-actual-key-here
GEMINI_MODEL=gemini-2.5-flash
```

### Step 4.4: Configure CORS

Add your frontend URL:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,https://your-production-domain.com
```

### Step 4.5: Optional - Cloudinary (for later)

If you want file upload functionality now:

1. Go to [Cloudinary](https://cloudinary.com/) and sign up
2. Get your credentials from Dashboard
3. Add to `.env`:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## 🔴 Part 5: Redis Setup (5 minutes)

Redis is required for background job processing.

### macOS (with Homebrew)
```bash
brew install redis
brew services start redis

# Verify it's running
redis-cli ping
# Should return: PONG
```

### Ubuntu/Debian Linux
```bash
sudo apt-get update
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis

# Verify
redis-cli ping
```

### Windows (with Docker)
```bash
docker run -d -p 6379:6379 --name redis redis:latest

# Verify
docker ps
```

### Windows (with WSL)
Use the Linux instructions above in WSL.

## 🚀 Part 6: Start the Backend (2 minutes)

### Option 1: Using the run script (recommended)

```bash
# Make script executable (first time only)
chmod +x run_dev.sh

# Run the backend
./run_dev.sh
```

### Option 2: Manual start

```bash
# Ensure conda environment is activated
conda activate scholarstream

# Start the server
python -m app.main
```

You should see:
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

## ✅ Part 7: Verify Everything Works

### Test 1: Health Check

Open browser and go to: **http://localhost:8000/health**

Should see:
```json
{
  "status": "healthy",
  "environment": "development",
  "version": "1.0.0"
}
```

### Test 2: API Documentation

Go to: **http://localhost:8000/docs**

You should see interactive Swagger UI with all endpoints.

### Test 3: Test Scholarship Discovery

1. In Swagger UI, find **POST /api/scholarships/discover**
2. Click **"Try it out"**
3. Use this test data:

```json
{
  "user_id": "test-user-123",
  "profile": {
    "name": "Test Student",
    "academic_status": "Undergraduate",
    "school": "Test University",
    "gpa": 3.5,
    "major": "Computer Science",
    "graduation_year": "2026",
    "background": ["First-generation"],
    "financial_need": 25000,
    "interests": ["STEM", "Technology"]
  }
}
```

4. Click **"Execute"**
5. Should return scholarships (mock data initially)

## 🔗 Part 8: Connect Frontend

### Update Frontend .env

In your **frontend** directory (not backend), create/update `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000

# Keep your existing Firebase frontend config
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
# etc.
```

### Start Frontend

```bash
# In a NEW terminal
cd ../  # Go back to project root
npm run dev
```

Frontend should now make API calls to your local backend!

## 🐛 Troubleshooting

### Issue: "Firebase authentication failed"

**Solution**: Check your `.env` file:
- Ensure `FIREBASE_PRIVATE_KEY` is wrapped in double quotes
- Verify all Firebase credentials match the JSON file exactly
- Don't modify the `\n` characters in the private key

### Issue: "Gemini API quota exceeded"

**Solution**:
- Free tier has rate limits
- Check usage in Google Cloud Console
- Consider upgrading if needed for production
- Backend has built-in caching to minimize API calls

### Issue: "Redis connection refused"

**Solution**:
```bash
# Check if Redis is running
redis-cli ping

# If not running:
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Docker
docker start redis
```

### Issue: "ModuleNotFoundError"

**Solution**:
```bash
# Ensure conda environment is activated
conda activate scholarstream

# Reinstall dependencies
pip install -r requirements.txt
```

### Issue: "Port 8000 already in use"

**Solution**:
```bash
# Find and kill process using port 8000
# macOS/Linux
lsof -ti:8000 | xargs kill -9

# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Or change port in .env
PORT=8001
```

## 📊 Monitoring & Logs

### View Logs

Backend uses structured JSON logging. Watch logs in terminal:

```bash
# Logs appear in the terminal where you started the backend
# Look for:
# - "Request received" - incoming API calls
# - "Discovery request received" - scholarship discovery started
# - "Scholarship enriched with AI" - Gemini AI processing
```

### Test Individual Components

```python
# Test Firebase connection
python -c "from app.database import db; print('Firebase connected!')"

# Test Gemini AI
python -c "from app.services.ai_service import ai_service; print('Gemini configured!')"
```

## 🎉 Success! What's Next?

Your backend is now running! You can:

1. ✅ Create a user in the frontend
2. ✅ Complete onboarding
3. ✅ Backend will discover scholarships automatically
4. ✅ View matched scholarships in the dashboard

## 📚 Additional Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Firebase Docs**: https://firebase.google.com/docs
- **Gemini API Docs**: https://ai.google.dev/docs
- **Project README**: See `backend/README.md` for API details

## 💪 Production Deployment

Ready for production? See `backend/README.md` section on deployment to:
- Google Cloud Run (recommended)
- Railway
- Render
- AWS/DigitalOcean VPS

---

**Alhamdulillah!** Your backend is ready. If you encounter issues, check the logs first, then refer to the troubleshooting section.

**May Allah grant us success - Allahu Musta'an** 🤲
