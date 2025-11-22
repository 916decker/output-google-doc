# 📄 Send to Google Docs
## Chrome Extension for AI Chat Platforms

**One-click saving of AI answers from Perplexity, Comet, and other AI chat platforms directly to Google Docs.**

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?logo=googlechrome)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🎯 **What Does This Do?**

This Chrome extension adds a **"Send to Google Docs"** button at the end of every AI answer on platforms like Perplexity and Comet.

Click the button → Answer instantly appears in Google Docs → Keep researching!

Perfect for:
- 📚 **Research** - Save multiple answers to one document
- 💼 **Work** - Archive important AI insights
- 📝 **Learning** - Build a knowledge base from AI conversations
- 🗂️ **Organization** - Keep all your AI answers in one searchable place

---

## ✨ **Features**

- ✅ **One-click export** - No copy-paste, no formatting issues
- ✅ **Two save modes** - Append to one doc OR create new docs
- ✅ **Smart metadata** - Includes source URL, timestamp, page title
- ✅ **Fully customizable** - Choose doc names, organization style
- ✅ **Works automatically** - Button appears on every AI answer
- ✅ **Secure** - Direct Google API integration, no third-party servers
- ✅ **Free forever** - No subscriptions, no hidden costs

---

## 🚀 **Quick Start**

**Total time: 15 minutes**

1. **Generate icons** (use `icon-generator.html`) → 5 min
2. **Set up Google Cloud** (enable APIs, create OAuth credentials) → 8 min
3. **Load extension** in Chrome → 2 min
4. **Start using!** → 0 min

👉 **[Read QUICKSTART.md](QUICKSTART.md)** for step-by-step instructions

👉 **[Read INSTALL.md](INSTALL.md)** for detailed setup guide

---

## 📁 **What's Included**

```
📦 send-to-google-docs/
├── 📄 manifest.json          # Extension configuration
├── 🎨 icon.svg               # Source icon file
├── 🖼️ icon-generator.html    # Generate PNGs (no coding!)
├── ⚙️ content.js             # Injects buttons into pages
├── 💅 styles.css             # Button styling
├── 🔧 background.js          # Google Docs API integration
├── 🎛️ popup.html             # Settings interface
├── 🎛️ popup.js               # Settings logic
├── 📖 README.md              # This file
├── ⚡ QUICKSTART.md          # Fast setup guide
└── 📚 INSTALL.md             # Detailed instructions
```

---

## 🎨 **Screenshots**

### The Button in Action
When you get an AI answer, the button appears automatically:

```
┌──────────────────────────────────────────────┐
│ [AI Answer content here...]                  │
│                                              │
│ [Detailed explanation...]                   │
└──────────────────────────────────────────────┘

    [📄 Send to Google Docs] ← Click here!
```

### Settings Panel
Customize how your docs are saved:

- **Save Mode**: Append to one doc OR create new docs
- **Naming**: By date, source, or custom name
- **Target Doc**: Specify which doc to append to

---

## 🛠️ **How It Works**

1. **Extension loads** when you visit Perplexity/Comet
2. **Watches for AI answers** using smart selectors
3. **Injects a button** below each answer
4. **When clicked**:
   - Extracts the answer text
   - Authenticates with Google (first time only)
   - Creates or appends to Google Doc
   - Shows success notification

All processing happens in your browser - no external servers involved!

---

## 🌐 **Supported Platforms**

Currently works on:
- ✅ **Perplexity.ai** - Fully tested
- ✅ **Comet** - When available
- ⚙️ **Other AI platforms** - Easily customizable

**Want to add more sites?**
Edit `manifest.json` → Add URLs to the `matches` array

---

## 🔒 **Privacy & Security**

- ✅ **No data collection** - We don't collect any user data
- ✅ **Direct API calls** - Your content goes straight to Google
- ✅ **No third-party servers** - Everything runs in your browser
- ✅ **OAuth 2.0** - Industry-standard Google authentication
- ✅ **You own your data** - All docs stored in YOUR Google Drive

---

## ⚙️ **Customization**

### Change Which Sites It Works On

