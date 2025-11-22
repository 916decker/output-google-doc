/**
 * ROBUST Content Script - Future-Proof Detection
 * Uses universal UI patterns instead of fragile class names
 * Works even when platforms update their HTML
 */

// Track processed elements
const processedElements = new WeakSet();

// Modal state
let currentModal = null;
let currentAnswerElement = null;

/**
 * UNIVERSAL DETECTION STRATEGY
 *
 * Every AI chat has action buttons (copy, share, like, etc.)
 * We find these stable UI elements, then work backwards to the answer
 *
 * This approach is resilient to HTML structure changes
 */

/**
 * Find action button containers (universal across all platforms)
 * These patterns exist on ChatGPT, Claude, Gemini, Perplexity, etc.
 */
function findActionButtons() {
  const patterns = [
    // Copy button (most universal)
    'button[aria-label*="Copy" i]',
    'button[title*="Copy" i]',
    'button:has(svg):has-text("Copy")',
    '[class*="copy" i][role="button"]',

    // Share button
    'button[aria-label*="Share" i]',
    'button[title*="Share" i]',

    // Like/Dislike buttons
    'button[aria-label*="Good response" i]',
    'button[aria-label*="Bad response" i]',
    'button[aria-label*="Thumbs" i]',

    // More actions menu
    'button[aria-label*="More" i]',
    'button[title*="More" i]',
    '[role="button"][aria-haspopup="menu"]',

    // Generic action containers
    '[class*="action" i][class*="button" i]',
    '[class*="message" i][class*="action" i]'
  ];

  const buttons = [];

  patterns.forEach(pattern => {
    try {
      const found = document.querySelectorAll(pattern);
      found.forEach(btn => buttons.push(btn));
    } catch (e) {
      // Invalid selector, skip
    }
  });

  return buttons;
}

/**
 * Find answer container by working backwards from action buttons
 */
function findAnswerContainer(actionButton) {
  let current = actionButton;

  // Walk up the DOM tree looking for the answer container
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
 * Heuristics to identify answer containers
 */
function isLikelyAnswerContainer(element) {
  // Skip if too small
  const text = element.textContent || '';
  if (text.length < 50) return false;

  // Skip if it's just a wrapper
  if (element.children.length === 1) return false;

  // Look for answer-like attributes/classes
  const html = element.outerHTML.toLowerCase();
  const answerKeywords = [
    'message', 'answer', 'response', 'content',
    'assistant', 'model', 'ai', 'bot'
  ];

  const hasAnswerKeyword = answerKeywords.some(keyword =>
    html.includes(keyword)
  );

  // Check if it contains formatted content (paragraphs, lists, code blocks)
  const hasFormattedContent =
    element.querySelector('p, ul, ol, pre, code, h1, h2, h3') !== null;

  return hasAnswerKeyword || hasFormattedContent;
}

/**
 * Platform-specific selectors as FALLBACK only
 * Used when universal detection doesn't find anything
 */
const FALLBACK_SELECTORS = {
  'www.perplexity.ai': '.prose, [class*="answer"]',
  'chat.openai.com': '[data-message-author-role="assistant"]',
  'chatgpt.com': '[data-message-author-role="assistant"]',
  'claude.ai': '[data-is-streaming="false"]',
  'gemini.google.com': '.model-response',
  'comet.com': '.message-content'
};

/**
 * SMART DETECTION: Try multiple strategies
 */
function findAllAnswers() {
  const answers = new Set();

  // STRATEGY 1: Universal detection (action buttons)
  const actionButtons = findActionButtons();
  actionButtons.forEach(button => {
    const container = findAnswerContainer(button);
    if (container && !processedElements.has(container)) {
      answers.add(container);
    }
  });

  // STRATEGY 2: Fallback to platform-specific selectors
  if (answers.size === 0) {
    const hostname = window.location.hostname;
    const fallbackSelector = FALLBACK_SELECTORS[hostname];

    if (fallbackSelector) {
      const elements = document.querySelectorAll(fallbackSelector);
      elements.forEach(el => {
        if (!processedElements.has(el)) {
          answers.add(el);
        }
      });
    }
  }

  // STRATEGY 3: Generic patterns (last resort)
  if (answers.size === 0) {
    const genericPatterns = [
      '[role="article"]',
      '[class*="message"][class*="assistant"]',
      '[class*="response"][class*="content"]',
      'article',
      '.markdown-body'
    ];

    genericPatterns.forEach(pattern => {
      try {
        const elements = document.querySelectorAll(pattern);
        elements.forEach(el => {
          if (el.textContent.length > 100 && !processedElements.has(el)) {
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
 * Find the best insertion point for our buttons
 * Looks for existing action button containers
 */
function findInsertionPoint(answerElement) {
  // Look for action button containers within the answer
  const actionContainers = answerElement.querySelectorAll(
    '[class*="action" i], [class*="button" i][class*="group" i], [role="group"]'
  );

  // Find the one closest to the bottom
  let bestContainer = null;
  let maxTop = 0;

  actionContainers.forEach(container => {
    const rect = container.getBoundingClientRect();
    if (rect.top > maxTop) {
      maxTop = rect.top;
      bestContainer = container;
    }
  });

  return bestContainer;
}

/**
 * Create button group (same as before)
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
 * Extract text content
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
 * Quick Save handler
 */
async function handleQuickSave(answerElement) {
  const button = event.currentTarget;
  const originalHTML = button.innerHTML;

  try {
    button.disabled = true;
    button.innerHTML = `
      <svg class="spinner" width="16" height="16" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="#4285F4" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" />
      </svg>
      <span>Saving...</span>
    `;

    const content = extractTextContent(answerElement);
    const keywords = extractKeywords(content, 3);
    const docName = generateDocName('', keywords, content);

    const response = await chrome.runtime.sendMessage({
      action: 'sendToGoogleDocsEnhanced',
      data: {
        content: content,
        metadata: {
          folderId: null,
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
    button.innerHTML = `<span>Error</span>`;
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
 * Inject buttons into answer
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

  // Try to find best insertion point (near existing action buttons)
  const insertionPoint = findInsertionPoint(answerElement);

  if (insertionPoint) {
    // Insert alongside existing action buttons
    insertionPoint.appendChild(buttonGroup);
  } else {
    // Fallback: insert at end of answer
    answerElement.insertAdjacentElement('afterend', buttonGroup);
  }

  processedElements.add(answerElement);
}

/**
 * Process all answers on the page
 */
function processAnswers() {
  const answers = findAllAnswers();
  answers.forEach(answer => injectButton(answer));
}

/**
 * Initialize with smart detection
 */
function init() {
  // Initial processing
  processAnswers();

  // Watch for new answers (with debouncing)
  const observer = new MutationObserver(() => {
    clearTimeout(window.gdocsProcessTimeout);
    window.gdocsProcessTimeout = setTimeout(processAnswers, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('✅ Send to Google Docs (Robust Detection) loaded');
}

// Start when ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Placeholder for showCustomModal (would include full modal code from content-v2.js)
function showCustomModal(answerElement) {
  // TODO: Include full modal implementation
  console.log('Custom modal not yet implemented in robust version');
  alert('Custom save modal - see content-v2.js for full implementation');
}
