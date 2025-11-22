/**
 * Background Service Worker - Enhanced with Folder & Metadata Management
 * Handles Google Docs/Drive API integration with organization features
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
 * Remove cached auth token
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
      lastUsedFolder: null,
      favoriteFolders: [],
      defaultTags: [],
      defaultFormat: 'markdown' // New: default to markdown
    }, resolve);
  });
}

/**
 * MARKDOWN PARSER - Convert markdown to Google Docs formatting
 */

/**
 * Parse markdown content into structured elements
 */
function parseMarkdown(text) {
  const lines = text.split('\n');
  const elements = [];
  let currentElement = null;
  let inCodeBlock = false;
  let codeBlockContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block detection
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push({
          type: 'code',
          content: codeBlockContent.join('\n'),
          language: codeBlockContent[0] || 'text'
        });
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
        const language = line.trim().substring(3).trim();
        codeBlockContent = [language];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Heading detection
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      elements.push({
        type: 'heading',
        level: level,
        content: text
      });
      continue;
    }

    // Bullet list detection
    if (line.trim().match(/^[-*+]\s+(.+)$/)) {
      const content = line.trim().substring(2);
      elements.push({
        type: 'bullet',
        content: content
      });
      continue;
    }

    // Numbered list detection
    if (line.trim().match(/^\d+\.\s+(.+)$/)) {
      const content = line.trim().replace(/^\d+\.\s+/, '');
      elements.push({
        type: 'numbered',
        content: content
      });
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      if (currentElement && currentElement.type === 'paragraph') {
        elements.push(currentElement);
        currentElement = null;
      }
      continue;
    }

    // Regular paragraph
    if (!currentElement || currentElement.type !== 'paragraph') {
      currentElement = {
        type: 'paragraph',
        content: line
      };
    } else {
      currentElement.content += ' ' + line;
    }
  }

  // Add last element
  if (currentElement) {
    elements.push(currentElement);
  }

  return elements;
}

/**
 * Parse inline markdown (bold, italic, code, links)
 */
function parseInlineMarkdown(text) {
  const segments = [];
  let current = '';
  let i = 0;

  while (i < text.length) {
    // Bold (**text** or __text__)
    if (text.substring(i, i + 2) === '**' || text.substring(i, i + 2) === '__') {
      if (current) segments.push({ type: 'text', content: current });
      current = '';

      const endMarker = text.substring(i, i + 2);
      const endPos = text.indexOf(endMarker, i + 2);
      if (endPos !== -1) {
        segments.push({
          type: 'bold',
          content: text.substring(i + 2, endPos)
        });
        i = endPos + 2;
        continue;
      }
    }

    // Italic (*text* or _text_)
    if ((text[i] === '*' || text[i] === '_') && text[i + 1] !== text[i]) {
      if (current) segments.push({ type: 'text', content: current });
      current = '';

      const marker = text[i];
      const endPos = text.indexOf(marker, i + 1);
      if (endPos !== -1 && text[endPos - 1] !== '\\') {
        segments.push({
          type: 'italic',
          content: text.substring(i + 1, endPos)
        });
        i = endPos + 1;
        continue;
      }
    }

    // Inline code (`code`)
    if (text[i] === '`') {
      if (current) segments.push({ type: 'text', content: current });
      current = '';

      const endPos = text.indexOf('`', i + 1);
      if (endPos !== -1) {
        segments.push({
          type: 'code',
          content: text.substring(i + 1, endPos)
        });
        i = endPos + 1;
        continue;
      }
    }

    // Links ([text](url))
    if (text[i] === '[') {
      const closeBracket = text.indexOf(']', i);
      const openParen = text.indexOf('(', closeBracket);
      const closeParen = text.indexOf(')', openParen);

      if (closeBracket !== -1 && openParen === closeBracket + 1 && closeParen !== -1) {
        if (current) segments.push({ type: 'text', content: current });
        current = '';

        segments.push({
          type: 'link',
          content: text.substring(i + 1, closeBracket),
          url: text.substring(openParen + 1, closeParen)
        });
        i = closeParen + 1;
        continue;
      }
    }

    current += text[i];
    i++;
  }

  if (current) segments.push({ type: 'text', content: current });
  return segments;
}

/**
 * Convert markdown elements to Google Docs API requests
 */
