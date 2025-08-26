# 🚀 ExJAM Registration System - Google Apps Script Deployment Guide

## Overview
This guide will help you deploy the ExJAM President General's Conference registration system using Google Apps Script and Google Workspace Forms.

## Prerequisites
- Google Account with access to Google Workspace
- Google Drive access
- Google Sheets access
- Google Forms access

## 📋 Step-by-Step Deployment

### Step 1: Access Google Apps Script
1. Go to [script.google.com](https://script.google.com)
2. Sign in with your Google account
3. Click **"New Project"**

### Step 2: Create the Apps Script Project
1. **Rename the project**: Click on "Untitled project" and rename it to `ExJAM Registration System`
2. **Delete the default code**: Remove the existing `function myFunction() {}` code

### Step 3: Add the Script Files

#### File 1: ExjamRegistrationSystem.gs
1. In the Apps Script editor, you'll see `Code.gs` by default
2. Copy the entire content from `ExjamRegistrationSystem.gs` in this project
3. Paste it into the `Code.gs` file
4. Rename `Code.gs` to `ExjamRegistrationSystem.gs` by clicking the file name

#### File 2: QRBarcodeIntegration.gs
1. Click the **"+"** button next to the files list
2. Select **"Script"**
3. Name it `QRBarcodeIntegration.gs`
4. Copy and paste the content from `QRBarcodeIntegration.gs` in this project

#### File 3: PhotoProcessing.gs
1. Click the **"+"** button next to the files list
2. Select **"Script"**
3. Name it `PhotoProcessing.gs`
4. Copy and paste the content from `PhotoProcessing.gs` in this project

### Step 4: Configure the System
1. **Update Configuration**: In `ExjamRegistrationSystem.gs`, find the `CONFIG` object and update:
   ```javascript
   const CONFIG = {
     FOLDER_NAME: "ExJAM PG Conference 2025",
     SPREADSHEET_NAME: "ExJAM Registration Responses",
     EVENT_DATE: "December 15, 2025",
     EVENT_VENUE: "Air Force Military School Jos",
     EVENT_THEME: "Maiden Flight - Building Bridges Across Generations"
   };
   ```

2. **Update Email Settings**: Find the email configuration and update:
   ```javascript
   const EMAIL_CONFIG = {
     FROM_NAME: "ExJAM Registration System",
     FROM_EMAIL: "your-email@gmail.com", // Update with your email
     SUBJECT: "ExJAM PG Conference Registration Confirmation"
   };
   ```

### Step 5: Enable Required APIs
1. In the Apps Script editor, click **"Services"** in the left sidebar
2. Add these services:
   - **Google Drive API**
   - **Google Sheets API**
   - **Gmail API**
   - **Google Forms API**

### Step 6: Set Up Permissions
1. Click **"Deploy"** → **"New deployment"**
2. Choose **"Web app"** as the type
3. Set execution as **"Me"**
4. Set access to **"Anyone"** (for form submissions)
5. Click **"Deploy"**
6. **Authorize** the app when prompted

### Step 7: Initialize the System
1. In the Apps Script editor, go to the **"Select function"** dropdown
2. Select **`initializeRegistrationSystem`**
3. Click the **"Run"** button (▶️)
4. **Authorize** when prompted
5. Check the **"Execution log"** for success messages

### Step 8: Test the System
1. Run the **`testPhotoProcessing`** function to test photo functionality
2. Run the **`createSampleBadge`** function to test badge generation
3. Check your Google Drive for the created folders and files

## 📁 Expected File Structure
After deployment, you should see this structure in your Google Drive:
```
ExJAM PG Conference 2025/
├── QR Codes/
├── Barcodes/
├── Badges/
├── Participant Photos/
├── Reports/
└── Data/
    └── ExJAM Registration Responses (Google Sheet)
```

## 🔧 Troubleshooting

### Common Issues:

#### 1. "Service not enabled" error
- Go to **Services** in Apps Script
- Make sure all required APIs are added
- Wait a few minutes for services to activate

#### 2. "Permission denied" error
- Check that you're signed in with the correct Google account
- Ensure you have edit permissions on Google Drive
- Re-authorize the app if needed

#### 3. "Form not found" error
- Make sure the Google Form was created successfully
- Check the form URL in the execution log
- Verify the form is accessible

#### 4. "Photo processing failed" error
- Check that Google Drive API is enabled
- Verify photo upload links are accessible
- Check file size limits (max 5MB)

### Debug Steps:
1. **Check Execution Logs**: View logs in Apps Script editor
2. **Test Individual Functions**: Run functions one by one
3. **Check Google Drive**: Verify folders and files are created
4. **Check Google Sheets**: Verify spreadsheet is created with correct headers

## 📧 Email Configuration
To customize email notifications:
1. Update `EMAIL_CONFIG` in the main script
2. Modify email templates in the `sendConfirmationEmail` function
3. Test email sending with a sample registration

## 🔄 Updating the System
To update the system:
1. Make changes in the Apps Script editor
2. Save the files (Ctrl+S or Cmd+S)
3. Create a new deployment version
4. Update the web app deployment

## 📊 Monitoring and Maintenance
- **Check Execution Logs**: Monitor for errors
- **Review Google Drive**: Ensure files are being created
- **Monitor Google Sheets**: Check registration data
- **Test Regularly**: Run test functions periodically

## 🚀 Production Deployment
For production use:
1. **Update Configuration**: Set production values
2. **Test Thoroughly**: Run all test functions
3. **Set Permissions**: Configure appropriate access levels
4. **Monitor**: Set up regular monitoring
5. **Backup**: Keep backups of the script files

## 📞 Support
If you encounter issues:
1. Check the execution logs in Apps Script
2. Verify all APIs are enabled
3. Test individual functions
4. Check Google Drive permissions
5. Review the troubleshooting section above

## ✅ Deployment Checklist
- [ ] Google Apps Script project created
- [ ] All three script files added
- [ ] Configuration updated
- [ ] Required APIs enabled
- [ ] Permissions authorized
- [ ] System initialized
- [ ] Test functions run successfully
- [ ] Google Drive folders created
- [ ] Google Sheet created
- [ ] Google Form accessible
- [ ] Email notifications working
- [ ] Photo processing tested
- [ ] Badge generation tested

## 🎉 Success!
Once all steps are completed, your ExJAM registration system will be live and ready to accept registrations with:
- ✅ Automated form creation
- ✅ QR code and barcode generation
- ✅ Photo upload and processing
- ✅ Professional badge creation
- ✅ Email notifications
- ✅ Data management
- ✅ Reporting capabilities

The system is now ready for the ExJAM President General's Conference!
