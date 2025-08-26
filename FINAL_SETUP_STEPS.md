# ✅ Final Setup Steps - Almost Done!

## 📋 Status
✅ **Service Account Created:** `exjam-registration@exjam-registration.iam.gserviceaccount.com`
✅ **Local Environment:** `.env.local` configured
⏳ **Next:** Share Google Sheet & Deploy to Vercel

---

## 🔴 STEP 1: Share Your Google Sheet (REQUIRED)

### Open Your Google Sheet:
https://docs.google.com/spreadsheets/d/1dkLY2WxaPkk6eceW_gJIDj3iUabTBO5p_fS5W_PD91s/edit

### Share with Service Account:
1. Click **"Share"** button (top-right corner)
2. Paste this email: `exjam-registration@exjam-registration.iam.gserviceaccount.com`
3. Set permission to **"Editor"**
4. **UNCHECK** "Notify people"
5. Click **"Share"**

---

## 🔴 STEP 2: Add Environment Variables to Vercel

### Go to Vercel Dashboard:
1. Visit: https://vercel.com/dashboard
2. Click your project: **exjam-alumni-registration**
3. Go to **Settings** → **Environment Variables**

### Add These 3 Variables:

#### Variable 1: GOOGLE_SHEETS_ID
```
Name: GOOGLE_SHEETS_ID
Value: 1dkLY2WxaPkk6eceW_gJIDj3iUabTBO5p_fS5W_PD91s
Environment: ✓ Production, ✓ Preview, ✓ Development
```
Click **Save**

#### Variable 2: GOOGLE_SERVICE_ACCOUNT_EMAIL
```
Name: GOOGLE_SERVICE_ACCOUNT_EMAIL
Value: exjam-registration@exjam-registration.iam.gserviceaccount.com
Environment: ✓ Production, ✓ Preview, ✓ Development
```
Click **Save**

#### Variable 3: GOOGLE_PRIVATE_KEY
```
Name: GOOGLE_PRIVATE_KEY
Value: [Copy the ENTIRE private key below including BEGIN and END lines]
```

Copy this entire block:
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

Environment: ✓ Production, ✓ Preview, ✓ Development
Click **Save**

---

## 🔴 STEP 3: Redeploy to Activate

### In Vercel Dashboard:
1. Go to **"Deployments"** tab
2. Find the latest deployment
3. Click the **3 dots menu** → **"Redeploy"**
4. Confirm **"Redeploy"**

Or use command line:
```bash
vercel --prod --yes
```

---

## 🔴 STEP 4: Test Your System

### Test Registration Form:
1. Visit: https://exjam-alumni-registration.vercel.app/registration.html
2. Fill out the form
3. Submit

### Check Google Sheet:
1. Open: https://docs.google.com/spreadsheets/d/1dkLY2WxaPkk6eceW_gJIDj3iUabTBO5p_fS5W_PD91s/edit
2. Look for new row with registration data
3. QR code and barcode should be generated

---

## ✅ Success Indicators

When working correctly, you'll see:
- ✅ Form submission shows "Registration successful!"
- ✅ QR code displays on success page
- ✅ New row appears in Google Sheet
- ✅ All columns filled including QR/barcode

---

## 🆘 If Something Goes Wrong

### "Permission denied" error
→ Make sure you shared the sheet with: `exjam-registration@exjam-registration.iam.gserviceaccount.com`

### "Invalid credentials" error
→ Check that you copied the ENTIRE private key including BEGIN/END lines

### Form doesn't submit
→ Check browser console (F12) for errors
→ Verify all 3 environment variables are in Vercel

### No data in sheet
→ Confirm sheet ID is correct: `1dkLY2WxaPkk6eceW_gJIDj3iUabTBO5p_fS5W_PD91s`

---

## 📞 Quick Links

- **Your Google Sheet**: https://docs.google.com/spreadsheets/d/1dkLY2WxaPkk6eceW_gJIDj3iUabTBO5p_fS5W_PD91s/edit
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Live Registration Form**: https://exjam-alumni-registration.vercel.app/registration.html
- **Service Account Email**: `exjam-registration@exjam-registration.iam.gserviceaccount.com`

---

**You're just 4 steps away from a fully functional registration system!** 🚀