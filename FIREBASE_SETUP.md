# Firebase Setup for ScholarStream

## Prerequisites
- Node.js installed
- Firebase account (free tier is sufficient for development)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name it "ScholarStream" (or your preferred name)
4. Disable Google Analytics (optional for development)
5. Click "Create project"

## Step 2: Register Web App

1. In your Firebase project, click the Web icon (</>) to add a web app
2. Register app with nickname "ScholarStream Web"
3. Copy the Firebase configuration object

## Step 3: Enable Authentication

1. In Firebase Console, go to "Authentication" > "Get started"
2. Click on "Sign-in method" tab
3. Enable "Email/Password" provider
4. (Optional) Enable "Google" provider for social login

## Step 4: Create Firestore Database

1. Go to "Firestore Database" > "Create database"
2. Start in "Test mode" (for development)
3. Choose a location close to your users
4. Click "Enable"

## Step 5: Set Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your Firebase configuration from Step 2:
   ```env
   VITE_FIREBASE_API_KEY=your_actual_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

## Step 6: Set Up Firestore Security Rules

In Firebase Console > Firestore Database > Rules, add these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Onboarding data
    match /users/{userId}/onboarding_draft/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 7: Run the Application

```bash
npm install
npm run dev
```

## Testing Authentication

1. Navigate to `/signup` to create a new account
2. Check Firebase Console > Authentication to see your user
3. Check Firestore to see the user document created
4. Try logging out and logging back in

## Common Issues

### "Firebase: Error (auth/configuration-not-found)"
- Make sure all Firebase environment variables are set correctly
- Restart your dev server after updating .env

### "Firebase: Error (auth/invalid-api-key)"
- Double-check your API key in .env
- Make sure there are no extra spaces or quotes

### "Missing or insufficient permissions"
- Update your Firestore security rules as shown in Step 6
- Make sure the user is authenticated before accessing Firestore

## Next Steps

Once Firebase is set up:
- Backend API (FastAPI) will communicate with Firebase for user verification
- Cloudinary will be used for file uploads (profile pictures, documents)
- Frontend will use Firebase Auth for protected routes

## Backend Integration (FastAPI)

The FastAPI backend will:
1. Verify Firebase ID tokens for authenticated requests
2. Access Firestore to read/write scholarship data
3. Call AI APIs (Google Gemini) with user context

See backend repository for FastAPI setup instructions.
