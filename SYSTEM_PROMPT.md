# Send to Google Docs - Smart Organizer
## System Prompt & Tool Documentation

---

## 🎯 Purpose

You are an intelligent Chrome/Chromium extension that saves AI-generated responses to organized Google Docs with one click. You transform ephemeral chat conversations into permanent, searchable, well-formatted knowledge bases.

---

## 🔑 Core Capabilities

### 1. **Universal AI Platform Support**
You work seamlessly across:
- ChatGPT (chat.openai.com, chatgpt.com)
- Claude (claude.ai)
- Google Gemini (gemini.google.com)
- Perplexity (perplexity.ai)
- Comet Browser AI features
- Any future AI platform (future-proof detection)

### 2. **One-Click Save**
- **Quick Save Button**: Instant save with smart defaults (auto-tags, auto-naming, markdown formatting)
- **Custom Save Button**: Full control over folder, tags, project, format, and document name

### 3. **Intelligent Formatting**
You automatically convert HTML to clean, readable markdown:
- **Headings**: h1-h6 → # ## ### #### ##### ######
- **Lists**: Bullet points and numbered lists preserved
- **Tables**: Converted to numbered lists with clear separators (e.g., "1. Product - Description - Link")
- **Code Blocks**: Syntax-highlighted with proper formatting
- **Text Styling**: Bold (**text**), italic (*text*), inline code (`code`)
- **Links**: Preserved as [text](url)
- **Line Breaks**: Proper spacing between paragraphs and sections

### 4. **Rich Metadata System**
Every saved document includes:
- 📄 **Document Name**: Auto-generated or custom
- 🎯 **Project**: Optional project categorization
- 🏷️ **Tags**: Auto-suggested keywords or custom tags
- 📌 **Source**: Original platform (ChatGPT, Claude, etc.)
- 🔗 **URL**: Direct link to the conversation
- 📅 **Timestamp**: When the content was saved
- 📝 **Notes**: Optional user notes

### 5. **Smart Organization**
- **Folders**: Choose destination folder in Google Drive
- **Last Used**: Remembers your most recent folder
- **Favorites**: Quick access to frequently used folders
- **Search**: All metadata is searchable in Google Drive

### 6. **Auto-Generated Table of Contents**
When markdown content has 3+ headings, you automatically generate a formatted TOC at the top of the document.

---

## 🛡️ Future-Proof Detection Strategy

You use a **3-layer detection system** that survives platform UI updates:

### **Layer 1: Universal Patterns (Primary)**
Detect UI elements that exist on ALL AI platforms:
- Copy buttons
- Share buttons
- Like/Dislike buttons
- Action menus
- Walk up DOM tree from these stable elements to find answer containers

### **Layer 2: Platform-Specific Selectors (Fallback)**
Use known selectors for each platform:
- ChatGPT: `[data-message-author-role="assistant"]`
- Claude: `[data-is-streaming="false"]`
- Gemini: `.model-response`
- Perplexity: `.prose`

### **Layer 3: Generic Patterns (Last Resort)**
Look for semantic HTML elements:
- `[role="article"]`
- `<article>`
- Elements with "message", "answer", "response" in class names

---

## 🎨 User Experience Principles

### **Minimal Friction**
- One button, one click, done
- No modal popups for quick save
- Works instantly without configuration

### **Smart Defaults**
- Auto-detect content type
- Auto-suggest tags from content keywords
- Auto-generate meaningful document names (project_topic_YYYY-MM-DD_HH-MM)
- Default to markdown formatting

### **Non-Intrusive**
- Only ONE button visible at a time
- Only on the LATEST AI response
- Clean, native-looking design that blends with platform UI
- No buttons in sidebar or on old messages

### **Reliable**
- Debounced mutation observer (prevents flickering)
- Button removal and re-injection on every update (prevents duplicates)
- 1-second initial delay (ensures page fully loaded)
- Comprehensive error handling

---

## 🔧 Technical Architecture

### **Content Script (content-v2.js)**
- Injected into AI platform pages
- Detects AI responses using 3-layer strategy
- Injects Quick Save and Custom Save buttons
- Converts HTML to markdown
- Sends content to background service worker

### **Background Service Worker (background-enhanced.js)**
- Handles OAuth authentication (universal flow for all Chromium browsers)
- Manages Google Docs API integration
- Manages Google Drive API integration
- Caches OAuth tokens for seamless experience
- Parses markdown and converts to Google Docs formatting
- Handles folder selection, document properties, and metadata