function convertToGoogleDocsRequests(elements, startIndex) {
  const requests = [];
  let currentIndex = startIndex;

  elements.forEach(element => {
    switch (element.type) {
      case 'heading':
        // Insert text
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: element.content + '\n'
          }
        });

        // Apply heading style
        requests.push({
          updateParagraphStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + element.content.length
            },
            paragraphStyle: {
              namedStyleType: `HEADING_${element.level}`
            },
            fields: 'namedStyleType'
          }
        });

        currentIndex += element.content.length + 1;
        break;

      case 'bullet':
      case 'numbered':
        // Insert text
        const bulletText = element.content + '\n';
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: bulletText
          }
        });

        // Apply bullet/numbered list
        requests.push({
          createParagraphBullets: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + bulletText.length - 1
            },
            bulletPreset: element.type === 'bullet' ? 'BULLET_DISC_CIRCLE_SQUARE' : 'NUMBERED_DECIMAL_ALPHA_ROMAN'
          }
        });

        currentIndex += bulletText.length;
        break;

      case 'code':
        // Insert code block with gray background
        const codeText = element.content + '\n\n';
        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: codeText
          }
        });

        // Apply code formatting (monospace + gray background)
        requests.push({
          updateTextStyle: {
            range: {
              startIndex: currentIndex,
              endIndex: currentIndex + codeText.length
            },
            textStyle: {
              weightedFontFamily: { fontFamily: 'Courier New' },
              fontSize: { magnitude: 10, unit: 'PT' },
              backgroundColor: {
                color: { rgbColor: { red: 0.95, green: 0.95, blue: 0.95 } }
              }
            },
            fields: 'weightedFontFamily,fontSize,backgroundColor'
          }
        });

        currentIndex += codeText.length;
        break;

      case 'paragraph':
        // Parse inline formatting
        const segments = parseInlineMarkdown(element.content);
        const paraText = element.content + '\n';

        requests.push({
          insertText: {
            location: { index: currentIndex },
            text: paraText
          }
        });

        // Apply inline formatting
        let segmentIndex = currentIndex;
        segments.forEach(segment => {
          if (segment.type === 'bold') {
            requests.push({
              updateTextStyle: {
                range: {
                  startIndex: segmentIndex,
                  endIndex: segmentIndex + segment.content.length
                },
                textStyle: { bold: true },
                fields: 'bold'
              }
            });
          } else if (segment.type === 'italic') {
            requests.push({
              updateTextStyle: {
                range: {
                  startIndex: segmentIndex,
                  endIndex: segmentIndex + segment.content.length
                },
                textStyle: { italic: true },
                fields: 'italic'
              }
            });
          } else if (segment.type === 'code') {
            requests.push({
              updateTextStyle: {
                range: {
                  startIndex: segmentIndex,
                  endIndex: segmentIndex + segment.content.length
                },
                textStyle: {
                  weightedFontFamily: { fontFamily: 'Courier New' },
                  backgroundColor: {
                    color: { rgbColor: { red: 0.95, green: 0.95, blue: 0.95 } }
                  }
                },
                fields: 'weightedFontFamily,backgroundColor'
              }
            });
          } else if (segment.type === 'link') {
            requests.push({
              updateTextStyle: {
                range: {
                  startIndex: segmentIndex,
                  endIndex: segmentIndex + segment.content.length
                },
                textStyle: {
                  link: { url: segment.url },
                  foregroundColor: {
                    color: { rgbColor: { red: 0.26, green: 0.52, blue: 0.96 } }
                  },
                  underline: true
                },
                fields: 'link,foregroundColor,underline'
              }
            });
          }

          segmentIndex += segment.content.length;
        });

        currentIndex += paraText.length;
        break;
    }
  });

  return { requests, endIndex: currentIndex };
}

/**
 * Save last used folder
 */
async function saveLastUsedFolder(folderId) {
  if (!folderId) return;

  const settings = await getSettings();
  await chrome.storage.sync.set({ lastUsedFolder: folderId });

  // Add to favorites if not already there (keep max 5)
  const favorites = settings.favoriteFolders || [];
  if (!favorites.find(f => f.id === folderId)) {
    // We'll add folder details when we fetch it
    // For now, just save the ID
  }
}

/**
 * Get list of user's folders from Google Drive
 */
async function getFolders(token) {
  try {
    const response = await fetch(
      `${GOOGLE_DRIVE_API}?` + new URLSearchParams({
        q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
        orderBy: 'modifiedTime desc',
        pageSize: '50',
        fields: 'files(id, name, parents)'
      }),
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch folders: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];

  } catch (error) {
    console.error('Error fetching folders:', error);
    return [];
  }
}

