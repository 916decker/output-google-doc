/**
 * Content Script - Enhanced with Organization Features
 * Injects "Send to Google Docs" buttons with modal for folder/tag selection
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
  // Fallback for unknown sites
  default: {
    answerSelector: '[class*="answer"], [class*="response"], [class*="message"]',
    insertPosition: 'afterend'
  }
};

// Track which elements already have buttons
const processedElements = new WeakSet();

// Modal state
let currentModal = null;
let currentAnswerElement = null;
let availableFolders = [];

/**
 * Get site configuration based on current hostname
 */
function getSiteConfig() {
  const hostname = window.location.hostname;
  return SITE_CONFIGS[hostname] || SITE_CONFIGS.default;
}

/**
 * Create the "Send to Google Docs" button
 */
function createButton() {
  const button = document.createElement('button');
  button.className = 'send-to-gdocs-btn';
  button.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" fill="#4285F4"/>
      <path d="M14 2V8H20" fill="#A1C2FA"/>
      <path d="M8 12H16M8 16H16M8 8H12" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
    </svg>
    <span>Send to Google Docs</span>
  `;

  button.title = 'Send this answer to Google Docs';

  return button;
}

/**
 * Extract clean text content from an element
 */
function extractTextContent(element) {
  // Clone the element to avoid modifying the original
  const clone = element.cloneNode(true);

  // Remove any existing "Send to Google Docs" buttons
  const buttons = clone.querySelectorAll('.send-to-gdocs-btn');
  buttons.forEach(btn => btn.remove());

  // Get text content
  let text = clone.innerText || clone.textContent;

  // Clean up extra whitespace
  text = text.trim().replace(/\n{3,}/g, '\n\n');

  return text;
}

/**
 * Extract keywords from content for tag suggestions
 */
function extractKeywords(text) {
  // Common words to ignore
  const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);

  // Extract words and count frequency
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Count frequency
  const frequency = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  // Sort by frequency and return top 10
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Generate smart document name
 */
function generateDocName(project, tags, content) {
  const now = new Date();
  const datePart = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timePart = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS

  let nameParts = [];

  // Add project if provided
  if (project && project.trim()) {
    nameParts.push(project.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'));
  }

  // Add first tag if provided
  if (tags && tags.trim()) {
    const firstTag = tags.split(',')[0].trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    if (firstTag) {
      nameParts.push(firstTag);
    }
  }

  // Add date and time
  nameParts.push(`${datePart}_${timePart}`);

  // If no project or tags, add content preview
  if (nameParts.length === 1) {
    const preview = content.substring(0, 30).replace(/[^\w\s]/g, '').replace(/\s+/g, '-');
    nameParts.unshift(preview || 'AI-Answer');
  }

  return nameParts.join('_');
}

/**
 * Create and show modal
 */
async function showModal(answerElement) {
  // Store current answer element
  currentAnswerElement = answerElement;

  // Extract content
  const content = extractTextContent(answerElement);
  const contentPreview = content.substring(0, 200) + (content.length > 200 ? '...' : '');
  const keywords = extractKeywords(content);

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.className = 'gdocs-modal-overlay';
  overlay.innerHTML = `
    <div class="gdocs-modal">
      <div class="gdocs-modal-header">
        <h2>📄 Save to Google Docs</h2>
        <button class="gdocs-modal-close" title="Close">&times;</button>
      </div>

      <div class="gdocs-modal-body">
        <!-- Folder Selection -->
        <div class="gdocs-form-group">
          <label for="gdocs-folder">
            📁 Save to Folder
            <span class="gdocs-help-icon" title="Choose where to save this document">?</span>
          </label>
          <div class="gdocs-folder-select-container">
            <select id="gdocs-folder" class="gdocs-select">
              <option value="">📂 My Drive (Root)</option>
            </select>
            <button class="gdocs-browse-btn" id="gdocs-browse-folders" title="Browse all folders">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              Browse
            </button>
          </div>
          <div class="gdocs-selected-path" id="gdocs-selected-path"></div>
        </div>

        <!-- Project Name -->
        <div class="gdocs-form-group">
          <label for="gdocs-project">
            🎯 Project Name
            <span class="gdocs-optional">(optional)</span>
          </label>
          <input
            type="text"
            id="gdocs-project"
            class="gdocs-input"
            placeholder="e.g., Q4 Campaign, Thesis Research, Client Acme"
            maxlength="100"
          >
        </div>

        <!-- Tags -->
        <div class="gdocs-form-group">
          <label for="gdocs-tags">
            🏷️ Tags
            <span class="gdocs-optional">(comma-separated)</span>
          </label>
          <input
            type="text"
            id="gdocs-tags"
            class="gdocs-input"
            placeholder="e.g., AI, marketing, research, python"
            maxlength="200"
          >
          <div class="gdocs-tag-suggestions" id="gdocs-tag-suggestions"></div>
        </div>

        <!-- Optional Notes -->
        <div class="gdocs-form-group">
          <label for="gdocs-notes">
            📝 Notes
            <span class="gdocs-optional">(optional)</span>
          </label>
          <textarea
            id="gdocs-notes"
            class="gdocs-textarea"
            placeholder="Add context, reminders, or custom notes..."
            rows="2"
            maxlength="500"
          ></textarea>
        </div>

        <!-- Document Name -->
        <div class="gdocs-form-group">
          <label for="gdocs-docname">
            📄 Document Name
            <span class="gdocs-help-icon" title="Auto-generated, but you can edit it">?</span>
          </label>
          <input
            type="text"
            id="gdocs-docname"
            class="gdocs-input gdocs-docname"
            placeholder="Auto-generated name"
            maxlength="150"
            value="${generateDocName('', '', content)}"
          >
        </div>

        <!-- Preview Section -->
        <div class="gdocs-preview-section">
          <div class="gdocs-preview-header">
            <strong>Preview:</strong>
            <span id="gdocs-preview-chars">${content.length} characters</span>
          </div>
          <div class="gdocs-preview-content" id="gdocs-preview-content">${contentPreview}</div>
        </div>
      </div>

      <div class="gdocs-modal-footer">
        <button class="gdocs-btn gdocs-btn-secondary" id="gdocs-cancel-btn">
          Cancel
        </button>
        <button class="gdocs-btn gdocs-btn-primary" id="gdocs-save-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Save to Drive
        </button>
      </div>

      <!-- Loading State -->
      <div class="gdocs-modal-loading" id="gdocs-modal-loading" style="display: none;">
        <div class="gdocs-spinner-large"></div>
        <p>Saving to Google Drive...</p>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  currentModal = overlay;

  // Load folders
  await loadFolders();

  // Show keyword suggestions
  showKeywordSuggestions(keywords);

  // Setup event listeners
  setupModalEventListeners();

  // Focus first input
  setTimeout(() => {
    overlay.querySelector('#gdocs-project')?.focus();
  }, 100);
}

