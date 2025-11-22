/**
 * Content Script - OPTIMIZED FOR DAILY USE + FUTURE-PROOF
 * Two-button approach: Quick Save (1-click) + Save As (custom)
 * Robust detection: Works even when platforms update their HTML
 * Supports: ChatGPT, Claude, Gemini, Perplexity, Comet, and unknown platforms
 */

// FALLBACK selectors (used only when universal detection fails)
// These are platform-specific and may break on updates
const FALLBACK_SELECTORS = {
  'www.perplexity.ai': '.prose, [class*="answer"], [class*="response"]',
  'comet.com': '.message-content, [class*="answer"], [class*="response"]',
  'chat.openai.com': '[data-message-author-role="assistant"], .agent-turn, [class*="markdown"]',
  'chatgpt.com': '[data-message-author-role="assistant"], .agent-turn, [class*="markdown"]',
  'claude.ai': '[data-is-streaming="false"], .font-claude-message, [class*="MessageContent"]',
  'gemini.google.com': '.model-response, [class*="response"], message-content'
};

// Track processed elements
const processedElements = new WeakSet();

/**
 * UNIVERSAL DETECTION - Find action buttons (Copy, Share, Like, etc.)
 * These exist on ALL AI platforms and rarely change
 */
function findActionButtons() {
  const patterns = [
    // Copy button (most universal)
    'button[aria-label*="Copy" i]',
    'button[title*="Copy" i]',
    '[class*="copy" i][role="button"]',

    // Share button
    'button[aria-label*="Share" i]',
    'button[title*="Share" i]',

    // Like/Dislike buttons
    'button[aria-label*="Good" i]',
    'button[aria-label*="Bad" i]',
    'button[aria-label*="Thumbs" i]',
    '[aria-label*="upvote" i]',
    '[aria-label*="downvote" i]',

    // More/Actions menu
    'button[aria-label*="More" i]',
    '[aria-haspopup="menu"]',

    // Regenerate/Retry
    'button[aria-label*="Regenerate" i]',
    'button[aria-label*="Retry" i]'
  ];

  const buttons = [];
  patterns.forEach(pattern => {
    try {
      document.querySelectorAll(pattern).forEach(btn => buttons.push(btn));
    } catch (e) {
      // Invalid selector, skip
    }
  });

  return buttons;
}

/**
 * Walk up DOM tree from action button to find answer container
 */
function findAnswerContainer(actionButton) {
  let current = actionButton;

  // Walk up max 10 levels
  for (let i = 0; i < 10; i++) {
    current = current.parentElement;
    if (!current) break;

    // Check if this looks like an answer container
    if (isLikelyAnswerContainer(current)) {
      return current;
    }
  }

  return null;
}

/**
 * Heuristics to identify if element is an answer container
 */
function isLikelyAnswerContainer(element) {
  // Must have substantial text
  const text = element.textContent || '';
  if (text.length < 50) return false;

  // Skip if it's just a thin wrapper
  if (element.children.length === 1) return false;

  // Look for answer-like attributes/classes
  const html = element.outerHTML.toLowerCase();
  const answerKeywords = ['message', 'answer', 'response', 'content', 'assistant', 'model', 'ai', 'bot'];
  const hasAnswerKeyword = answerKeywords.some(keyword => html.includes(keyword));

  // Check for formatted content (paragraphs, lists, code blocks)
  const hasFormatting = element.querySelector('p, ul, ol, pre, code, h1, h2, h3, h4') !== null;

  // Pass if has keyword OR formatting (lenient)
  return hasAnswerKeyword || hasFormatting;
}

/**
 * SMART DETECTION: Try multiple strategies in order
 */
function findAllAnswers() {
  const answers = new Set();

  // STRATEGY 1: Universal detection (action buttons) - PRIMARY
  const actionButtons = findActionButtons();
  actionButtons.forEach(button => {
    const container = findAnswerContainer(button);
    if (container && !processedElements.has(container)) {
      answers.add(container);
    }
  });

  // STRATEGY 2: Platform-specific selectors - FALLBACK
  if (answers.size === 0) {
    const hostname = window.location.hostname;
    const fallbackSelector = FALLBACK_SELECTORS[hostname];

    if (fallbackSelector) {
      try {
        const elements = document.querySelectorAll(fallbackSelector);
        elements.forEach(el => {
          if (!processedElements.has(el) && extractTextContent(el).length > 50) {
            answers.add(el);
          }
        });
      } catch (e) {
        console.warn('Fallback selector failed:', e);
      }
    }
  }

  // STRATEGY 3: Generic patterns - LAST RESORT
  if (answers.size === 0) {
    const genericPatterns = [
      '[role="article"]',
      'article',
      '[class*="message"][class*="assistant" i]',
      '[class*="response"][class*="content" i]',
      '[data-message-author-role="assistant"]',
      '.markdown-body'
    ];

    genericPatterns.forEach(pattern => {
      try {
        const elements = document.querySelectorAll(pattern);
        elements.forEach(el => {
          if (!processedElements.has(el) && extractTextContent(el).length > 100) {
            answers.add(el);
          }
        });
      } catch (e) {
        // Skip invalid selectors
      }
    });
  }

  return Array.from(answers);
}

/**
 * Find best insertion point for buttons (near existing action buttons)
 */
function findInsertionPoint(answerElement) {
  // Look for action button containers
  const actionContainers = answerElement.querySelectorAll(
    '[class*="action" i], [class*="button" i][class*="group" i], [role="group"], [class*="toolbar" i]'
  );

  // Find the one closest to bottom (usually at end of answer)
  let bestContainer = null;
  let maxTop = 0;

  actionContainers.forEach(container => {
    try {
      const rect = container.getBoundingClientRect();
      if (rect.top > maxTop) {
        maxTop = rect.top;
        bestContainer = container;
      }
    } catch (e) {
      // Skip if getBoundingClientRect fails
    }
  });

  return bestContainer;
}

// Modal state
let currentModal = null;
let currentAnswerElement = null;

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
          format: 'markdown', // Default to markdown for Quick Save
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

        <!-- Format Selection -->
        <div class="gdocs-form-group">
          <label for="gdocs-format">📝 Format</label>
          <select id="gdocs-format" class="gdocs-select">
            <option value="markdown" selected>Markdown (headings, lists, code blocks)</option>
            <option value="plain">Plain Text (no formatting)</option>
            <option value="rich">Rich Text (preserve HTML)</option>
          </select>
          <small class="gdocs-hint">Markdown auto-generates table of contents if 3+ headings detected</small>
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
  const format = modal.querySelector('#gdocs-format')?.value || 'markdown';
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
        metadata: { folderId, format, project, tags, notes: '', docName },
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
 * Inject button group (with smart insertion)
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

  // SMART INSERTION: Try to insert near existing action buttons
  const insertionPoint = findInsertionPoint(answerElement);

  if (insertionPoint) {
    // Insert alongside existing UI controls (looks natural)
    insertionPoint.appendChild(buttonGroup);
  } else {
    // Fallback: insert at end of answer
    answerElement.insertAdjacentElement('afterend', buttonGroup);
  }

  processedElements.add(answerElement);
}

/**
 * Process all answers (using robust multi-layer detection)
 */
function processAnswers() {
  // Use the new robust detection system
  const answers = findAllAnswers();

  // ONLY inject button on the LAST answer (most recent)
  // This prevents duplicate buttons all over the page
  if (answers.length > 0) {
    const lastAnswer = answers[answers.length - 1];
    injectButton(lastAnswer);
  }
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

  console.log('✅ Send to Google Docs (v2 - Future-Proof) loaded');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