Edit `manifest.json`:
```json
"matches": [
  "https://www.perplexity.ai/*",
  "https://comet.com/*",
  "https://YOUR-SITE-HERE.com/*"  ← Add your site
]
```

### Adjust Button Appearance

Edit `styles.css`:
```css
.send-to-gdocs-btn {
  background: #4285F4;  ← Change color
  padding: 8px 16px;    ← Change size
  /* ... customize more ... */
}
```

### Add Custom Answer Selectors

Edit `content.js`:
```javascript
const SITE_CONFIGS = {
  'your-site.com': {
    answerSelector: '.your-answer-class',  ← Add selector
    insertPosition: 'afterend'
  }
}
```

---

## 🆘 **Troubleshooting**

### Common Issues

| Problem | Solution |
|---------|----------|
| Button not appearing | Refresh the page, check extension is enabled |
| Authentication errors | Click "Test Connection" in extension popup |
| Can't find Doc ID | Look in URL: `docs.google.com/document/d/ID_HERE/edit` |
| Documents not saving | Check Google Drive storage, verify API is enabled |

📖 **[See full troubleshooting guide in INSTALL.md](INSTALL.md#troubleshooting)**

---

## 🎯 **Best Practices**

### For Research
- Use **Append Mode** to collect all research in one doc
- Create a dedicated folder in Google Drive
- Name docs by date for easy chronological searching

### For Work
- Use **New Doc Mode** for each client/project
- Use custom naming with project prefixes
- Archive regularly to subfolders

### For Learning
- Append mode with one doc per subject
- Include keywords in custom doc names
- Review and summarize periodically

---

## 📊 **Comparison with Alternatives**

| Solution | Setup Time | Reliability | Cost | Auto-Inject Button |
|----------|-----------|------------|------|-------------------|
| **This Extension** | 15 min | ⭐⭐⭐⭐⭐ | FREE | ✅ Yes |
| Bookmarklet | 5 min | ⭐⭐⭐ | FREE | ❌ No (click each time) |
| Zapier/Make | 20 min | ⭐⭐⭐ | $$ Monthly | ❌ Can't inject UI |
| Copy-Paste | 0 min | ⭐⭐ | FREE | ❌ Manual every time |

---

## 🤝 **Contributing**

Want to improve this extension?

1. Fork the repo
2. Make your changes
3. Test thoroughly
4. Submit a pull request

**Ideas welcome:**
- Support for more AI platforms
- Additional export formats (Notion, Evernote, etc.)
- Enhanced formatting options
- Tagging and categorization

---

## 📜 **License**

MIT License - Use freely, modify as needed, no warranties provided.

---

## 🙋 **FAQ**

**Q: Does this work with ChatGPT?**
A: Not currently - ChatGPT uses a different structure. You can modify `content.js` to add support.

**Q: Can I export to other formats besides Google Docs?**
A: Currently Google Docs only, but the code can be modified to support other platforms.

**Q: Is my data private?**
A: Yes! Everything goes directly from your browser to Google. No third-party servers involved.

**Q: Does this work on mobile?**
A: Chrome extensions only work on desktop browsers currently.

**Q: Can I share this with my team?**
A: Yes! Each person needs to install it individually with their own Google credentials.

**Q: What if Perplexity changes their design?**
A: The extension might need updates to the answer selectors. Check for updates or modify `content.js`.

---

## 📞 **Support**

- 📖 **Documentation**: Read INSTALL.md and QUICKSTART.md
- 🐛 **Found a bug?**: Open an issue on GitHub
- 💡 **Feature request?**: Open an issue with [Feature] in title
- 🤔 **Questions?**: Check the FAQ above first

---

## 🎉 **Credits**

Built for AI enthusiasts who want to save time and stay organized.

**Technologies Used:**
- Chrome Extension Manifest V3
- Google Docs API
- Google Drive API
- OAuth 2.0 Authentication

---

## 📈 **Roadmap**

Future improvements:
- [ ] Support for ChatGPT
- [ ] Support for Claude.ai
- [ ] Export to Notion
- [ ] Markdown formatting options
- [ ] Batch export multiple answers
- [ ] Search within saved answers
- [ ] Tags and categories

---

**Made with ❤️ for productivity**

⭐ **Star this repo** if you find it useful!
