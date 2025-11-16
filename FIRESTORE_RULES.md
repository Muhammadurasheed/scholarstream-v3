# Firestore Security Rules Setup

**Bismillah ir-Rahman ir-Rahim** ✨

## 🚨 IMPORTANT: Configure Firestore Security Rules

If you're seeing "Missing or insufficient permissions" errors, you need to set up Firestore security rules.

## Quick Setup

### 1. Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **scholarstream-i4i**
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab

### 2. Apply These Rules

Replace the existing rules with the following:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection - users can read/write their own profile
    match /users/{userId} {
      // Allow users to read and write their own profile
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow users to create their own profile during signup
      allow create: if request.auth != null && request.auth.uid == userId;
    }
    
    // Scholarships collection - authenticated users can read all
    match /scholarships/{scholarshipId} {
      allow read: if request.auth != null;
      allow write: if false; // Only backend can write scholarships
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
    
    // Default: deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Publish the Rules

1. Click the **Publish** button
2. Wait for confirmation that rules are deployed

## What These Rules Do

- ✅ **Users can create and manage their own profile**
- ✅ **Users can read all scholarships** (but only backend can write)
- ✅ **Users can manage their own applications**
- ✅ **Users can manage their own saved scholarships**
- ❌ **Users cannot access other users' data**
- ❌ **Users cannot modify scholarship data directly**

## Testing the Rules

After applying the rules:

1. Restart your development server: `npm run dev`
2. Try signing up with a new account
3. The "Missing or insufficient permissions" error should be gone

## Development vs Production

**Current Rules (Above)**: Good for development and production
- Users have full control over their own data
- Proper security boundaries

**Test Mode Rules**: ⚠️ NOT RECOMMENDED
```javascript
allow read, write: if true; // Insecure! Anyone can access any data
```

## Troubleshooting

### Still getting permission errors?

1. **Check the rules are published**: Look for "Last published" timestamp in Firebase Console
2. **Verify user is authenticated**: Check browser console for auth logs
3. **Check the document path**: Make sure you're writing to the correct collection
4. **Clear browser cache**: Sometimes old rules are cached

### Rules not applying?

- Wait 1-2 minutes after publishing
- Refresh your browser
- Restart your development server

## Backend Integration

The backend uses **Firebase Admin SDK** which bypasses these rules. Only the frontend (web app) is restricted by these rules.

**Allahu Musta'an** 🤲
