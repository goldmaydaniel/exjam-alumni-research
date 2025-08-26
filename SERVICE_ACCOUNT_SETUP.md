# 🔐 Google Service Account Setup - Step by Step

## 📋 Quick Links
- **Google Cloud Console**: https://console.cloud.google.com
- **Your Google Sheet**: https://docs.google.com/spreadsheets/d/1dkLY2WxaPkk6eceW_gJIDj3iUabTBO5p_fS5W_PD91s/edit

## Step 1: Create Google Cloud Project

### 1.1 Go to Google Cloud Console
1. Open: https://console.cloud.google.com
2. Sign in with your Google account
3. You'll see the Google Cloud Console dashboard

### 1.2 Create New Project
1. Click the **project dropdown** at the top (might say "Select a project")
2. Click **"NEW PROJECT"** button
3. Enter details:
   - **Project name**: `exjam-registration`
   - **Organization**: Leave as is (or select if you have one)
4. Click **"CREATE"**
5. Wait 30 seconds for project creation
6. **IMPORTANT**: Make sure your new project is selected in the dropdown

## Step 2: Enable Google Sheets API

### 2.1 Navigate to APIs
1. Click the **hamburger menu** (☰) in top-left
2. Go to **"APIs & Services"** → **"Library"**

### 2.2 Enable Required APIs
1. Search for **"Google Sheets API"**
2. Click on it
3. Click **"ENABLE"** button
4. Wait for it to enable (10-15 seconds)

Also enable (optional but recommended):
1. Search for **"Google Drive API"**
2. Click **"ENABLE"**

## Step 3: Create Service Account

### 3.1 Go to Credentials
1. In left sidebar, click **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** button at top
3. Select **"Service account"**

### 3.2 Fill Service Account Details
**Step 1 - Service account details:**
- **Service account name**: `exjam-sheets-service`
- **Service account ID**: (auto-fills) `exjam-sheets-service`
- **Description**: `Service account for ExJAM registration system`
- Click **"CREATE AND CONTINUE"**

**Step 2 - Grant access (Optional):**
- Click **"Select a role"** dropdown
- Type "Editor" in search
- Select **"Editor"** role
- Click **"CONTINUE"**

**Step 3 - Grant users access (Optional):**
- Skip this - just click **"DONE"**

## Step 4: Generate JSON Key

### 4.1 Access Service Account
1. You'll see your service account in the list
2. Click on the **email address** of your service account
   (looks like: `exjam-sheets-service@exjam-registration.iam.gserviceaccount.com`)

### 4.2 Create Key
1. Click **"KEYS"** tab at the top
2. Click **"ADD KEY"** → **"Create new key"**
3. Select **"JSON"** format
4. Click **"CREATE"**
5. **IMPORTANT**: A JSON file will download automatically
   - Save this file safely!
   - Name it something like `exjam-service-account.json`
   - You'll need this file's contents

### 4.3 Open the JSON File
1. Open the downloaded JSON file in a text editor
2. You'll see something like:
```json
{
  "type": "service_account",
  "project_id": "exjam-registration",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "exjam-sheets-service@exjam-registration.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

### 4.4 Note Important Values
From this file, you need:
1. **client_email**: The email address (e.g., `exjam-sheets-service@exjam-registration.iam.gserviceaccount.com`)
2. **private_key**: The entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

## Step 5: Share Google Sheet with Service Account

### 5.1 Open Your Google Sheet
1. Go to: https://docs.google.com/spreadsheets/d/1dkLY2WxaPkk6eceW_gJIDj3iUabTBO5p_fS5W_PD91s/edit
2. This is your ExJAM registration spreadsheet

### 5.2 Share with Service Account
1. Click **"Share"** button (top-right corner)
2. In the **"Add people and groups"** field, paste the service account email:
   - Use the `client_email` from your JSON file
   - Example: `exjam-sheets-service@exjam-registration.iam.gserviceaccount.com`
3. Set permission to **"Editor"**
4. **UNCHECK** "Notify people" (service accounts can't receive emails)
5. Click **"Share"**

## Step 6: Set Up Environment Variables

### 6.1 Create Local Environment File
Create `.env.local` in your project:
```bash
cd /Users/goldmay/exjam-alumni-research
touch .env.local
```

### 6.2 Add Your Credentials
Edit `.env.local` and add:
```env
# Your Google Sheet ID (from the URL)
GOOGLE_SHEETS_ID=1dkLY2WxaPkk6eceW_gJIDj3iUabTBO5p_fS5W_PD91s

