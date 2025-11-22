/**
 * Content Script - OPTIMIZED FOR DAILY USE
 * Two-button approach: Quick Save (1-click) + Save As (custom)
 * Works on Perplexity, Comet, and similar AI chat platforms
 */

// Configuration for different sites
const SITE_CONFIGS = {
  'www.perplexity.ai': {
    answerSelector: '.prose, [class*="answer"], [class*="response"]',
    insertPosition: 'afterend'
  },
  'comet.com': {
    answerSelector: '.message-content, [class*="answer"], [class*="response"]',
    insertPosition: 'afterend'
  },
  'chat.openai.com': {
    answerSelector: '[data-message-author-role="assistant"], .agent-turn, [class*="markdown"]',
    insertPosition: 'afterend'
  },
  'chatgpt.com': {
    answerSelector: '[data-message-author-role="assistant"], .agent-turn, [class*="markdown"]',
    insertPosition: 'afterend'
  },
  'claude.ai': {
    answerSelector: '[data-is-streaming="false"], .font-claude-message, [class*="MessageContent"]',
    insertPosition: 'afterend'
  },
  'gemini.google.com': {
    answerSelector: '.model-response, [class*="response"], message-content',
    insertPosition: 'afterend'
  },
  default: {
    answerSelector: '[class*="answer"], [class*="response"], [class*="message"], [role="article"]',
    insertPosition: 'afterend'
  }
};

// Track processed elements
const processedElements = new WeakSet();

// Modal state
let currentModal = null;
let currentAnswerElement = null;

/**
 * Get site configuration
 */
function getSiteConfig() {
  const hostname = window.location.hostname;
  return SITE_CONFIGS[hostname] || SITE_CONFIGS.default;
}

/**
 * Create button group with Quick Save + Save As
 */
function createButtonGroup() {
  const container = document.createElement('div');
  container.className = 'send-to-gdocs-container';
  container.innerHTML = `
    <button class="send-to-gdocs-btn send-to-gdocs-quick" title="Quick Save (uses smart defaults)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#4285F4"/>
        <path d="M14 2V8H20" fill="#A1C2FA"/>
      </svg>
      <span>Quick Save</span>
    </button>
    <button class="send-to-gdocs-btn send-to-gdocs-custom" title="Customize folder, tags, and name">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4285F4" stroke-width="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v6M23 12h-6m-6 0H1"/>
      </svg>
    </button>
  `;

  return container;
}

/**
 * Extract clean text content
 */
function extractTextContent(element) {
  const clone = element.cloneNode(true);
  const buttons = clone.querySelectorAll('.send-to-gdocs-btn, .send-to-gdocs-container');
  buttons.forEach(btn => btn.remove());

  let text = clone.innerText || clone.textContent;
  return text.trim().replace(/\n{3,}/g, '\n\n');
}

/**
 * Extract keywords for auto-tagging
 */
function extractKeywords(text, limit = 3) {
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'said', 'from', 'they', 'them', 'their', 'there', 'then', 'than', 'some', 'all', 'just', 'not', 'also', 'more', 'very', 'about', 'into', 'such', 'only', 'other']);

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 4 && !stopWords.has(word));

  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

/**
 * Generate smart document name
 */
function generateDocName(project = '', tags = [], content = '') {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].substring(0, 5).replace(':', '-');

  let parts = [];

  if (project) {
    parts.push(project.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 30));
  }

  if (tags && tags.length > 0) {
    parts.push(tags[0].replace(/[^\w-]/g, '').substring(0, 20));
  }

  if (parts.length === 0 && content) {
    const preview = content.substring(0, 30).replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
    parts.push(preview || 'AI-Answer');
  }

  parts.push(`${date}_${time}`);

  return parts.join('_');
}

/**
 * QUICK SAVE - One-click save with smart defaults
 */
async function handleQuickSave(answerElement) {
  const button = event.currentTarget;
  const originalHTML = button.innerHTML;

  try {
    // Show loading
    button.disabled = true;
    button.innerHTML = `
      <svg class="spinner" width="16" height="16" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="#4285F4" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" />
      </svg>
      <span>Saving...</span>
    `;

    // Extract content
    const content = extractTextContent(answerElement);
    const keywords = extractKeywords(content, 3);

    // Generate smart defaults
    const docName = generateDocName('', keywords, content);

    // Send to background
    const response = await chrome.runtime.sendMessage({
      action: 'sendToGoogleDocsEnhanced',
      data: {
        content: content,
        metadata: {
          folderId: null, // Will use last used or root
          project: '',
          tags: keywords,
          notes: '',
          docName: docName
        },
        source: {
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString()
        }
      }
    });

    if (response.success) {
      // Success state
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="#0F9D58" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Saved!</span>
      `;
      button.classList.add('success');

      showNotification(`Quick Saved! <a href="${response.docUrl}" target="_blank">Open Doc</a>`);

      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.disabled = false;
        button.classList.remove('success');
      }, 2000);

    } else {
      throw new Error(response.error || 'Failed to save');
    }

  } catch (error) {
    console.error('Quick save error:', error);
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 8V12M12 16H12.01" stroke="#D93025" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>Error</span>
    `;
    button.classList.add('error');

    showNotification(`Error: ${error.message}`, 'error');

    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.disabled = false;
      button.classList.remove('error');
    }, 2000);
  }
}

