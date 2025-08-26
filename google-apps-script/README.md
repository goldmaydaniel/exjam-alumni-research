# ExJAM Registration System - Google Apps Script Setup Guide

This guide will help you set up the ExJAM PG Conference registration system using Google Apps Script with QR codes and barcodes.

## Overview

The system includes:
- **Google Forms Integration**: Automated form creation for event registration
- **QR Code Generation**: Multiple QR codes for different purposes using Google Charts API
- **Barcode Generation**: Code128 barcodes for participant tracking
- **Photo Upload & Processing**: Photo upload via Google Drive links with validation
- **Professional Badge Creation**: PDF badges with embedded photos, QR codes, and barcodes
- **Automated Email Notifications**: Confirmation emails to participants
- **Data Management**: Spreadsheet integration for response tracking
- **Reporting**: Automated registration reports and statistics

## Setup Instructions

### Step 1: Access Google Apps Script

1. Go to [script.google.com](https://script.google.com)
2. Sign in with your Google account
3. Click "New Project"
4. Rename the project to "ExJAM Registration System"

### Step 2: Create the Script Files

#### File 1: ExjamRegistrationSystem.gs
1. In the Apps Script editor, create a new file called `ExjamRegistrationSystem.gs`
2. Copy and paste the content from `ExjamRegistrationSystem.gs` in this project
3. This is the main registration system file

#### File 2: QRBarcodeIntegration.gs
1. Create another file called `QRBarcodeIntegration.gs`
2. Copy and paste the content from `QRBarcodeIntegration.gs` in this project
3. This handles QR code and barcode generation

#### File 3: PhotoProcessing.gs
1. Create another file called `PhotoProcessing.gs`
2. Copy and paste the content from `PhotoProcessing.gs` in this project
3. This handles photo upload, processing, and badge generation with photos

### Step 3: Configure the System

1. **Update Configuration**: In `ExjamRegistrationSystem.gs`, modify the `CONFIG` object:
   ```javascript
   const CONFIG = {
     EVENT_NAME: "ExJAM President General's Conference - Maiden Flight",
     EVENT_DATE: "November 28-30, 2025",
     EVENT_VENUE: "NAF Conference Centre, FCT, ABUJA",
     EVENT_THEME: "Strive to Excel",
     ID_PREFIX: "EXJAM",
     SPREADSHEET_NAME: "ExJAM PG Conference Registrations",
     FOLDER_NAME: "ExJAM PG Conference 2025"
   };
   ```

2. **Update Contact Information**: Modify the email templates and contact details as needed.

### Step 4: Enable Required APIs

1. In the Apps Script editor, go to **Services** (+ icon)
2. Add the following services:
   - **Google Forms API**
   - **Google Sheets API**
   - **Google Drive API**
   - **Gmail API**

### Step 5: Set Up Permissions

1. Click **Deploy** > **New deployment**
2. Choose **Web app** as the type
3. Set access to **Anyone with Google account**
4. Click **Deploy**
5. Authorize the app when prompted

### Step 6: Initialize the System

1. In the Apps Script editor, run the `setupRegistrationSystem()` function
2. This will:
   - Create the registration form
   - Create the response spreadsheet
   - Set up Google Drive folders
   - Generate initial QR codes and barcodes
   - Create a sample badge

### Step 7: Test the System

1. Run the `testCodeGeneration()` function to test QR code and barcode generation
2. Submit a test registration through the form
3. Check that confirmation emails are sent
4. Verify that data is properly stored in the spreadsheet

## Usage Instructions

### Running the Main Setup
```javascript
function setupRegistrationSystem() {
  // This creates the entire registration system
}
```

### Testing Code Generation
```javascript
function testCodeGeneration() {
  // This tests QR code and barcode generation
}
```

### Generating Registration Report
```javascript
function generateRegistrationReport() {
  // This generates a comprehensive registration report
}
```

### Bulk Code Generation
```javascript
function bulkGenerateCodes(participantsData) {
  // This generates codes for multiple participants
}
```

## System Features

### 1. Registration Form
- **Personal Information**: Name, ExJAM Service Number, Set, Squadron, Chapter
- **Contact Information**: Email, phone, location, emergency contact
- **Photo Upload**: Photo upload instructions, Google Drive link, photo consent
- **Professional Information**: Occupation, organization
- **Logistics**: Dietary restrictions, accommodation, transportation
- **Session Preferences**: Interests, speaking opportunities
- **Additional Information**: Goals, expectations, comments

### 2. QR Codes Generated
- **Registration Form QR**: Links directly to the registration form
- **Event Information QR**: Contains event details and registration link
- **Contact Information QR**: Contains contact details and registration link
- **Venue Information QR**: Contains venue details
- **Participant QR**: Individual QR codes for each registration

### 3. Barcodes Generated
- **Event ID Barcode**: "EXJAM-PG-2025"
- **Venue Code Barcode**: "NAF-CC-ABUJA"
- **Date Code Barcode**: "20251128-30"
- **Participant Barcode**: Individual registration IDs

### 4. Participant Badges
- Professional HTML/PDF badges with embedded photos
- Photo upload via Google Drive links
- Photo validation and processing
- Embedded QR codes and barcodes
- Participant information and event details
- Registration ID and photo status

### 5. Automated Features
- **Email Confirmations**: Sent automatically to participants
- **Data Storage**: Responses stored in Google Sheets
- **Unique IDs**: Auto-generated registration IDs
- **File Organization**: Automatic folder structure in Google Drive

## File Structure

The system creates the following structure in Google Drive:

```
ExJAM PG Conference 2025/
├── QR Codes/
│   ├── Registration_Form_QR.png
│   ├── Event_Info_QR.png
│   ├── Contact_Info_QR.png
│   ├── Venue_Info_QR.png
│   └── QR_[RegistrationID].png (for each participant)
├── Barcodes/
│   ├── Event_ID_Barcode.png
│   ├── Venue_Code_Barcode.png
│   ├── Date_Code_Barcode.png
│   └── Barcode_[RegistrationID].png (for each participant)
├── Badges/
│   ├── Badge_[RegistrationID].html (for each participant)
│   └── Badge_[RegistrationID].pdf (for each participant)
├── Reports/
│   └── Registration_Report_[Date].txt
└── Data/
    └── Additional data files
```

## Customization Options

### 1. Form Customization
- Modify form fields in the `add*Section()` functions
- Add or remove questions as needed
- Change field types (text, multiple choice, checkbox, etc.)

### 2. QR Code Customization
- Modify QR code data in `generateAllEventCodes()`
- Change QR code size and format
- Add custom QR codes for specific purposes

### 3. Badge Customization
- Modify the HTML template in `createBadgeHTML()`
- Change colors, fonts, and layout
- Add custom branding elements

### 4. Email Customization
- Modify email templates in `sendConfirmationEmail()`
- Add additional email notifications
- Customize email content and formatting

## Troubleshooting

### Common Issues

1. **API Quotas Exceeded**
   - Google Charts API has daily quotas
   - Consider using alternative QR/barcode APIs
   - Implement rate limiting for bulk operations

2. **Permission Errors**
   - Ensure all required APIs are enabled
   - Check that the script has proper authorization
   - Verify Google account permissions

3. **Form Not Created**
   - Check that Google Forms API is enabled
   - Verify script permissions
   - Check console logs for error messages

4. **QR Codes Not Generated**
   - Verify internet connectivity
   - Check Google Charts API availability
   - Review error logs in Apps Script console

### Debugging

1. **Check Console Logs**
   - Open Apps Script editor
   - View execution logs for error messages
   - Use `console.log()` for debugging

2. **Test Individual Functions**
   - Run functions one by one to isolate issues
   - Use the test functions provided

3. **Check File Permissions**
   - Ensure Google Drive folders are accessible
   - Verify spreadsheet permissions

## Support

For technical support or customization requests:
- Check the Apps Script documentation
- Review Google Forms API documentation
- Contact the development team

## Security Considerations

1. **Data Privacy**
   - Participant data is stored in Google Sheets
   - Ensure compliance with data protection regulations
   - Implement appropriate access controls

2. **API Security**
   - Use HTTPS for all API calls
   - Implement rate limiting
   - Monitor API usage

3. **Access Control**
   - Limit script access to authorized users
   - Regularly review permissions
   - Implement audit logging

## Future Enhancements

1. **Advanced Analytics**
   - Real-time registration statistics
   - Geographic distribution maps
   - Trend analysis

2. **Mobile App Integration**
   - Native mobile app for registration
   - QR code scanning functionality
   - Push notifications

3. **Payment Integration**
   - Registration fee collection
   - Payment processing
   - Receipt generation

4. **Advanced Badge Features**
   - Digital badges with verification
   - NFC integration
   - Augmented reality features

---

*This system is designed specifically for the ExJAM PG Conference - Maiden Flight event. Customize as needed for other events.*
