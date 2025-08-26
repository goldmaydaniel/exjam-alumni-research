# 🔐 Google Service Account Setup for ExJAM Registration System

## 📋 Overview

A Google Service Account provides secure, programmatic access to Google APIs and services. This guide will help you create and configure a service account for your ExJAM registration system, enabling better security and automation.

## 🎯 Why Use a Service Account?

### **Benefits**
- ✅ **Enhanced Security**: Separate credentials from personal account
- ✅ **API Access**: Programmatic access to Google services
- ✅ **Automation**: Run scripts and processes automatically
- ✅ **Deployment**: Deploy web apps with proper permissions
- ✅ **Monitoring**: Track usage and manage access

### **Use Cases for ExJAM System**
- **Web App Deployment**: Secure deployment of registration system
- **API Integration**: Access to Drive, Sheets, Gmail APIs
- **Automated Processing**: Background form processing
- **Data Management**: Secure access to participant data
- **Reporting**: Automated report generation

## 🚀 Step-by-Step Setup

### **Step 1: Access Google Cloud Console**

1. **Go to Google Cloud Console**
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Sign in with your Google account

2. **Select or Create Project**
   - Choose your existing project or create a new one
   - Name it: `exjam-registration-system`
   - Click "Create" or "Select"

### **Step 2: Enable Required APIs**

1. **Go to APIs & Services → Library**
2. **Search and enable these APIs:**
   - **Google Drive API**
   - **Google Sheets API**
   - **Gmail API**
   - **Google Forms API**
   - **Google Apps Script API**

3. **For each API:**
   - Click on the API name
   - Click "Enable"
   - Wait for confirmation

### **Step 3: Create Service Account**

1. **Go to APIs & Services → Credentials**
2. **Click "Create Credentials"**
3. **Select "Service Account"**
4. **Fill in the details:**
   - **Service account name**: `exjam-registration-service`
   - **Service account ID**: `exjam-registration-service@[project-id].iam.gserviceaccount.com`
   - **Description**: `Service account for ExJAM registration system`
5. **Click "Create and Continue"**

### **Step 4: Grant Permissions**

1. **Role Assignment:**
   - Click "Select a role"
   - Choose "Apps Script Admin" (for deployment)
   - Choose "Project Editor" (for general access)
   - Click "Continue"

2. **User Access:**
   - **Grant users access**: Yes
   - **Service account users**: Add your email
   - Click "Done"

### **Step 5: Create and Download Key**

1. **Click on your service account**
2. **Go to "Keys" tab**
3. **Click "Add Key" → "Create new key"**
4. **Choose "JSON" format**
5. **Click "Create"**
6. **Download the JSON file** (keep it secure!)

## 🔧 Configuration in Apps Script

### **Step 1: Add Service Account to Project**

1. **Open your Apps Script project**
2. **Go to Project Settings**
3. **Under "Script Properties":**
   - Add: `SERVICE_ACCOUNT_EMAIL`
   - Value: Your service account email

### **Step 2: Update Configuration**

```javascript
// In your CONFIG object, add:
const CONFIG = {
  // ... existing config ...
  SERVICE_ACCOUNT: {
    email: 'exjam-registration-service@[project-id].iam.gserviceaccount.com',
    projectId: '[your-project-id]',
    keyFile: 'path/to/service-account-key.json'
  }
};
```

### **Step 3: Authentication Functions**

```javascript
/**
 * Authenticate using service account
 */
function authenticateWithServiceAccount() {
  try {
    // This will use the service account credentials
    const drive = DriveApp;
    const sheets = SpreadsheetApp;
    
    console.log("✅ Service account authentication successful");
    return true;
    
  } catch (error) {
    console.error("❌ Service account authentication failed: " + error);
    return false;
  }
}

/**
 * Test service account access
 */
function testServiceAccountAccess() {
  try {
    console.log("🧪 Testing service account access...");
    
    // Test Drive access
    const drive = DriveApp;
    const rootFolder = drive.getRootFolder();
    console.log("✅ Drive access: " + rootFolder.getName());
    
    // Test Sheets access
    const sheets = SpreadsheetApp;
    console.log("✅ Sheets access: Available");
    
    // Test Gmail access
    const gmail = GmailApp;
    console.log("✅ Gmail access: Available");
    
    console.log("🎉 Service account access test passed!");
    return true;
    
  } catch (error) {
    console.error("❌ Service account access test failed: " + error);
    return false;
  }
}
```

## 🔒 Security Best Practices

### **Key Management**
- ✅ **Secure Storage**: Keep JSON key file in secure location
- ✅ **Access Control**: Limit who can access the key
- ✅ **Regular Rotation**: Update keys periodically
- ✅ **Monitoring**: Track usage and access

### **Permissions**
- ✅ **Least Privilege**: Grant only necessary permissions
- ✅ **Role-Based Access**: Use appropriate IAM roles
- ✅ **User Management**: Control who can use the service account
- ✅ **Audit Logging**: Monitor all activities

