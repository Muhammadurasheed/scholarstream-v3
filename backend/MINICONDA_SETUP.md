# 🐍 FastAPI Backend Setup with Miniconda

## Prerequisites
- Miniconda or Anaconda installed
- Python 3.11+ (comes with Miniconda)
- Firebase project (for authentication and database)
- Google Gemini API key
- Upstash Redis account (free tier available)

## Step 1: Create Conda Environment

Open your terminal/command prompt and navigate to the backend directory:

```bash
cd backend
```

Create a new conda environment named `scholarstream`:

```bash
conda create -n scholarstream python=3.11 -y
```

Activate the environment:

```bash
# Windows
conda activate scholarstream

# macOS/Linux
conda activate scholarstream
```

## Step 2: Install Dependencies

With the environment activated, install all required packages:

```bash
pip install -r requirements.txt
```

This will install:
- FastAPI and Uvicorn (web framework)
- Firebase Admin SDK (database and auth)
- Google Generative AI (Gemini)
- Upstash Redis (caching and rate limiting)
- Web scraping libraries (BeautifulSoup, Selenium, etc.)
- All other dependencies

## Step 3: Configure Environment Variables

Copy the `.env.example` file to `.env`:

```bash
# Windows
copy .env.example .env

# macOS/Linux
cp .env.example .env
```

Edit the `.env` file with your actual credentials:

### Firebase Configuration
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Copy the values from the downloaded JSON file to your `.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY_ID`
   - `FIREBASE_PRIVATE_KEY` (keep the quotes and line breaks)
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_CLIENT_ID`

### Google Gemini API
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Add to `.env`: `GEMINI_API_KEY=your_key_here`

### Upstash Redis
1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Redis database (free tier available)
3. Copy the REST URL and TOKEN
4. Add to `.env`:
   - `UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN=your_token_here`

### CORS Settings
Update allowed origins to match your frontend URL:
```
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Step 4: Run the Backend Server

With your conda environment activated and `.env` configured:

```bash
python run.py
```

You should see:
```
🚀 Starting ScholarStream FastAPI Backend...
📍 Server will run at: http://localhost:8000
📚 API Docs available at: http://localhost:8000/docs
🔄 Auto-reload enabled for development

✨ Bismillah ir-Rahman ir-Rahim

INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process using WatchFiles
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## Step 5: Test the API

Open your browser and visit:
- **API Docs (Swagger UI)**: http://localhost:8000/docs
- **Alternative Docs (ReDoc)**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

You should see the interactive API documentation.

## Step 6: Connect Frontend

In your frontend project root, create or update `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

Restart your frontend development server (if it's running).

## Common Issues & Solutions

### Issue: `ModuleNotFoundError: No module named 'fastapi'`
**Solution**: Make sure your conda environment is activated:
```bash
conda activate scholarstream
pip install -r requirements.txt
```

### Issue: Firebase authentication errors
**Solution**: 
1. Verify your Firebase credentials in `.env`
2. Ensure the private key includes `\n` for line breaks
3. Keep the private key wrapped in double quotes
4. Check that your Firebase project has Firestore enabled

### Issue: Gemini API quota exceeded
**Solution**: 
- Free tier: 15 requests per minute
- Upgrade to paid plan or implement caching
- The app uses Redis caching to minimize API calls

### Issue: Upstash Redis connection errors
**Solution**:
1. Verify your Redis URL and token in `.env`
2. Check that your Upstash database is active
3. Test connection: `curl $UPSTASH_REDIS_REST_URL/ping -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN"`

### Issue: CORS errors from frontend
**Solution**: Update `CORS_ORIGINS` in `.env` to include your frontend URL

### Issue: Port 8000 already in use
**Solution**: 
- Stop other services using port 8000
- Or change `PORT=8001` in `.env`
- Or use: `uvicorn app.main:app --port 8001`

## Development Workflow

1. **Activate environment** (every time you open a new terminal):
   ```bash
   conda activate scholarstream
   ```

2. **Start backend** (from backend directory):
   ```bash
   python run.py
   ```

3. **Start frontend** (from project root, in another terminal):
   ```bash
   npm run dev
   ```

4. **Stop servers**: Press `Ctrl+C` in each terminal

## Useful Commands

```bash
# Activate environment
conda activate scholarstream

# Deactivate environment
conda deactivate

# List installed packages
conda list

# Update a specific package
pip install --upgrade package_name

# Run tests (when implemented)
pytest

# Check Python version
python --version

# View environment info
conda info

# List all conda environments
conda env list

# Remove environment (if needed)
conda env remove -n scholarstream
```

## Project Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Environment configuration
│   ├── models.py            # Pydantic models
│   ├── database.py          # Firebase/Firestore client
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── scholarships.py  # Scholarship endpoints
│   │   └── applications.py  # Application tracking endpoints
│   └── services/
│       ├── __init__.py
│       ├── ai_service.py         # Gemini AI integration
│       ├── scraper_service.py    # Web scraping
│       └── matching_service.py   # Scholarship matching logic
├── .env                     # Your environment variables (create this)
├── .env.example            # Template for .env
├── requirements.txt        # Python dependencies
├── run.py                  # Development server runner
└── MINICONDA_SETUP.md     # This file
```

## Next Steps

1. ✅ Backend server running on http://localhost:8000
2. ✅ Frontend connected and making API calls
3. 🔄 Test scholarship discovery flow:
   - Complete user onboarding
   - Trigger scholarship discovery
   - View matched scholarships in dashboard
4. 🚀 Deploy to production (see BACKEND_SETUP_GUIDE.md for deployment options)

## Need Help?

- Check logs in terminal for error messages
- Visit http://localhost:8000/docs for API documentation
- Review `backend/app/main.py` for endpoint details
- Check Firebase Console for database issues
- Monitor Upstash Console for Redis metrics

---

**Bismillah - Let's build something amazing! 🚀**
