# 📚 ExJAM Registration System - Complete Setup Guide

## 🎯 Overview
This guide will help you set up the complete registration system with Vercel hosting, Google Sheets integration, and automatic badge generation.

## 📋 Prerequisites
- Google Account
- Vercel Account (free)
- Node.js 18+ installed
- Your existing Google Spreadsheet ID

## 🔧 Step 1: Google Cloud Setup

### 1.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Create Project"
3. Name it: `exjam-registration`
4. Note your Project ID

### 1.2 Enable APIs
```bash
# Enable required APIs
1. Go to "APIs & Services" > "Enable APIs"
2. Search and enable:
   - Google Sheets API
   - Google Drive API (for badge storage)
```

### 1.3 Create Service Account
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "Service Account"
3. Name: `exjam-sheets-service`
4. Role: "Editor"
5. Click "Done"

### 1.4 Generate Private Key
1. Click on your service account
2. Go to "Keys" tab
3. Add Key > Create new key > JSON
4. Download the JSON file (keep it safe!)

### 1.5 Share Google Sheet with Service Account
1. Open your Google Sheet
2. Click "Share"
3. Add the service account email (from JSON file)
4. Give "Editor" permission

## 🚀 Step 2: Vercel Setup

### 2.1 Install Dependencies
```bash
cd /Users/goldmay/exjam-alumni-research
npm install
```

### 2.2 Create Environment File
```bash
cp .env.example .env.local
```

### 2.3 Configure Environment Variables
Edit `.env.local` with your values:

```env
# From your Google Sheet URL
GOOGLE_SHEETS_ID=1dkLY2WxaPkk6eceW_gJIDj3iUabTBO5p_fS5W_PD91s

# From the JSON key file
GOOGLE_SERVICE_ACCOUNT_EMAIL=exjam-sheets@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### 2.4 Set Up Vercel Environment Variables
```bash
# Add each environment variable to Vercel
vercel env add GOOGLE_SHEETS_ID production
vercel env add GOOGLE_SERVICE_ACCOUNT_EMAIL production
vercel env add GOOGLE_PRIVATE_KEY production
```

## 📊 Step 3: Google Sheets Structure

### 3.1 Create Sheet Structure
Your Google Sheet should have a sheet named "Registrations" with these columns:

| Column | Field | Type |
|--------|-------|------|
| A | Registration ID | Auto-generated |
| B | Registration Date | Timestamp |
| C | First Name | Text |
| D | Last Name | Text |
| E | Email | Email |
| F | Phone | Text |
| G | Organization | Text |
| H | Position | Text |
| I | Chapter | Text |
| J | Graduation Year | Number |
| K | Accommodation Type | Text |
| L | Dietary Restrictions | Text |
| M | Emergency Contact | Text |
| N | Emergency Phone | Text |
| O | Photo URL | URL |
| P | QR Code | Base64 |
| Q | Barcode | Base64 |
| R | Status | Text |
| S | Check-in Time | Timestamp |

### 3.2 Add Headers
In row 1, add these headers:
```
Registration ID | Registration Date | First Name | Last Name | Email | Phone | Organization | Position | Chapter | Graduation Year | Accommodation Type | Dietary Restrictions | Emergency Contact | Emergency Phone | Photo URL | QR Code | Barcode | Status | Check-in Time
```

## 🎨 Step 4: Custom Registration Form

### 4.1 Create New Registration Page
Create `registration.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ExJAM Conference Registration</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="registration-container">
        <form id="registrationForm">
            <!-- Form fields here -->
        </form>
    </div>
    <script src="registration.js"></script>
</body>
</html>
```

### 4.2 Create Registration JavaScript
Create `registration.js`:

```javascript
const form = document.getElementById('registrationForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Show success message
            // Display QR code and barcode
            // Show badge download link
        }
    } catch (error) {
        console.error('Registration failed:', error);
    }
});
```

## 🧪 Step 5: Testing

### 5.1 Test Locally
```bash
vercel dev
```
Visit: http://localhost:3000

### 5.2 Test API Endpoints
```bash
# Test registration
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","phone":"1234567890"}'

# Test statistics
curl http://localhost:3000/api/stats
```

## 🚀 Step 6: Deploy to Production

### 6.1 Deploy
```bash
vercel --prod
```

### 6.2 Verify Deployment
1. Visit your production URL
2. Test registration form
3. Check Google Sheet for new entries
4. Verify QR code generation

## 📱 Step 7: Mobile QR Scanner Setup

### 7.1 Create Scanner Page
Create `scanner.html` for check-in:

```html
<!DOCTYPE html>
<html>
<head>
    <title>ExJAM Check-in Scanner</title>
    <script src="https://unpkg.com/html5-qrcode"></script>
</head>
<body>
    <div id="reader"></div>
    <div id="result"></div>
    <script>
        const scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: 250
        });
        
        scanner.render(async (decodedText) => {
            // Send to verify endpoint
            const response = await fetch('/api/verify', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({qrData: decodedText})
            });
            
            const result = await response.json();
            document.getElementById('result').innerHTML = result.message;
        });
    </script>
</body>
</html>
```

## ✅ Step 8: Final Checklist

- [ ] Google Cloud Project created
- [ ] APIs enabled (Sheets, Drive)
- [ ] Service account created and key downloaded
- [ ] Sheet shared with service account
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Local testing successful
- [ ] Deployed to Vercel
- [ ] Production testing successful

## 🆘 Troubleshooting

### Issue: "Insufficient permissions"
**Solution:** Make sure the service account has Editor access to your Google Sheet

### Issue: "Invalid API key"
**Solution:** Check that GOOGLE_PRIVATE_KEY has proper line breaks (`\n`)

### Issue: "Cannot find module"
**Solution:** Run `npm install` to install all dependencies

### Issue: "CORS error"
**Solution:** Check that API routes include proper CORS headers

## 📞 Support Resources

- [Google Sheets API Docs](https://developers.google.com/sheets/api)
- [Vercel Documentation](https://vercel.com/docs)
- [Node.js Google APIs](https://github.com/googleapis/google-api-nodejs-client)

## 🎉 Success!

Your registration system should now be:
- ✅ Live on Vercel
- ✅ Writing to Google Sheets
- ✅ Generating QR codes and barcodes
- ✅ Creating professional badges
- ✅ Accessible to your team

Next steps:
1. Customize the registration form design
2. Add email notifications
3. Create admin dashboard
4. Set up analytics tracking