/**
 * Four Directions Message Vault & Events Management - Client-side Logic (Arabic Firestore Edition)
 * Firestore Credentials Auth, Role-Based Access Control (RBAC), Events Management,
 * Smart Pricing, Monthly Settlements Dashboard, and Arabic RTL PDF Statement Generator.
 */

// Import Firebase SDK Modules from Official CDN
// دوال مساعدة لضمان عدم توقف الكود
window.escapeHTML = function (str) {
  if (!str) return '';
  return String(str).replace(/[&<>'"]/g, match => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return escapeMap[match];
  });
};

window.showToast = function (message, type = "success") {
  // إشعار مؤقت عشان الكود يكمل وميضربش
  console.log("إشعار:", message);
  // لو حابب تشوف الإشعارات بعينك ممكن تفعل السطر اللي تحت
  // alert(message); 
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDoc,
  deleteDoc,
  doc,
  setDoc,
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

// Firestore Collections
const messagesCol = collection(db, "messages");
const usersCol = collection(db, "users");
const teamCol = collection(db, "team_members");
const eventsCol = collection(db, "events");
const settlementsCol = collection(db, "settlements");

// Subscription unsubscribers for real-time listeners
let unsubscribeMessages = null;
let unsubscribeUsers = null;
let unsubscribeTeam = null;
let unsubscribeEvents = null;
let unsubscribeSettlements = null;

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements - Login Section
  const loginForm = document.getElementById('login-form');
  const loginUsernameInput = document.getElementById('login-username');
  const loginPasswordInput = document.getElementById('login-password');
  const loginBtn = document.getElementById('login-btn');

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
  const statEventsCount = document.getElementById('stat-events-count');
  const statPendingSettlements = document.getElementById('stat-pending-settlements');
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

  // DOM Elements - Events Management Section
  const addEventForm = document.getElementById('add-event-form');
  const eventNameInput = document.getElementById('event-name');
  const eventDateInput = document.getElementById('event-date');
  const eventManagerRateInput = document.getElementById('event-manager-rate');
  const eventTeamLeaderRateInput = document.getElementById('event-teamleader-rate');
  const eventOrganizerRateInput = document.getElementById('event-organizer-rate');
  const eventsTableBody = document.getElementById('events-table-body');
  const eventsEmptyState = document.getElementById('events-empty-state');
  const eventsCountBadge = document.getElementById('events-count-badge');

  // DOM Elements - Event Attendees Modal
  const eventAttendeesModal = document.getElementById('event-attendees-modal');
  const modalEventTitle = document.getElementById('modal-event-title');
  const modalEventMeta = document.getElementById('modal-event-meta');
  const modalRatesBanner = document.getElementById('modal-rates-banner');
  const closeAttendeesModalBtn = document.getElementById('close-attendees-modal-btn');
  const addAttendeeForm = document.getElementById('add-attendee-form');
  const attendeeSelect = document.getElementById('attendee-select');
  const attendeeBaseRate = document.getElementById('attendee-base-rate');
  const attendeeBonus = document.getElementById('attendee-bonus');
  const attendeeDeductions = document.getElementById('attendee-deductions');
  const addExtraTaskBtn = document.getElementById('add-extra-task-btn');
  const extraTasksContainer = document.getElementById('extra-tasks-container');
  const attendeeLiveNet = document.getElementById('attendee-live-net');
  const modalAttendeesTableBody = document.getElementById('modal-attendees-table-body');
  const modalAttendeesCount = document.getElementById('modal-attendees-count');
  const modalAttendeesEmpty = document.getElementById('modal-attendees-empty');

  // DOM Elements - Settlements Dashboard
  const settlementMonthSelect = document.getElementById('settlement-month-select');
  const currentMonthBtn = document.getElementById('current-month-btn');
  const settlementMonthLabel = document.getElementById('settlement-month-label');
  const settlementsTableBody = document.getElementById('settlements-table-body');
  const settlementsEmptyState = document.getElementById('settlements-empty-state');
  const settlementStatEvents = document.getElementById('settlement-stat-events');
  const settlementStatMembers = document.getElementById('settlement-stat-members');
  const settlementStatTotal = document.getElementById('settlement-stat-total');
  const settlementStatPaid = document.getElementById('settlement-stat-paid');

  // DOM Elements - Member Monthly Breakdown Modal
  const memberBreakdownModal = document.getElementById('member-breakdown-modal');
  const breakdownMemberTitle = document.getElementById('breakdown-member-title');
  const breakdownMonthMeta = document.getElementById('breakdown-month-meta');
  const breakdownMemberInfo = document.getElementById('breakdown-member-info');
  const breakdownEventsTableBody = document.getElementById('breakdown-events-table-body');
  const breakdownSummaryBox = document.getElementById('breakdown-summary-box');
  const closeBreakdownModalBtn = document.getElementById('close-breakdown-modal-btn');

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
  let eventsList = [];
  let settlementsMap = {};
  let currentFilter = 'all';
  let searchQuery = '';
  let activeEventId = null;

  // Helper: Format Current Month (YYYY-MM)
  function getSystemCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Set default date for new event to today & settlement month to current month
  if (eventDateInput) {
    const today = new Date().toISOString().split('T')[0];
    eventDateInput.value = today;
  }
  if (settlementMonthSelect) {
    settlementMonthSelect.value = getSystemCurrentMonth();
  }

  // 1. Initial boot: Ensure default admin account exists in Firestore
  // 2. Check active login session from sessionStorage/localStorage
  checkSession();

  // --- Session Management & RBAC ---

  function checkSession() {
    const savedUser = sessionStorage.getItem('fd_user') || localStorage.getItem('fd_user');
    if (savedUser) {
      try {
        const userObj = JSON.parse(savedUser);
        if (userObj && userObj.username && userObj.role) {
          loginUserSession(userObj.username, userObj.role);
          return;
        }
      } catch (e) {
        sessionStorage.removeItem('fd_user');
        localStorage.removeItem('fd_user');
      }
    }
    showLoginScreen();
  }

  function showLoginScreen() {
    document.getElementById('login-container').style.display = 'flex';
    document.getElementById('app-wrapper').style.display = 'none';
  }

  function loginUserSession(username, role) {
    // Persist session in sessionStorage and localStorage
    const sessionData = JSON.stringify({ username, role });
    sessionStorage.setItem('fd_user', sessionData);
    localStorage.setItem('fd_user', sessionData);

    document.getElementById('login-container').style.display = 'none';
    document.getElementById('app-wrapper').style.display = 'block';

    const userDisplayName = document.getElementById('user-display-name');
    if (userDisplayName) {
      userDisplayName.textContent = username;
    }

    // Inject dynamic hero greeting
    const heroGreeting = document.getElementById('hero-greeting');
    if (heroGreeting) {
      heroGreeting.innerHTML = `أهلاً يا <span class="brand-accent">${escapeHTML(username)}</span> 👋`;
    }

    // RBAC: Toggle Admin-only elements
    if (role === 'admin') {
      adminOnlyElements.forEach(el => el.style.display = '');
      setupUsersRealtimeListener();
    } else {
      adminOnlyElements.forEach(el => el.style.display = 'none');
    }

    if (homeStats) homeStats.style.display = 'flex';
    setupTeamRealtimeListener();
    setupEventsRealtimeListener();
    setupSettlementsRealtimeListener();
    setupMessagesRealtimeListener();
    updateTextareaCounters();

    // Redirect to main dashboard
    switchView('home-view');
  }

  // --- 1. Robust Firestore Login Execution (Firebase v9 Modular Syntax, Click & Submit Safe) ---

  async function performLogin() {
    const userField = loginUsernameInput || document.getElementById('username') || document.getElementById('login-username');
    const passField = loginPasswordInput || document.getElementById('password') || document.getElementById('login-password');
    const btn = loginBtn || document.getElementById('loginBtn') || document.getElementById('login-btn');

    const enteredUser = userField ? userField.value.trim() : '';
    const enteredPass = passField ? passField.value.trim() : '';

    if (!enteredUser || !enteredPass) {
      showToast("يرجى إدخال اسم المستخدم وكلمة المرور.", "danger");
      return;
    }

    // UI Loading Feedback
    const originalBtnHTML = btn ? btn.innerHTML : 'تسجيل الدخول';
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق...';
    }

    try {
      // Query Firestore 'users' collection using Firebase v9 Modular Syntax
      const q = query(
        collection(db, "users"),
        where("username", "==", enteredUser),
        where("password", "==", enteredPass)
      );

      const querySnapshot = await getDocs(q);

      // Success State: User document found
      if (!querySnapshot.empty) {
        let userRole = 'user';
        let userName = enteredUser;

        querySnapshot.forEach((docSnap) => {
          const userData = docSnap.data();
          userRole = userData.role || 'user';
          userName = userData.username || enteredUser;
        });

        // Save credentials and role to localStorage for RBAC
        localStorage.setItem('role', userRole);
        localStorage.setItem('username', userName);
        localStorage.setItem('fd_user', JSON.stringify({ username: userName, role: userRole }));
        sessionStorage.setItem('fd_user', JSON.stringify({ username: userName, role: userRole }));

        // Switch to main dashboard and initialize session views
        loginUserSession(userName, userRole);
        showToast(`أهلاً بك مجدداً، ${userName}!`, "success");
        if (userField) userField.value = '';
        if (passField) passField.value = '';
      } else {
        // Error State: No matching user found (Arabic UI Alert)
        console.error("Firestore Login Error: auth/invalid-credentials", "اسم المستخدم أو كلمة المرور غير صحيحة.");
        showToast("اسم المستخدم أو كلمة المرور غير صحيحة", "danger");
      }
    } catch (error) {
      console.error("Firestore Login Error:", error.code || "unknown-code", error.message || error);
      showToast("حدث خطأ في الاتصال، يرجى المحاولة لاحقاً", "danger");
    } finally {
      // Restore login button state
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnHTML;
      }
    }
  }

  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      performLogin();
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      performLogin();
    });
  }

  if (loginPasswordInput) {
    loginPasswordInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performLogin();
      }
    });
  }

  // Logout Handler
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeTeam) unsubscribeTeam();
      if (unsubscribeEvents) unsubscribeEvents();
      if (unsubscribeSettlements) unsubscribeSettlements();
      sessionStorage.removeItem('fd_user');
      localStorage.removeItem('fd_user');
      window.location.reload();
    });
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

    if (viewId === 'settlements-view') {
      renderMonthlySettlements();
    }
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
      if (statMessagesCount) statMessagesCount.textContent = messages.length;
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
      if (!tableBody) return;
      tableBody.innerHTML = '';

      snapshot.forEach((docSnap) => {
        const u = docSnap.data();
        const id = docSnap.id;

        const row = document.createElement('tr');
        const roleLabel = u.role === 'admin' ? 'مسؤول النظام' : 'مستخدم عادي';
        const roleClass = u.role === 'admin' ? 'admin' : 'user';

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
      if (teamTableBody) teamTableBody.innerHTML = '';
      teamMembers = [];

      snapshot.forEach((docSnap) => {
        const t = docSnap.data();
        teamMembers.push({ id: docSnap.id, ...t });

        if (teamTableBody) {
          const row = document.createElement('tr');

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
        }
      });

      if (teamEmptyState && teamTableBody) {
        if (teamMembers.length === 0) {
          teamEmptyState.style.display = 'flex';
          teamTableBody.parentElement.style.display = 'none';
        } else {
          teamEmptyState.style.display = 'none';
          teamTableBody.parentElement.style.display = 'table';
        }
      }

      if (statTeamCount) {
        statTeamCount.textContent = teamMembers.length;
      }

      populateAttendeeDropdown();
      renderMonthlySettlements();

    }, (error) => {
      console.error("Team Sync Error: ", error);
    });
  }

  // --- Events Module Real-time Listener ---

  function setupEventsRealtimeListener() {
    if (unsubscribeEvents) unsubscribeEvents();

    const eventsQ = query(eventsCol, orderBy("date", "desc"));

    unsubscribeEvents = onSnapshot(eventsQ, (snapshot) => {
      eventsList = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        eventsList.push({
          id: docSnap.id,
          name: data.name || '',
          date: data.date || '',
          rates: data.rates || { managerRate: 0, teamLeaderRate: 0, organizerRate: 0 },
          attendees: data.attendees || [],
          createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : new Date().toISOString()
        });
      });

      renderEventsTable();
      renderMonthlySettlements();

      if (statEventsCount) {
        statEventsCount.textContent = eventsList.length;
      }

      if (activeEventId) {
        const activeEvt = eventsList.find(e => e.id === activeEventId);
        if (activeEvt) {
          renderModalAttendeesList(activeEvt);
        }
      }
    }, (error) => {
      console.error("Events Sync Error: ", error);
      showToast("فشل الاتصال بقاعدة بيانات الفعاليات.", "danger");
    });
  }

  function setupSettlementsRealtimeListener() {
    if (unsubscribeSettlements) unsubscribeSettlements();

    unsubscribeSettlements = onSnapshot(settlementsCol, (snapshot) => {
      settlementsMap = {};
      snapshot.forEach((docSnap) => {
        settlementsMap[docSnap.id] = docSnap.data();
      });
      renderMonthlySettlements();
    }, (error) => {
      console.error("Settlements Sync Error: ", error);
    });
  }

  // --- Render Events List ---

  function renderEventsTable() {
    if (!eventsTableBody) return;
    eventsTableBody.innerHTML = '';

    if (eventsList.length === 0) {
      if (eventsEmptyState) eventsEmptyState.style.display = 'flex';
      eventsTableBody.parentElement.style.display = 'none';
      if (eventsCountBadge) eventsCountBadge.textContent = '0';
      return;
    }

    if (eventsEmptyState) eventsEmptyState.style.display = 'none';
    eventsTableBody.parentElement.style.display = 'table';
    if (eventsCountBadge) eventsCountBadge.textContent = eventsList.length;

    eventsList.forEach(event => {
      const row = document.createElement('tr');
      const attendeesCount = (event.attendees || []).length;
      const rates = event.rates || {};

      row.innerHTML = `
        <td><strong>${escapeHTML(event.name)}</strong></td>
        <td><i class="fa-regular fa-calendar" style="margin-left: 6px; color: var(--accent-mustard);"></i>${escapeHTML(event.date)}</td>
        <td>
          <div style="font-size: 12px; display: flex; flex-direction: column; gap: 2px;">
            <span>مانجر: <strong style="color: var(--accent-mustard);">${rates.managerRate || 0}</strong> ج.م</span>
            <span>تيم ليدر: <strong style="color: var(--accent-mustard);">${rates.teamLeaderRate || 0}</strong> ج.م</span>
            <span>أورجانيزر: <strong style="color: var(--accent-mustard);">${rates.organizerRate || 0}</strong> ج.م</span>
          </div>
        </td>
        <td>
          <span class="badge-role user" style="font-size: 13px;">
            <i class="fa-solid fa-users" style="margin-left: 4px;"></i>
            ${attendeesCount} عضو
          </span>
        </td>
        <td>
          <div class="table-actions">
            <button 
              class="btn-action-view" 
              onclick="openEventAttendeesModal('${event.id}')" 
              title="إدارة الحضور والتسعير الذكي"
            >
              <i class="fa-solid fa-users-gear"></i>
              إدارة الحضور
            </button>
            <button 
              class="btn-action-sm" 
              onclick="deleteEvent('${event.id}')" 
              title="حذف الفعالية"
            >
              <i class="fa-solid fa-trash-can"></i>
              حذف
            </button>
          </div>
        </td>
      `;
      eventsTableBody.appendChild(row);
    });
  }

  // --- Add Event Form Handler ---

  if (addEventForm) {
    addEventForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = eventNameInput.value.trim();
      const date = eventDateInput.value;
      const managerRate = Number(eventManagerRateInput.value) || 0;
      const teamLeaderRate = Number(eventTeamLeaderRateInput.value) || 0;
      const organizerRate = Number(eventOrganizerRateInput.value) || 0;

      if (!name || !date) {
        showToast("يرجى ملء اسم الحفلة وتاريخها.", "danger");
        return;
      }

      try {
        await addDoc(eventsCol, {
          name: name,
          date: date,
          rates: {
            managerRate: managerRate,
            teamLeaderRate: teamLeaderRate,
            organizerRate: organizerRate
          },
          attendees: [],
          createdAt: serverTimestamp()
        });

        showToast(`تم إنشاء الفعالية "${name}" بنجاح!`, "success");
        addEventForm.reset();
        eventDateInput.value = new Date().toISOString().split('T')[0];
      } catch (err) {
        console.error("Error creating event:", err);
        showToast("فشل في إنشاء الفعالية.", "danger");
      }
    });
  }

  // --- Delete Event ---

  window.deleteEvent = async function (id) {
    const evt = eventsList.find(e => e.id === id);
    const name = evt ? evt.name : 'الفعالية';

    if (confirm(`هل أنت متأكد من حذف الفعالية "${name}" وجميع بيانات الحضور المسجلة بها؟`)) {
      try {
        await deleteDoc(doc(db, "events", id));
        showToast(`تم حذف الفعالية "${name}".`, "success");
      } catch (err) {
        console.error("Error deleting event:", err);
        showToast("فشل في حذف الفعالية.", "danger");
      }
    }
  };

  // --- Event Attendees & Smart Pricing Modal Management ---

  window.openEventAttendeesModal = function (eventId) {
    const evt = eventsList.find(e => e.id === eventId);
    if (!evt) return;

    activeEventId = eventId;
    modalEventTitle.textContent = `حضور فعالية: ${evt.name}`;
    modalEventMeta.textContent = `تاريخ الحفلة: ${evt.date}`;

    // Fill event rates banner
    const rates = evt.rates || {};
    modalRatesBanner.innerHTML = `
      <div class="rate-pill">
        <span>أجر المانجر الافتراضي:</span>
        <strong>${rates.managerRate || 0} ج.م</strong>
      </div>
      <div class="rate-pill">
        <span>أجر التيم ليدر الافتراضي:</span>
        <strong>${rates.teamLeaderRate || 0} ج.م</strong>
      </div>
      <div class="rate-pill">
        <span>أجر الأورجانيزر الافتراضي:</span>
        <strong>${rates.organizerRate || 0} ج.م</strong>
      </div>
    `;

    populateAttendeeDropdown();
    resetAttendeeForm();
    renderModalAttendeesList(evt);

    eventAttendeesModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  function closeAttendeesModal() {
    eventAttendeesModal.style.display = 'none';
    document.body.style.overflow = '';
    activeEventId = null;
  }

  if (closeAttendeesModalBtn) {
    closeAttendeesModalBtn.addEventListener('click', closeAttendeesModal);
  }

  if (eventAttendeesModal) {
    eventAttendeesModal.addEventListener('click', (e) => {
      if (e.target === eventAttendeesModal) {
        closeAttendeesModal();
      }
    });
  }

  function populateAttendeeDropdown() {
    if (!attendeeSelect) return;
    attendeeSelect.innerHTML = '<option value="" disabled selected>اختر عضو الفريق...</option>';

    teamMembers.forEach(member => {
      const opt = document.createElement('option');
      opt.value = member.id;
      opt.textContent = `${member.name} (${member.rank || 'عضو'}) - كود: ${member.code || '-'}`;
      attendeeSelect.appendChild(opt);
    });
  }

  // Smart Pricing Logic: Triggered when selecting a team member
  if (attendeeSelect) {
    attendeeSelect.addEventListener('change', () => {
      const selectedMemberId = attendeeSelect.value;
      const member = teamMembers.find(m => m.id === selectedMemberId);
      const activeEvt = eventsList.find(e => e.id === activeEventId);

      if (!member || !activeEvt) return;

      const rates = activeEvt.rates || {};
      let defaultRate = 0;

      // Smart pricing based on assigned rank
      if (member.rank === 'Manager' || member.rank === 'Owner') {
        defaultRate = rates.managerRate || 0;
      } else if (member.rank === 'Team Leader') {
        defaultRate = rates.teamLeaderRate || 0;
      } else if (member.rank === 'Organizer') {
        defaultRate = rates.organizerRate || 0;
      } else {
        defaultRate = rates.organizerRate || 0;
      }

      attendeeBaseRate.value = defaultRate;
      calculateAttendeeLiveNet();
    });
  }

  // Live calculation of attendee net
  function calculateAttendeeLiveNet() {
    const base = Number(attendeeBaseRate.value) || 0;
    const bonus = Number(attendeeBonus.value) || 0;
    const deductions = Number(attendeeDeductions.value) || 0;

    let extraTasksTotal = 0;
    const taskRows = extraTasksContainer.querySelectorAll('.extra-task-row');
    taskRows.forEach(row => {
      const amtInput = row.querySelector('.task-amount-input');
      if (amtInput) {
        extraTasksTotal += (Number(amtInput.value) || 0);
      }
    });

    const net = base + bonus + extraTasksTotal - deductions;
    attendeeLiveNet.textContent = `${net} ج.م`;
    return net;
  }

  if (attendeeBaseRate) attendeeBaseRate.addEventListener('input', calculateAttendeeLiveNet);
  if (attendeeBonus) attendeeBonus.addEventListener('input', calculateAttendeeLiveNet);
  if (attendeeDeductions) attendeeDeductions.addEventListener('input', calculateAttendeeLiveNet);

  // Dynamic Custom Extra Tasks (مهام إضافية)
  function createExtraTaskRow(desc = '', amount = '') {
    const row = document.createElement('div');
    row.className = 'extra-task-row';

    row.innerHTML = `
      <input type="text" class="form-input task-desc-input" placeholder="اسم المهمة (مثال: مواصلات زيادة، شغل إضافي)" value="${escapeHTML(desc)}" required>
      <input type="number" class="form-input task-amount-input" placeholder="القيمة (ج.م)" min="0" value="${amount}" required>
      <button type="button" class="btn-remove-task" title="حذف هذه المهمة">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;

    const amtInput = row.querySelector('.task-amount-input');
    amtInput.addEventListener('input', calculateAttendeeLiveNet);

    const removeBtn = row.querySelector('.btn-remove-task');
    removeBtn.addEventListener('click', () => {
      row.remove();
      calculateAttendeeLiveNet();
    });

    extraTasksContainer.appendChild(row);
  }

  if (addExtraTaskBtn) {
    addExtraTaskBtn.addEventListener('click', () => {
      createExtraTaskRow();
    });
  }

  function resetAttendeeForm() {
    if (addAttendeeForm) addAttendeeForm.reset();
    if (extraTasksContainer) extraTasksContainer.innerHTML = '';
    if (attendeeBonus) attendeeBonus.value = 0;
    if (attendeeDeductions) attendeeDeductions.value = 0;
    if (attendeeLiveNet) attendeeLiveNet.textContent = '0 ج.م';
  }

  // Add / Save Attendee in Event
  if (addAttendeeForm) {
    addAttendeeForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!activeEventId) return;
      const activeEvt = eventsList.find(e => e.id === activeEventId);
      if (!activeEvt) return;

      const memberId = attendeeSelect.value;
      const member = teamMembers.find(m => m.id === memberId);
      if (!member) {
        showToast("يرجى اختيار عضو الفريق أولاً.", "danger");
        return;
      }

      const baseRate = Number(attendeeBaseRate.value) || 0;
      const bonus = Number(attendeeBonus.value) || 0;
      const deductions = Number(attendeeDeductions.value) || 0;

      // Extract custom extra tasks
      const extraTasks = [];
      const taskRows = extraTasksContainer.querySelectorAll('.extra-task-row');
      taskRows.forEach(row => {
        const descInput = row.querySelector('.task-desc-input');
        const amtInput = row.querySelector('.task-amount-input');
        if (descInput && amtInput) {
          const d = descInput.value.trim();
          const a = Number(amtInput.value) || 0;
          if (d && a > 0) {
            extraTasks.push({ description: d, amount: a });
          }
        }
      });

      const netAmount = calculateAttendeeLiveNet();

      const existingAttendees = activeEvt.attendees ? [...activeEvt.attendees] : [];
      const existingIndex = existingAttendees.findIndex(a => a.memberId === memberId);

      const attendeeObj = {
        memberId: member.id,
        name: member.name,
        rank: member.rank || '',
        phone: member.phone || '',
        paymentMethod: member.paymentMethod || '',
        paymentAccount: member.paymentAccount || '',
        baseRate: baseRate,
        bonus: bonus,
        deductions: deductions,
        extraTasks: extraTasks,
        netAmount: netAmount,
        addedAt: new Date().toISOString()
      };

      if (existingIndex > -1) {
        existingAttendees[existingIndex] = attendeeObj;
      } else {
        existingAttendees.push(attendeeObj);
      }

      try {
        const eventDocRef = doc(db, "events", activeEventId);
        await updateDoc(eventDocRef, {
          attendees: existingAttendees
        });

        showToast(`تم تسجيل حضور "${member.name}" في الفعالية بنجاح!`, "success");
        resetAttendeeForm();
      } catch (err) {
        console.error("Error saving attendee:", err);
        showToast("فشل في حفظ بيانات حضور العضو.", "danger");
      }
    });
  }

  // Render Attendees List inside Modal
  function renderModalAttendeesList(evt) {
    if (!modalAttendeesTableBody) return;
    modalAttendeesTableBody.innerHTML = '';

    const attendees = evt.attendees || [];
    if (modalAttendeesCount) modalAttendeesCount.textContent = attendees.length;

    if (attendees.length === 0) {
      if (modalAttendeesEmpty) modalAttendeesEmpty.style.display = 'block';
      modalAttendeesTableBody.parentElement.style.display = 'none';
      return;
    }

    if (modalAttendeesEmpty) modalAttendeesEmpty.style.display = 'none';
    modalAttendeesTableBody.parentElement.style.display = 'table';

    attendees.forEach(att => {
      const row = document.createElement('tr');

      let badgeClass = 'user';
      if (att.rank === 'Owner') badgeClass = 'owner';
      if (att.rank === 'Manager') badgeClass = 'manager';
      if (att.rank === 'Team Leader') badgeClass = 'teamleader';
      if (att.rank === 'Organizer') badgeClass = 'organizer';

      // Format extra tasks
      let extraTasksHTML = '<span style="color: var(--text-muted);">-</span>';
      if (att.extraTasks && att.extraTasks.length > 0) {
        extraTasksHTML = att.extraTasks.map(t =>
          `<span style="display: block; font-size: 11px; color: var(--accent-mustard);">• ${escapeHTML(t.description)} (${t.amount} ج.م)</span>`
        ).join('');
      }

      row.innerHTML = `
        <td><strong>${escapeHTML(att.name)}</strong></td>
        <td><span class="badge-role ${badgeClass}">${escapeHTML(att.rank || '-')}</span></td>
        <td><strong style="color: var(--text-primary);">${att.baseRate || 0}</strong> ج.م</td>
        <td><span style="color: #25D366;">+${att.bonus || 0} ج.م</span></td>
        <td><span style="color: #ff5252;">-${att.deductions || 0} ج.م</span></td>
        <td>${extraTasksHTML}</td>
        <td><strong style="color: var(--accent-mustard); font-size: 15px;">${att.netAmount || 0} ج.م</strong></td>
        <td>
          <button 
            class="btn-action-sm" 
            onclick="removeAttendeeFromEvent('${evt.id}', '${att.memberId}')" 
            title="إزالة هذا العضو من الحفلة"
          >
            <i class="fa-solid fa-user-minus"></i>
            إزالة
          </button>
        </td>
      `;
      modalAttendeesTableBody.appendChild(row);
    });
  }

  // Remove Attendee from Event
  window.removeAttendeeFromEvent = async function (eventId, memberId) {
    const evt = eventsList.find(e => e.id === eventId);
    if (!evt) return;

    const attendees = evt.attendees || [];
    const att = attendees.find(a => a.memberId === memberId);
    const name = att ? att.name : 'العضو';

    if (confirm(`هل أنت متأكد من إزالة "${name}" من حضور هذه الحفلة؟`)) {
      try {
        const updated = attendees.filter(a => a.memberId !== memberId);
        const eventDocRef = doc(db, "events", eventId);
        await updateDoc(eventDocRef, { attendees: updated });
        showToast(`تمت إزالة "${name}" من الحضور.`, "info");
      } catch (err) {
        console.error("Error removing attendee:", err);
        showToast("فشل في إزالة العضو من الحفلة.", "danger");
      }
    }
  };

  // --- Monthly Settlements Dashboard Logic (تقفيل الحسابات) ---

  if (settlementMonthSelect) {
    settlementMonthSelect.addEventListener('change', renderMonthlySettlements);
  }

  if (currentMonthBtn) {
    currentMonthBtn.addEventListener('click', () => {
      settlementMonthSelect.value = getSystemCurrentMonth();
      renderMonthlySettlements();
    });
  }

  function getArabicMonthName(monthStr) {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const monthsArabic = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthsArabic[monthIndex] || month} ${year}`;
  }

  function renderMonthlySettlements() {
    if (!settlementsTableBody || !settlementMonthSelect) return;
    settlementsTableBody.innerHTML = '';

    const selectedMonth = settlementMonthSelect.value;
    if (!selectedMonth) return;

    if (settlementMonthLabel) {
      settlementMonthLabel.textContent = getArabicMonthName(selectedMonth);
    }

    // Filter events falling within this month: date.startsWith(selectedMonth)
    const monthEvents = eventsList.filter(evt => evt.date && evt.date.startsWith(selectedMonth));

    if (settlementStatEvents) {
      settlementStatEvents.textContent = monthEvents.length;
    }

    // Aggregate by member
    const memberAggregates = {};

    monthEvents.forEach(evt => {
      const attendees = evt.attendees || [];
      attendees.forEach(att => {
        const mId = att.memberId;
        if (!memberAggregates[mId]) {
          const currentMember = teamMembers.find(t => t.id === mId);
          memberAggregates[mId] = {
            memberId: mId,
            name: currentMember ? currentMember.name : att.name,
            rank: currentMember ? currentMember.rank : att.rank,
            code: currentMember ? currentMember.code : '-',
            phone: currentMember ? currentMember.phone : att.phone,
            paymentMethod: currentMember ? currentMember.paymentMethod : att.paymentMethod,
            paymentAccount: currentMember ? currentMember.paymentAccount : att.paymentAccount,
            events: [],
            totalBaseRate: 0,
            totalBonus: 0,
            totalDeductions: 0,
            totalExtraTasks: 0,
            grandTotal: 0
          };
        }

        let extraTotal = 0;
        if (att.extraTasks && Array.isArray(att.extraTasks)) {
          extraTotal = att.extraTasks.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        }

        const base = Number(att.baseRate) || 0;
        const bonus = Number(att.bonus) || 0;
        const ded = Number(att.deductions) || 0;
        const net = base + bonus + extraTotal - ded;

        memberAggregates[mId].events.push({
          eventId: evt.id,
          eventName: evt.name,
          eventDate: evt.date,
          baseRate: base,
          bonus: bonus,
          deductions: ded,
          extraTasks: att.extraTasks || [],
          netAmount: net
        });

        memberAggregates[mId].totalBaseRate += base;
        memberAggregates[mId].totalBonus += bonus;
        memberAggregates[mId].totalDeductions += ded;
        memberAggregates[mId].totalExtraTasks += extraTotal;
        memberAggregates[mId].grandTotal += net;
      });
    });

    const aggregatedMembersList = Object.values(memberAggregates);

    if (settlementStatMembers) {
      settlementStatMembers.textContent = aggregatedMembersList.length;
    }

    if (aggregatedMembersList.length === 0) {
      if (settlementsEmptyState) settlementsEmptyState.style.display = 'flex';
      settlementsTableBody.parentElement.style.display = 'none';
      if (settlementStatTotal) settlementStatTotal.textContent = '0 ج.م';
      if (settlementStatPaid) settlementStatPaid.textContent = '0 ج.م';
      if (statPendingSettlements) statPendingSettlements.textContent = '0 ج.م';
      return;
    }

    if (settlementsEmptyState) settlementsEmptyState.style.display = 'none';
    settlementsTableBody.parentElement.style.display = 'table';

    let monthGrandTotal = 0;
    let monthPaidTotal = 0;

    aggregatedMembersList.forEach(item => {
      const settlementKey = `${selectedMonth}_${item.memberId}`;
      const isPaid = settlementsMap[settlementKey]?.paid || false;

      monthGrandTotal += item.grandTotal;
      if (isPaid) {
        monthPaidTotal += item.grandTotal;
      }

      const row = document.createElement('tr');
      if (isPaid) {
        row.className = 'row-paid';
      }

      let badgeClass = 'user';
      if (item.rank === 'Owner') badgeClass = 'owner';
      if (item.rank === 'Manager') badgeClass = 'manager';
      if (item.rank === 'Team Leader') badgeClass = 'teamleader';
      if (item.rank === 'Organizer') badgeClass = 'organizer';

      const statusBadge = isPaid
        ? `<span class="badge-paid-status paid"><i class="fa-solid fa-circle-check"></i> تم الدفع</span>`
        : `<span class="badge-paid-status pending"><i class="fa-regular fa-clock"></i> قيد الانتظار</span>`;

      row.innerHTML = `
        <td><strong>${escapeHTML(item.name)}</strong></td>
        <td><span class="badge-role ${badgeClass}">${escapeHTML(item.rank || '-')}</span></td>
        <td><span class="badge-payment">${escapeHTML(item.paymentMethod || '-')}</span></td>
        <td><code style="font-size: 13px; color: var(--accent-mustard);">${escapeHTML(item.paymentAccount || '-')}</code></td>
        <td><strong style="color: var(--text-primary);">${item.events.length}</strong> حفلة</td>
        <td><strong class="stat-total-cell" style="font-size: 16px; color: var(--accent-mustard);">${item.grandTotal} ج.م</strong></td>
        <td>
          <label class="paid-toggle-wrapper">
            <input 
              type="checkbox" 
              class="paid-toggle-input" 
              ${isPaid ? 'checked' : ''} 
              onchange="toggleMemberPaidStatus('${selectedMonth}', '${item.memberId}', this.checked)"
            >
            ${statusBadge}
          </label>
        </td>
        <td>
          <div class="table-actions">
            <button 
              class="btn-pdf" 
              onclick="generateMemberStatementPDF('${item.memberId}', '${selectedMonth}')" 
              title="تحميل كشف الحساب المعتمد PDF"
            >
              <i class="fa-solid fa-file-pdf"></i>
              تحميل كشف الحساب PDF
            </button>
            <button 
              class="btn-action-view" 
              onclick="openMemberBreakdownModal('${item.memberId}', '${selectedMonth}')" 
              title="عرض تفاصيل الحفلات والمهام الإضافية"
            >
              <i class="fa-solid fa-eye"></i>
              التفاصيل
            </button>
          </div>
        </td>
      `;

      settlementsTableBody.appendChild(row);
    });

    if (settlementStatTotal) settlementStatTotal.textContent = `${monthGrandTotal} ج.م`;
    if (settlementStatPaid) settlementStatPaid.textContent = `${monthPaidTotal} ج.م`;
    if (statPendingSettlements) statPendingSettlements.textContent = `${monthGrandTotal - monthPaidTotal} ج.م`;
  }

  // Toggle "تم الدفع" Status in Firestore
  window.toggleMemberPaidStatus = async function (monthKey, memberId, isChecked) {
    const settlementDocId = `${monthKey}_${memberId}`;
    try {
      const docRef = doc(db, "settlements", settlementDocId);
      await setDoc(docRef, {
        month: monthKey,
        memberId: memberId,
        paid: isChecked,
        paidAt: isChecked ? serverTimestamp() : null
      }, { merge: true });

      const statusText = isChecked ? 'تم تأكيد دفع المستحقات بنجاح!' : 'تم تغيير الحالة إلى قيد الانتظار.';
      showToast(statusText, isChecked ? 'success' : 'info');
    } catch (err) {
      console.error("Error updating settlement paid status:", err);
      showToast("فشل في تحديث حالة الدفع في قاعدة البيانات.", "danger");
    }
  };

  // --- Member Breakdown Modal ---

  window.openMemberBreakdownModal = function (memberId, monthKey) {
    const member = teamMembers.find(t => t.id === memberId);
    if (!member) return;

    const monthEvents = eventsList.filter(evt => evt.date && evt.date.startsWith(monthKey));
    const attendedEvents = [];

    monthEvents.forEach(evt => {
      const att = (evt.attendees || []).find(a => a.memberId === memberId);
      if (att) {
        let extraTotal = 0;
        if (att.extraTasks && Array.isArray(att.extraTasks)) {
          extraTotal = att.extraTasks.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        }
        attendedEvents.push({
          eventName: evt.name,
          eventDate: evt.date,
          baseRate: Number(att.baseRate) || 0,
          bonus: Number(att.bonus) || 0,
          deductions: Number(att.deductions) || 0,
          extraTasks: att.extraTasks || [],
          netAmount: (Number(att.baseRate) || 0) + (Number(att.bonus) || 0) + extraTotal - (Number(att.deductions) || 0)
        });
      }
    });

    breakdownMemberTitle.textContent = `كشف حساب: ${member.name}`;
    breakdownMonthMeta.textContent = `عن شهر: ${getArabicMonthName(monthKey)}`;

    breakdownMemberInfo.innerHTML = `
      <div class="member-info-item">
        <span class="member-info-label">كود العضو:</span>
        <span class="member-info-val" style="font-family: monospace;">${member.code || '-'}</span>
      </div>
      <div class="member-info-item">
        <span class="member-info-label">الرتبة / الدور:</span>
        <span class="member-info-val">${member.rank || '-'}</span>
      </div>
      <div class="member-info-item">
        <span class="member-info-label">طريقة الدفع:</span>
        <span class="member-info-val">${member.paymentMethod || '-'}</span>
      </div>
      <div class="member-info-item">
        <span class="member-info-label">رقم الحساب / المحفظة:</span>
        <span class="member-info-val">${member.paymentAccount || '-'}</span>
      </div>
    `;

    breakdownEventsTableBody.innerHTML = '';
    let sumBase = 0, sumBonus = 0, sumDeductions = 0, sumExtra = 0, grandTotal = 0;

    attendedEvents.forEach(evt => {
      sumBase += evt.baseRate;
      sumBonus += evt.bonus;
      sumDeductions += evt.deductions;
      grandTotal += evt.netAmount;

      let extraTasksHTML = '<span style="color: var(--text-muted);">-</span>';
      if (evt.extraTasks && evt.extraTasks.length > 0) {
        extraTasksHTML = evt.extraTasks.map(t => {
          sumExtra += Number(t.amount) || 0;
          return `<span style="display: block; font-size: 11px; color: var(--accent-mustard);">• ${escapeHTML(t.description)} (${t.amount} ج.م)</span>`;
        }).join('');
      }

      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${escapeHTML(evt.eventName)}</strong></td>
        <td>${escapeHTML(evt.eventDate)}</td>
        <td>${evt.baseRate} ج.م</td>
        <td style="color: #25D366;">+${evt.bonus} ج.م</td>
        <td style="color: #ff5252;">-${evt.deductions} ج.م</td>
        <td>${extraTasksHTML}</td>
        <td><strong style="color: var(--accent-mustard); font-size: 14px;">${evt.netAmount} ج.م</strong></td>
      `;
      breakdownEventsTableBody.appendChild(row);
    });

    breakdownSummaryBox.innerHTML = `
      <div>
        <div style="font-size: 13px; color: var(--text-secondary);">
          إجمالي الأجور: <strong>${sumBase}</strong> + بونص: <strong>${sumBonus}</strong> + إضافي: <strong>${sumExtra}</strong> - خصومات: <strong>${sumDeductions}</strong>
        </div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
          إجمالي عدد الحفلات المنفذة: ${attendedEvents.length} حفلة
        </div>
      </div>
      <div class="breakdown-summary-total">
        الإجمالي الصافي: ${grandTotal} ج.م
      </div>
    `;

    memberBreakdownModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  };

  function closeBreakdownModal() {
    memberBreakdownModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (closeBreakdownModalBtn) {
    closeBreakdownModalBtn.addEventListener('click', closeBreakdownModal);
  }

  if (memberBreakdownModal) {
    memberBreakdownModal.addEventListener('click', (e) => {
      if (e.target === memberBreakdownModal) {
        closeBreakdownModal();
      }
    });
  }

  // --- Arabic PDF Statement Generation (Table-Based Layout, NO Flexbox/Grid, Robust RTL & Spacing) ---

  window.generateMemberStatementPDF = function (memberId, monthKey) {
    const member = teamMembers.find(t => t.id === memberId);
    if (!member) {
      showToast("تعذر العثور على بيانات العضو لتوليد الـ PDF.", "danger");
      return;
    }

    const monthEvents = eventsList.filter(evt => evt.date && evt.date.startsWith(monthKey));
    const attendedEvents = [];

    monthEvents.forEach(evt => {
      const att = (evt.attendees || []).find(a => a.memberId === memberId);
      if (att) {
        let extraTotal = 0;
        if (att.extraTasks && Array.isArray(att.extraTasks)) {
          extraTotal = att.extraTasks.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        }
        attendedEvents.push({
          eventName: evt.name || '',
          eventDate: evt.date || '',
          baseRate: Number(att.baseRate) || 0,
          bonus: Number(att.bonus) || 0,
          deductions: Number(att.deductions) || 0,
          extraTasks: att.extraTasks || [],
          netAmount: (Number(att.baseRate) || 0) + (Number(att.bonus) || 0) + extraTotal - (Number(att.deductions) || 0)
        });
      }
    });

    if (attendedEvents.length === 0) {
      showToast("لا توجد حفلات مسجلة لهذا العضو في هذا الشهر.", "danger");
      return;
    }

    showToast("جاري تجهيز كشف الحساب وتصدير ملف PDF...", "info");

    const pdfContentContainer = document.getElementById('pdf-statement-content');
    if (!pdfContentContainer) return;

    let sumBase = 0, sumBonus = 0, sumDeductions = 0, sumExtra = 0, grandTotal = 0;

    let tableRowsHTML = '';
    attendedEvents.forEach((evt, idx) => {
      sumBase += evt.baseRate;
      sumBonus += evt.bonus;
      sumDeductions += evt.deductions;
      grandTotal += evt.netAmount;

      let extraTasksString = '-';
      if (evt.extraTasks && evt.extraTasks.length > 0) {
        extraTasksString = evt.extraTasks.map(t => {
          sumExtra += (Number(t.amount) || 0);
          return `${escapeHTML(t.description)}&nbsp;(${t.amount}&nbsp;ج.م)`;
        }).join('&nbsp;+&nbsp;');
      }

      tableRowsHTML += `
        <tr style="page-break-inside: avoid; break-inside: avoid; background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9f9f9'};">
          <td align="center" style="text-align: center; padding: 9px 4px; border: 1px solid #dcdcdc; font-size: 11px; color: #121212;">${idx + 1}</td>
          <td align="right" style="text-align: right; padding: 9px 8px; border: 1px solid #dcdcdc; font-size: 11.5px; font-weight: 700; color: #111111;">${escapeHTML(evt.eventName)}</td>
          <td align="center" style="text-align: center; padding: 9px 6px; border: 1px solid #dcdcdc; font-size: 11px; color: #444444;">${escapeHTML(evt.eventDate)}</td>
          <td align="center" style="text-align: center; padding: 9px 6px; border: 1px solid #dcdcdc; font-size: 11px; font-weight: 700; color: #121212;">${evt.baseRate}&nbsp;ج.م</td>
          <td align="center" style="text-align: center; padding: 9px 6px; border: 1px solid #dcdcdc; font-size: 11px; color: #1e7e34; font-weight: 700;">+${evt.bonus}&nbsp;ج.م</td>
          <td align="center" style="text-align: center; padding: 9px 6px; border: 1px solid #dcdcdc; font-size: 11px; color: #b02a37; font-weight: 700;">-${evt.deductions}&nbsp;ج.م</td>
          <td align="right" style="text-align: right; padding: 9px 8px; border: 1px solid #dcdcdc; font-size: 11px; color: #b8860b;">${extraTasksString}</td>
          <td align="center" style="text-align: center; padding: 9px 6px; border: 1px solid #dcdcdc; font-size: 12px; font-weight: 900; color: #111111; background-color: ${idx % 2 === 0 ? '#fdfdfd' : '#f4f4f4'};">${evt.netAmount}&nbsp;ج.م</td>
        </tr>
      `;
    });

    const isPaid = settlementsMap[`${monthKey}_${memberId}`]?.paid || false;
    const paidBadgeHTML = isPaid
      ? `<span style="color: #155724; background-color: #d4edda; border: 1px solid #c3e6cb; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11.5px; display: inline-block;">تم سداد المستحقات بالكامل ✓</span>`
      : `<span style="color: #856404; background-color: #fff3cd; border: 1px solid #ffeeba; padding: 3px 8px; border-radius: 4px; font-weight: 700; font-size: 11.5px; display: inline-block;">قيد المراجعة والتحويل</span>`;

    const nowFormatted = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Pure Table-Based Layout with Strict Border-Box & Margin Containment
    pdfContentContainer.innerHTML = `
      <div class="pdf-statement-page" dir="rtl" style="font-family: 'Cairo', 'Tajawal', sans-serif !important; line-height: 1.75 !important; border: 2px solid #1a1a1a; border-radius: 8px; padding: 20px 22px; background-color: #ffffff; color: #121212; width: 96%; max-width: 96%; margin: 0 auto; box-sizing: border-box;">
        
        <!-- 1. Header Table (Borderless) -->
        <table dir="rtl" width="100%" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border-bottom: 2px solid #d7b704; padding-bottom: 14px; margin-bottom: 16px; page-break-inside: avoid; break-inside: avoid;">
          <tr>
            <td align="right" valign="middle" style="width: 60%; text-align: right; vertical-align: middle;">
              <table dir="rtl" border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <tr>
                  <td valign="middle" style="vertical-align: middle; padding-left: 12px;">
                    <img src="logo.png" alt="4Directions" width="55" height="55" style="width: 55px; height: 55px; display: block;">
                  </td>
                  <td valign="middle" align="right" style="vertical-align: middle; text-align: right;">
                    <h1 style="margin: 0 0 2px 0; font-size: 21px; font-weight: 800; color: #121212; font-family: 'Cairo', sans-serif; line-height: 1.3;">فور <span style="color: #d7b704;">دايركشنز</span></h1>
                    <p style="margin: 0; font-size: 10.5px; color: #666666; font-family: 'Cairo', sans-serif;">4Directions Event Organizers Management</p>
                  </td>
                </tr>
              </table>
            </td>
            <td align="left" valign="middle" style="width: 40%; text-align: left; vertical-align: middle; direction: ltr;">
              <div style="background-color: #1a1a1a; color: #d7b704; font-size: 14px; font-weight: 800; padding: 5px 12px; border-radius: 4px; display: inline-block; font-family: 'Cairo', sans-serif; direction: rtl; text-align: center; margin-bottom: 5px;">
                كشف حساب مستحقات مالية
              </div>
              <p style="margin: 2px 0 0 0; font-size: 11.5px; color: #333333; font-family: 'Cairo', sans-serif; direction: rtl; text-align: left;">
                عن شهر:&nbsp;<strong style="color: #121212;">${getArabicMonthName(monthKey)}</strong>
              </p>
              <p style="margin: 2px 0 0 0; font-size: 10.5px; color: #777777; font-family: 'Cairo', sans-serif; direction: rtl; text-align: left;">
                تاريخ الإصدار:&nbsp;${nowFormatted}
              </p>
            </td>
          </tr>
        </table>

        <!-- 2. Member Details Table (Borderless 3-Column Table Layout) -->
        <table dir="rtl" width="100%" border="0" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #fbfbfb; border: 1px solid #e0e0e0; border-right: 4px solid #d7b704; border-radius: 6px; margin-bottom: 16px; font-family: 'Cairo', sans-serif; page-break-inside: avoid; break-inside: avoid;">
          <tr>
            <td align="right" valign="top" style="width: 33.33%; padding: 8px 12px; text-align: right; border-bottom: 1px solid #f0f0f0;">
              <p style="margin: 0 0 3px 0; font-size: 11px; font-weight: 700; color: #666666;">اسم العضو:</p>
              <p style="margin: 0; font-size: 13px; font-weight: 800; color: #121212;">${escapeHTML(member.name)}</p>
            </td>
            <td align="right" valign="top" style="width: 33.33%; padding: 8px 12px; text-align: right; border-bottom: 1px solid #f0f0f0;">
              <p style="margin: 0 0 3px 0; font-size: 11px; font-weight: 700; color: #666666;">الكود / المعرّف:</p>
              <p style="margin: 0; font-size: 13px; font-weight: 800; color: #121212; font-family: monospace;">${escapeHTML(member.code || '-')}</p>
            </td>
            <td align="right" valign="top" style="width: 33.33%; padding: 8px 12px; text-align: right; border-bottom: 1px solid #f0f0f0;">
              <p style="margin: 0 0 3px 0; font-size: 11px; font-weight: 700; color: #666666;">الرتبة في الفريق:</p>
              <p style="margin: 0; font-size: 13px; font-weight: 800; color: #121212;">${escapeHTML(member.rank || '-')}</p>
            </td>
          </tr>
          <tr>
            <td align="right" valign="top" style="width: 33.33%; padding: 8px 12px; text-align: right;">
              <p style="margin: 0 0 3px 0; font-size: 11px; font-weight: 700; color: #666666;">طريقة الدفع المعتمدة:</p>
              <p style="margin: 0; font-size: 13px; font-weight: 800; color: #121212;">${escapeHTML(member.paymentMethod || '-')}</p>
            </td>
            <td align="right" valign="top" style="width: 33.33%; padding: 8px 12px; text-align: right;">
              <p style="margin: 0 0 3px 0; font-size: 11px; font-weight: 700; color: #666666;">رقم الحساب / المحفظة:</p>
              <p style="margin: 0; font-size: 13px; font-weight: 800; color: #121212;">${escapeHTML(member.paymentAccount || '-')}</p>
            </td>
            <td align="right" valign="top" style="width: 33.33%; padding: 8px 12px; text-align: right;">
              <p style="margin: 0 0 3px 0; font-size: 11px; font-weight: 700; color: #666666;">حالة السداد:</p>
              <div style="margin: 0;">${paidBadgeHTML}</div>
            </td>
          </tr>
        </table>

        <!-- 3. Main Events Data Table (Fixed Layout, Explicit Column Widths) -->
        <table dir="rtl" width="100%" border="0" cellpadding="0" cellspacing="0" style="table-layout: fixed; width: 100%; border-collapse: collapse; margin-bottom: 16px; font-family: 'Cairo', sans-serif; text-align: right;">
          <thead>
            <tr style="background-color: #1a1a1a; color: #ffffff; page-break-inside: avoid; break-inside: avoid;">
              <th align="center" style="width: 5%; text-align: center; padding: 10px 4px; font-size: 11px; border: 1px solid #333333; color: #ffffff;">م</th>
              <th align="right" style="width: 31%; text-align: right; padding: 10px 8px; font-size: 11.5px; border: 1px solid #333333; color: #ffffff;">اسم الفعالية / الحفلة</th>
              <th align="center" style="width: 13%; text-align: center; padding: 10px 6px; font-size: 11px; border: 1px solid #333333; color: #ffffff;">التاريخ</th>
              <th align="center" style="width: 11%; text-align: center; padding: 10px 6px; font-size: 11px; border: 1px solid #333333; color: #ffffff;">الأجر الأساسي</th>
              <th align="center" style="width: 10%; text-align: center; padding: 10px 6px; font-size: 11px; border: 1px solid #333333; color: #ffffff;">البونص</th>
              <th align="center" style="width: 10%; text-align: center; padding: 10px 6px; font-size: 11px; border: 1px solid #333333; color: #ffffff;">الخصومات</th>
              <th align="right" style="width: 18%; text-align: right; padding: 10px 8px; font-size: 11px; border: 1px solid #333333; color: #ffffff;">مهام إضافية</th>
              <th align="center" style="width: 12%; text-align: center; padding: 10px 6px; font-size: 11.5px; border: 1px solid #333333; color: #ffffff;">صافي الحفلة</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHTML}
          </tbody>
        </table>

        <!-- 4. Financial Totals Summary (Table-Based, Anti-Squish) -->
        <table dir="rtl" width="100%" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; background-color: #fbfbfb; border: 1.5px solid #1a1a1a; border-radius: 6px; margin-bottom: 16px; page-break-inside: avoid; break-inside: avoid; font-family: 'Cairo', sans-serif;">
          <tr>
            <td align="right" valign="middle" style="width: 65%; padding: 14px 16px; text-align: right;">
              <p style="margin: 0 0 5px 0; font-size: 13px; font-weight: 800; color: #1a1a1a;">ملخص العمليات الحسابية:</p>
              <p style="margin: 0 0 4px 0; font-size: 11.5px; color: #444444; line-height: 1.6;">
                الأجور الأساسية (${sumBase}&nbsp;ج.م) + إجمالي البونص (${sumBonus}&nbsp;ج.م) + إضافي (${sumExtra}&nbsp;ج.م) - خصومات (${sumDeductions}&nbsp;ج.م)
              </p>
              <p style="margin: 0; font-size: 11.5px; font-weight: 700; color: #b8860b;">
                إجمالي عدد الفعاليات المنفذة:&nbsp;${attendedEvents.length}&nbsp;فعالية
              </p>
            </td>
            <td align="center" valign="middle" style="width: 35%; padding: 14px 16px; background-color: #1a1a1a; color: #ffffff; text-align: center; border-right: 4px solid #d7b704; border-radius: 0 5px 5px 0;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #dddddd; font-family: 'Cairo', sans-serif;">الإجمالي النهائي المستحق:</p>
              <p style="margin: 0; font-size: 22px; font-weight: 900; color: #d7b704; font-family: 'Cairo', sans-serif; line-height: 1.3;">${grandTotal}&nbsp;ج.م</p>
            </td>
          </tr>
        </table>

        <!-- 5. Stamp and Signatures Footer Table (Spaced & Separated Columns) -->
        <table dir="rtl" width="100%" border="0" cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; border-top: 1px dashed #cccccc; padding-top: 14px; margin-top: 14px; page-break-inside: avoid; break-inside: avoid; font-family: 'Cairo', sans-serif;">
          <tr>
            <td align="right" valign="top" style="width: 65%; padding: 10px 0; text-align: right;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: #1a1a1a;">ملاحظات الإدارة:</p>
              <p style="margin: 0; font-size: 11px; color: #555555; line-height: 1.7;">
                يتم تحويل المستحقات بناءً على بيانات الدفع المسجلة أعلاه (${escapeHTML(member.paymentMethod || '')}:&nbsp;${escapeHTML(member.paymentAccount || '')}).
              </p>
            </td>
            <td align="center" valign="bottom" style="width: 35%; padding: 10px 0; text-align: center;">
              <div style="border-bottom: 1.5px dotted #666666; width: 140px; margin: 0 auto 6px auto; height: 35px;"></div>
              <p style="margin: 0; font-size: 12px; font-weight: 800; color: #1a1a1a;">إدارة فور دايركشنز</p>
            </td>
          </tr>
        </table>

      </div>
    `;

    // Strict A4 multi-page configuration with standard margins and avoidance of table row splits
    const opt = {
      margin: [5, 5, 5, 5],
      filename: `كشف-حساب-${member.name.replace(/\s+/g, '-')}-${monthKey}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
        scrollX: 0
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy']
      }
    };

    if (window.html2pdf) {
      window.html2pdf().set(opt).from(pdfContentContainer).save().then(() => {
        showToast(`تم تحميل كشف الحساب PDF بنجاح للعضو "${member.name}"!`, "success");
      }).catch(err => {
        console.error("PDF generation error:", err);
        showToast("حدث خطأ أثناء تصدير الـ PDF.", "danger");
      });
    } else {
      showToast("مكتبة توليد الـ PDF غير محملة. يرجى إعادة تحديث الصفحة.", "danger");
    }
  };

  // --- Message Vault Operations (Add, Render, Copy, Pin, Delete, Counters) ---

  function updateTextareaCounters() {
    if (!textInput || !charCountEl) return;
    const text = textInput.value;
    const charCount = text.length;
    const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    charCountEl.textContent = `${charCount} حرف | ${wordCount} كلمة`;
  }

  if (textInput) {
    textInput.addEventListener('input', updateTextareaCounters);
  }

  if (messageForm) {
    messageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = titleInput ? titleInput.value.trim() : '';
      const content = textInput ? textInput.value : '';
      const pinned = pinInput ? pinInput.checked : false;

      if (!title || !content.trim()) {
        showToast('يرجى ملء عنوان الرسالة ومحتواها لحفظها.', 'danger');
        return;
      }

      await addMessage(title, content, pinned);
      
      messageForm.reset();
      updateTextareaCounters();
    });
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
    if (!messagesGrid) return;
    
    let filtered = messages.filter(msg => {
      if (currentFilter === 'pinned' && !msg.pinned) {
        return false;
      }
      
      if (searchQuery) {
        const titleMatch = (msg.title || '').toLowerCase().includes(searchQuery);
        const contentMatch = (msg.content || '').toLowerCase().includes(searchQuery);
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

    if (messagesCountBadge) messagesCountBadge.textContent = filtered.length;

    if (filtered.length === 0) {
      if (emptyState) {
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
      }
    } else {
      if (emptyState) emptyState.style.display = 'none';

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

  // --- Filter and Search listeners ---

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      if (searchInput.value.length > 0) {
        if (clearSearchBtn) clearSearchBtn.style.display = 'block';
      } else {
        if (clearSearchBtn) clearSearchBtn.style.display = 'none';
      }
      renderMessages();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      if (searchInput) searchInput.focus();
      renderMessages();
    });
  }

  if (tabAll) {
    tabAll.addEventListener('click', () => {
      setActiveTab(tabAll, 'all');
    });
  }

  if (tabPinned) {
    tabPinned.addEventListener('click', () => {
      setActiveTab(tabPinned, 'pinned');
    });
  }

  function setActiveTab(activeTabEl, filterType) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    activeTabEl.classList.add('active');
    currentFilter = filterType;
    renderMessages();
  }
});
