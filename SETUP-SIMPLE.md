# ⚡ SUPER SIMPLE SETUP (8 Minutes)
## Zero Technical Knowledge Required

**Goal**: Get this working in under 10 minutes with copy-paste commands.

---

## 📋 **What You Need**
- ✅ Chrome browser
- ✅ Google account
- ✅ 8 minutes

**No coding. No command line. Just clicking and pasting.**

---

## 🎯 **THE 3-STEP PROCESS**

```
STEP 1: Google Setup (5 min)  → Get your secret key
STEP 2: Install Extension (2 min)  → Load into Chrome
STEP 3: First Use (1 min)  → Click "Allow" and done!
```

---

## 🔑 **STEP 1: Get Your Google Key** (5 minutes)

### **1A: Create Project**

1. **Open this link**: https://console.cloud.google.com/projectcreate

2. **Fill in**:
   - Project name: `AI-Docs-Saver` (or anything)
   - Click **CREATE**

3. **Wait 10 seconds** for it to create

✅ **Done!** Project created.

---

### **1B: Enable APIs** (2 clicks)

1. **Click this link**: https://console.cloud.google.com/apis/library/docs.googleapis.com
   - Click **ENABLE**

2. **Click this link**: https://console.cloud.google.com/apis/library/drive.googleapis.com
   - Click **ENABLE**

✅ **Done!** APIs enabled.

---

### **1C: Get Your Key** (The important part)

1. **Click this link**: https://console.cloud.google.com/apis/credentials

2. **Click** "Configure Consent Screen" (blue button)
   - Choose **External**
   - Click **CREATE**

3. **Fill in ONLY these 2 fields**:
   - App name: `AI Docs Saver`
   - User support email: `your-email@gmail.com` (your email)
   - Developer contact: `your-email@gmail.com` (same email)

4. **Click "Save and Continue"** (bottom of page)
   - Click "Save and Continue" again (Scopes page)
   - Click "Save and Continue" again (Test users page)
   - Click "Back to Dashboard"

5. **Now create credentials**:
   - Click **"Credentials"** (left sidebar)
   - Click **"+ CREATE CREDENTIALS"** (top)
   - Choose **"OAuth client ID"**

6. **Fill in**:
   - Application type: **Chrome Extension**
   - Name: `AI Docs Extension`
   - Application ID: Leave blank for now (we'll come back)
   - Click **CREATE**

7. **COPY YOUR CLIENT ID**:
   ```
   It looks like: 123456789-abc123def456.apps.googleusercontent.com
   ```
   **Save this somewhere!** (Notepad, etc.)

✅ **Done!** You have your secret key.

---

## 🔌 **STEP 2: Install Extension** (2 minutes)

### **2A: Update Manifest**

1. **Open this file** in Notepad (or any text editor):
   ```
   manifest.json
   ```

2. **Find line 44** (says `YOUR_CLIENT_ID_HERE`):
   ```json
   "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
   ```

3. **Replace** `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com` with your copied Client ID:
   ```json
   "client_id": "123456789-abc123def456.apps.googleusercontent.com",
   ```

4. **Save the file** (Ctrl+S or Cmd+S)

✅ **Done!** Extension configured.

---

### **2B: Load in Chrome**

1. **Open Chrome** and go to:
   ```
   chrome://extensions/
   ```

2. **Turn on** "Developer mode" (toggle switch, top-right corner)

3. **Click** "Load unpacked" (top-left)

4. **Select** the folder containing all your extension files

5. **COPY the Extension ID**:
   - Under your extension, you'll see: `ID: abcdefghij123456...`
   - Copy this whole ID

✅ **Done!** Extension loaded.

---

### **2C: Tell Google About Extension**

1. **Go back to**: https://console.cloud.google.com/apis/credentials

2. **Click** on your OAuth client ID (the one you created)

3. **Paste your Extension ID** in the "Application ID" field

4. **Click SAVE**

✅ **Done!** Google knows about your extension.

---

## 🎉 **STEP 3: First Use** (1 minute)

1. **Go to** https://www.perplexity.ai

2. **Ask any question**

3. **See the button** appear below the answer:
   ```
   [📄 Quick Save]  [⚙️]
   ```

4. **Click** [📄 Quick Save]

5. **A popup appears** asking for permissions:
   - "AI Docs Saver wants to access your Google Docs and Drive"
   - Click **ALLOW**

6. **Done!** Answer saved to Google Docs!

---

## ✅ **YOU'RE READY!**

**That's it!** Now every time you see an AI answer:
- Click **[Quick Save]** → Saved in 1 second
- Or click **[⚙️]** → Customize folder/tags

---

## 🆘 **Stuck? Common Issues**

### **"Extension ID not found" error**
→ Make sure you completed Step 2C (pasted Extension ID in Google Console)
→ Wait 2-3 minutes after pasting, then try again

### **"Invalid Client ID" error**
→ Double-check you copied the FULL Client ID (including `.apps.googleusercontent.com`)
→ Make sure no extra spaces when pasting

### **Button doesn't appear**
→ Refresh the Perplexity page
→ Make sure extension is enabled at `chrome://extensions/`

### **"Permission denied" error**
→ Click the extension icon → "Test Connection"
→ Click "Allow" when Google asks for permissions

---

## 🎯 **Quick Reference**

**What you need from Google Cloud Console:**
- Client ID: `123456789-abc123def456.apps.googleusercontent.com`
- Extension ID: `abcdefghijklmnop` (from Chrome)

**Where they go:**
- Client ID → `manifest.json` line 44
- Extension ID → Google Cloud Console → OAuth client

**Done!** Everything else is automatic.

---

## ⏱️ **Time Breakdown**

| Step | Time |
|------|------|
| Google Cloud setup | 5 min |
| Install extension | 2 min |
| First use (permissions) | 1 min |
| **TOTAL** | **8 min** |

After setup: **1-click saves forever!** ⚡

---

**Need help?** The original INSTALL.md has detailed screenshots and troubleshooting.

**Ready to use?** Start with Step 1 above! 🚀