/**
 * Create enhanced document with metadata
 */
async function createDocumentWithMetadata(token, title, content, metadata, source) {
  // Step 1: Create the document
  const createResponse = await fetch(GOOGLE_DOCS_API, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: metadata.docName || title
    })
  });

  if (!createResponse.ok) {
    throw new Error(`Failed to create document: ${createResponse.statusText}`);
  }

  const doc = await createResponse.json();
  const docId = doc.documentId;

  // Step 2: Add content with rich metadata header
  await addContentWithMetadata(token, docId, content, metadata, source);

  // Step 3: Move to folder if specified
  if (metadata.folderId) {
    await moveToFolder(token, docId, metadata.folderId);
  }

  // Step 4: Set document properties (for searchability)
  await setDocumentProperties(token, docId, metadata);

  // Step 5: Save last used folder
  await saveLastUsedFolder(metadata.folderId);

  return {
    docId: docId,
    docUrl: `https://docs.google.com/document/d/${docId}/edit`
  };
}

/**
 * Add content with formatted metadata header
 */
async function addContentWithMetadata(token, docId, content, metadata, source) {
  const timestamp = new Date(source.timestamp).toLocaleString();
  const format = metadata.format || 'markdown'; // Default to markdown

  // Get current document to find end index
  const docResponse = await fetch(`${GOOGLE_DOCS_API}/${docId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });

  if (!docResponse.ok) {
    throw new Error(`Failed to read document: ${docResponse.statusText}`);
  }

  const docData = await docResponse.json();
  let currentIndex = docData.body.content[docData.body.content.length - 1].endIndex - 1;

  const allRequests = [];

  // Build metadata header
  let headerParts = [
    `${'═'.repeat(80)}`,
    `📄 DOCUMENT METADATA`,
    `${'═'.repeat(80)}`,
    ``
  ];

  if (metadata.project) {
    headerParts.push(`🎯 Project: ${metadata.project}`);
  }

  if (metadata.tags && metadata.tags.length > 0) {
    headerParts.push(`🏷️  Tags: ${metadata.tags.join(', ')}`);
  }

  headerParts.push(
    ``,
    `📌 Source: ${source.title}`,
    `🔗 URL: ${source.url}`,
    `📅 Saved: ${timestamp}`,
    ``
  );

  if (metadata.notes) {
    headerParts.push(
      `📝 Notes: ${metadata.notes}`,
      ``
    );
  }

  headerParts.push(
    `${'═'.repeat(80)}`,
    ``,
    ``
  );

  const header = headerParts.join('\n');

  // Insert metadata header (always plain text)
  allRequests.push({
    insertText: {
      location: { index: currentIndex },
      text: header
    }
  });
  currentIndex += header.length;

  // Handle content based on format
  if (format === 'markdown') {
    // Parse markdown content
    const elements = parseMarkdown(content);

    // Check if we should add TOC (3+ headings)
    const headings = elements.filter(el => el.type === 'heading');
    const shouldAddTOC = headings.length >= 3;

    if (shouldAddTOC) {
      // Generate TOC
      const tocText = '📑 TABLE OF CONTENTS\n' + '─'.repeat(80) + '\n';
      allRequests.push({
        insertText: {
          location: { index: currentIndex },
          text: tocText
        }
      });
      currentIndex += tocText.length;

      // Add TOC entries
      headings.forEach((heading, idx) => {
        const indent = '  '.repeat(heading.level - 1);
        const tocEntry = `${indent}${idx + 1}. ${heading.content}\n`;
        allRequests.push({
          insertText: {
            location: { index: currentIndex },
            text: tocEntry
          }
        });
        currentIndex += tocEntry.length;
      });

      // Add separator after TOC
      const separator = '\n' + '─'.repeat(80) + '\n\n';
      allRequests.push({
        insertText: {
          location: { index: currentIndex },
          text: separator
        }
      });
      currentIndex += separator.length;
    }

    // Convert parsed markdown to Google Docs requests
    const { requests: contentRequests, endIndex } = convertToGoogleDocsRequests(elements, currentIndex);
    allRequests.push(...contentRequests);

  } else if (format === 'plain') {
    // Plain text - just insert as-is
    allRequests.push({
      insertText: {
        location: { index: currentIndex },
        text: content
      }
    });

  } else if (format === 'rich') {
    // Rich text - preserve HTML formatting (future enhancement)
    // For now, fall back to plain text
    allRequests.push({
      insertText: {
        location: { index: currentIndex },
        text: content
      }
    });
  }

  // Execute all requests in a single batch update
  const updateResponse = await fetch(`${GOOGLE_DOCS_API}/${docId}:batchUpdate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: allRequests
    })
  });

  if (!updateResponse.ok) {
    const errorText = await updateResponse.text();
    throw new Error(`Failed to update document: ${updateResponse.statusText} - ${errorText}`);
  }
}

