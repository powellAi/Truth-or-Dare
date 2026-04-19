// send-launch-emails.js
// Run this script when you're ready to notify all subscribers

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ==========================================
// OPTION 1: Using EmailJS (Easiest)
// ==========================================
async function sendEmailsWithEmailJS() {
    // First, sign up at https://www.emailjs.com/
    // Get your Service ID, Template ID, and Public Key
    
    const EMAILJS_SERVICE_ID = 'your_service_id';
    const EMAILJS_TEMPLATE_ID = 'your_template_id';
    const EMAILJS_PUBLIC_KEY = 'your_public_key';

    try {
        // Get all subscribers who haven't been notified
        const subscribersRef = collection(db, 'launch-subscribers');
        const snapshot = await getDocs(subscribersRef);
        
        let sentCount = 0;
        
        for (const docSnap of snapshot.docs) {
            const subscriber = docSnap.data();
            
            // Skip if already notified
            if (subscriber.notified) {
                console.log(`Skipping ${subscriber.email} - already notified`);
                continue;
            }

            // Send email via EmailJS
            const templateParams = {
                to_email: subscriber.email,
                app_name: 'YourApp',
                app_url: 'https://your-app.web.app',
                message: 'We\'re officially live! Your app is now available.'
            };

            try {
                // In browser, you'd use emailjs.send()
                // For Node.js, make HTTP request to EmailJS API
                const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        service_id: EMAILJS_SERVICE_ID,
                        template_id: EMAILJS_TEMPLATE_ID,
                        user_id: EMAILJS_PUBLIC_KEY,
                        template_params: templateParams
                    })
                });

                if (response.ok) {
                    // Mark as notified in Firestore
                    await updateDoc(doc(db, 'launch-subscribers', docSnap.id), {
                        notified: true,
                        notifiedAt: new Date()
                    });
                    
                    sentCount++;
                    console.log(`✓ Sent to ${subscriber.email}`);
                    
                    // Rate limiting - wait 1 second between emails
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } else {
                    console.error(`Failed to send to ${subscriber.email}`);
                }
            } catch (error) {
                console.error(`Error sending to ${subscriber.email}:`, error);
            }
        }

        console.log(`\n🎉 Launch emails sent to ${sentCount} subscribers!`);
    } catch (error) {
        console.error('Error sending emails:', error);
    }
}

// ==========================================
// OPTION 2: Using Resend (Modern & Simple)
// ==========================================
async function sendEmailsWithResend() {
    // Sign up at https://resend.com/ and get API key
    const RESEND_API_KEY = 'your_resend_api_key';

    try {
        const subscribersRef = collection(db, 'launch-subscribers');
        const snapshot = await getDocs(subscribersRef);
        
        let sentCount = 0;
        
        for (const docSnap of snapshot.docs) {
            const subscriber = docSnap.data();
            
            if (subscriber.notified) continue;

            try {
                const response = await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${RESEND_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        from: 'YourApp <notifications@your-domain.com>',
                        to: subscriber.email,
                        subject: '🚀 We\'re Live! YourApp is Now Available',
                        html: `
                            <h1>We're officially live!</h1>
                            <p>Thank you for your patience. YourApp is now available!</p>
                            <p>
                                <a href="https://your-app.web.app" 
                                   style="background: #FF6B35; color: white; padding: 12px 24px; 
                                          text-decoration: none; border-radius: 8px; display: inline-block;">
                                    Launch App
                                </a>
                            </p>
                            <p>Install it on your device for the best experience:</p>
                            <ul>
                                <li><strong>Chrome:</strong> Click the install icon in the address bar</li>
                                <li><strong>Mobile:</strong> Tap Share → Add to Home Screen</li>
                            </ul>
                            <p>Thanks for being an early supporter!</p>
                        `
                    })
                });

                if (response.ok) {
                    await updateDoc(doc(db, 'launch-subscribers', docSnap.id), {
                        notified: true,
                        notifiedAt: new Date()
                    });
                    
                    sentCount++;
                    console.log(`✓ Sent to ${subscriber.email}`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                console.error(`Error sending to ${subscriber.email}:`, error);
            }
        }

        console.log(`\n🎉 Launch emails sent to ${sentCount} subscribers!`);
    } catch (error) {
        console.error('Error:', error);
    }
}

// ==========================================
// OPTION 3: Simple Email Template Creator
// ==========================================
function getEmailHTML(appName, appUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #0A0E27 0%, #FF6B35 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
            border-radius: 12px;
            margin-bottom: 30px;
        }
        .button {
            background: #FF6B35;
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            display: inline-block;
            margin: 20px 0;
            font-weight: bold;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 We're Live!</h1>
        <p style="font-size: 18px; margin: 10px 0 0 0;">
            ${appName} is now available
        </p>
    </div>
    
    <p>Hey there!</p>
    
    <p>
        We're thrilled to announce that ${appName} is officially live! 
        Thank you for being one of our early supporters.
    </p>
    
    <p style="text-align: center;">
        <a href="${appUrl}" class="button">
            Launch App Now →
        </a>
    </p>
    
    <h3>📱 Install on Your Device</h3>
    <p>For the best experience, install ${appName} as an app:</p>
    <ul>
        <li><strong>Chrome Desktop:</strong> Click the install icon (⊕) in the address bar</li>
        <li><strong>iPhone/iPad:</strong> Tap Share → Add to Home Screen</li>
        <li><strong>Android:</strong> Tap Menu → Install App</li>
    </ul>
    
    <p>
        Once installed, ${appName} will work like a native app on your device, 
        even when you're offline!
    </p>
    
    <p>Thanks again for your support. We can't wait to see what you create!</p>
    
    <div class="footer">
        <p>© 2025 ${appName}. All rights reserved.</p>
        <p style="font-size: 12px; color: #999;">
            You received this email because you signed up for launch notifications.
        </p>
    </div>
</body>
</html>
    `;
}

// ==========================================
// Run the script
// ==========================================

// Choose your method:
// sendEmailsWithEmailJS();
// sendEmailsWithResend();

console.log('📧 Email Launch Script Ready!');
console.log('Uncomment your preferred method above and run: node send-launch-emails.js');
