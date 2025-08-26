# 🚀 ExJAM Registration System - Function Guide

## 📋 Available Functions

### 🎯 **Main Functions**

#### 1. `initializeRegistrationSystem()`
**Purpose**: Complete system initialization with comprehensive setup
**What it does**:
- ✅ Validates configuration
- ✅ Creates folder structure
- ✅ Creates registration form
- ✅ Creates response spreadsheet
- ✅ Links form to spreadsheet
- ✅ Generates event codes
- ✅ Creates sample badge
- ✅ Tests photo processing
- ✅ Generates initial report

**How to run**:
1. Open your Apps Script project
2. Select `initializeRegistrationSystem` from the function dropdown
3. Click the **Run** button (▶️)
4. Authorize when prompted

**Expected output**:
```
🚀 Initializing ExJAM Registration System...
=============================================
📋 Step 1: Validating configuration...
✅ Configuration validated successfully
📁 Step 2: Creating folder structure...
✅ Folders created successfully
📝 Step 3: Creating registration form...
✅ Registration form created successfully
📊 Step 4: Creating response spreadsheet...
✅ Response spreadsheet created successfully
🔗 Step 5: Linking form to spreadsheet...
✅ Form linked to spreadsheet successfully
🎫 Step 6: Generating event codes...
✅ Event codes generated successfully
🖼️ Step 7: Creating sample badge...
✅ Sample badge created successfully
📸 Step 8: Testing photo processing...
✅ Photo processing tested successfully
📈 Step 9: Generating initial report...
✅ Initial report generated successfully
🎉 ExJAM Registration System initialization complete!
```

#### 2. `quickSetup()`
**Purpose**: Fast setup for testing (creates basic structure only)
**What it does**:
- ✅ Creates folders
- ✅ Creates registration form
- ✅ Creates response spreadsheet

**Use when**: You want to test quickly without full initialization

#### 3. `testPhotoProcessing()`
**Purpose**: Test photo upload and processing functionality
**What it does**:
- ✅ Creates test participant data
- ✅ Tests photo processing
- ✅ Validates badge generation

**Use when**: You want to verify photo functionality works

### 🔧 **Configuration Functions**

#### `validateConfiguration()`
**Purpose**: Validates all configuration settings
**Checks**:
- ✅ All required fields are present
- ✅ Date format is valid
- ✅ Folder name is appropriate length

### 📊 **Reporting Functions**

#### `generateRegistrationReport()`
**Purpose**: Creates comprehensive registration report
**Includes**:
- 📈 Registration statistics
- 📍 Geographic distribution
- 🏛️ Set/Squadron/Chapter breakdown
- 🍽️ Dietary requirements
- 🏨 Accommodation needs
- 🚗 Transportation needs

### 🎫 **Code Generation Functions**

#### `generateEventCodes()`
**Purpose**: Creates QR codes and barcodes for the event
**Creates**:
- 📱 QR codes for easy access
- 📊 Barcodes for scanning
- 🎫 Event-specific codes

### 🖼️ **Badge Functions**

#### `createSampleBadge()`
**Purpose**: Creates a sample participant badge
**Features**:
- 📸 Photo placeholder
- 📋 Participant information
- 🎫 QR code and barcode
- 🎨 Professional design

## 🎯 **How to Use the Functions**

### **Step 1: First Time Setup**
1. Open your Apps Script project
2. Run `initializeRegistrationSystem()`
3. Check the execution logs for progress
4. Verify all components are created

### **Step 2: Testing**
1. Run `testPhotoProcessing()` to test photo functionality
2. Run `createSampleBadge()` to test badge generation
3. Check Google Drive for created files

### **Step 3: Monitoring**
1. Run `generateRegistrationReport()` to get current statistics
2. Check the spreadsheet for new registrations
3. Monitor the execution logs for any issues

## 📍 **Function Locations**

| Function | File | Purpose |
|----------|------|---------|
| `initializeRegistrationSystem` | ExjamRegistrationSystem.gs | Main initialization |
| `quickSetup` | ExjamRegistrationSystem.gs | Fast setup |
| `testPhotoProcessing` | ExjamRegistrationSystem.gs | Photo testing |
| `processPhotoAndCreateBadge` | PhotoProcessing.gs | Photo processing |
| `generateParticipantCodes` | QRBarcodeIntegration.gs | QR/Barcode generation |

## 🔍 **Troubleshooting**

### **Common Issues:**

#### "Function not found"
- Make sure you're in the correct Apps Script project
- Check that all files are properly uploaded
- Refresh the page if needed

#### "Service not enabled"
- Go to **Services** in the left sidebar
- Add missing APIs (Drive, Sheets, Gmail, Forms)
- Wait a few minutes for activation

#### "Permission denied"
- Re-authorize the app when prompted
- Check that you're signed in with the correct account
- Ensure you have edit permissions

#### "Configuration error"
- Check the CONFIG object in ExjamRegistrationSystem.gs
- Verify all required fields are filled
- Use proper date format (e.g., "December 15, 2025")

## 📞 **Getting Help**

1. **Check Execution Logs**: View detailed logs in Apps Script
2. **Test Individual Functions**: Run functions one by one
3. **Verify Google Drive**: Check that folders and files are created
4. **Review Configuration**: Ensure CONFIG object is correct

## 🎉 **Success Indicators**

When everything is working correctly, you should see:
- ✅ All 9 steps complete in `initializeRegistrationSystem()`
- ✅ Google Drive folders created
- ✅ Google Form accessible
- ✅ Google Sheet with headers
- ✅ Sample badge generated
- ✅ Photo processing working
- ✅ QR codes and barcodes created

---
**📚 For complete setup instructions, see: DEPLOYMENT_GUIDE.md**
