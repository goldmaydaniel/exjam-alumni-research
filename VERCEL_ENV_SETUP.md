# 🚀 Vercel Environment Variables - Quick Setup

## 📋 How to Add to Vercel

### Step 1: Go to Vercel Dashboard
https://vercel.com/dashboard

### Step 2: Select Your Project
Click on: **exjam-alumni-registration**

### Step 3: Navigate to Environment Variables
**Settings** → **Environment Variables**

### Step 4: Add Each Variable

## 📝 Copy & Paste These Values

### Variable 1: GOOGLE_SHEETS_ID
**Name:** `GOOGLE_SHEETS_ID`  
**Value:**
```
1dkLY2WxaPkk6eceW_gJIDj3iUabTBO5p_fS5W_PD91s
```
**Environment:** ✅ Production, ✅ Preview, ✅ Development  
Click **Save**

---

### Variable 2: GOOGLE_SERVICE_ACCOUNT_EMAIL
**Name:** `GOOGLE_SERVICE_ACCOUNT_EMAIL`  
**Value:**
```
exjam-registration@exjam-registration.iam.gserviceaccount.com
```
**Environment:** ✅ Production, ✅ Preview, ✅ Development  
Click **Save**

---

### Variable 3: GOOGLE_PRIVATE_KEY
**Name:** `GOOGLE_PRIVATE_KEY`  
**Value:** (Copy this ENTIRE block including BEGIN and END)
```
-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCvXVSXfkxz2QKW
gv+yXFQYlAB8EXkRnrLn0JssTQwwUv0F7AHoFTpFGVoaMSjP4IQagdYNjFH71C8n
aKzaQ4qtg4y7qK3BTqjDx7gW7C9Q0Yg7pFFC7rfEqfbWz+Da63odnGlReTJwq0+s
f6IFq68jGfezMUOzVLZdFoa+oZ5eGBBV6x8FWdjRq1v3A8G67w4DCWZwyYG50KMS
f46wlV1fNtJheMySp3aIwjIvk5lVxtJPfUeyrFZcSK0v5z8K3mrYD1Kd3cr0+w0t
bShTRCMxq8ZL91g/Jc40z9U3kaYcnqrv7iTnMPM4Fq/xJVd60gA3HYmZEyawvUWH
yL0NyQA9AgMBAAECggEAFU/bDKDgGwwlO7QmmGnkG9XmIS3hGs/An6+Yds/ToA6A
iuGzHEjIJhxTTkTp2Cme+bcMaTpuaZPQjzzcv5c0bqtCxTkAtNzMYc652VSm2MQ+
MZFiAX0QKanGQouiS2NmxIZ9E4EOgjwvmJ/XnvzNx2RL2CPakxwZIEMGk9BXIMl0
NPUBMxQyKYXc5ETz3fOkf7/kgSFRdZQd+wlH78pcM9Vn6qZwXvhY+n4i6I7NWnDD
z5Tu8UFlGVNDEvWAmQnt8qv4+cTp5v0YOoT4Bpxr+rvrd+NXFMqcZ5IOaTXBxIp2
clGROYjksB72L1i3f53xgaEQJrPQuz+dWx8M02a6uQKBgQDmSfXcsjGGPSRM88Jp
kMF0WWzXtOA8OYZUkDnsMlgUmjLJkQ/+OKw0JE0ZLWJdSZ5d0cb/irqTNj5YqCLw
xTSGzeRSsnDR2qfsCeB6A5SgTOVeeC0gmTTDpCjUn9TaIlnsN178KH6p3cRseIG6
HisfzE866TWZ9SLVTG01916oTwKBgQDC8YqQbVcqxqsQ1HCspcpaUc79p7tVF+Km
/aKZ0r3lKohcNcCVx3oM4ZUWZLo5+M4FWr01Ki74eyl+vIEDxWZ31J88gTtxMDan
yIGmPxYA9crFN3JlVBM+po7wdalff+hLXtcAGn11nKF5Evotj7uPtjbMF0yhDiH4
6y6zupxfswKBgE0PLrBdCGltCDqfzsxYXgO68Mr1gZtlfGfLozZAWmz6dEgyvHFL
MYR5KTtljma8/btTOQ3FtE0Sd6ZfDOIYe00olGB/yXTPgCVh4LWzgQZq9M251Q/1
dEyLIAaWPTmJCSIcHTKvskLRLKtHX9GRyshnK5QA+ai8+Jz7aAgI8KnNAoGAfVCq
Q1eWbjAR7Zqy57kX0GHAjvyRBw14rOJk8T8wxS1HRQdkyqPViIxGu4N61yNixLxk
3tVEJoV90jO5N8Rgr21mA44LuSJGMCtLdKQfL/TRKWAQUKTwThjh0B/DBloB6NmJ
mk5tEfrjLiKN4lYAO0zmAuKDZxDfs9TzS6QNO9MCgYA+ARP46WXevqHqlBy6Gu0z
6UTtDMoyiCxEkehySzfYsJeYORgQkvzycj04igU6ri5/NQTNY6dCepUSDidKlIEs
UkGdaXE/lRAzrseMhtiSm2eNN3Ch8YO2H0k9zW5EVMC7Hr+peyIlC2oxR/2il/Vx
X6s15P12yI8FsOwIyU47kA==
-----END PRIVATE KEY-----
```
**Environment:** ✅ Production, ✅ Preview, ✅ Development  
Click **Save**

---

## 🔄 Step 5: Redeploy

After adding all 3 variables:

1. Go to **Deployments** tab
2. Click **...** on latest deployment
3. Click **Redeploy**
4. Confirm **Redeploy**

Or via command line:
```bash
vercel --prod --yes
```

---

## ✅ Verification

Your environment variables are set correctly when:
- All 3 variables show in the Environment Variables list
- They have green checkmarks for Production, Preview, Development
- The deployment completes successfully

---

## 🎯 Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your Project:** https://vercel.com/layoverhqs-projects/exjam-alumni-registration
- **Environment Variables:** https://vercel.com/layoverhqs-projects/exjam-alumni-registration/settings/environment-variables

---

## 📌 Important Notes

1. **Don't add quotes** around the values in Vercel (unlike in .env files)
2. **Copy the entire private key** including BEGIN and END lines
3. **Check all 3 environments** (Production, Preview, Development)
4. **Redeploy after adding** variables for changes to take effect

---

**Ready!** Once these are added and deployed, your registration system will be fully functional! 🚀