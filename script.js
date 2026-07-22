/**
 * Four Directions Message Vault - Client-side Logic (Arabic Firebase Edition)
 * Complete upgrade containing Firestore credentials auth, Admin panel controls, real-time snapshot sync, and copy clipboard.
 */

// Import Firebase SDK Modules from Official CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDoc,
  deleteDoc, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  where,
  getDocs,
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
const usersCol = collection(db, "users");
const teamCol = collection(db, "team_members"); // New Team Members collection

// Subscription unsubscribers
let unsubscribeMessages = null;
let unsubscribeUsers = null;
let unsubscribeTeam = null;

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements - Login Section
  const loginForm = document.getElementById('login-form');
  const loginUsernameInput = document.getElementById('login-username');
  const loginPasswordInput = document.getElementById('login-password');

  // DOM Elements - Sidebar & Layout
  const navLinks = document.querySelectorAll('.nav-link');
  const viewSections = document.querySelectorAll('.view-section');
  const adminOnlyElements = document.querySelectorAll('.admin-only');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
  const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebar = document.getElementById('main-sidebar');

  // DOM Elements - Home Stats
  const statMessagesCount = document.getElementById('stat-messages-count');
  const statTeamCount = document.getElementById('stat-team-count');
  const homeStats = document.getElementById('home-stats');

  // DOM Elements - Messages Form Section
  const messageForm = document.getElementById('message-form');
  const titleInput = document.getElementById('message-title');
  const textInput = document.getElementById('message-text');
  const pinInput = document.getElementById('message-pin');
  const charCountEl = document.getElementById('char-count');
  
  // DOM Elements - Search Section
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  
  // DOM Elements - Filter Tabs
  const tabAll = document.getElementById('filter-all');
  const tabPinned = document.getElementById('filter-pinned');
  
  // DOM Elements - Feed Section
  const messagesGrid = document.getElementById('messages-grid');
  const emptyState = document.getElementById('empty-state');
  const messagesCountBadge = document.getElementById('messages-count');
  const toastContainer = document.getElementById('toast-container');

  // DOM Elements - Team Management Section
  const addTeamForm = document.getElementById('add-team-form');
  const teamMemberName = document.getElementById('team-member-name');
  const teamMemberRank = document.getElementById('team-member-rank');
  const teamMemberPhone = document.getElementById('team-member-phone');
  const teamMemberPaymentMethod = document.getElementById('team-member-payment-method');
  const teamMemberPaymentAccount = document.getElementById('team-member-payment-account');
  const teamTableBody = document.getElementById('team-table-body');
  const teamEmptyState = document.getElementById('team-empty-state');

  // DOM Elements - Admin Users Section
  const addUserForm = document.getElementById('add-user-form');
  const adminUsernameInput = document.getElementById('admin-username');
  const adminPasswordInput = document.getElementById('admin-password');
  const adminRoleSelect = document.getElementById('admin-role');

  // Application State
  let messages = [];
  let teamMembers = [];
  let currentFilter = 'all'; 
  let searchQuery = '';

  // 1. Initial boot: Create default admin user if users collection is empty
  await initializeDefaultAdmin();

  // 2. Check active login session from sessionStorage
  checkSession();

  // --- Session Management & RBAC ---

  function checkSession() {
    const savedUser = sessionStorage.getItem('fd_user');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        loginUserSession(userObj.username, userObj.role);
      } catch (e) {
        sessionStorage.removeItem('fd_user');
        showLoginScreen();
      }
    } else {
      showLoginScreen();
    }
  }

  function showLoginScreen() {
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('app-wrapper').style.display = 'none';
  }

  function loginUserSession(username, role) {
    sessionStorage.setItem('fd_user', JSON.stringify({ username, role }));

    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-wrapper').style.display = 'block';
    document.getElementById('user-display-name').textContent = username;
    
    // RBAC: Toggle Admin-only elements
    if (role === 'admin') {
      adminOnlyElements.forEach(el => el.style.display = '');
      setupUsersRealtimeListener();
      setupTeamRealtimeListener();
    } else {
      adminOnlyElements.forEach(el => el.style.display = 'none');
    }

    homeStats.style.display = 'flex';
    setupMessagesRealtimeListener();
    updateTextareaCounters();

    // Default route
    switchView('home-view');
  }

  // Open & Close Mobile Sidebar Functions
  function openMobileSidebar() {
    sidebar.classList.add('active');
    if (sidebarOverlay) sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileSidebar() {
    sidebar.classList.remove('active');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('data-target');
      switchView(targetId);
      
      // Close sidebar on mobile after clicking
      if (window.innerWidth <= 768) {
        closeMobileSidebar();
      }
    });
  });

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', openMobileSidebar);
  }

  if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', closeMobileSidebar);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeMobileSidebar);
  }

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      sidebarToggleBtn.classList.toggle('collapsed');
    });
  }

  function switchView(viewId) {
    // Update nav links active state
    navLinks.forEach(link => {
      if (link.getAttribute('data-target') === viewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update view visibility
    viewSections.forEach(section => {
      if (section.id === viewId) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });
  }

  // --- Real-time Listeners ---

  function setupMessagesRealtimeListener() {
    if (unsubscribeMessages) unsubscribeMessages();
    
    const q = query(messagesCol, orderBy("timestamp", "desc"));
    
    unsubscribeMessages = onSnapshot(q, (snapshot) => {
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
      
      // Update Home stat
      statMessagesCount.textContent = messages.length;
    }, (error) => {
      console.error("Messages Sync Error: ", error);
      showToast("فشل الاتصال بقاعدة بيانات الرسائل.", "danger");
    });
  }

  function setupUsersRealtimeListener() {
    if (unsubscribeUsers) unsubscribeUsers();
    
    const usersQ = query(usersCol, orderBy("username", "asc"));
    
    unsubscribeUsers = onSnapshot(usersQ, (snapshot) => {
      const tableBody = document.getElementById('users-table-body');
      tableBody.innerHTML = '';
      
      snapshot.forEach((docSnap) => {
        const u = docSnap.data();
        const id = docSnap.id;
        
        const row = document.createElement('tr');
        const roleLabel = u.role === 'admin' ? 'مسؤول النظام' : 'مستخدم عادي';
        const roleClass = u.role === 'admin' ? 'admin' : 'user';
        
        // Block delete action for primary admin account
        const isPrimaryAdmin = u.username === 'admin';
        const disabledAttr = isPrimaryAdmin ? 'disabled' : '';
        const titleAttr = isPrimaryAdmin ? 'لا يمكن حذف الحساب الرئيسي للمسؤول' : 'حذف هذا المستخدم';

        row.innerHTML = `
          <td><strong>${escapeHTML(u.username)}</strong></td>
          <td><span class="badge-role ${roleClass}">${roleLabel}</span></td>
          <td>
            <button 
              class="btn-action-sm" 
              onclick="deleteUser('${id}')" 
              ${disabledAttr} 
              title="${titleAttr}"
            >
              <i class="fa-solid fa-user-minus"></i>
              حذف
            </button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    }, (error) => {
      console.error("Users Sync Error: ", error);
    });
  }

  function formatWhatsAppNumber(phoneStr) {
    if (!phoneStr) return '';
    let cleaned = phoneStr.trim().replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }
    // Egyptian number logic: if starts with 01 (e.g. 01012345678), prepend country code 20 -> 201012345678
    if (/^01[0-2,5]\d{8}$/.test(cleaned)) {
      cleaned = '20' + cleaned.substring(1);
    } else if (cleaned.startsWith('0')) {
      cleaned = '20' + cleaned.substring(1);
    }
    return cleaned;
  }

  function setupTeamRealtimeListener() {
    if (unsubscribeTeam) unsubscribeTeam();

    const teamQ = query(teamCol, orderBy("createdAt", "desc"));

    unsubscribeTeam = onSnapshot(teamQ, (snapshot) => {
      teamTableBody.innerHTML = '';
      teamMembers = [];

      snapshot.forEach((docSnap) => {
        const t = docSnap.data();
        teamMembers.push({ id: docSnap.id, ...t });
        
        const row = document.createElement('tr');
        
        // Map rank to badge class
        let badgeClass = 'user';
        if (t.rank === 'Owner') badgeClass = 'owner';
        if (t.rank === 'Manager') badgeClass = 'manager';
        if (t.rank === 'Team Leader') badgeClass = 'teamleader';
        if (t.rank === 'Organizer') badgeClass = 'organizer';

        const rawPhone = t.phone || '-';
        const waFormatted = formatWhatsAppNumber(t.phone);
        const paymentMeth = t.paymentMethod || '-';
        const paymentAcc = t.paymentAccount || '-';

        const whatsappButton = waFormatted ? `
          <a 
            href="https://wa.me/${waFormatted}" 
            target="_blank" 
            rel="noopener noreferrer" 
            class="btn-whatsapp" 
            title="محادثة عبر الواتساب"
          >
            <i class="fa-brands fa-whatsapp"></i>
            واتساب
          </a>
        ` : '';

        row.innerHTML = `
          <td><strong>${escapeHTML(t.name)}</strong></td>
          <td style="font-family: monospace; letter-spacing: 1px;">${escapeHTML(t.code || '-')}</td>
          <td><span class="badge-role ${badgeClass}">${escapeHTML(t.rank || '-')}</span></td>
          <td dir="ltr" style="text-align: right;">${escapeHTML(rawPhone)}</td>
          <td><span class="badge-payment">${escapeHTML(paymentMeth)}</span></td>
          <td>${escapeHTML(paymentAcc)}</td>
          <td>
            <div class="table-actions">
              ${whatsappButton}
              <button 
                class="btn-action-sm" 
                onclick="deleteTeamMember('${docSnap.id}')" 
                title="إزالة العضو من الفريق"
              >
                <i class="fa-solid fa-user-xmark"></i>
                حذف
              </button>
            </div>
          </td>
        `;
        teamTableBody.appendChild(row);
      });

      if (teamMembers.length === 0) {
        teamEmptyState.style.display = 'flex';
        teamTableBody.parentElement.style.display = 'none';
      } else {
        teamEmptyState.style.display = 'none';
        teamTableBody.parentElement.style.display = 'table';
      }

      // Update Home stat
      statTeamCount.textContent = teamMembers.length;

    }, (error) => {
      console.error("Team Sync Error: ", error);
    });
  }

  // --- Auth Handlers ---

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginUsernameInput.value.trim();
    const password = loginPasswordInput.value.trim();

    if (!username || !password) {
      showToast("يرجى إدخال اسم المستخدم وكلمة المرور.", "danger");
      return;
    }

    try {
      const authQuery = query(
        usersCol, 
        where("username", "==", username), 
        where("password", "==", password)
      );
      
      const querySnapshot = await getDocs(authQuery);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0].data();
        loginUserSession(userDoc.username, userDoc.role);
        showToast(`أهلاً بك مجدداً، ${userDoc.username}!`, "success");
      } else {
        showToast("اسم المستخدم أو كلمة المرور غير صحيحة.", "danger");
      }
    } catch (err) {
      console.error("Login verification error:", err);
      showToast("حدث خطأ أثناء محاولة تسجيل الدخول.", "danger");
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    if (unsubscribeUsers) unsubscribeUsers();
    if (unsubscribeMessages) unsubscribeMessages();
    if (unsubscribeTeam) unsubscribeTeam();
    sessionStorage.removeItem('fd_user');
    window.location.reload(); 
  });

  // --- Admin User Operations ---

  addUserForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = adminUsernameInput.value.trim();
    const password = adminPasswordInput.value.trim();
    const role = adminRoleSelect.value;

    if (!username || !password) {
      showToast("يرجى ملء كافة البيانات لإنشاء المستخدم.", "danger");
      return;
    }

    try {
      const checkQuery = query(usersCol, where("username", "==", username));
      const checkSnapshot = await getDocs(checkQuery);
      
      if (!checkSnapshot.empty) {
        showToast("اسم المستخدم هذا مسجل بالفعل في النظام.", "danger");
        return;
      }

      await addDoc(usersCol, {
        username: username,
        password: password,
        role: role,
        createdAt: serverTimestamp()
      });

      showToast(`تمت إضافة المستخدم "${username}" بنجاح!`, "success");
      addUserForm.reset();
    } catch (err) {
      console.error("Error adding user:", err);
      showToast("فشل في إضافة المستخدم الجديد.", "danger");
    }
  });

  window.deleteUser = async function(id) {
    try {
      const docRef = doc(db, "users", id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        showToast("المستخدم غير موجود.", "danger");
        return;
      }

      const targetUsername = docSnap.data().username;

      if (targetUsername === 'admin') {
        showToast("لا يمكن حذف حساب المسؤول الرئيسي للموقع.", "danger");
        return;
      }

      if (confirm(`هل أنت متأكد من حذف حساب المستخدم "${targetUsername}"؟`)) {
        await deleteDoc(docRef);
        showToast(`تم حذف حساب المستخدم "${targetUsername}" بنجاح.`, "success");
      }
    } catch (err) {
      console.error("Error deleting user:", err);
      showToast("فشل في حذف المستخدم.", "danger");
    }
  };

  // --- Team Management Operations ---

  async function getNextTeamCode() {
    try {
      const snapshot = await getDocs(teamCol);
      let maxNum = 0;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.code) {
          const match = data.code.match(/4D-(\d+)/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        }
      });

      const nextNum = maxNum + 1;
      return `4D-${nextNum}`;
    } catch (err) {
      console.error("Error calculating sequential team code:", err);
      return `4D-1`;
    }
  }

  addTeamForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = teamMemberName.value.trim();
    const rank = teamMemberRank.value;
    const phone = teamMemberPhone.value.trim();
    const paymentMethod = teamMemberPaymentMethod.value;
    const paymentAccount = teamMemberPaymentAccount.value.trim();

    if (!name || !rank || !phone || !paymentMethod || !paymentAccount) {
      showToast("يرجى ملء جميع البيانات المطلوبة لعضو الفريق.", "danger");
      return;
    }

    // Auto-generate sequential code: 4D-1, 4D-2, etc.
    const generatedCode = await getNextTeamCode();

    try {
      await addDoc(teamCol, {
        name: name,
        rank: rank,
        phone: phone,
        paymentMethod: paymentMethod,
        paymentAccount: paymentAccount,
        code: generatedCode,
        createdAt: serverTimestamp()
      });

      showToast(`تم إضافة العضو "${name}" بنجاح بالكود ${generatedCode}`, "success");
      addTeamForm.reset();
    } catch (err) {
      console.error("Error adding team member:", err);
      showToast("فشل في إضافة عضو الفريق.", "danger");
    }
  });

  window.deleteTeamMember = async function(id) {
    if (confirm(`هل أنت متأكد من إزالة هذا العضو من الفريق؟`)) {
      try {
        await deleteDoc(doc(db, "team_members", id));
        showToast(`تم حذف العضو من الفريق.`, "success");
      } catch (err) {
        console.error("Error deleting team member:", err);
        showToast("فشل في حذف العضو.", "danger");
      }
    }
  };


  // --- Message operations ---

  messageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = titleInput.value.trim();
    const content = textInput.value; 
    const pinned = pinInput.checked;

    if (!title || !content.trim()) {
      showToast('يرجى ملء عنوان الرسالة ومحتواها لحفظها.', 'danger');
      return;
    }

    await addMessage(title, content, pinned);
    
    messageForm.reset();
    updateTextareaCounters();
  });

  textInput.addEventListener('input', updateTextareaCounters);

  searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim().toLowerCase();
    
    if (searchInput.value.length > 0) {
      clearSearchBtn.style.display = 'block';
    } else {
      clearSearchBtn.style.display = 'none';
    }
    
    renderMessages();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearSearchBtn.style.display = 'none';
    searchInput.focus();
    renderMessages();
  });

  tabAll.addEventListener('click', () => {
    setActiveTab(tabAll, 'all');
  });

  tabPinned.addEventListener('click', () => {
    setActiveTab(tabPinned, 'pinned');
  });

  function setActiveTab(activeTabEl, filterType) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    activeTabEl.classList.add('active');
    currentFilter = filterType;
    renderMessages();
  }

  function updateTextareaCounters() {
    const text = textInput.value;
    const charCount = text.length;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    charCountEl.textContent = `${charCount} حرف | ${wordCount} كلمة`;
  }

  async function initializeDefaultAdmin() {
    try {
      const snapshot = await getDocs(usersCol);
      if (snapshot.empty) {
        await addDoc(usersCol, {
          username: "admin",
          password: "admin123",
          role: "admin",
          createdAt: serverTimestamp()
        });
        console.log("Default admin account created in Firestore: admin / admin123");
      }
    } catch (err) {
      console.error("Initialization check error:", err);
    }
  }

  async function addMessage(title, content, pinned) {
    try {
      await addDoc(messagesCol, {
        title: title,
        content: content,
        pinned: pinned,
        timestamp: serverTimestamp()
      });
      showToast('تم حفظ الرسالة بنجاح في المخزن!', 'success');
    } catch (err) {
      console.error("Error adding message:", err);
      showToast('فشل في حفظ الرسالة في قاعدة البيانات.', 'danger');
    }
  }

  window.deleteMessage = function(id) {
    const message = messages.find(m => m.id === id);
    if (!message) return;

    const messageTitle = message.title;
    
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
        showToast(`تم حذف الرسالة "${messageTitle}" بنجاح.`, 'danger');
      } catch (err) {
        console.error("Error deleting message:", err);
        showToast('فشل في حذف الرسالة من قاعدة البيانات.', 'danger');
        if (cardEl) {
          cardEl.style.opacity = '1';
          cardEl.style.transform = 'none';
        }
      }
    }, 300);
  };

  window.togglePin = async function(id) {
    const message = messages.find(m => m.id === id);
    if (!message) return;

    const newPinnedState = !message.pinned;
    try {
      const docRef = doc(db, "messages", id);
      await updateDoc(docRef, { pinned: newPinnedState });
      
      const statusText = newPinnedState ? 'تم تثبيتها في الأعلى' : 'تم إلغاء التثبيت';
      showToast(`"${message.title}" ${statusText}.`, 'info');
    } catch (err) {
      console.error("Error updating pin state:", err);
      showToast('فشل في تعديل حالة تثبيت الرسالة.', 'danger');
    }
  };

  window.copyMessageText = async function(id, buttonEl) {
    const message = messages.find(m => m.id === id);
    if (!message) return;

    try {
      await navigator.clipboard.writeText(message.content);
      applyCopyFeedback(buttonEl, message.title);
    } catch (err) {
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
          showToast('تعذر نسخ محتوى الرسالة.', 'danger');
        }
      } catch (fallbackErr) {
        showToast('تعذر النسخ. يرجى التحديد والنسخ يدوياً.', 'danger');
      }
      document.body.removeChild(textarea);
    }
  };

  function applyCopyFeedback(buttonEl, title) {
    const originalHTML = buttonEl.innerHTML;
    buttonEl.classList.add('copied');
    buttonEl.innerHTML = `<i class="fa-solid fa-check"></i> تم النسخ!`;
    
    showToast(`تم نسخ "${title}" بالكامل!`, 'success');
    
    setTimeout(() => {
      buttonEl.classList.remove('copied');
      buttonEl.innerHTML = originalHTML;
    }, 1500);
  }

  function renderMessages() {
    let filtered = messages.filter(msg => {
      if (currentFilter === 'pinned' && !msg.pinned) {
        return false;
      }
      
      if (searchQuery) {
        const titleMatch = msg.title.toLowerCase().includes(searchQuery);
        const contentMatch = msg.content.toLowerCase().includes(searchQuery);
        return titleMatch || contentMatch;
      }

      return true;
    });

    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const existingCards = messagesGrid.querySelectorAll('.message-card');
    existingCards.forEach(card => card.remove());

    messagesCountBadge.textContent = filtered.length;

    if (filtered.length === 0) {
      emptyState.style.display = 'flex';
      
      if (searchQuery) {
        emptyState.querySelector('.empty-title').textContent = 'لا توجد رسائل مطابقة';
        emptyState.querySelector('.empty-desc').textContent = `لا توجد رسائل تطابق البحث عن "${searchQuery}". حاول مجدداً بكلمة أخرى.`;
        emptyState.querySelector('.empty-icon').innerHTML = '<i class="fa-solid fa-magnifying-glass-minus"></i>';
      } else if (currentFilter === 'pinned') {
        emptyState.querySelector('.empty-title').textContent = 'لا توجد رسائل مثبتة';
        emptyState.querySelector('.empty-desc').textContent = 'لم تقم بتثبيت أي رسالة بعد. اضغط على رمز التثبيت على أي بطاقة لتثبيتها في الأعلى.';
        emptyState.querySelector('.empty-icon').innerHTML = '<i class="fa-solid fa-thumbtack"></i>';
      } else {
        emptyState.querySelector('.empty-title').textContent = 'المخزن فارغ حالياً';
        emptyState.querySelector('.empty-desc').textContent = 'أنشئ قالب رسالة واتساب الأول من اللوحة الجانبية لملء المخزن.';
        emptyState.querySelector('.empty-icon').innerHTML = '<i class="fa-solid fa-box-open"></i>';
      }
    } else {
      emptyState.style.display = 'none';

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
                title="${msg.pinned ? 'إلغاء التثبيت' : 'تثبيت الرسالة'}"
              >
                <i class="fa-solid fa-thumbtack"></i>
              </button>
              <button 
                class="action-btn delete-btn" 
                onclick="deleteMessage('${msg.id}')" 
                title="حذف الرسالة"
              >
                <i class="fa-solid fa-trash-can"></i>
              </button>
            </div>
          </div>
          
          <div class="card-content">${escapedContent}</div>
          
          <div class="card-footer">
            <button class="btn-copy" onclick="copyMessageText('${msg.id}', this)" title="نسخ محتوى الرسالة">
              <i class="fa-regular fa-clone"></i> نسخ الرسالة
            </button>
          </div>
        `;
        
        messagesGrid.appendChild(card);
      });
    }
  }

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

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
      <button class="toast-close" title="إغلاق التنبيه">&times;</button>
    `;

    toastContainer.appendChild(toast);

    const timeoutId = setTimeout(() => {
      removeToast(toast);
    }, 3000);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(timeoutId);
      removeToast(toast);
    });
  }

  function removeToast(toastEl) {
    toastEl.style.opacity = '0';
    const width = window.innerWidth;
    if (width >= 600) {
      toastEl.style.transform = 'translateX(100%)';
    } else {
      toastEl.style.transform = 'translateX(-100%)';
    }
    setTimeout(() => {
      if (toastEl.parentNode === toastContainer) {
        toastContainer.removeChild(toastEl);
      }
    }, 300);
  }
});