### **Network Security**
- ✅ **HTTPS Only**: All connections must be secure
- ✅ **IP Restrictions**: Limit access to specific IP ranges
- ✅ **API Quotas**: Set reasonable usage limits
- ✅ **Error Handling**: Don't expose sensitive information

## 📊 Monitoring and Management

### **Usage Tracking**
1. **Go to Google Cloud Console**
2. **APIs & Services → Dashboard**
3. **View API usage metrics**
4. **Monitor quota usage**

### **Cost Management**
1. **Billing → Budgets & Alerts**
2. **Set spending limits**
3. **Monitor API costs**
4. **Optimize usage**

### **Access Logs**
1. **IAM & Admin → Audit Logs**
2. **View service account activities**
3. **Monitor for suspicious access**
4. **Review permissions regularly**

## 🚀 Deployment with Service Account

### **Step 1: Update Deployment Script**

```javascript
/**
 * Deploy web app using service account
 */
function deployWebAppWithServiceAccount() {
  try {
    console.log("🚀 Deploying web app with service account...");
    
    // Authenticate with service account
    if (!authenticateWithServiceAccount()) {
      throw new Error("Service account authentication failed");
    }
    
    // Deploy the web app
    const deployment = Apps.newDeployment();
    deployment.setDeploymentConfig(Apps.newDeploymentConfig()
      .setScriptId(ScriptApp.getScriptId())
      .setVersion('1')
      .setManifestFileName('appsscript.json')
      .setDescription('ExJAM Registration System Web App - Service Account'));
    
    const deployedVersion = Apps.createDeployment(deployment);
    
    console.log("✅ Web app deployed successfully with service account!");
    console.log("📋 Deployment ID: " + deployedVersion.getDeploymentId());
    console.log("🌐 Web app URL: " + ScriptApp.getService().getUrl());
    
    return {
      success: true,
      deploymentId: deployedVersion.getDeploymentId(),
      webAppUrl: ScriptApp.getService().getUrl(),
      message: "Web app deployed successfully with service account!"
    };
    
  } catch (error) {
    console.error("❌ Error deploying with service account: " + error);
    return {
      success: false,
      error: error.toString(),
      message: "Failed to deploy with service account. Check logs for details."
    };
  }
}
```

### **Step 2: Test Deployment**

1. **Run the test function:**
   ```javascript
   testServiceAccountAccess()
   ```

2. **Deploy the web app:**
   ```javascript
   deployWebAppWithServiceAccount()
   ```

3. **Verify deployment:**
   - Check the web app URL
   - Test all functionality
   - Monitor execution logs

## 🔧 Troubleshooting

### **Common Issues**

#### **"Service account not found" Error**
- **Solution**: Verify service account email in CONFIG
- **Check**: Ensure service account exists in Google Cloud Console

#### **"Insufficient permissions" Error**
- **Solution**: Grant appropriate IAM roles
- **Check**: Verify role assignments in IAM & Admin

#### **"API not enabled" Error**
- **Solution**: Enable required APIs in Google Cloud Console
- **Check**: Go to APIs & Services → Library

#### **"Authentication failed" Error**
- **Solution**: Verify service account key file
- **Check**: Ensure JSON key is valid and accessible

### **Debug Steps**
1. **Check Google Cloud Console** for service account status
2. **Verify API enablement** in APIs & Services
3. **Review IAM permissions** and role assignments
4. **Test authentication** with test functions
5. **Check execution logs** for detailed error messages

## 📋 Setup Checklist

### **Google Cloud Console**
- [ ] Project created/selected
- [ ] Required APIs enabled
- [ ] Service account created
- [ ] IAM roles assigned
- [ ] JSON key downloaded

### **Apps Script Configuration**
- [ ] Service account email added to CONFIG
- [ ] Authentication functions implemented
- [ ] Test functions working
- [ ] Deployment script updated

### **Testing & Verification**
- [ ] Service account access test passed
- [ ] Web app deployment successful
- [ ] All functionality working
- [ ] Security measures implemented

## 🎯 Next Steps

### **Immediate Actions**
1. **Create the service account** following this guide
2. **Download and secure the JSON key**
3. **Update your Apps Script configuration**
4. **Test service account access**

### **After Setup**
1. **Deploy web app using service account**
2. **Monitor usage and access logs**
3. **Set up alerts and monitoring**
4. **Regular security reviews**

---

## 🎉 Ready to Enhance Security!

Your ExJAM registration system will now have enterprise-grade security with:

✅ **Service Account Authentication** - Secure API access  
✅ **Enhanced Permissions** - Proper role-based access  
✅ **Automated Deployment** - Streamlined web app deployment  
✅ **Better Monitoring** - Track usage and security  
✅ **Professional Standards** - Enterprise-level security  

**Start setting up your service account now to take your registration system to the next level!**
