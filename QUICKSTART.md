# ⚡ QUICK START GUIDE
## Get Running in 15 Minutes

**For people who want fast results with minimal reading.**

---

## ✅ **CHECKLIST**

- [ ] Generate icons (5 min)
- [ ] Set up Google Cloud (8 min)
- [ ] Load in Chrome (2 min)
- [ ] Test it! (1 min)

---

## 🎯 **STEP 1: Icons** (5 minutes)

1. **Double-click `icon-generator.html`** (opens in browser)
2. **Right-click each icon** → "Save image as..."
3. Save as `icon16.png`, `icon48.png`, `icon128.png`
4. **Put them in the extension folder**

✅ Done? Move to Step 2.

---

## 🔑 **STEP 2: Google Cloud Setup** (8 minutes)

### A. Create Project
1. Go to **console.cloud.google.com**
2. Click "New Project" → Name it anything → "Create"

### B. Enable APIs
1. Click **"APIs & Services"** → **"Library"**
2. Search **"Google Docs API"** → **Enable**
3. Search **"Google Drive API"** → **Enable**

### C. Create Credentials
1. **"APIs & Services"** → **"Credentials"**
2. Click **"Configure Consent Screen"**
   - External → Create
   - Fill in your email (2 places)
   - Save & Continue (3 times)
   - Back to Dashboard

3. **"Credentials"** → **"Create Credentials"** → **"OAuth client ID"**
   - Type: **Chrome Extension**
   - Name: anything
   - Leave Application ID blank for now
   - **Create**

4. **COPY the Client ID** that appears

### D. Update manifest.json
1. **Open `manifest.json`** in any text editor
2. **Find**: `"client_id": "YOUR_CLIENT_ID_HERE"`
3. **Replace** `YOUR_CLIENT_ID_HERE` with your copied Client ID
4. **Save**

✅ Done? Move to Step 3.

---

## 🔌 **STEP 3: Load in Chrome** (2 minutes)

1. Open Chrome → Go to **`chrome://extensions/`**
2. Turn on **"Developer mode"** (top-right toggle)
3. Click **"Load unpacked"**
4. **Select your extension folder**
5. **COPY the Extension ID** (long string of letters under the name)

### Update Google Cloud
1. Go back to **console.cloud.google.com**
2. **"APIs & Services"** → **"Credentials"**
3. **Click your OAuth client**
4. **Paste Extension ID** in "Application ID"
5. **Save**

✅ Done? Move to Step 4.

---

## 🎉 **STEP 4: Test It!** (1 minute)

1. **Click extension icon** in Chrome (puzzle piece → "Send to Google Docs")
2. Click **"Test Connection"**
3. **Sign in** when prompted → **Allow all permissions**
4. Should say **"Connected to Google"** ✓

### Try It Out
1. Go to **perplexity.ai**
2. Ask any question
3. Click the **blue "Send to Google Docs" button** below the answer
4. Check your **Google Drive** - new doc should appear! 🎊

---

## ⚙️ **CONFIGURE** (Optional)

Click extension icon to choose:
- **Append Mode**: All answers in one doc (like a journal)
- **New Doc Mode**: Each answer gets its own doc

---

## 🆘 **PROBLEMS?**

### Button not showing?
→ Refresh the Perplexity page

### Auth errors?
→ Click extension icon → "Sign Out of Google" → "Test Connection" again

### Still stuck?
→ Read **INSTALL.md** for detailed troubleshooting

---

## 🚀 **YOU'RE READY!**

Start saving AI answers to Google Docs with one click.

**Pin the extension** to your toolbar for easy access to settings.

---

**Questions?** Check INSTALL.md for detailed instructions.
