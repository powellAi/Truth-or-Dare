# Truth or Dare - Landing Page

A coming soon landing page for the Truth or Dare app. Collects emails from interested users before launch and supports PWA installation directly from the browser.

---

## Screenshots

![Landing Page](../screenshots/Home.jpg)

---

## Features

- Email collection for launch notifications via EmailJS
- PWA install button for Chrome users
- Animated, modern design
- Fully mobile responsive
- Offline support via service worker

---

## Built With

- HTML, CSS, JavaScript
- Firebase Hosting
- Firebase Firestore — stores subscriber emails
- EmailJS — sends launch notification emails
- Service Worker — enables offline functionality

---

## File Structure

```
landing-page/
├── index.html            # Main landing page
├── manifest.json         # PWA manifest
├── service-worker.js     # Offline support
├── firestore.rules       # Database security rules
├── send-launch-emails.js # Script to email subscribers on launch
└── SETUP-GUIDE.md        # Detailed setup instructions
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Firebase CLI](https://firebase.google.com/docs/cli)
- A Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
- An [EmailJS](https://www.emailjs.com/) account

### Installation

1. Install Firebase CLI
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase
   ```bash
   firebase login
   ```

3. Initialize Firebase in the landing page folder
   ```bash
   cd landing-page
   firebase init hosting
   ```

4. Add your Firebase config to `index.html` at line 308

5. Add your EmailJS credentials to `index.html`

### Customization

Open `index.html` and update the following:

| Line | What to change |
|------|----------------|
| 22 | Page title |
| 80 | Logo |
| 85-90 | Headline and description |
| 308 | Firebase config |

Also update `manifest.json` with your app's `name`, `short_name` and `description`.

### Deploy

```bash
firebase deploy --only hosting
```

Your site will be live at `https://YOUR-PROJECT.web.app`

---

## PWA Installation

**Chrome Desktop:**
1. Visit the site
2. Click the install icon in the address bar
3. Or go to Menu and select "Install App"

**Mobile (Chrome/Safari):**
1. Visit the site
2. Tap the Share button
3. Select "Add to Home Screen"

---

## Sending Launch Emails

When you are ready to launch, run the following script to notify all subscribers:

```bash
node send-launch-emails.js
```

EmailJS free tier allows up to 200 emails per month.

---

## When You Are Ready to Launch

1. Build your full React app
2. Replace the landing page with your app files
3. Run `send-launch-emails.js` to notify subscribers
4. Update `service-worker.js` to cache your app files
5. Deploy with `firebase deploy --only hosting`

---

## PWA Checklist

- manifest.json
- Service worker registered
- Icons at 192x192px and 512x512px
- HTTPS enabled (automatic with Firebase Hosting)
- Responsive design

---

## Author

**powellAi**
- GitHub: [@powellAi](https://github.com/powellAi)

---

## License

This project is open source and available under the [MIT License](../LICENSE).
