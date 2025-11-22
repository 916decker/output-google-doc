# 🚀 Installation Guide
## Send to Google Docs Chrome Extension

**Total Setup Time: 15-20 minutes** (One-time setup)

---

## 📋 **PART 1: Generate Icons** (5 minutes)

### Option A: EASIEST - Use the HTML Generator (NO CODING)

1. **Open `icon-generator.html`** in your web browser (double-click the file)
2. The icons will appear automatically
3. **Right-click each icon** and select "Save image as..."
4. Save them with these exact names:
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`
5. **Put all three PNG files** in the same folder as the other extension files

### Option B: Online Converter (Also Easy)

1. Go to [cloudconvert.com/svg-to-png](https://cloudconvert.com/svg-to-png)
2. Upload `icon.svg`
3. Create three versions:
   - 16x16 pixels → save as `icon16.png`
   - 48x48 pixels → save as `icon48.png`
   - 128x128 pixels → save as `icon128.png`

---

## 🔑 **PART 2: Set Up Google Cloud** (10 minutes)

### Step 1: Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **"Select a Project"** → **"New Project"**
3. **Name it**: "Send to Google Docs"
4. Click **"Create"**

### Step 2: Enable Required APIs

1. In your new project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Docs API"** → Click it → Click **"Enable"**
3. Search for **"Google Drive API"** → Click it → Click **"Enable"**

### Step 3: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Configure Consent Screen"**
   - Choose **"External"** → Click **"Create"**
   - **App name**: "Send to Google Docs"
   - **User support email**: Your email
   - **Developer contact**: Your email
   - Click **"Save and Continue"**
   - Click **"Save and Continue"** on Scopes (leave default)
   - Click **"Save and Continue"** on Test users
   - Click **"Back to Dashboard"**

3. Go back to **"Credentials"** tab
4. Click **"Create Credentials"** → **"OAuth client ID"**
5. **Application type**: Choose **"Chrome Extension"**
6. **Name**: "Send to Google Docs Extension"
7. **Application ID**: We'll fill this in later
8. Click **"Create"**

9. **COPY YOUR CLIENT ID** - it looks like:
   ```
   123456789-abc123def456.apps.googleusercontent.com
   ```

### Step 4: Update manifest.json

1. Open `manifest.json` in a text editor (Notepad, TextEdit, VS Code, etc.)
2. Find this line:
   ```json
   "client_id": "YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
   ```
3. Replace `YOUR_CLIENT_ID_HERE.apps.googleusercontent.com` with your actual Client ID
4. **Save the file**

---

## 🔌 **PART 3: Install Extension in Chrome** (5 minutes)

### Step 1: Load the Extension

1. Open **Chrome** browser
2. Go to `chrome://extensions/`
3. Turn on **"Developer mode"** (toggle in top-right corner)
4. Click **"Load unpacked"**
5. **Select the folder** containing all your extension files
6. The extension should now appear in your extensions list!

### Step 2: Get Your Extension ID

1. On the `chrome://extensions/` page, find your extension
2. You'll see an **ID** like: `abcdefghijklmnopqrstuvwxyz123456`
3. **Copy this ID**

### Step 3: Update Google Cloud with Extension ID