# Service account email from JSON file
GOOGLE_SERVICE_ACCOUNT_EMAIL=exjam-sheets-service@exjam-registration.iam.gserviceaccount.com

# Private key from JSON file (copy the ENTIRE thing including BEGIN/END)
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC5W8pqe...
[REST OF YOUR KEY HERE - IT'S VERY LONG]
...XmHjQ6LS1oqkA1yl3A=
-----END PRIVATE KEY-----"
```

**IMPORTANT**: 
- Copy the ENTIRE private key including `-----BEGIN` and `-----END` lines
- Keep the quotes around the private key
- Make sure there are no extra spaces

## Step 7: Add to Vercel

### 7.1 Go to Vercel Dashboard
1. Visit: https://vercel.com/dashboard
2. Click on your project: `exjam-alumni-registration`

### 7.2 Add Environment Variables
1. Go to **"Settings"** tab
2. Click **"Environment Variables"** in left sidebar
3. Add each variable:

**Variable 1:**
- Name: `GOOGLE_SHEETS_ID`
- Value: `1dkLY2WxaPkk6eceW_gJIDj3iUabTBO5p_fS5W_PD91s`
- Environment: Production ✓, Preview ✓, Development ✓
- Click **"Save"**

**Variable 2:**
- Name: `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- Value: `your-service-account@project.iam.gserviceaccount.com`
- Environment: Production ✓, Preview ✓, Development ✓
- Click **"Save"**

**Variable 3:**
- Name: `GOOGLE_PRIVATE_KEY`
- Value: (paste the entire private key including BEGIN/END)
- Environment: Production ✓, Preview ✓, Development ✓
- Click **"Save"**

### 7.3 Redeploy
After adding all variables:
1. Go to **"Deployments"** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Click **"Redeploy"** in the popup

## Step 8: Test Your Setup

### 8.1 Test Registration
1. Go to: https://exjam-alumni-registration.vercel.app/registration.html
2. Fill out the form
3. Submit

### 8.2 Check Google Sheet
1. Open your Google Sheet
2. You should see the new registration appear!

## 🎉 Success Checklist

- ✅ Google Cloud project created
- ✅ Google Sheets API enabled
- ✅ Service account created
- ✅ JSON key downloaded
- ✅ Sheet shared with service account
- ✅ Environment variables in `.env.local`
- ✅ Environment variables in Vercel
- ✅ System redeployed
- ✅ Test registration works

## 🆘 Troubleshooting

### "Permission denied" Error
- Make sure you shared the Google Sheet with the service account email
- Check that you gave "Editor" permission, not "Viewer"

### "Invalid credentials" Error
- Check that the private key is copied correctly (including BEGIN/END)
- Make sure there are no extra spaces or line breaks
- Verify the service account email is correct

### "Cannot find spreadsheet" Error
- Verify the GOOGLE_SHEETS_ID is correct
- Check that the sheet is shared with the service account

### Form submission fails
- Check browser console for errors (F12)
- Verify all environment variables are set in Vercel
- Make sure you redeployed after adding variables

## 📞 Need Help?

If you get stuck:
1. Double-check each step above
2. Make sure the service account has "Editor" access to the sheet
3. Verify all environment variables are set correctly
4. Check Vercel logs for error messages

---

**Ready?** Follow these steps carefully and your registration system will be fully connected to Google Sheets! 🚀