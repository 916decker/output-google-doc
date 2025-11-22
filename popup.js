/**
 * Popup Script - Settings UI logic
 */

// DOM elements
const authStatus = document.getElementById('authStatus');
const authStatusText = document.getElementById('authStatusText');
const modeAppend = document.getElementById('modeAppend');
const modeNew = document.getElementById('modeNew');
const docNaming = document.getElementById('docNaming');
const customDocName = document.getElementById('customDocName');
const customNameField = document.getElementById('customNameField');
const targetDocId = document.getElementById('targetDocId');
const targetDocSection = document.getElementById('targetDocSection');
const namingSection = document.getElementById('namingSection');
const saveBtn = document.getElementById('saveBtn');
const testBtn = document.getElementById('testBtn');
const logoutBtn = document.getElementById('logoutBtn');
const helpLink = document.getElementById('helpLink');

/**
 * Load current settings
 */
async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    docMode: 'append',
    targetDocId: null,
    docNaming: 'timestamp',
    customDocName: 'AI Answers'
  });

  // Set form values
  if (settings.docMode === 'append') {
    modeAppend.checked = true;
    targetDocSection.classList.remove('hidden');
    namingSection.classList.add('hidden');
  } else {
    modeNew.checked = true;
    targetDocSection.classList.add('hidden');
    namingSection.classList.remove('hidden');
  }

  docNaming.value = settings.docNaming;
  customDocName.value = settings.customDocName;
  targetDocId.value = settings.targetDocId || '';

  // Show custom name field if needed
  if (settings.docNaming === 'custom') {
    customNameField.classList.remove('hidden');
  }
}

/**
 * Save settings
 */
async function saveSettings() {
  const settings = {
    docMode: modeAppend.checked ? 'append' : 'new',
    docNaming: docNaming.value,
    customDocName: customDocName.value,
    targetDocId: targetDocId.value.trim() || null
  };

  await chrome.storage.sync.set(settings);

  // Visual feedback
  const originalText = saveBtn.textContent;
  saveBtn.textContent = '✓ Saved!';
  saveBtn.style.background = '#0F9D58';

  setTimeout(() => {
    saveBtn.textContent = originalText;
    saveBtn.style.background = '';
  }, 2000);
}

/**
 * Check authentication status
 */
async function checkAuthStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'getAuthStatus' });

    if (response.authenticated) {
      authStatus.className = 'auth-status connected';
      authStatusText.textContent = 'Connected to Google';
      logoutBtn.classList.remove('hidden');
    } else {
      authStatus.className = 'auth-status disconnected';
      authStatusText.textContent = 'Not connected';
      logoutBtn.classList.add('hidden');
    }
  } catch (error) {
    authStatus.className = 'auth-status disconnected';
    authStatusText.textContent = 'Connection error';
    logoutBtn.classList.add('hidden');
  }
}

/**
 * Test connection by sending a test message
 */
async function testConnection() {
  const originalText = testBtn.textContent;
  testBtn.textContent = 'Testing...';
  testBtn.disabled = true;

  try {
    // Try to get auth token (this will trigger login if needed)
    const response = await chrome.runtime.sendMessage({ action: 'getAuthStatus' });

    if (response.authenticated) {
      testBtn.textContent = '✓ Connected!';
      testBtn.style.background = '#0F9D58';
      testBtn.style.color = 'white';
      checkAuthStatus();
    } else {
      testBtn.textContent = '✗ Failed';
      testBtn.style.background = '#D93025';
      testBtn.style.color = 'white';
    }
  } catch (error) {
    testBtn.textContent = '✗ Error';
    testBtn.style.background = '#D93025';
    testBtn.style.color = 'white';
    console.error('Test connection error:', error);
  }

  setTimeout(() => {
    testBtn.textContent = originalText;
    testBtn.disabled = false;
    testBtn.style.background = '';
    testBtn.style.color = '';
  }, 3000);
}

/**
 * Handle logout
 */
async function handleLogout() {
  const confirmed = confirm('Are you sure you want to sign out of Google?');

  if (confirmed) {
    try {
      await chrome.runtime.sendMessage({ action: 'logout' });
      checkAuthStatus();
      alert('Signed out successfully');
    } catch (error) {
      alert('Error signing out: ' + error.message);
    }
  }
}

/**
 * Show help information
 */
function showHelp() {
  const helpText = `
TROUBLESHOOTING GUIDE

1. Button not appearing?
   - Refresh the page after installing
   - Check that you're on Perplexity or Comet
   - Look at the end of answer boxes

2. Authentication errors?
   - Click "Test Connection"
   - Allow Google permissions when prompted
   - Try signing out and back in

3. Can't find Doc ID?
   - Open your Google Doc
   - Copy the ID from URL between /d/ and /edit
   - Paste it in the Target Document field

4. Documents not saving?
   - Check your Google Drive permissions
   - Verify you have storage space
   - Try creating a new doc instead of append mode

Need more help? Check the extension page for updates.
  `.trim();

  alert(helpText);
}

/**
 * Event listeners
 */
modeAppend.addEventListener('change', () => {
  if (modeAppend.checked) {
    targetDocSection.classList.remove('hidden');
    namingSection.classList.add('hidden');
  }
});

modeNew.addEventListener('change', () => {
  if (modeNew.checked) {
    targetDocSection.classList.add('hidden');
    namingSection.classList.remove('hidden');
  }
});

docNaming.addEventListener('change', () => {
  if (docNaming.value === 'custom') {
    customNameField.classList.remove('hidden');
  } else {
    customNameField.classList.add('hidden');
  }
});

saveBtn.addEventListener('click', saveSettings);
testBtn.addEventListener('click', testConnection);
logoutBtn.addEventListener('click', handleLogout);
helpLink.addEventListener('click', (e) => {
  e.preventDefault();
  showHelp();
});

// Initialize
loadSettings();
checkAuthStatus();
