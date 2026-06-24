/**
 * Four Directions Message Vault - Client-side Logic (Firebase Edition)
 * Static Single Page Application with Firebase Firestore, real-time sync, and Copy features.
 */

// Import Firebase SDK Modules from Official CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// User's Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzUjdkykFEM-FqGUTPL_cr7AtZWx0qzaA",
  authDomain: "four-directions-vault.firebaseapp.com",
  projectId: "four-directions-vault",
  storageBucket: "four-directions-vault.firebasestorage.app",
  messagingSenderId: "974280419828",
  appId: "1:974280419828:web:6e883ffd03bc7c722db1a1"
};

// Initialize Firebase App & Firestore Database
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messagesCol = collection(db, "messages");

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const messageForm = document.getElementById('message-form');
  const titleInput = document.getElementById('message-title');
  const textInput = document.getElementById('message-text');
  const pinInput = document.getElementById('message-pin');
  
  const charCountEl = document.getElementById('char-count');
  
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  
  const tabAll = document.getElementById('filter-all');
  const tabPinned = document.getElementById('filter-pinned');
  
  const messagesGrid = document.getElementById('messages-grid');
  const emptyState = document.getElementById('empty-state');
  const messagesCountBadge = document.getElementById('messages-count');
  const toastContainer = document.getElementById('toast-container');

  // Application State
  let messages = [];
  let currentFilter = 'all'; // 'all' or 'pinned'
  let searchQuery = '';

  // Initialize UI counters
  updateTextareaCounters();

  // --- Real-time Firebase Sync ---
  // Query messages ordered by timestamp descending
  const q = query(messagesCol, orderBy("timestamp", "desc"));
  
  // Attach Firestore Listener
  onSnapshot(q, (snapshot) => {
    messages = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      messages.push({
        id: docSnap.id,
        title: data.title || '',
        content: data.content || '',
        pinned: data.pinned || false,
        createdAt: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString()
      });
    });
    renderMessages();
  }, (error) => {
    console.error("Firestore Subscription Error: ", error);
    showToast("Failed to connect to vault database.", "danger");
  });

  // --- Event Listeners ---

  // Form submit handler
  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = titleInput.value.trim();
    const content = textInput.value; // Keep spaces, lines, emojis intact
    const pinned = pinInput.checked;

    if (!title || !content.trim()) {
      showToast('Please fill in both the title and the message.', 'danger');
      return;
    }

    // Add Message to Firebase
    await addMessage(title, content, pinned);
    
    // Reset Form
    messageForm.reset();
    updateTextareaCounters();
  });

  // Real-time Textarea counter
  textInput.addEventListener('input', updateTextareaCounters);

  // Real-time Search input
  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    
    // Toggle clear search button visibility
    if (searchInput.value.length > 0) {
      clearSearchBtn.style.display = 'block';
    } else {
      clearSearchBtn.style.display = 'none';
    }
    
    renderMessages();
  });

  // Clear Search button handler
  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    searchInput.focus();
    renderMessages();
  });

  // Filter Tabs
  tabAll.addEventListener('click', () => {
    setActiveTab(tabAll, 'all');
  });

  tabPinned.addEventListener('click', () => {
    setActiveTab(tabPinned, 'pinned');
  });

  // --- Helper Functions ---

  /**
   * Set active tab filter
   */
  function setActiveTab(activeTabEl, filterType) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    activeTabEl.classList.add('active');
    currentFilter = filterType;
    renderMessages();
  }

  /**
   * Update character and word counts for textarea
   */
  function updateTextareaCounters() {
    const text = textInput.value;
    const charCount = text.length;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    charCountEl.textContent = `${charCount} character${charCount !== 1 ? 's' : ''} | ${wordCount} word${wordCount !== 1 ? 's' : ''}`;
  }

  /**
   * Add new message to Firestore database
   */
  async function addMessage(title, content, pinned) {
    try {
      await addDoc(messagesCol, {
        title: title,
        content: content,
        pinned: pinned,
        timestamp: serverTimestamp()
      });
      showToast('Message saved successfully to Firebase!', 'success');
    } catch (err) {
      console.error("Error adding message:", err);
      showToast('Failed to save message to database.', 'danger');
    }
  }

  /**
   * Delete message from Firestore database by ID
   */
  window.deleteMessage = function(id) {
    const message = messages.find(m => m.id === id);
    if (!message) return;

    const messageTitle = message.title;
    
    // Add visual fade-out in DOM before executing deletion
    const cardEl = document.querySelector(`.message-card[data-id="${id}"]`);
    if (cardEl) {
      cardEl.style.opacity = '0';
      cardEl.style.transform = 'scale(0.9) translateY(10px)';
      cardEl.style.transition = 'all 0.3s ease-out';
    }

    setTimeout(async () => {
      try {
        const docRef = doc(db, "messages", id);
        await deleteDoc(docRef);
        showToast(`"${messageTitle}" deleted.`, 'danger');
      } catch (err) {
        console.error("Error deleting message:", err);
        showToast('Failed to delete message from database.', 'danger');
        // Restore opacity if failed
        if (cardEl) {
          cardEl.style.opacity = '1';
          cardEl.style.transform = 'none';
        }
      }
    }, 300);
  };

  /**
   * Toggle pin state of a message in Firestore
   */
  window.togglePin = async function(id) {
    const message = messages.find(m => m.id === id);
    if (!message) return;

    const newPinnedState = !message.pinned;
    try {
      const docRef = doc(db, "messages", id);
      await updateDoc(docRef, { pinned: newPinnedState });
      
      const statusText = newPinnedState ? 'pinned to top' : 'unpinned';
      showToast(`"${message.title}" ${statusText}.`, 'info');
    } catch (err) {
      console.error("Error updating pin state:", err);
      showToast('Failed to update pin state in database.', 'danger');
    }
  };

  /**
   * Copy message content to clipboard with fallback
   */
  window.copyMessageText = async function(id, buttonEl) {
    const message = messages.find(m => m.id === id);
    if (!message) return;

    try {
      // Modern Clipboard API
      await navigator.clipboard.writeText(message.content);
      applyCopyFeedback(buttonEl, message.title);
    } catch (err) {
      // Fallback method for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = message.content;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        const success = document.execCommand('copy');
        if (success) {
          applyCopyFeedback(buttonEl, message.title);
        } else {
          showToast('Unable to copy message text.', 'danger');
        }
      } catch (fallbackErr) {
        showToast('Unable to copy. Please manually highlight and copy.', 'danger');
      }
      document.body.removeChild(textarea);
    }
  };

  /**
   * Apply copy button UI changes temporarily
   */
  function applyCopyFeedback(buttonEl, title) {
    const originalHTML = buttonEl.innerHTML;
    buttonEl.classList.add('copied');
    buttonEl.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
    
    showToast(`"${title}" copied exactly!`, 'success');
    
    setTimeout(() => {
      buttonEl.classList.remove('copied');
      buttonEl.innerHTML = originalHTML;
    }, 1500);
  }

  /**
   * Render message cards to the dashboard grid
   */
  function renderMessages() {
    // 1. Filter Messages
    let filtered = messages.filter(msg => {
      // Match tabs
      if (currentFilter === 'pinned' && !msg.pinned) {
        return false;
      }
      
      // Match search query
      if (searchQuery) {
        const titleMatch = msg.title.toLowerCase().includes(searchQuery);
        const contentMatch = msg.content.toLowerCase().includes(searchQuery);
        return titleMatch || contentMatch;
      }

      return true;
    });

    // 2. Sort Messages: Pinned first, then newest first
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // 3. Clear Grid but keep original empty state placeholder
    const existingCards = messagesGrid.querySelectorAll('.message-card');
    existingCards.forEach(card => card.remove());

    // Update count badge
    messagesCountBadge.textContent = filtered.length;

    // 4. Check if empty
    if (filtered.length === 0) {
      emptyState.style.display = 'flex';
      
      // Customize empty state message if searching
      if (searchQuery) {
        emptyState.querySelector('.empty-title').textContent = 'No matching messages';
        emptyState.querySelector('.empty-desc').textContent = `No messages match the query "${searchQuery}". Try editing your search query.`;
        emptyState.querySelector('.empty-icon').innerHTML = '<i class="fa-solid fa-magnifying-glass-minus"></i>';
      } else if (currentFilter === 'pinned') {
        emptyState.querySelector('.empty-title').textContent = 'No pinned messages';
        emptyState.querySelector('.empty-desc').textContent = 'You haven\'t pinned any messages yet. Click the pin icon on a card to pin it.';
        emptyState.querySelector('.empty-icon').innerHTML = '<i class="fa-solid fa-thumbtack"></i>';
      } else {
        emptyState.querySelector('.empty-title').textContent = 'Your vault is empty';
        emptyState.querySelector('.empty-desc').textContent = 'Create your first WhatsApp message template on the left panel to populate your vault.';
        emptyState.querySelector('.empty-icon').innerHTML = '<i class="fa-solid fa-box-open"></i>';
      }
    } else {
      emptyState.style.display = 'none';

      // 5. Inject cards
      filtered.forEach(msg => {
        const card = document.createElement('article');
        card.className = `message-card ${msg.pinned ? 'pinned' : ''}`;
        card.setAttribute('data-id', msg.id);
        
        const escapedTitle = escapeHTML(msg.title);
        const escapedContent = escapeHTML(msg.content);

        card.innerHTML = `
          <div class="card-header">
            <h3 class="card-title" title="${escapedTitle}">${escapedTitle}</h3>
            <div class="card-actions">
              <button 
                class="action-btn pin-btn ${msg.pinned ? 'is-pinned' : ''}" 
                onclick="togglePin('${msg.id}')" 
                title="${msg.pinned ? 'Unpin message' : 'Pin message'}"
              >
                <i class="fa-solid fa-thumbtack"></i>
              </button>
              <button 
                class="action-btn delete-btn" 
                onclick="deleteMessage('${msg.id}')" 
                title="Delete message"
              >
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
          
          <div class="card-content">${escapedContent}</div>
          
          <div class="card-footer">
            <button class="btn-copy" onclick="copyMessageText('${msg.id}', this)" title="Copy exact formatted content">
              <i class="fa-regular fa-clone"></i> Copy Message
            </button>
          </div>
        `;
        
        messagesGrid.appendChild(card);
      });
    }
  }

  /**
   * Helper to escape HTML characters for XSS prevention
   */
  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Display premium toast notification
   */
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '<i class="fa-solid fa-circle-info"></i>';
    if (type === 'success') {
      icon = '<i class="fa-solid fa-circle-check"></i>';
    } else if (type === 'danger') {
      icon = '<i class="fa-solid fa-circle-exclamation"></i>';
    }

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" title="Close Notification">&times;</button>
    `;

    toastContainer.appendChild(toast);

    // Auto-remove toast after 3 seconds
    const timeoutId = setTimeout(() => {
      removeToast(toast);
    }, 3000);

    // Close button click handler
    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(timeoutId);
      removeToast(toast);
    });
  }

  /**
   * Transition toast out and remove from DOM
   */
  function removeToast(toastEl) {
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toastEl.parentNode === toastContainer) {
        toastContainer.removeChild(toastEl);
      }
    }, 300);
  }
});