/**
 * CUSTOM SAVE - Show modal for customization
 */
async function showCustomModal(answerElement) {
  currentAnswerElement = answerElement;

  const content = extractTextContent(answerElement);
  const keywords = extractKeywords(content, 5);
  const suggestedTags = keywords.join(', ');
  const defaultName = generateDocName('', keywords, content);
  const contentPreview = content.substring(0, 200) + (content.length > 200 ? '...' : '');

  // Create modal
  const overlay = document.createElement('div');
  overlay.className = 'gdocs-modal-overlay';
  overlay.innerHTML = `
    <div class="gdocs-modal gdocs-modal-compact">
      <div class="gdocs-modal-header">
        <h2>📄 Save to Google Docs</h2>
        <button class="gdocs-modal-close" title="Close (Esc)">&times;</button>
      </div>

      <div class="gdocs-modal-body">
        <!-- Folder Selection -->
        <div class="gdocs-form-group">
          <label for="gdocs-folder">📁 Folder</label>
          <select id="gdocs-folder" class="gdocs-select">
            <option value="">📂 My Drive</option>
          </select>
        </div>

        <!-- Project Name -->
        <div class="gdocs-form-group">
          <label for="gdocs-project">🎯 Project <span class="gdocs-optional">(optional)</span></label>
          <input
            type="text"
            id="gdocs-project"
            class="gdocs-input"
            placeholder="e.g., Q4 Campaign"
            maxlength="100"
          >
        </div>

        <!-- Tags -->
        <div class="gdocs-form-group">
          <label for="gdocs-tags">🏷️ Tags <span class="gdocs-optional">(optional)</span></label>
          <input
            type="text"
            id="gdocs-tags"
            class="gdocs-input"
            placeholder="comma-separated"
            value="${suggestedTags}"
            maxlength="200"
          >
          <small class="gdocs-hint">Auto-suggested. Edit or clear as needed.</small>
        </div>

        <!-- Document Name -->
        <div class="gdocs-form-group">
          <label for="gdocs-docname">📄 Document Name</label>
          <input
            type="text"
            id="gdocs-docname"
            class="gdocs-input"
            value="${defaultName}"
            maxlength="150"
          >
        </div>

        <!-- Collapsible Preview -->
        <details class="gdocs-preview-details">
          <summary>Preview content (${content.length} chars)</summary>
          <div class="gdocs-preview-content">${contentPreview}</div>
        </details>
      </div>

      <div class="gdocs-modal-footer">
        <button class="gdocs-btn gdocs-btn-secondary" id="gdocs-cancel-btn">Cancel</button>
        <button class="gdocs-btn gdocs-btn-primary" id="gdocs-save-btn">
          💾 Save to Drive
        </button>
      </div>

      <div class="gdocs-modal-loading" id="gdocs-modal-loading" style="display:none;">
        <div class="gdocs-spinner-large"></div>
        <p>Saving...</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  currentModal = overlay;

  // Load folders
  await loadFolders();

  // Setup listeners
  setupModalListeners();

  // Focus project field
  setTimeout(() => overlay.querySelector('#gdocs-project')?.focus(), 100);
}

/**
 * Load folders for dropdown
 */
async function loadFolders() {
  const select = document.getElementById('gdocs-folder');
  if (!select) return;

  try {
    const response = await chrome.runtime.sendMessage({ action: 'getFolders' });

    if (response.success && response.folders) {
      let html = '<option value="">📂 My Drive</option>';

      if (response.favoriteFolders && response.favoriteFolders.length > 0) {
        html += '<optgroup label="⭐ Recent">';
        response.favoriteFolders.forEach(f => {
          html += `<option value="${f.id}">📁 ${f.name}</option>`;
        });
        html += '</optgroup>';
      }

      if (response.folders.length > 0) {
        html += '<optgroup label="All Folders">';
        response.folders.slice(0, 20).forEach(f => {
          html += `<option value="${f.id}">📁 ${f.name}</option>`;
        });
        html += '</optgroup>';
      }

      select.innerHTML = html;

      // Auto-select last used folder
      if (response.lastUsedFolder) {
        select.value = response.lastUsedFolder;
      }
    }
  } catch (error) {
    console.error('Error loading folders:', error);
  }
}

/**
 * Setup modal event listeners
 */
function setupModalListeners() {
  const modal = currentModal;
  if (!modal) return;

  // Close handlers
  modal.querySelector('.gdocs-modal-close')?.addEventListener('click', closeModal);
  modal.querySelector('#gdocs-cancel-btn')?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => e.target === modal && closeModal());

  // Escape key
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);

  // Save button
  modal.querySelector('#gdocs-save-btn')?.addEventListener('click', handleModalSave);

  // Enter key to save
  const enterHandler = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleModalSave();
    }
  };
  modal.addEventListener('keydown', enterHandler);

  // Auto-update doc name
  const projectInput = modal.querySelector('#gdocs-project');
  const tagsInput = modal.querySelector('#gdocs-tags');
  const nameInput = modal.querySelector('#gdocs-docname');

  const updateName = () => {
    if (!nameInput.dataset.edited) {
      const content = extractTextContent(currentAnswerElement);
      const tags = tagsInput.value.split(',').map(t => t.trim()).filter(t => t);
      nameInput.value = generateDocName(projectInput.value, tags, content);
    }
  };

  projectInput?.addEventListener('input', updateName);
  tagsInput?.addEventListener('input', updateName);
  nameInput?.addEventListener('input', () => nameInput.dataset.edited = 'true');
}

/**
 * Handle modal save
 */
async function handleModalSave() {
  const modal = currentModal;
  if (!modal) return;

  const folderId = modal.querySelector('#gdocs-folder')?.value || null;
  const project = modal.querySelector('#gdocs-project')?.value.trim();
  const tagsValue = modal.querySelector('#gdocs-tags')?.value.trim();
  const tags = tagsValue ? tagsValue.split(',').map(t => t.trim()).filter(t => t) : [];
  const docName = modal.querySelector('#gdocs-docname')?.value.trim();

  if (!docName) {
    showNotification('Please enter a document name', 'error');
    return;
  }

  // Show loading
  const loading = modal.querySelector('#gdocs-modal-loading');
  const body = modal.querySelector('.gdocs-modal-body');
  const footer = modal.querySelector('.gdocs-modal-footer');

  body.style.display = 'none';
  footer.style.display = 'none';
  loading.style.display = 'flex';

  try {
    const content = extractTextContent(currentAnswerElement);

    const response = await chrome.runtime.sendMessage({
      action: 'sendToGoogleDocsEnhanced',
      data: {
        content,
        metadata: { folderId, project, tags, notes: '', docName },
        source: {
          url: window.location.href,
          title: document.title,
          timestamp: new Date().toISOString()
        }
      }
    });

    if (response.success) {
      closeModal();
      showNotification(`Saved! <a href="${response.docUrl}" target="_blank">Open Doc</a>`);
    } else {
      throw new Error(response.error || 'Failed to save');
    }

  } catch (error) {
    console.error('Modal save error:', error);
    showNotification(`Error: ${error.message}`, 'error');

    body.style.display = 'block';
    footer.style.display = 'flex';
    loading.style.display = 'none';
  }
}

/**
 * Close modal
 */
function closeModal() {
  if (currentModal) {
    currentModal.remove();
    currentModal = null;
    currentAnswerElement = null;
  }
}

/**
 * Show notification
 */
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `gdocs-notification ${type}`;
  notification.innerHTML = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add('show'), 10);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}

/**
 * Inject button group
 */
function injectButton(answerElement) {
  if (processedElements.has(answerElement)) return;

  const text = extractTextContent(answerElement);
  if (text.length < 20) return;

  const buttonGroup = createButtonGroup();

  // Quick save button
  const quickBtn = buttonGroup.querySelector('.send-to-gdocs-quick');
  quickBtn.addEventListener('click', (e) => {
    e.preventDefault();
    handleQuickSave(answerElement);
  });

  // Custom save button
  const customBtn = buttonGroup.querySelector('.send-to-gdocs-custom');
  customBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showCustomModal(answerElement);
  });

  // Insert
  const config = getSiteConfig();
  if (config.insertPosition === 'afterend') {
    answerElement.insertAdjacentElement('afterend', buttonGroup);
  } else {
    answerElement.appendChild(buttonGroup);
  }

  processedElements.add(answerElement);
}

/**
 * Process all answers
 */
function processAnswers() {
  const config = getSiteConfig();
  document.querySelectorAll(config.answerSelector).forEach(injectButton);
}

/**
 * Initialize
 */
function init() {
  processAnswers();

  const observer = new MutationObserver(() => {
    clearTimeout(window.gdocsProcessTimeout);
    window.gdocsProcessTimeout = setTimeout(processAnswers, 500);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  console.log('✅ Send to Google Docs (v2 - Optimized) loaded');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