/**
 * Load user's folders from Google Drive
 */
async function loadFolders() {
  const folderSelect = document.getElementById('gdocs-folder');
  if (!folderSelect) return;

  try {
    folderSelect.innerHTML = '<option value="">Loading folders...</option>';

    // Get folders from background script
    const response = await chrome.runtime.sendMessage({ action: 'getFolders' });

    if (response.success && response.folders) {
      availableFolders = response.folders;

      // Build folder options
      let options = '<option value="">📂 My Drive (Root)</option>';

      // Add recent/favorite folders first
      if (response.favoriteFolders && response.favoriteFolders.length > 0) {
        options += '<optgroup label="⭐ Favorites">';
        response.favoriteFolders.forEach(folder => {
          options += `<option value="${folder.id}">📁 ${folder.name}</option>`;
        });
        options += '</optgroup>';
      }

      // Add all folders
      if (response.folders.length > 0) {
        options += '<optgroup label="All Folders">';
        response.folders.forEach(folder => {
          options += `<option value="${folder.id}">📁 ${folder.name}</option>`;
        });
        options += '</optgroup>';
      }

      folderSelect.innerHTML = options;
    } else {
      folderSelect.innerHTML = '<option value="">📂 My Drive (Root)</option>';
    }
  } catch (error) {
    console.error('Error loading folders:', error);
    folderSelect.innerHTML = '<option value="">📂 My Drive (Root)</option>';
  }
}