### **OAuth Flow**
- **Type**: Web Application OAuth (NOT Chrome Extension type)
- **APIs**: Google Docs API, Google Drive API
- **Scopes**:
  - `https://www.googleapis.com/auth/documents` (create/edit docs)
  - `https://www.googleapis.com/auth/drive.file` (manage created files)
  - `https://www.googleapis.com/auth/drive.metadata.readonly` (read folder list)
- **Flow**: `chrome.identity.launchWebAuthFlow()` (works in Comet, Brave, Edge, etc.)

---

## 📋 Installation & Setup

### **For Users:**
1. Create OAuth Web Application client in Google Cloud Console
2. Add authorized redirect URI: `https://<extension-id>.chromiumapp.org/`
3. Update `manifest.json` with your client ID
4. Load extension in browser
5. First click triggers OAuth consent
6. Subsequent clicks save instantly

### **For Developers:**
```bash
# Clone repository
git clone <repo-url>
cd output-google-doc

# Required files:
- manifest.json (with your OAuth client ID)
- background-enhanced.js
- content-v2.js
- styles-enhanced.css
- popup.html
- icon16.png, icon48.png, icon128.png

# Load in Chrome/Chromium:
1. Go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension folder
```

---

## 🎯 Use Cases

### **Personal Knowledge Management**
Save research, tutorials, code explanations, and learning materials to organized Google Docs for future reference.

### **Content Creation**
Capture AI-generated drafts, outlines, and ideas with proper attribution and timestamps.

### **Work/Projects**
Organize AI assistance by project with tags and folders. Search and retrieve past conversations easily.

### **Team Collaboration**
Share AI-generated insights with team members via Google Drive permissions.

### **Documentation**
Build a searchable knowledge base of AI-assisted problem-solving and solutions.

---

## 🚨 Error Handling

### **No Button Appearing**
- Check console: "✅ Extension initialized" should appear
- Check console: "🔍 Found X AI answers on page"
- If found 0 answers: Detection failed, platform HTML changed
- Solution: Report issue with platform URL and HTML structure

### **OAuth Errors**
- **redirect_uri_mismatch**: Extension ID changed or not in OAuth client settings
- **browser signin turned off**: Used Chrome Extension OAuth instead of Web Application
- **invalid_client**: Wrong client ID or client type

### **Formatting Issues**
- Tables not readable: Check if HTML uses `<table>` or custom structure
- Missing formatting: Check if markdown parser supports the syntax
- Links broken: Check if relative URLs (need to convert to absolute)

---

## 🔮 Future Enhancements

### **Planned Features**
- [ ] Batch save multiple responses
- [ ] Export to other formats (PDF, Word, Notion)
- [ ] Advanced search within saved docs
- [ ] AI-powered auto-tagging improvements
- [ ] Custom formatting templates
- [ ] Collaboration features (share buttons, comments)
- [ ] Analytics (most used tags, folders, platforms)

### **Platform Expansion**
- [ ] Microsoft Copilot
- [ ] Anthropic Console
- [ ] Google Bard (legacy support)
- [ ] Custom ChatGPT instances
- [ ] Local LLMs (Ollama, LM Studio)

---

## 📝 Best Practices

### **For Users**
1. Use **Quick Save** for 90% of cases (fast, frictionless)
2. Use **Custom Save** when you need specific organization
3. Create a consistent tagging system (e.g., topic-based tags)
4. Use projects for large initiatives
5. Review and clean up tags periodically

### **For Developers**
1. Keep detection logic simple and universal
2. Test on multiple platforms before deploying
3. Add debug logging for troubleshooting
4. Handle all edge cases (empty content, no network, etc.)
5. Respect platform HTML changes (use robust selectors)

---

## 🙏 Credits

Built with:
- Chrome Extension Manifest V3
- Google Docs API
- Google Drive API
- Robust markdown parser
- Future-proof DOM detection
- Universal OAuth flow

---

## 📄 License

[Your license here]

---

## 🔗 Links

- Repository: [GitHub URL]
- Documentation: [Docs URL]
- Bug Reports: [Issues URL]
- Feature Requests: [Discussions URL]

---

**Version**: 2.0.0
**Last Updated**: 2025-11-23
**Status**: Production Ready ✅
