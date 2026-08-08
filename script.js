/**
 * Four Directions Message Vault & Events Management - Client-side Logic (Arabic Firestore Edition)
 * Firestore Credentials Auth, Role-Based Access Control (RBAC), Events Management,
 * Smart Pricing, Monthly Settlements Dashboard, and Arabic RTL PDF Statement Generator.
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
  await initializeDefaultAdmin();

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

  // --- 1. Robust Firestore Login Form Submission Handler ---

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const username = loginUsernameInput.value.trim();
      const password = loginPasswordInput.value.trim();

      if (!username || !password) {
        showToast("يرجى إدخال اسم المستخدم وكلمة المرور.", "danger");
        return;
      }

      // UI Loading Feedback
      const originalBtnHTML = loginBtn.innerHTML;
      loginBtn.disabled = true;
      loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق...';

      try {
        // Query Firestore users collection for matching username and password
        const authQuery = query(
          usersCol, 
          where("username", "==", username), 
          where("password", "==", password)
        );
        
        const querySnapshot = await getDocs(authQuery);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0].data();
          const role = userDoc.role || 'user';
          
          // Successful login: save session and redirect to dashboard
          loginUserSession(userDoc.username, role);
          showToast(`أهلاً بك مجدداً، ${userDoc.username}!`, "success");
          loginForm.reset();
        } else {
          // Authentication failed: invalid credentials
          console.error("Firestore Login Error: auth/invalid-credentials", "اسم المستخدم أو كلمة المرور غير صحيحة.");
          showToast("اسم المستخدم أو كلمة المرور غير صحيحة", "danger");
        }
      } catch (error) {
        // Detailed error logging for easy debugging
        console.error("Firestore Login Error:", error.code || "unknown-code", error.message || error);
        
        if (error.code === 'unavailable' || error.message?.includes('network')) {
          showToast("حدث خطأ في الاتصال، يرجى المحاولة لاحقاً", "danger");
        } else {
          showToast("حدث خطأ في الاتصال، يرجى المحاولة لاحقاً", "danger");
        }
      } finally {
        // Restore login button state
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalBtnHTML;
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

  window.deleteEvent = async function(id) {
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

  window.openEventAttendeesModal = function(eventId) {
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
  window.removeAttendeeFromEvent = async function(eventId, memberId) {
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
  window.toggleMemberPaidStatus = async function(monthKey, memberId, isChecked) {
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

  window.openMemberBreakdownModal = function(memberId, monthKey) {
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

  // --- Arabic PDF Statement Generation (RTL, Cairo Font, Luxury 4Directions Theme) ---

  window.generateMemberStatementPDF = function(memberId, monthKey) {
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
          return `${escapeHTML(t.description)} (${t.amount} ج.م)`;
        }).join(' + ');
      }

      tableRowsHTML += `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td><strong>${escapeHTML(evt.eventName)}</strong></td>
          <td style="text-align: center;">${escapeHTML(evt.eventDate)}</td>
          <td style="text-align: center;">${evt.baseRate} ج.م</td>
          <td style="text-align: center; color: #1e7e34;">+${evt.bonus} ج.م</td>
          <td style="text-align: center; color: #b02a37;">-${evt.deductions} ج.م</td>
          <td>${extraTasksString}</td>
          <td style="text-align: center; font-weight: 800; color: #121212;">${evt.netAmount} ج.م</td>
        </tr>
      `;
    });

    const isPaid = settlementsMap[`${monthKey}_${memberId}`]?.paid || false;
    const paidBadgeHTML = isPaid 
      ? `<span style="color: #155724; background: #d4edda; border: 1px solid #c3e6cb; padding: 4px 10px; border-radius: 4px; font-weight: 700;">تم سداد المستحقات بالكامل ✓</span>`
      : `<span style="color: #856404; background: #fff3cd; border: 1px solid #ffeeba; padding: 4px 10px; border-radius: 4px; font-weight: 700;">قيد المراجعة والتحويل</span>`;

    const nowFormatted = new Date().toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    pdfContentContainer.innerHTML = `
      <!-- Header -->
      <div class="pdf-header">
        <div class="pdf-brand-logo">
          <img src="logo.png" alt="4Directions Logo">
          <div class="pdf-brand-text">
            <h1>فور <span style="color: #d7b704;">دايركشنز</span></h1>
            <p>4Directions Event Organizers Management</p>
          </div>
        </div>
        <div class="pdf-meta-box">
          <div class="doc-title">كشف حساب مستحقات مالية</div>
          <div class="doc-date">شهر: <strong>${getArabicMonthName(monthKey)}</strong></div>
          <div class="doc-date" style="font-size: 11px;">تاريخ الإصدار: ${nowFormatted}</div>
        </div>
      </div>

      <!-- Member Details Box -->
      <div class="pdf-member-grid">
        <div class="pdf-info-cell">
          <span class="cell-lbl">اسم العضو:</span>
          <span class="cell-val">${escapeHTML(member.name)}</span>
        </div>
        <div class="pdf-info-cell">
          <span class="cell-lbl">الكود / المعرّف:</span>
          <span class="cell-val" style="font-family: monospace;">${escapeHTML(member.code || '-')}</span>
        </div>
        <div class="pdf-info-cell">
          <span class="cell-lbl">الرتبة في الفريق:</span>
          <span class="cell-val">${escapeHTML(member.rank || '-')}</span>
        </div>
        <div class="pdf-info-cell">
          <span class="cell-lbl">طريقة الدفع المعتمدة:</span>
          <span class="cell-val">${escapeHTML(member.paymentMethod || '-')}</span>
        </div>
        <div class="pdf-info-cell">
          <span class="cell-lbl">رقم الحساب / المحفظة:</span>
          <span class="cell-val">${escapeHTML(member.paymentAccount || '-')}</span>
        </div>
        <div class="pdf-info-cell">
          <span class="cell-lbl">حالة السداد:</span>
          <span class="cell-val">${paidBadgeHTML}</span>
        </div>
      </div>

      <!-- Breakdown Table -->
      <table class="pdf-table">
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">م</th>
            <th>اسم الفعالية / الحفلة</th>
            <th style="text-align: center;">التاريخ</th>
            <th style="text-align: center;">الأجر الأساسي</th>
            <th style="text-align: center;">البونص</th>
            <th style="text-align: center;">الخصومات</th>
            <th>مهام إضافية</th>
            <th style="text-align: center;">صافي الحفلة</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHTML}
        </tbody>
      </table>

      <!-- Financial Totals Summary Box -->
      <div class="pdf-summary-box">
        <div class="pdf-summary-left">
          <span class="sum-lbl">ملخص العمليات الحسابية:</span>
          <span class="sum-pay">
            الأجور الأساسية (${sumBase} ج.م) + إجمالي البونص (${sumBonus} ج.م) + إضافي (${sumExtra} ج.م) - خصومات (${sumDeductions} ج.م)
          </span>
          <span class="sum-pay" style="color: #ffd700; margin-top: 4px;">
            إجمالي عدد الفعاليات المنفذة: ${attendedEvents.length} فعالية
          </span>
        </div>
        <div class="pdf-summary-right">
          <span style="font-size: 12px; color: #dddddd; display: block;">الإجمالي النهائي المستحق:</span>
          <span class="pdf-grand-total">${grandTotal} ج.م</span>
        </div>
      </div>

      <!-- Stamp and Signatures Footer -->
      <div class="pdf-footer-stamp">
        <div>
          <strong>ملاحظات الإدارة:</strong><br>
          <span style="font-size: 11px; color: #555555;">
            يتم تحويل المستحقات بناءً على بيانات الدفع المسجلة أعلاه (${escapeHTML(member.paymentMethod || '')}: ${escapeHTML(member.paymentAccount || '')}).
          </span>
        </div>
        <div class="pdf-signature-area">
          <div class="pdf-signature-line"></div>
          <strong>إدارة فور دايركشنز</strong>
        </div>
      </div>
    `;

    // Trigger html2pdf export with Cairo and high-DPI canvas
    const opt = {
      margin: [8, 8, 8, 8],
      filename: `كشف-حساب-${member.name.replace(/\s+/g, '-')}-${monthKey}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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

  // --- Admin User Operations ---

  if (addUserForm) {
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
  }

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

  if (addTeamForm) {
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
  }

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

  if (messageForm) {
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
  }

  if (textInput) textInput.addEventListener('input', updateTextareaCounters);

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      
      if (searchInput.value.length > 0) {
        clearSearchBtn.style.display = 'block';
      } else {
        clearSearchBtn.style.display = 'none';
      }
      
      renderMessages();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
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

  function updateTextareaCounters() {
    if (!textInput || !charCountEl) return;
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
    if (!messagesGrid) return;
    
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

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function showToast(message, type = 'info') {
    if (!toastContainer) return;

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
    }, 3500);

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