/**
 * Show keyword suggestions for tags
 */
function showKeywordSuggestions(keywords) {
  const suggestionsContainer = document.getElementById('gdocs-tag-suggestions');
  if (!suggestionsContainer || keywords.length === 0) return;

  const suggestionsHTML = keywords.slice(0, 5).map(keyword =>
    `<span class="gdocs-tag-suggestion" data-tag="${keyword}">${keyword}</span>`
  ).join('');

  suggestionsContainer.innerHTML = `
    <div class="gdocs-suggestions-label">Suggested:</div>
    ${suggestionsHTML}
  `;
}

/**
 * Setup modal event listeners
 */
function setupModalEventListeners() {
  const modal = currentModal;
  if (!modal) return;

  // Close button
  const closeBtn = modal.querySelector('.gdocs-modal-close');
  closeBtn?.addEventListener('click', closeModal);

  // Cancel button
  const cancelBtn = modal.querySelector('#gdocs-cancel-btn');
  cancelBtn?.addEventListener('click', closeModal);

  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Escape key to close
  document.addEventListener('keydown', handleEscapeKey);

  // Save button
  const saveBtn = modal.querySelector('#gdocs-save-btn');
  saveBtn?.addEventListener('click', handleSave);

  // Browse folders button
  const browseBtn = modal.querySelector('#gdocs-browse-folders');
  browseBtn?.addEventListener('click', handleBrowseFolders);

  // Tag suggestions
  const tagSuggestions = modal.querySelectorAll('.gdocs-tag-suggestion');
  tagSuggestions.forEach(suggestion => {
    suggestion.addEventListener('click', () => {
      const tag = suggestion.dataset.tag;
      const tagsInput = modal.querySelector('#gdocs-tags');
      if (tagsInput) {
        const currentTags = tagsInput.value;
        tagsInput.value = currentTags ? `${currentTags}, ${tag}` : tag;
        suggestion.style.opacity = '0.5';
        suggestion.style.pointerEvents = 'none';
      }
    });
  });

  // Auto-update document name when project or tags change
  const projectInput = modal.querySelector('#gdocs-project');
  const tagsInput = modal.querySelector('#gdocs-tags');
  const docNameInput = modal.querySelector('#gdocs-docname');

  const updateDocName = () => {
    if (docNameInput && !docNameInput.dataset.manuallyEdited) {
      const content = extractTextContent(currentAnswerElement);
      docNameInput.value = generateDocName(
        projectInput?.value || '',
        tagsInput?.value || '',
        content
      );
    }
  };

  projectInput?.addEventListener('input', updateDocName);
  tagsInput?.addEventListener('input', updateDocName);
  docNameInput?.addEventListener('input', () => {
    docNameInput.dataset.manuallyEdited = 'true';
  });
}

/**
 * Handle escape key
 */
function handleEscapeKey(e) {
  if (e.key === 'Escape' && currentModal) {
    closeModal();
  }
}

/**
 * Handle browse folders
 */
async function handleBrowseFolders() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'browseFolders' });

    if (response.success && response.folder) {
      const folderSelect = document.getElementById('gdocs-folder');
      const pathDisplay = document.getElementById('gdocs-selected-path');

      if (folderSelect) {
        // Add new folder to dropdown if not exists
        const existingOption = Array.from(folderSelect.options).find(
          opt => opt.value === response.folder.id
        );

        if (!existingOption) {
          const option = document.createElement('option');
          option.value = response.folder.id;
          option.textContent = `📁 ${response.folder.name}`;
          folderSelect.appendChild(option);
        }

        folderSelect.value = response.folder.id;
      }

      if (pathDisplay) {
        pathDisplay.textContent = `Selected: ${response.folder.path || response.folder.name}`;
      }
    }
  } catch (error) {
    console.error('Error browsing folders:', error);
    showNotification('Error browsing folders', 'error');
  }
}

