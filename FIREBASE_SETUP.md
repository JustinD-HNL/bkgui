# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication for the Buildkite Pipeline Builder.

## Prerequisites

- A Google/Firebase account
- An existing Firebase project (or create a new one)

## Step 1: Firebase Console Setup

### 1.1 Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your existing project or create a new one
3. If creating new project:
   - Enter project name (e.g., "buildkite-pipeline-builder")
   - Choose your country/region
   - Accept terms and create project

### 1.2 Enable Authentication
1. In the Firebase Console, click **"Authentication"** in the left sidebar
2. Click **"Get started"** if it's your first time
3. Go to the **"Sign-in method"** tab
4. Enable Google authentication:

#### Google Authentication
1. Click on **"Google"**
2. Toggle **"Enable"**
3. Select a support email address
4. Add your domain to authorized domains:
   - `localhost` (for local development)
   - Your Cloud Run domain (e.g., `buildkite-pipeline-builder-xxx-uc.a.run.app`)
5. Click **"Save"**

**Note**: Since you're only using Google authentication, you don't need to enable Email/Password sign-in.

### 1.3 Configure Authorized Domains
1. Still in the **"Sign-in method"** tab
2. Scroll down to **"Authorized domains"**
3. Add your domains:
   - `localhost` (already added by default)
   - Your Cloud Run domain when deployed
   - Any custom domains you plan to use

## Step 2: Get Firebase Configuration

### 2.1 Web App Configuration
1. Go to **Project Settings** (gear icon in sidebar)
2. Scroll down to **"Your apps"** section
3. Click **"Add app"** and select **"Web"** (</> icon)
4. Register your app:
   - App nickname: "Buildkite Pipeline Builder"
   - Check "Also set up Firebase Hosting" (optional)
   - Click **"Register app"**

### 2.2 Copy Configuration Values
You'll see a config object like this:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345678"
};
```

**Save these values** - you'll need them for deployment!

## Step 3: Local Development Setup

### 3.1 Create Local Configuration
1. Copy the template file:
   ```bash
   cp firebase-config.template.js firebase-config.js
   ```

2. Edit `firebase-config.js` with your actual Firebase configuration values

3. Add `firebase-config.js` to your `.gitignore`:
   ```bash
   echo "firebase-config.js" >> .gitignore
   ```

### 3.2 Include Configuration in HTML
Add this line to your `index.html` before other scripts (if testing locally):
```html
<script src="firebase-config.js"></script>
```

## Step 4: Deployment Configuration

### 4.1 Using the Deploy Script
The `deploy.sh` script will prompt you for Firebase configuration during deployment:

```bash
./deploy.sh
```

You'll be asked to enter:
- Firebase API Key
- Firebase Auth Domain
- Firebase Project ID
- Firebase Storage Bucket
- Firebase Messaging Sender ID
- Firebase App ID

### 4.2 Manual Cloud Run Deployment
If deploying manually, set the environment variables:

```bash
gcloud run deploy buildkite-pipeline-builder \
  --image gcr.io/YOUR_PROJECT_ID/buildkite-pipeline-builder \
  --set-env-vars "NODE_ENV=production,FIREBASE_API_KEY=your-api-key,FIREBASE_AUTH_DOMAIN=your-domain,FIREBASE_PROJECT_ID=your-project-id,FIREBASE_STORAGE_BUCKET=your-bucket,FIREBASE_MESSAGING_SENDER_ID=your-sender-id,FIREBASE_APP_ID=your-app-id"
```

### 4.3 Cloud Build CI/CD Setup
For automated deployments, set up substitution variables in Cloud Build:

1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Create or edit your trigger
3. Add substitution variables:
   - `_FIREBASE_API_KEY`: Your Firebase API key
   - `_FIREBASE_AUTH_DOMAIN`: Your auth domain
   - `_FIREBASE_PROJECT_ID`: Your project ID
   - `_FIREBASE_STORAGE_BUCKET`: Your storage bucket
   - `_FIREBASE_MESSAGING_SENDER_ID`: Your messaging sender ID
   - `_FIREBASE_APP_ID`: Your app ID

## Step 5: Security Configuration

### 5.1 API Key Restrictions (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services > Credentials**
3. Find your Firebase API key
4. Click **"Edit"** (pencil icon)
5. Add application restrictions:
   - **HTTP referrers**: Add your domains
   - **API restrictions**: Select specific APIs (Firebase Auth, etc.)

### 5.2 Firebase Security Rules
Your Firebase project should have appropriate security rules. For authentication, the default rules are usually sufficient.

## Step 6: Testing Authentication

### 6.1 Local Testing
1. Start your local server: `npm start`
2. Open `http://localhost:8080`
3. You should see the authentication screen
4. Try signing up with Google

### 6.2 Production Testing
1. Deploy your application using `./deploy.sh`
2. Access your Cloud Run URL
3. Test Google authentication
4. Verify user info displays correctly after login

## Troubleshooting

### Common Issues

#### "Auth domain not authorized"
- **Solution**: Add your domain to Firebase Console > Authentication > Sign-in method > Authorized domains

#### "API key not valid"
- **Solution**: Check that your API key is correct and not restricted beyond your domain

#### "Google sign-in popup blocked"
- **Solution**: Ensure pop-ups are allowed for your domain

#### "Firebase not initialized"
- **Solution**: Check that all Firebase configuration values are set correctly

### Debug Mode
Enable debug mode by opening browser console. The Firebase auth service logs helpful information about configuration loading and authentication state.

### Environment Variables Check
Verify your environment variables are set correctly:

```bash
gcloud run services describe buildkite-pipeline-builder \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)"
```

## Security Best Practices

1. **Never commit Firebase config to public repositories**
2. **Use environment variables for production**
3. **Restrict API keys to specific domains**
4. **Enable only required authentication methods**
5. **Regularly review authorized domains**
6. **Monitor authentication logs in Firebase Console**

## Additional Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)
- [Cloud Run Environment Variables](https://cloud.google.com/run/docs/configuring/environment-variables)

---

**🔐 Your Buildkite Pipeline Builder is now secured with Firebase Authentication!**