1. Go back to [console.cloud.google.com](https://console.cloud.google.com)
2. Go to **"APIs & Services"** → **"Credentials"**
3. Click on your **OAuth 2.0 Client ID** (the one you created)
4. **Paste your Extension ID** in the "Application ID" field
5. Click **"Save"**

---

## ✅ **PART 4: Test It!** (2 minutes)

### First-Time Authentication

1. **Click the extension icon** in Chrome (puzzle piece icon, then find "Send to Google Docs")
2. Click **"Test Connection"**
3. You'll be prompted to **sign in with Google**
4. **Allow all permissions** when asked
5. You should see **"Connected to Google"** ✓

### Test on Perplexity

1. Go to [perplexity.ai](https://www.perplexity.ai)
2. Ask any question and wait for the answer
3. You should see a **blue "Send to Google Docs" button** below the answer
4. Click it!
5. Check your [Google Drive](https://drive.google.com) - you should see a new document! 🎉

---

## ⚙️ **PART 5: Configure Settings** (Optional)

Click the extension icon to customize:

### 📝 **Save Mode**

- **Append to One Document**: All answers go to the same doc (like a journal)
  - Great for collecting multiple answers in one place
  - You can specify which doc, or let it auto-create one

- **Create New Document Each Time**: Each answer gets its own separate doc
  - Great for organizing answers individually
  - Choose how to name them (by date, source, or custom name)

### 📄 **Document Naming** (for "Create New" mode)

- **By Date & Time**: "AI Answer - 11/22/2025 3:45 PM" _(recommended)_
- **By Source Page Title**: Uses the webpage title
- **Custom Name**: You choose the prefix

### 🎯 **Target Document** (for "Append" mode)

- Leave blank to auto-create on first use
- Or paste a Google Doc ID to use a specific document
- Find Doc ID in URL: `docs.google.com/document/d/YOUR_DOC_ID_HERE/edit`

---

## 🌐 **Supported Websites**

Currently works on:
- ✅ Perplexity.ai
- ✅ Comet (when available)
- ✅ Other AI chat platforms with similar layouts

**Want to add more sites?** Edit `manifest.json` and add URLs to `matches` array.

---

## 🛠️ **Troubleshooting**

### Button not appearing?

1. **Refresh the page** after installing the extension
2. Make sure you're on Perplexity or Comet
3. Check that the extension is **enabled** at `chrome://extensions/`
4. Look for the button **at the end of answer boxes** (not at the top)

### Authentication errors?

1. Click the extension icon → **"Test Connection"**
2. Make sure you **allowed all permissions** when signing in
3. Try clicking **"Sign Out of Google"** then test connection again
4. Verify your **Client ID** in `manifest.json` matches Google Cloud Console
5. Verify your **Extension ID** matches in Google Cloud Console

### Documents not saving?

1. Check you have **storage space** in Google Drive
2. Go to [Google Cloud Console](https://console.cloud.google.com) → verify APIs are enabled
3. Try **"Create New Document"** mode instead of append
4. Check the **browser console** for errors (F12 → Console tab)

### "Extension ID not found" error?

1. Make sure you completed **Part 3, Step 3** (updating Google Cloud with Extension ID)
2. Wait 5 minutes after updating - changes can take time to propagate
3. Try reloading the extension: `chrome://extensions/` → click reload icon

### Can't find Doc ID?

1. Open any Google Doc
2. Look at the URL: `https://docs.google.com/document/d/COPY_THIS_PART/edit`
3. The ID is between `/d/` and `/edit`

---

## 🎯 **Best Practices**

### Organizing Your Docs

1. **Create a dedicated folder** in Google Drive called "AI Answers"
2. **Use Append Mode** if you want a daily journal of AI answers
3. **Use New Doc Mode** if you want to organize answers individually
4. **Add labels/tags** in the document titles to make searching easier

### Naming Strategies

- **For research**: Use "By Date & Time" + create folders by topic
- **For work**: Use custom name like "Client Research" or "Project Ideas"
- **For learning**: Append to one doc per subject

### Storage Tips

- Perplexity answers can be **long** - watch your Google Drive storage
- Consider using **append mode** to reduce document clutter
- Periodically **archive old documents** to a subfolder

---

## 🔒 **Privacy & Security**

- ✅ Your credentials stay **on your computer**
- ✅ **No data** is sent to any third-party servers
- ✅ Only you have access to your Google Docs
- ✅ You can revoke access anytime at [Google Account Permissions](https://myaccount.google.com/permissions)

---

## 📱 **Updating the Extension**

If you make any changes to the code:

1. Go to `chrome://extensions/`
2. Click the **reload icon** on your extension card
3. Refresh any open Perplexity/Comet tabs

---

## 🆘 **Getting Help**

- Check the **Help & Troubleshooting** link in the extension popup
- Review the **Troubleshooting** section above
- Check Chrome DevTools Console (F12) for error messages

---

## 🎉 **You're Done!**

Enjoy sending AI answers to Google Docs with one click!

**Pro tip**: Pin the extension to your Chrome toolbar for quick access to settings.

---

**Made with ❤️ for AI productivity enthusiasts**