/**
 * Move document to folder
 */
async function moveToFolder(token, docId, folderId) {
  try {
    // First, get current parents
    const getResponse = await fetch(
      `${GOOGLE_DRIVE_API}/${docId}?fields=parents`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!getResponse.ok) {
      console.error('Failed to get document parents');
      return;
    }

    const data = await getResponse.json();
    const previousParents = data.parents ? data.parents.join(',') : '';

    // Update parent folder
    const updateUrl = `${GOOGLE_DRIVE_API}/${docId}?` + new URLSearchParams({
      addParents: folderId,
      removeParents: previousParents,
      fields: 'id, parents'
    });

    const updateResponse = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!updateResponse.ok) {
      console.error('Failed to move document to folder');
    }

  } catch (error) {
    console.error('Error moving document to folder:', error);
  }
}

/**
 * Set document properties for searchability
 */
async function setDocumentProperties(token, docId, metadata) {
  try {
    const properties = {};

    if (metadata.project) {
      properties.project = metadata.project;
    }

    if (metadata.tags && metadata.tags.length > 0) {
      properties.tags = metadata.tags.join(',');

      // Also set as keywords for better search
      properties.keywords = metadata.tags.join(' ');
    }

    // Update file properties
    const updateResponse = await fetch(`${GOOGLE_DRIVE_API}/${docId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: properties,
        description: metadata.notes || ''
      })
    });

    if (!updateResponse.ok) {
      console.error('Failed to set document properties');
    }

  } catch (error) {
    console.error('Error setting document properties:', error);
  }
}

/**
 * Main function to send content to Google Docs (Enhanced)
 */
async function sendToGoogleDocsEnhanced(content, metadata, source) {
  try {
    const token = await getAuthToken();
    const settings = await getSettings();

    // Use last used folder if no folder specified
    if (!metadata.folderId && settings.lastUsedFolder) {
      metadata.folderId = settings.lastUsedFolder;
    }

    // Create document with all metadata
    const result = await createDocumentWithMetadata(
      token,
      metadata.docName || 'AI Answer',
      content,
      metadata,
      source
    );

    return {
      success: true,
      ...result
    };

  } catch (error) {
    console.error('Error in sendToGoogleDocsEnhanced:', error);

    // Try to refresh token if auth error
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
 * Handle folder picker (opens Google Picker)
 */
async function browseFolders() {
  // Note: Google Picker API requires additional setup
  // For now, we'll return a prompt for the user to paste folder ID
  // In a full implementation, you'd use the Google Picker API

  return {
    success: false,
    error: 'Folder picker not yet implemented. Please select from dropdown or paste folder ID in settings.'
  };
}

/**
 * Message handler
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  // Enhanced save with metadata
  if (request.action === 'sendToGoogleDocsEnhanced') {
    sendToGoogleDocsEnhanced(
      request.data.content,
      request.data.metadata,
      request.data.source
    )
      .then(result => sendResponse(result))
      .catch(error => sendResponse({
        success: false,
        error: error.message
      }));
    return true;
  }

  // Get folders
  if (request.action === 'getFolders') {
    (async () => {
      try {
        const token = await getAuthToken();
        const folders = await getFolders(token);
        const settings = await getSettings();

        // Get favorite folders (recent/most used)
        const favoriteFolders = settings.favoriteFolders || [];

        sendResponse({
          success: true,
          folders: folders,
          favoriteFolders: favoriteFolders,
          lastUsedFolder: settings.lastUsedFolder
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: error.message,
          folders: []
        });
      }
    })();
    return true;
  }

  // Browse folders
  if (request.action === 'browseFolders') {
    browseFolders()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({
        success: false,
        error: error.message
      }));
    return true;
  }

  // Auth status
  if (request.action === 'getAuthStatus') {
    getAuthToken()
      .then(token => sendResponse({ authenticated: !!token }))
      .catch(() => sendResponse({ authenticated: false }));
    return true;
  }

  // Logout
  if (request.action === 'logout') {
    getAuthToken()
      .then(token => removeAuthToken(token))
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

console.log('✅ Send to Google Docs background service worker (Enhanced) loaded');
