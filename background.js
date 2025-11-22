/**
 * Background Service Worker - Handles Google Docs API integration
 */

// Google API configuration
const GOOGLE_DOCS_API = 'https://docs.googleapis.com/v1/documents';
const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3/files';

/**
 * Get OAuth2 access token
 */
async function getAuthToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

/**
 * Remove cached auth token (for logout or token refresh)
 */
async function removeAuthToken(token) {
  return new Promise((resolve) => {
    chrome.identity.removeCachedAuthToken({ token }, () => {
      resolve();
    });
  });
}

/**
 * Get user settings from storage
 */
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({
      docMode: 'append', // 'append' or 'new'
      targetDocId: null,
      docNaming: 'timestamp', // 'timestamp', 'source', or 'custom'
      customDocName: 'AI Answers',
      folderName: 'AI Answers Archive'
    }, resolve);
  });
}

/**
 * Create a new Google Doc
 */
async function createNewDoc(token, title, content, source) {
  // Create the document
  const createResponse = await fetch(GOOGLE_DOCS_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title
    })
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create document: ${createResponse.statusText}`);
  }

  const doc = await createResponse.json();
  const docId = doc.documentId;

  // Add content to the document
  await addContentToDoc(token, docId, content, source);

  return {
    docId: docId,
    docUrl: `https://docs.google.com/document/d/${docId}/edit`
  };
}

/**
 * Add content to an existing Google Doc
 */
async function addContentToDoc(token, docId, content, source) {
  // Prepare the content with metadata
  const timestamp = new Date(source.timestamp).toLocaleString();
  const header = `\n\n${'─'.repeat(80)}\n`;
  const metadata = `📄 Source: ${source.title}\n🔗 URL: ${source.url}\n📅 Saved: ${timestamp}\n${'-'.repeat(80)}\n\n`;
  const fullContent = header + metadata + content + '\n';

  // Get the current document to find the end index
  const docResponse = await fetch(`${GOOGLE_DOCS_API}/${docId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!docResponse.ok) {
    throw new Error(`Failed to read document: ${docResponse.statusText}`);
  }

  const docData = await docResponse.json();
  const endIndex = docData.body.content[docData.body.content.length - 1].endIndex - 1;

  // Insert the content at the end
  const batchUpdateResponse = await fetch(`${GOOGLE_DOCS_API}/${docId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        {
          insertText: {
            location: { index: endIndex },
            text: fullContent
          }
        }
      ]
    })
  });

  if (!batchUpdateResponse.ok) {
    throw new Error(`Failed to update document: ${batchUpdateResponse.statusText}`);
  }
}

/**
 * Generate document title based on settings
 */
function generateDocTitle(settings, source) {
  switch (settings.docNaming) {
    case 'timestamp':
      return `AI Answer - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`;
    case 'source':
      return `${source.title.substring(0, 100)}`;
    case 'custom':
      return `${settings.customDocName} - ${new Date().toLocaleDateString()}`;
    default:
      return 'AI Answer';
  }
}

/**
 * Main function to send content to Google Docs
 */
async function sendToGoogleDocs(content, source) {
  try {
    // Get auth token
    const token = await getAuthToken();

    // Get user settings
    const settings = await getSettings();

    let result;

    if (settings.docMode === 'append' && settings.targetDocId) {
      // Append to existing document
      await addContentToDoc(token, settings.targetDocId, content, source);
      result = {
        docId: settings.targetDocId,
        docUrl: `https://docs.google.com/document/d/${settings.targetDocId}/edit`
      };
    } else {
      // Create new document
      const title = generateDocTitle(settings, source);
      result = await createNewDoc(token, title, content, source);

      // If in append mode but no target doc, save this as the target
      if (settings.docMode === 'append' && !settings.targetDocId) {
        await chrome.storage.sync.set({ targetDocId: result.docId });
      }
    }

    return {
      success: true,
      ...result
    };

  } catch (error) {
    console.error('Error in sendToGoogleDocs:', error);

    // If auth error, try to refresh token
    if (error.message && error.message.includes('auth')) {
      try {
        const token = await getAuthToken();
        await removeAuthToken(token);
      } catch (e) {
        console.error('Failed to refresh token:', e);
      }
    }

    return {
      success: false,
      error: error.message || 'Failed to send to Google Docs'
    };
  }
}

/**
 * Listen for messages from content scripts
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'sendToGoogleDocs') {
    sendToGoogleDocs(request.data.content, request.data.source)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({
        success: false,
        error: error.message
      }));
    return true; // Keep the message channel open for async response
  }

  if (request.action === 'getAuthStatus') {
    getAuthToken()
      .then(token => sendResponse({ authenticated: !!token }))
      .catch(() => sendResponse({ authenticated: false }));
    return true;
  }

  if (request.action === 'logout') {
    getAuthToken()
      .then(token => removeAuthToken(token))
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Log when service worker is loaded
console.log('✅ Send to Google Docs background service worker loaded');
