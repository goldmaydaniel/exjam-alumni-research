# 🚀 Quick Deployment Reference

## 📋 Essential Steps

### 1. Access Google Apps Script
- Go to: https://script.google.com
- Sign in with Google account
- Click "New Project"

### 2. Create Project Structure
```
ExJAM Registration System/
├── ExjamRegistrationSystem.gs (Main file)
├── QRBarcodeIntegration.gs
└── PhotoProcessing.gs
```

### 3. Enable APIs (Services)
- Google Drive API
- Google Sheets API  
- Gmail API
- Google Forms API

### 4. Key Functions to Run
1. `initializeRegistrationSystem` - Set up folders and form
2. `testPhotoProcessing` - Test photo functionality
3. `createSampleBadge` - Test badge generation

### 5. Configuration Updates
```javascript
const CONFIG = {
  FOLDER_NAME: "ExJAM PG Conference 2025",
  SPREADSHEET_NAME: "ExJAM Registration Responses",
  EVENT_DATE: "December 15, 2025",
  EVENT_VENUE: "Air Force Military School Jos",
  EVENT_THEME: "Maiden Flight - Building Bridges Across Generations"
};
```

## 🔧 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Service not enabled | Add missing API in Services |
| Permission denied | Re-authorize the app |
| Form not found | Check execution logs |
| Photo processing failed | Verify Google Drive API |

## 📞 Emergency Contacts
- Check execution logs in Apps Script
- Verify all APIs are enabled
- Test individual functions
- Review DEPLOYMENT_GUIDE.md for details

## ✅ Success Indicators
- [ ] Google Drive folders created
- [ ] Google Sheet with headers
- [ ] Google Form accessible
- [ ] Test functions run successfully
- [ ] Email notifications working
- [ ] Photo processing tested
- [ ] Badge generation working

---
**📚 Full Guide**: See DEPLOYMENT_GUIDE.md for complete instructions