/**
 * Handle save
 */
async function handleSave() {
  const modal = currentModal;
  if (!modal) return;

  // Get form values
  const folderId = modal.querySelector('#gdocs-folder')?.value || null;
  const project = modal.querySelector('#gdocs-project')?.value.trim() || '';
  const tags = modal.querySelector('#gdocs-tags')?.value.trim() || '';
  const notes = modal.querySelector('#gdocs-notes')?.value.trim() || '';
  const docName = modal.querySelector('#gdocs-docname')?.value.trim();

  // Validate
  if (!docName) {
    showNotification('Please enter a document name', 'error');
    return;
  }

  // Show loading state
  const loadingDiv = modal.querySelector('#gdocs-modal-loading');
  const modalBody = modal.querySelector('.gdocs-modal-body');
  const modalFooter = modal.querySelector('.gdocs-modal-footer');

  if (loadingDiv && modalBody && modalFooter) {
    modalBody.style.display = 'none';
    modalFooter.style.display = 'none';
    loadingDiv.style.display = 'flex';
  }

  try {
    // Extract content
    const content = extractTextContent(currentAnswerElement);
    const pageUrl = window.location.href;
    const pageTitle = document.title;

    // Send to background script
    const response = await chrome.runtime.sendMessage({
      action: 'sendToGoogleDocsEnhanced',
      data: {
        content: content,
        metadata: {
          folderId: folderId,
          project: project,
          tags: tags ? tags.split(',').map(t => t.trim()).filter(t => t) : [],
          notes: notes,
          docName: docName
        },
        source: {
          url: pageUrl,
          title: pageTitle,
          timestamp: new Date().toISOString()
        }
      }
    });

    if (response.success) {
      closeModal();
      showNotification(`Saved to Google Docs! <a href="${response.docUrl}" target="_blank">Open Doc</a>`);
    } else {
      throw new Error(response.error || 'Failed to save to Google Docs');
    }

  } catch (error) {
    console.error('Error saving to Google Docs:', error);
    showNotification(`Error: ${error.message}`, 'error');

    // Restore form
    if (loadingDiv && modalBody && modalFooter) {
      modalBody.style.display = 'block';
      modalFooter.style.display = 'flex';
      loadingDiv.style.display = 'none';
    }
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
    document.removeEventListener('keydown', handleEscapeKey);
  }
}

/**
 * Handle button click - show modal
 */
function handleButtonClick(event, answerElement) {
  event.preventDefault();
  showModal(answerElement);
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `gdocs-notification ${type}`;
  notification.innerHTML = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('show');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

/**
 * Inject button next to an answer element
 */
function injectButton(answerElement) {
  // Skip if already processed
  if (processedElements.has(answerElement)) {
    return;
  }

  // Skip if element is too small (likely not a real answer)
  const text = extractTextContent(answerElement);
  if (text.length < 20) {
    return;
  }

  // Create button
  const button = createButton();
  button.addEventListener('click', (e) => handleButtonClick(e, answerElement));

  // Create container for button
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'send-to-gdocs-container';
  buttonContainer.appendChild(button);

  // Insert button
  const config = getSiteConfig();
  if (config.insertPosition === 'afterend') {
    answerElement.insertAdjacentElement('afterend', buttonContainer);
  } else {
    answerElement.appendChild(buttonContainer);
  }

  // Mark as processed
  processedElements.add(answerElement);
}

/**
 * Find and process all answer elements on the page
 */
function processAnswers() {
  const config = getSiteConfig();
  const answerElements = document.querySelectorAll(config.answerSelector);

  answerElements.forEach(element => {
    injectButton(element);
  });
}

/**
 * Initialize the extension
 */
function init() {
  // Process existing answers
  processAnswers();

  // Watch for new answers (for dynamic content)
  const observer = new MutationObserver((mutations) => {
    // Debounce to avoid excessive processing
    clearTimeout(window.gdocsProcessTimeout);
    window.gdocsProcessTimeout = setTimeout(processAnswers, 500);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log('✅ Send to Google Docs extension (Enhanced) loaded');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
