/**
 * Content Script - Injects "Send to Google Docs" buttons
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
 * Handle button click - send content to Google Docs
 */
async function handleButtonClick(event, answerElement) {
  const button = event.currentTarget;
  const originalHTML = button.innerHTML;

  try {
    // Show loading state
    button.disabled = true;
    button.innerHTML = `
      <svg class="spinner" width="16" height="16" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="#4285F4" stroke-width="3" fill="none" stroke-dasharray="31.4 31.4" />
      </svg>
      <span>Sending...</span>
    `;

    // Extract content
    const content = extractTextContent(answerElement);
    const pageUrl = window.location.href;
    const pageTitle = document.title;

    // Send to background script
    const response = await chrome.runtime.sendMessage({
      action: 'sendToGoogleDocs',
      data: {
        content: content,
        source: {
          url: pageUrl,
          title: pageTitle,
          timestamp: new Date().toISOString()
        }
      }
    });

    if (response.success) {
      // Show success state
      button.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M20 6L9 17L4 12" stroke="#0F9D58" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>Sent!</span>
      `;
      button.classList.add('success');

      // Show document link if available
      if (response.docUrl) {
        showNotification(`Sent to Google Docs! <a href="${response.docUrl}" target="_blank">Open Doc</a>`);
      }

      // Reset after 3 seconds
      setTimeout(() => {
        button.innerHTML = originalHTML;
        button.disabled = false;
        button.classList.remove('success');
      }, 3000);

    } else {
      throw new Error(response.error || 'Failed to send to Google Docs');
    }

  } catch (error) {
    console.error('Error sending to Google Docs:', error);

    // Show error state
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="#D93025" stroke-width="2" stroke-linecap="round"/>
      </svg>
      <span>Error</span>
    `;
    button.classList.add('error');

    showNotification(`Error: ${error.message}`, 'error');

    // Reset after 3 seconds
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.disabled = false;
      button.classList.remove('error');
    }, 3000);
  }
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

  console.log('✅ Send to Google Docs extension loaded');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
