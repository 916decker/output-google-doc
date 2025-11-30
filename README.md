# 📄 Send to Google Docs - Smart Organizer

**One-click save AI responses to organized Google Docs with folders, tags, and smart metadata.**

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Chrome](https://img.shields.io/badge/browser-Chrome%20%7C%20Edge%20%7C%20Brave%20%7C%20Comet-orange.svg)

---

## ✨ Features

### 🚀 One-Click Save
- **Quick Save**: Instant save with auto-tags, auto-naming, markdown formatting
- **Custom Save**: Full control over folder, tags, project name, and format

### 🌐 Universal Platform Support
Works on **all major AI platforms**:
- ✅ ChatGPT (OpenAI)
- ✅ Claude (Anthropic)
- ✅ Google Gemini
- ✅ Perplexity
- ✅ Comet Browser
- ✅ Future platforms (future-proof detection)

### 📝 Beautiful Formatting
Automatic HTML → Markdown conversion:
- Headings, lists, tables, code blocks
- Bold, italic, links preserved
- Clean, readable output
- Auto-generated Table of Contents (3+ headings)

### 🗂️ Smart Organization
- Choose Google Drive folders
- Auto-suggested tags from content
- Project-based categorization
- Full metadata (source, URL, timestamp)

---

## 🎬 Quick Start

### 1. Create OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Google Docs API** and **Google Drive API**
4. Create OAuth consent screen (Internal or External)
5. Create **OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Add authorized redirect URI: `https://<your-extension-id>.chromiumapp.org/`

   > **Note**: You'll get the extension ID after loading the extension (step 2)

### 2. Install Extension

1. Download/clone this repository
2. Open `chrome://extensions/` (or `edge://extensions/`, `brave://extensions/`, etc.)
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the extension folder
6. **Copy the Extension ID** shown on the extension card

### 3. Configure OAuth

1. Go back to Google Cloud Console
2. Edit your OAuth client
3. Update redirect URI with your actual extension ID:
   ```
   https://YOUR-ACTUAL-EXTENSION-ID.chromiumapp.org/
   ```
4. Copy your **Client ID** (looks like: `123456789-abc123.apps.googleusercontent.com`)

### 4. Update manifest.json

Open `manifest.json` and update the `client_id`:

```json
{
  "oauth2": {
    "client_id": "YOUR-CLIENT-ID-HERE.apps.googleusercontent.com",
    "scopes": [
      "https://www.googleapis.com/auth/documents",
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/drive.metadata.readonly"
    ]
  }
}
```

### 5. Reload & Test

1. Go to `chrome://extensions/` and reload the extension
2. Visit ChatGPT, Claude, or any supported platform
3. Look for the **Quick Save** button at the end of AI responses
4. Click it!
5. First time: OAuth popup appears (grant access)
6. Done! Document saved to Google Drive

---

## 🎯 Usage

### Quick Save (Recommended)
1. Get an AI response
2. Click **Quick Save** button
3. Done! ✅

**What it does:**
- Auto-generates document name (topic + timestamp)
- Extracts keywords for tags
- Formats as markdown
- Saves to last-used folder (or root)

### Custom Save
1. Get an AI response
2. Click **⚙️ Settings** button
3. Choose folder, add tags, set project name
4. Click **Save to Drive**

---

## 📊 Output Example

```markdown
════════════════════════════════════════════════════════════════════════════════
📄 DOCUMENT METADATA
════════════════════════════════════════════════════════════════════════════════

🎯 Project: Machine Learning Research
🏷️  Tags: python, neural-networks, tensorflow

📌 Source: ChatGPT
🔗 URL: https://chatgpt.com/c/abc123...
📅 Saved: 2025-11-23, 2:30:15 PM

════════════════════════════════════════════════════════════════════════════════

# Introduction to Neural Networks

Neural networks are computational models inspired by biological neurons...

## Types of Neural Networks

1. Feedforward Neural Networks
2. Convolutional Neural Networks (CNNs)
3. Recurrent Neural Networks (RNNs)

### Code Example

```python
import tensorflow as tf

model = tf.keras.Sequential([
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dense(10, activation='softmax')
])
```

**Important**: Always normalize your data before training!
```

---

## 🛠️ Technical Details

### Architecture
- **Manifest V3** Chrome Extension
- **Content Script**: Detects AI responses, injects buttons
- **Service Worker**: Handles OAuth, Google APIs
- **APIs**: Google Docs API, Google Drive API

### File Structure
```
output-google-doc/
├── manifest.json              # Extension configuration + OAuth client ID
├── background-enhanced.js     # Service worker (OAuth, API calls)
├── content-v2.js              # Content script (detection, UI injection)
├── styles-enhanced.css        # Button and modal styling
├── popup.html                 # Extension popup (optional)
├── icon16.png                 # Extension icons
├── icon48.png
├── icon128.png
├── SYSTEM_PROMPT.md           # Full documentation
└── README.md                  # This file
```

### Detection Strategy
**3-Layer Future-Proof System:**

1. **Universal**: Find Copy/Share buttons → walk up DOM → find container
2. **Platform-Specific**: Known selectors for each AI platform
3. **Generic Fallback**: Semantic HTML patterns (`role="article"`, etc.)

This ensures the extension works even when platforms update their HTML.

---

## 🐛 Troubleshooting

### No button appears
1. Open DevTools Console (F12)
2. Look for: `✅ Extension initialized`
3. Check: `🔍 Found X AI answers on page`
4. If "Found 0": Platform not supported or HTML changed

**Solution**: Report issue with platform URL

### OAuth errors

**"redirect_uri_mismatch"**
- Extension ID in manifest doesn't match Google Cloud Console
- Update redirect URI in OAuth client settings

**"Access blocked: This app's request is invalid"**
- Using wrong OAuth client type (should be "Web application", NOT "Chrome Extension")
- Create new Web Application OAuth client

### Formatting issues

**Tables not readable**
- Some platforms use custom table HTML
- Extension converts to numbered lists for readability

**Missing formatting**
- Check if content uses standard HTML tags
- Report edge cases with example HTML

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 Changelog

### v2.0.0 (2025-11-23)
- ✨ Complete redesign with future-proof detection
- ✨ Simplified table formatting (numbered lists)
- ✨ Ultra-reliable single-button injection
- ✨ Web Application OAuth (works in all Chromium browsers)
- ✨ Enhanced markdown parser
- ✨ Auto-generated table of contents
- 🐛 Fixed infinite loop issues
- 🐛 Fixed button duplication bugs

### v1.0.0 (Initial Release)
- Basic save functionality
- Platform-specific detection
- Simple markdown conversion

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- Built with Chrome Extension Manifest V3
- Uses Google Docs API and Google Drive API
- Inspired by the need for organized AI knowledge management

---

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/916decker/output-google-doc/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/916decker/output-google-doc/discussions)
- 📖 **Documentation**: [SYSTEM_PROMPT.md](SYSTEM_PROMPT.md)

---

**Made with ❤️ for the AI power-user community**

⭐ Star this repo if you find it useful!
