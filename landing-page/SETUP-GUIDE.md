# 🚀 Launch Your App - Setup Guide

## Step 1: Get Your Firebase Config

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Click the **Web** icon (</>) to add Firebase to your web app
4. Copy your Firebase config object
5. Replace the placeholder in `landing-page.html` (around line 308):

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",              // Replace these
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## Step 2: Create App Icons

You need two icon sizes for PWA:
- **192x192 pixels** - saved as `icon-192.png`
- **512x512 pixels** - saved as `icon-512.png`

**Quick way to create icons:**
- Use [Canva](https://www.canva.com) - Free, easy to use
- Or [RealFaviconGenerator](https://realfavicongenerator.net/)
- Design a square logo with your app name/icon
- Export both sizes

## Step 3: Customize Your Landing Page

In `landing-page.html`, update:

**Line 22**: Change title
```html
<title>Your App Name - Coming Soon</title>
```

**Line 80**: Change logo
```html
<div class="logo">Your<span>App</span></div>
```

**Line 85-90**: Change headline and description
```html
<h1>
    Something <span class="gradient-text">Amazing</span><br>
    Is Coming
</h1>

<p class="subtitle">
    Your app description here
</p>
```

## Step 4: Update manifest.json

Replace with your app details:
```json
{
  "name": "Your App Full Name",
  "short_name": "YourApp",
  "description": "What your app does"
}
```

## Step 5: Deploy to Firebase

### First Time Setup:
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (in your project folder)
firebase init hosting

# Select:
# - Use existing project or create new
# - Public directory: public (or wherever your files are)
# - Single-page app: Yes
# - GitHub deploys: No (for now)
```

### File Structure:
Put these files in your `public` folder:
```
public/
├── index.html (rename landing-page.html to index.html)
├── manifest.json
├── service-worker.js
├── icon-192.png
├── icon-512.png
└── (your actual app files when ready)
```

### Deploy:
```bash
firebase deploy --only hosting
```

Your site will be live at: `https://YOUR-PROJECT.web.app`

## Step 6: Register Service Worker

Add this to the end of your HTML (before closing `</body>` tag):

```html
<script>
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then((reg) => console.log('Service Worker registered', reg))
    .catch((err) => console.log('Service Worker registration failed', err));
}
</script>
```

## Step 7: Test PWA Installation

### On Desktop (Chrome):
1. Open your deployed site
2. Look for install icon in address bar
3. Or click ⋮ menu → "Install [App Name]"

### On Mobile:
1. Open in Chrome/Safari
2. Tap Share → "Add to Home Screen"
3. App icon appears on home screen!

## When You're Ready to Launch Your Full App

1. Build your React/Vue/Angular app: `npm run build`
2. Copy built files to `public` folder
3. Update `service-worker.js` to cache your app's files
4. Deploy: `firebase deploy --only hosting`
5. Send launch emails to your subscribers!

## Sending Launch Emails

### Option 1: Manual (for small lists)
Query Firestore for subscribers and send via Gmail

### Option 2: Using EmailJS (Recommended)
1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Create email template
3. Add code to send emails to all subscribers

### Option 3: Cloud Functions
Create a function to bulk email all subscribers (see previous examples)

## Testing Checklist

- [ ] Firebase config is correct
- [ ] App icons load (check browser console)
- [ ] Email signup saves to Firestore
- [ ] PWA install prompt appears
- [ ] App can be installed from Chrome
- [ ] Service worker registers successfully
- [ ] App works offline (after first visit)

## Troubleshooting

**Install button doesn't appear:**
- Check manifest.json is accessible at `/manifest.json`
- Verify icons exist and are correct size
- Use HTTPS (Firebase Hosting provides this)
- Check browser console for errors

**Email not saving:**
- Check Firebase config
- Verify Firestore is enabled in Firebase Console
- Check browser console for errors

**PWA not working offline:**
- Service worker must be registered
- Visit site once while online first
- Check cache in DevTools → Application → Cache Storage

---

Need help? Check:
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
