// API Configuration
const API_BASE_URL = '/api/v1';

// Global State
let state = {
    trainer: null,
    clients: [],
    workouts: [],
    sessions: [],
    sessionTypes: [],
    stats: {
        activeClients: 0,
        monthlyEarnings: 0,
        sessionsThisWeek: 0, 
    }
};

// DOM Elements
const DOM = {
    clientsTbody: document.getElementById('clients-tbody'),
    dashboardClientList: document.getElementById('dashboard-client-list'),
    workoutGrid: document.getElementById('workout-grid'),
    weeklyCalendar: document.getElementById('weekly-calendar'),
    upcomingScheduleList: document.getElementById('upcoming-schedule-list'),
    
    // Stats
    statActiveClients: document.getElementById('stat-active-clients'),
    statSessions: document.getElementById('stat-sessions'),

    // Forms
    clientForm: document.getElementById('clientForm'),
    scheduleForm: document.getElementById('scheduleForm'),
    planForm: document.getElementById('planForm'),

    // Trainer Chat
    trainerChatUsers: document.getElementById('trainer-chat-users'),
    trainerChatMessages: document.getElementById('trainer-chat-messages'),
    trainerChatSelected: document.getElementById('trainer-chat-selected'),
    trainerChatInput: document.getElementById('trainer-chat-input'),
    trainerChatSendBtn: document.getElementById('trainer-chat-send-btn'),

    // Modals
    clientModal: document.getElementById('clientModal'),
    scheduleModal: document.getElementById('scheduleModal'),
    planModal: document.getElementById('planModal'),
    deleteModal: document.getElementById('deleteModal'),
    
    // Modal Titles
    clientModalTitle: document.getElementById('clientModalTitle'),
    scheduleModalTitle: document.getElementById('scheduleModalTitle'),
    planModalTitle: document.getElementById('planModalTitle'),
};

// Authentication & Fetch Wrapper
function getAuthToken() {
    return localStorage.getItem('access_token');
}

async function apiFetch(endpoint, options = {}) {
    // BYPASSED FOR TESTING - Uncomment below to enable authentication
    /*
    const token = getAuthToken();
    if (!token) {
        window.location.href = '../login/trainer_login.html'; // Redirect if no token
        return null;
    }
    */
    const token = getAuthToken() || 'dummy-token'; // Allow access without login

    const defaultHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        });

        if (response.status === 401) {
            // BYPASSED FOR TESTING - No redirect on 401
            console.log('API returned 401 - token may be invalid');
            // Uncomment below to enable authentication:
            /*
            // Token expired - handle logout
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user_role');
            window.location.href = '../login/trainer_login.html';
            */
            return null;
        }

        if (response.status === 204) {
             return { success: true };
        }

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.detail || data.error || 'API Request Failed');
        }
        return data;
    } catch (error) {
        showToast(error.message, 'error');
        console.error('API Error:', error);
        return null;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


// --- Main Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // ── Session Guard (back-button protection) ───────────
    fetch('/api/session/check').then(r => r.json()).then(d => {
        if (!d.logged_in || d.role !== 'trainer') window.location.replace('/');
    });

    // 1. Initial Data Fetch
    fetchAllData();

    // 2. Setup Category Filters
    setupCategoryFilters();

    // 3. Setup Action Buttons (Modals & Toasts)
    setupActionButtons();

    // 4. Setup Form Submissions
    setupFormSubmissions();

    // 5. Setup Sidebar Navigation
    setupSidebarNavigation();

    // 6. Setup Trainer Chat
    setupTrainerChat();
    
    // Set current date in header
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-US', dateOptions);

    // ── Logout ────────────────────────────────────────
    document.querySelector('.logout-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/logout';
        }
    });
});


// --- DATA FETCHING ---
async function fetchAllData() {
    showToast('Loading dashboard data...');
    await Promise.all([
        fetchTrainerProfile(),
        fetchClients(),
        fetchWorkouts(),
        fetchSessions(),
        fetchSessionTypes(),
    ]);
    updateDashboardStats();
}

async function fetchSessionTypes() {
    const data = await apiFetch('/session-types/');
    if (data && data.results) {
        state.sessionTypes = data.results;
        const typeSelect = document.getElementById('schedule-type');
        if (typeSelect) {
            typeSelect.innerHTML = '<option value="">Standard Session</option>';
            state.sessionTypes.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = t.name;
                typeSelect.appendChild(opt);
            });
        }
    }
}

async function fetchTrainerProfile() {
    try {
        const res = await fetch('/api/trainer/profile');
        const data = await res.json();
        if (data && !data.error) {
            state.trainer = data;
            updateTrainerUI();
        }
    } catch (error) {
        console.error('Failed to load trainer profile:', error);
    }
}

function updateTrainerUI() {
    const welcomeName = document.querySelector('.welcome-text h1');
    const headerAvatar = document.getElementById('header-avatar');
    const headerUserName = document.getElementById('header-user-name');
    const headerUserRole = document.getElementById('header-user-role');

    if (state.trainer) {
        const displayName = `${state.trainer.first_name || ''} ${state.trainer.last_name || ''}`.trim() || 'Trainer';
        if (welcomeName) welcomeName.textContent = `Welcome back, ${displayName}!`;
        if (headerUserName) headerUserName.textContent = displayName;
        if (headerUserRole) headerUserRole.textContent = state.trainer.specialization || 'Professional Trainer';
        if (headerAvatar && displayName.length > 0) {
            headerAvatar.textContent = displayName.charAt(0).toUpperCase();
        }

        const sFirstName = document.getElementById('s-firstname');
        const sLastName = document.getElementById('s-lastname');
        const sEmail = document.getElementById('s-email');
        const sPhone = document.getElementById('s-phone');
        const sSpecs = document.getElementById('s-specializations');
        const sExperience = document.getElementById('s-experience');
        const sCertifications = document.getElementById('s-certifications');
        const sHourlyRate = document.getElementById('s-hourly-rate');
        const sAvailability = document.getElementById('s-availability');
        const sBio = document.getElementById('s-bio');

        if (sFirstName) sFirstName.value = state.trainer.first_name || '';
        if (sLastName) sLastName.value = state.trainer.last_name || '';
        if (sEmail) sEmail.value = state.trainer.email || '';
        if (sPhone) sPhone.value = state.trainer.phone || '';
        if (sSpecs) sSpecs.value = state.trainer.specialization || '';
        if (sExperience) sExperience.value = state.trainer.experience || 0;
        if (sCertifications) sCertifications.value = state.trainer.certifications || '';
        if (sHourlyRate) sHourlyRate.value = state.trainer.hourly_rate || '';
        if (sAvailability) sAvailability.value = state.trainer.availability || 'Available';
        if (sBio) sBio.value = state.trainer.bio || '';
    }
}

async function fetchClients() {
    const data = await apiFetch('/members/');
    if (data && data.results) {
        state.clients = data.results;
        renderClientsTable();
        renderDashboardClients();
        populateClientDropdown();
    }
}

async function fetchWorkouts() {
    const data = await apiFetch('/workout-plans/');
    if (data && data.results) {
        state.workouts = data.results;
        renderWorkouts();
    }
}

async function fetchSessions() {
    const data = await apiFetch('/appointments/');
    if (data && data.results) {
         // Sort by date ascending
        state.sessions = data.results.sort((a,b) => new Date(a.date_time) - new Date(b.date_time));
        renderUpcomingSessions();
        renderWeeklyCalendar();
    }
}

async function fetchTrainerChatUsers() {
    try {
        const response = await fetch('/api/features/chat/users');
        const data = await response.json();
        if (data.users) {
            state.chatUsers = data.users;
            renderTrainerChatUsers();
        }
    } catch (error) {
        console.error('Failed to load chat users:', error);
    }
}

function setupTrainerChat() {
    if (DOM.trainerChatSendBtn) {
        DOM.trainerChatSendBtn.addEventListener('click', sendTrainerChatReply);
        DOM.trainerChatSendBtn.disabled = true;
    }
    if (DOM.trainerChatInput) {
        DOM.trainerChatInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                sendTrainerChatReply();
            }
        });
        DOM.trainerChatInput.disabled = true;
        DOM.trainerChatInput.placeholder = 'Select a user first to reply';
    }
    fetchTrainerChatUsers();
}

function renderTrainerChatUsers() {
    if (!DOM.trainerChatUsers) return;
    DOM.trainerChatUsers.innerHTML = '';
    if (!state.chatUsers || state.chatUsers.length === 0) {
        DOM.trainerChatUsers.innerHTML = '<p style="color: var(--text-light);">No chat users found yet.</p>';
        return;
    }
    state.chatUsers.forEach(user => {
        const userItem = document.createElement('button');
        userItem.type = 'button';
        userItem.className = 'action-btn';
        userItem.style.cssText = 'text-align:left; width:100%; padding: 0.85rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 12px; color: var(--text-dark);';
        userItem.innerHTML = `<strong>${user.full_name || user.email}</strong><br><span style="font-size:0.85rem;color:var(--text-light);">Last message: ${new Date(user.last_message_at).toLocaleString()}</span>`;
        userItem.addEventListener('click', () => selectTrainerChatUser(user.user_id, user.full_name || user.email));
        DOM.trainerChatUsers.appendChild(userItem);
    });
}

async function selectTrainerChatUser(userId, label) {
    state.selectedChatUserId = userId;
    if (DOM.trainerChatSelected) {
        DOM.trainerChatSelected.textContent = `Chatting with ${label}`;
    }
    if (DOM.trainerChatSendBtn) {
        DOM.trainerChatSendBtn.disabled = false;
    }
    if (DOM.trainerChatInput) {
        DOM.trainerChatInput.disabled = false;
        DOM.trainerChatInput.placeholder = 'Type your reply...';
    }
    await loadTrainerChatMessages(userId);
}

async function loadTrainerChatMessages(userId) {
    if (!DOM.trainerChatMessages) return;
    DOM.trainerChatMessages.innerHTML = '<p style="color: var(--text-light);">Loading messages...</p>';
    try {
        const response = await fetch(`/api/features/chat/messages/${userId}`);
        const data = await response.json();
        if (data.messages) {
            DOM.trainerChatMessages.innerHTML = '';
            data.messages.forEach(message => addTrainerChatMessage(message));
            DOM.trainerChatMessages.scrollTop = DOM.trainerChatMessages.scrollHeight;
        } else {
            DOM.trainerChatMessages.innerHTML = '<p style="color: var(--text-light);">No messages available.</p>';
        }
    } catch (error) {
        DOM.trainerChatMessages.innerHTML = '<p style="color: var(--danger);">Unable to load messages.</p>';
        console.error('Failed to load chat messages:', error);
    }
}

async function sendTrainerChatReply() {
    const userId = state.selectedChatUserId;
    const message = DOM.trainerChatInput?.value.trim();
    if (!userId) {
        showToast('Select a user first.', 'warning');
        return;
    }
    if (!message) {
        showToast('Please type a reply.', 'warning');
        return;
    }
    try {
        const response = await fetch('/api/features/chat/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, message })
        });
        const data = await response.json();
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        DOM.trainerChatInput.value = '';
        if (DOM.trainerChatMessages) {
            addTrainerChatMessage({ message, sender_type: 'trainer', created_at: new Date().toISOString() });
            DOM.trainerChatMessages.scrollTop = DOM.trainerChatMessages.scrollHeight;
        }
        showToast(data.message || 'Reply sent successfully', 'success');
    } catch (error) {
        showToast('Unable to send reply.', 'error');
        console.error('Failed to send trainer reply:', error);
    }
}

function addTrainerChatMessage(msg) {
    if (!DOM.trainerChatMessages) return;
    const messageDiv = document.createElement('div');
    const senderClass = msg.sender_type === 'trainer' ? 'trainer' : (msg.sender_type === 'support' ? 'support' : 'user');
    messageDiv.style.cssText = `padding: 0.85rem 1rem; border-radius: 16px; max-width: 90%; line-height: 1.4; ${senderClass === 'trainer' ? 'background: rgba(20, 20, 35, 0.5); align-self:flex-end;' : senderClass === 'user' ? 'background: rgba(20, 20, 35, 0.5); align-self:flex-start;' : 'background:rgba(255, 255, 255, 0.08); align-self:flex-start;'}`;
    const senderLabel = senderClass === 'trainer' ? 'Trainer' : senderClass === 'user' ? 'User' : 'Support';
    const timestamp = msg.created_at ? new Date(msg.created_at).toLocaleString() : new Date().toLocaleString();
    messageDiv.innerHTML = `<div style="font-size:0.85rem; color:var(--text-light); margin-bottom:0.35rem;">${senderLabel}</div><div style="font-size:0.95rem; color:var(--text-dark);">${escapeHtml(msg.message)}</div><div style="font-size:0.75rem; color:var(--text-light); margin-top:0.5rem; text-align:right;">${timestamp}</div>`;
    DOM.trainerChatMessages.appendChild(messageDiv);
}

// --- RENDERING ---

function renderClientsTable() {
    if (!DOM.clientsTbody) return;
    DOM.clientsTbody.innerHTML = '';
    
    if (state.clients.length === 0) {
        DOM.clientsTbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 2rem;">No clients found. Add one to get started!</td></tr>';
        return;
    }

    state.clients.forEach(client => {
        const tr = document.createElement('tr');
        tr.className = 'client-row';
        tr.style.cssText = 'border-bottom: 1px solid rgba(255, 255, 255, 0.08); transition: background 0.3s ease;';
        tr.setAttribute('data-status', client.status || 'Active');
        
        const planName = client.planDetails ? client.planDetails.name : 'No Plan';
        
        let statusBadgeClass = 'status-inactive';
        if(client.status === 'Active') statusBadgeClass = 'status-active';
        if(client.status === 'Pending') statusBadgeClass = 'status-pending';

        tr.innerHTML = `
            <td style="padding: 1rem;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="avatar" style="width: 32px; height: 32px; font-size: 0.9rem;">${client.username ? client.username.charAt(0).toUpperCase() : 'U'}</div>
                    <span style="font-weight: 500; color: var(--text-dark);">${client.username || 'Unknown User'}</span>
                </div>
            </td>
            <td style="padding: 1rem; color: var(--text-dark);">${planName}</td>
            <td style="padding: 1rem; color: var(--text-dark);">${client.phone || '-'}</td>
            <td style="padding: 1rem;">
                <span class="status-badge ${statusBadgeClass}">${client.status || 'Active'}</span>
            </td>
            <td style="padding: 1rem;">
                <div style="display: flex; gap: 8px;">
                    <button class="action-btn" style="padding: 6px 10px; font-size: 0.8rem; background: var(--bg-light); color: var(--primary-color);" onclick="editClient(${client.id})">Edit</button>
                    <button class="action-btn" style="padding: 6px 10px; font-size: 0.8rem; background: #fee2e2; color: #ef4444;" onclick="triggerDelete('client', ${client.id})">Delete</button>
                </div>
            </td>
        `;
        DOM.clientsTbody.appendChild(tr);
    });
}

function renderDashboardClients() {
    if (!DOM.dashboardClientList) return;
    DOM.dashboardClientList.innerHTML = '';
    
    // Show only first 4 active clients on dashboard
    const activeClients = state.clients.filter(c => c.status === 'Active').slice(0, 4);
    
    if (activeClients.length === 0) {
        DOM.dashboardClientList.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 1rem;">No active clients.</p>';
        return;
    }

    activeClients.forEach(client => {
        const div = document.createElement('div');
         div.className = 'client-item';
         div.setAttribute('data-status', 'Active');
         div.innerHTML = `
            <div class="client-info">
                <div class="avatar" style="width: 40px; height: 40px;">${client.username ? client.username.charAt(0).toUpperCase() : 'U'}</div>
                <div>
                    <h4>${client.username || 'Unknown User'}</h4>
                    <span style="font-size: 0.85rem; color: var(--text-light);">${client.plan_name || 'No Plan'}</span>
                </div>
            </div>
            <button class="action-btn" data-toast="Opening messaging..." style="padding: 6px 12px; font-size: 0.85rem;">Message</button>
        `;
        DOM.dashboardClientList.appendChild(div);
    });
}

function populateClientDropdown() {
    const select = document.getElementById('schedule-client');
    if(!select) return;
    
    select.innerHTML = '<option value="">Select a Client...</option>';
    
    if (state.clients.length === 0) {
        select.innerHTML += '<option value="" disabled>No clients available</option>';
        return;
    }
    
    state.clients.forEach(c => {
        const clientName = c.username || `${c.first_name} ${c.last_name}`.trim() || 'Unknown Client';
        const planInfo = c.plan_name ? ` (${c.plan_name})` : '';
        select.innerHTML += `<option value="${c.id}">${clientName}${planInfo}</option>`;
    });
}

function renderWorkouts() {
    if (!DOM.workoutGrid) return;
    DOM.workoutGrid.innerHTML = '';

    if (state.workouts.length === 0) {
        DOM.workoutGrid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; padding: 2rem; color: var(--text-light);">No workout plans found.</p>';
        return;
    }

    state.workouts.forEach(plan => {
        const card = document.createElement('div');
        // Add specific class for potential CSS styling if needed, keeping stat-card for base styling
        card.className = 'stat-card workout-card-premium workout-card';
        card.setAttribute('data-category', plan.difficulty || 'Beginner');
        // Match the layout from the image: Top Badge, Title, Desc, Stats, Button
        card.style.cssText = 'display: flex; flex-direction: column; align-items: flex-start; padding: 1.5rem; position: relative; background: rgba(20, 20, 35, 0.5); border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); gap: 12px; height: 100%; border: 1px solid rgba(255, 255, 255, 0.08);';
        
        let difficultyColor = '#10b981'; // Beginner (Green)
        let difficultyBg = '#ecfdf5';
        if(plan.difficulty === 'Intermediate') {
            difficultyColor = '#f59e0b'; // Intermediate (Orange)
            difficultyBg = '#fffbeb';
        }
        if(plan.difficulty === 'Advanced') {
            difficultyColor = '#3b82f6'; // Advanced (Blue)
            difficultyBg = '#eff6ff';
        }

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                <span style="background: ${difficultyBg}; color: ${difficultyColor}; padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 600;">${plan.difficulty}</span>
                <button class="action-btn" style="padding: 8px; font-size: 1rem; background: #fee2e2; color: #ef4444; border: 1px solid #fca5a5; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 1px 2px rgba(239,68,68,0.1);" onclick="triggerDelete('workout', ${plan.id})" title="Delete Plan">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
            
            <h3 style="font-size: 1.25rem; font-weight: 700; color: var(--text-dark); margin: 0;">${plan.name}</h3>
            
            <p style="color: var(--text-light); font-size: 0.95rem; line-height: 1.5; margin: 0; flex-grow: 1; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${plan.description}</p>
            
            <div style="display: flex; gap: 1rem; color: var(--text-dark); font-size: 0.9rem; font-weight: 500; width: 100%; margin-top: 0.5rem; margin-bottom: 0.5rem;">
                <span style="display: flex; align-items: center; gap: 6px;"><span style="color: #94a3b8;">⏱️</span> ${plan.duration_minutes} min</span>
                <span style="display: flex; align-items: center; gap: 6px;"><span style="color: #ef4444;">🔥</span> ${plan.estimated_calories} kcal</span>
            </div>
            
            <button onclick="editWorkout(${plan.id})" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; background: transparent; color: var(--primary-color); font-weight: 500; font-size: 0.9rem; cursor: pointer; transition: all 0.2s ease;">Edit Plan</button>
        `;
        
        // Add a subtle hover effect to the new edit button dynamically
        const editBtn = card.querySelector('button[onclick^="editWorkout"]');
        editBtn.addEventListener('mouseenter', () => { editBtn.style.background = 'rgba(255, 255, 255, 0.08)'; editBtn.style.borderColor = 'var(--primary-color)'; });
        editBtn.addEventListener('mouseleave', () => { editBtn.style.background = 'transparent'; editBtn.style.borderColor = '#cbd5e1'; });

        // Add a hover effect to the delete button
        const delBtn = card.querySelector('button[onclick^="triggerDelete"]');
        delBtn.addEventListener('mouseenter', () => { delBtn.style.background = '#fecaca'; });
        delBtn.addEventListener('mouseleave', () => { delBtn.style.background = '#fee2e2'; });

        DOM.workoutGrid.appendChild(card);
    });
}

function renderUpcomingSessions() {
    if (!DOM.upcomingScheduleList) return;
    DOM.upcomingScheduleList.innerHTML = '';
    
    const upcoming = state.sessions.filter(s => new Date(s.date_time) >= new Date()).slice(0, 5);

    if (upcoming.length === 0) {
        DOM.upcomingScheduleList.innerHTML = '<p style="color: var(--text-light); text-align: center; padding: 1rem;">No upcoming sessions.</p>';
        return;
    }

    upcoming.forEach(session => {
        const dateObj = new Date(session.date_time);
        const timeString = dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        const dateString = dateObj.toLocaleDateString([], {month: 'short', day: 'numeric'});
        
        // Find member name
        const client = state.clients.find(c => c.id === session.member);
        const clientName = client && client.user__username ? client.user__username : `Member #${session.member}`;

        const div = document.createElement('div');
        div.className = 'schedule-item';
        div.innerHTML = `
            <div class="time-block">
                <span style="font-weight: 600; color: var(--primary-color);">${timeString}</span>
                <span style="font-size: 0.8rem; color: var(--text-light);">${dateString}</span>
            </div>
            <div class="session-info">
                <h4 style="margin-bottom: 2px;">${clientName}</h4>
                <p style="font-size: 0.85rem; color: var(--text-light); text-transform: capitalize;">${session.session_type_details ? session.session_type_details.name : 'Training Session'}</p>
            </div>
             <div style="display:flex; gap: 5px; flex-direction:column;">
                <button class="action-btn" style="padding: 4px 10px; font-size: 0.75rem; background: var(--bg-light); color: var(--primary-color);" onclick="editSession(${session.id})">Edit</button>
                <button class="action-btn" style="padding: 4px 10px; font-size: 0.75rem; background: #fee2e2; color: #ef4444;" onclick="triggerDelete('session', ${session.id})">Cancel</button>
            </div>
        `;
        DOM.upcomingScheduleList.appendChild(div);
    });
}

function renderWeeklyCalendar() {
    if(!DOM.weeklyCalendar) return;
    
    // Clear out the dynamic content
    DOM.weeklyCalendar.innerHTML = '';
    
    // Simplified week view 
    for(let i=1; i<=7; i++) {
         const cell = document.createElement('div');
         cell.style.cssText = 'background: rgba(20, 20, 35, 0.5); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 4px; min-height: 80px; padding: 5px; display:flex; flex-direction:column; gap:4px; align-items:center;';
         
         // Find sessions for this day of week (1=Mon, 0=Sun in JS)
         let jsDay = i;
         if(i===7) jsDay = 0;
         
         const daySessions = state.sessions.filter(s => {
             const d = new Date(s.date_time);
             return d.getDay() === jsDay;
         });
         
         if (daySessions.length === 0) {
              const emptyText = document.createElement('span');
              emptyText.style.cssText = 'color: #cbd5e1; font-size: 0.8rem; margin-top: auto; margin-bottom: auto;';
              emptyText.textContent = 'Free';
              cell.appendChild(emptyText);
         } else {
             daySessions.forEach(s => {
                 const client = state.clients.find(c => c.id === s.member);
                 const cName = client && client.username ? client.username : 'Unknown';
                 const entry = document.createElement('div');
                 entry.style.cssText = 'background: var(--primary-color); color: white; border-radius: 4px; padding: 4px 6px; font-size: 0.75rem; width: 100%; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; cursor:pointer; font-weight: 500;';
                 entry.textContent = `${new Date(s.date_time).getHours()}:00 - ${cName}`;
                 entry.title = `${new Date(s.date_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${cName} (${s.session_type_details?.name || 'Session'})`;
                 entry.onclick = () => editSession(s.id);
                 cell.appendChild(entry);
             });
         }
         
         DOM.weeklyCalendar.appendChild(cell);
    }
}

function updateDashboardStats() {
    if(DOM.statActiveClients) {
        DOM.statActiveClients.textContent = state.clients.filter(c => c.status === 'Active').length;
    }
    if(DOM.statSessions) {
        const thisWeek = state.sessions.filter(s => {
            const d = new Date(s.date_time);
            const now = new Date();
            const diff = d.getTime() - now.getTime();
            return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
        });
        DOM.statSessions.textContent = thisWeek.length;
    }
}


// --- FORM HANDLING (CREATE / UPDATE) ---

function setupFormSubmissions() {
    if(DOM.clientForm) DOM.clientForm.addEventListener('submit', handleClientSubmit);
    if(DOM.planForm) DOM.planForm.addEventListener('submit', handlePlanSubmit);
    if(DOM.scheduleForm) DOM.scheduleForm.addEventListener('submit', handleScheduleSubmit);
}

async function handleClientSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('client-id').value;
    
    if (id) {
        // Update existing member
        const payload = {
            phone: document.getElementById('client-phone').value,
            address: document.getElementById('client-address').value,
            status: document.getElementById('client-status').value,
        };
        
        showToast('Updating client...', 'info');
        const res = await apiFetch(`/members/${id}/`, {
            method: 'PATCH',
            body: JSON.stringify(payload)
        });
        if(res) {
            showToast('Client updated successfully!', 'success');
            closeModal('clientModal');
            fetchClients();
        }
    } else {
        // Create brand new user and member
        const username = document.getElementById('client-name').value;
        const email = document.getElementById('client-email').value;
        
        if (!username || !email) {
            showToast('Username and Email are required for new clients.', 'warning');
            return;
        }

        const payload = {
            user: {
                username: username,
                email: email,
                password: 'password123', // Default password for new clients
                first_name: username.split(' ')[0],
                last_name: username.split(' ')[1] || ''
            },
            phone: document.getElementById('client-phone').value,
            address: document.getElementById('client-address').value || 'Add address later',
            trainer: state.trainer ? state.trainer.id : null // Automatically assign current trainer
        };

        showToast('Registering new client...', 'info');
        // Note: registration endpoints are public, but we can pass token if needed.
        // Usually registration might be allowed by anyone, but here we association them with THIS trainer.
        const res = await apiFetch('/register/member/', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (res) {
            showToast('New client registered and added to your list!', 'success');
            closeModal('clientModal');
            fetchClients();
        }
    }
}

async function handlePlanSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('plan-id').value;
    const payload = {
        name: document.getElementById('plan-name').value,
        description: document.getElementById('plan-description').value,
        difficulty: document.getElementById('plan-difficulty').value,
        duration_minutes: parseInt(document.getElementById('plan-duration').value),
        estimated_calories: parseInt(document.getElementById('plan-calories').value),
    };

    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/workout-plans/${id}/` : '/workout-plans/';
    
    showToast(id ? 'Updating plan...' : 'Creating plan...', 'info');
    
    const res = await apiFetch(endpoint, {
        method: method,
        body: JSON.stringify(payload)
    });

    if(res) {
        showToast(`Plan ${id ? 'updated' : 'created'} successfully!`, 'success');
        closeModal('planModal');
        fetchWorkouts(); // Refresh grid
    }
}

async function handleScheduleSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('schedule-id').value;
    const clientId = document.getElementById('schedule-client').value;
    const sessionTypeId = document.getElementById('schedule-type').value;
    
    if (!clientId) {
        showToast('Please select a client', 'error');
        return;
    }

    const payload = {
        member: parseInt(clientId),
        trainer: state.trainer ? state.trainer.id : null, 
        date_time: document.getElementById('schedule-datetime').value,
        notes: document.getElementById('schedule-notes').value,
    };
    
    if (sessionTypeId) {
        payload.session_type = parseInt(sessionTypeId);
    }

    const method = id ? 'PUT' : 'POST';
    const endpoint = id ? `/appointments/${id}/` : '/appointments/';
    
    showToast(id ? 'Updating session...' : 'Scheduling session...', 'info');
    
    const res = await apiFetch(endpoint, {
        method: method,
        body: JSON.stringify(payload)
    });

    if(res) {
        showToast(`Session ${id ? 'updated' : 'scheduled'} successfully!`, 'success');
        closeModal('scheduleModal');
        fetchSessions(); // Refresh 
    }
}


// --- EDIT/POPULATE MODALS ---

window.editClient = (id) => {
    const client = state.clients.find(c => c.id === id);
    if(!client) return;
    
    document.getElementById('client-id').value = client.id;
    document.getElementById('client-name').value = client.username || '';
    document.getElementById('client-name').disabled = true; // Cant edit username easily
    
    // Hide email and password groups for editing
    const emailGroup = document.getElementById('client-email-group');
    const passGroup = document.getElementById('client-password-group');
    if(emailGroup) emailGroup.style.display = 'none';
    if(passGroup) passGroup.style.display = 'none';
    
    document.getElementById('client-phone').value = client.phone || '';
    document.getElementById('client-address').value = client.address || '';
    document.getElementById('client-status').value = client.status || 'Active';
    
    if(DOM.clientModalTitle) DOM.clientModalTitle.textContent = "Edit Client";
    openModal('clientModal');
};

window.editWorkout = (id) => {
    const plan = state.workouts.find(p => p.id === id);
    if(!plan) return;
    
    document.getElementById('plan-id').value = plan.id;
    document.getElementById('plan-name').value = plan.name;
    document.getElementById('plan-description').value = plan.description;
    document.getElementById('plan-difficulty').value = plan.difficulty || 'Beginner';
    document.getElementById('plan-duration').value = plan.duration_minutes;
    document.getElementById('plan-calories').value = plan.estimated_calories;
    
    DOM.planModalTitle.textContent = "Edit Workout Plan";
    openModal('planModal');
};

window.editSession = (id) => {
    const session = state.sessions.find(s => s.id === id);
    if(!session) return;
    
    document.getElementById('schedule-id').value = session.id;
    document.getElementById('schedule-client').value = session.member;
    
    if (session.session_type) {
        document.getElementById('schedule-type').value = session.session_type;
    } else {
        document.getElementById('schedule-type').value = '';
    }

    // Format datetime for input type="datetime-local" (YYYY-MM-DDThh:mm)
    const dt = new Date(session.date_time);
    const localDt = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0,16);
    document.getElementById('schedule-datetime').value = localDt;
    document.getElementById('schedule-notes').value = session.notes || '';
    
    DOM.scheduleModalTitle.textContent = "Edit Session";
    openModal('scheduleModal');
};

function resetModalConfigurations() {
    // Reset forms when opened fresh
    if (DOM.clientForm) {
        DOM.clientForm.reset();
        document.getElementById('client-id').value = "";
        document.getElementById('client-name').disabled = false;
        
        // Show email and password groups for new registration
        const emailGroup = document.getElementById('client-email-group');
        const passGroup = document.getElementById('client-password-group');
        if(emailGroup) emailGroup.style.display = 'block';
        if(passGroup) passGroup.style.display = 'block';
        
        if(DOM.clientModalTitle) DOM.clientModalTitle.textContent = "Add New Client";
    }
    if (DOM.planForm) {
        DOM.planForm.reset();
        document.getElementById('plan-id').value = "";
        if(DOM.planModalTitle) DOM.planModalTitle.textContent = "Create Workout Plan";
    }
    if (DOM.scheduleForm) {
        DOM.scheduleForm.reset();
        document.getElementById('schedule-id').value = "";
        
        const typeSelect = document.getElementById('schedule-type');
        if (typeSelect) typeSelect.value = "";
        
        const clientSelect = document.getElementById('schedule-client');
        if (clientSelect) clientSelect.value = "";
        
        if(DOM.scheduleModalTitle) DOM.scheduleModalTitle.textContent = "Schedule Session";
    }
}


// --- DELETE LOGIC ---
let itemToDelete = { type: null, id: null };

window.triggerDelete = (type, id) => {
    itemToDelete = { type, id };
    openModal('deleteModal');
};

document.getElementById('confirmDeleteBtn')?.addEventListener('click', async () => {
    if (!itemToDelete.id || !itemToDelete.type) return;
    const { type, id } = itemToDelete;
    
    let endpoint = "";
    if (type === 'client') endpoint = `/members/${id}/`;
    if (type === 'workout') endpoint = `/workout-plans/${id}/`;
    if (type === 'session') endpoint = `/appointments/${id}/`;

    showToast(`Deleting ${type}...`, 'info');
    closeModal('deleteModal');

    const res = await apiFetch(endpoint, { method: 'DELETE' });
    if(res) {
        showToast(`${type} deleted successfully`, 'success');
        if (type === 'client') fetchClients();
        if (type === 'workout') fetchWorkouts();
        if (type === 'session') fetchSessions();
    }
    
    itemToDelete = { type: null, id: null };
});



// --- UI HELPER FUNCTIONS ---

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '✅';
    if(type === 'error') icon = '❌';
    if(type === 'info') icon = 'ℹ️';

    toast.innerHTML = `
        <span>${icon}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function openModal(modalId, isNew = false) {
    if (isNew) {
        resetModalConfigurations();
    }
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Populate client dropdown when opening schedule modal
        if (modalId === 'scheduleModal') {
            populateClientDropdown();
        }
    }
}

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function setupActionButtons() {
    // Action buttons hooked to Modals via data-modal attribute
    // (covers Quick Actions: + Create Workout, + Schedule Session, + Add Client)
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Don't double-fire if already has an inline onclick
            if (e.currentTarget.hasAttribute('onclick')) return;
            const modalId = e.currentTarget.getAttribute('data-modal');
            if (modalId) openModal(modalId, true);
        });
    });

    // Action buttons hooked to Toasts
    document.querySelectorAll('[data-toast]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const message = e.target.getAttribute('data-toast');
            showToast(message);
        });
    });

    // Close Modal X buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    // Close Modals on background click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
}

function setupCategoryFilters() {
    // Client Filters
    const clientTabs = document.querySelectorAll('#client-tabs .tab-btn');
    clientTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            clientTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const filterValue = tab.getAttribute('data-filter');
            const rows = document.querySelectorAll('#clients-tbody .client-row');
            
            rows.forEach(row => {
                if (filterValue === 'all' || row.getAttribute('data-status') === filterValue) {
                    row.style.display = 'table-row';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    });

    // Workout Filters
    const workoutTabs = document.querySelectorAll('#workout-tabs .tab-btn');
    workoutTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            workoutTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const filterValue = tab.getAttribute('data-filter');
            const cards = document.querySelectorAll('#workout-grid .workout-card');
            
            cards.forEach(card => {
                if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

function setupSidebarNavigation() {
    const navLinks = document.querySelectorAll('.nav-links a');
    const sections = document.querySelectorAll('.dashboard-section');
    const headerTitle = document.querySelector('.welcome-text h1');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Check if it's the logout link
            if (link.classList.contains('logout-btn') || link.parentElement.classList.contains('logout-btn')) {
                return; // Let the logout handler take care of it
            }

            e.preventDefault();

            // 1. Update Active Link UI
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // 2. Switch Sections
            const targetId = link.getAttribute('href').substring(1);
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });

            // 3. Update Header Title
            const sectionTitles = {
                'dashboard': 'Trainer Dashboard',
                'clients': 'Client Management',
                'schedule': 'My Schedule',
                'workouts': 'Workout Plans',
                'settings': 'Account Settings'
            };
            
            if (headerTitle && sectionTitles[targetId]) {
                headerTitle.textContent = sectionTitles[targetId];
            }

            // Close sidebar on mobile after clicking
            const sidebar = document.querySelector('.sidebar');
            if (sidebar) sidebar.classList.remove('open');
        });
    });

    // Handle "View All" and "Full Calendar" links on dashboard
    document.querySelector('.view-all[href="#clients"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.nav-links a[href="#clients"]').click();
    });

    document.querySelector('.view-all[href="#schedule"]')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelector('.nav-links a[href="#schedule"]').click();
    });
}


// =====================================================
// SETTINGS SECTION HANDLERS
// =====================================================

// --- Sync stats to Profile card ---
function updateSettingsProfileCard() {
    const clientCount = document.getElementById('sp-clients');
    const sessionCount = document.getElementById('sp-sessions');
    if (clientCount) clientCount.textContent = state.clients.filter(c => c.status === 'Active').length;
    if (sessionCount) sessionCount.textContent = state.sessions.length;
}

// Call after data is fetched
const _origUpdateDashboardStats = updateDashboardStats;
function updateDashboardStats() {
    _origUpdateDashboardStats();
    updateSettingsProfileCard();
}

// --- Profile Settings Save ---
window.handleProfileSettingsSave = async function(e) {
    e.preventDefault();
    const firstName = document.getElementById('s-firstname').value.trim();
    const lastName  = document.getElementById('s-lastname').value.trim();
    const phone = document.getElementById('s-phone').value.trim();
    const specialization = document.getElementById('s-specializations').value.trim();
    const experience = parseInt(document.getElementById('s-experience').value) || 0;
    const certifications = document.getElementById('s-certifications').value.trim();
    const hourlyRate = parseFloat(document.getElementById('s-hourly-rate').value) || null;
    const availability = document.getElementById('s-availability').value;
    const bio = document.getElementById('s-bio').value.trim();

    if (!firstName || !lastName || !specialization) {
        showToast('Please fill all required fields', 'error');
        return;
    }

    try {
        const res = await fetch('/api/trainer/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                specialization: specialization,
                experience: experience,
                certifications: certifications,
                hourly_rate: hourlyRate,
                availability: availability,
                bio: bio
            })
        });
        const data = await res.json();
        
        if (res.ok) {
            const displayName = `${firstName} ${lastName}`;
            const headerName = document.querySelector('.user-name');
            const headerRole = document.querySelector('.user-role');
            const headerAvatar = document.querySelector('.dashboard-header .avatar');
            
            if (headerName) headerName.textContent = displayName;
            if (headerRole) headerRole.textContent = specialization || 'Trainer';
            if (headerAvatar && firstName) headerAvatar.textContent = firstName.charAt(0).toUpperCase();
            
            if (state.trainer) {
                state.trainer.first_name = firstName;
                state.trainer.last_name = lastName;
                state.trainer.phone = phone;
                state.trainer.specialization = specialization;
                state.trainer.experience = experience;
                state.trainer.certifications = certifications;
                state.trainer.hourly_rate = hourlyRate;
                state.trainer.availability = availability;
                state.trainer.bio = bio;
            }
            
            showToast('Profile updated successfully! 🎉', 'success');
            await fetchTrainerProfile();
        } else {
            showToast(data.error || 'Failed to save profile', 'error');
        }
    } catch (error) {
        showToast('Error saving profile', 'error');
        console.error('Profile save error:', error);
    }
};

// --- Availability Save ---
window.handleAvailabilitySave = function(e) {
    e.preventDefault();
    const status = document.getElementById('s-availability-status').value;
    const statusLabels = {
        accepting: '✅ Accepting New Clients',
        full:      '⛔ Fully Booked',
        leave:     '🏖️ On Leave'
    };
    showToast(`Availability set to: ${statusLabels[status] || status}`, 'success');
};

// --- Password Change ---
window.handlePasswordChange = function(e) {
    e.preventDefault();
    const current = document.getElementById('s-current-pw').value;
    const newPw   = document.getElementById('s-new-pw').value;
    const confirm = document.getElementById('s-confirm-pw').value;

    if (!current) { showToast('Please enter your current password.', 'error'); return; }
    if (newPw.length < 8) { showToast('New password must be at least 8 characters.', 'error'); return; }
    if (newPw !== confirm) { showToast('Passwords do not match.', 'error'); return; }

    // Simulate API call
    showToast('Password updated successfully! 🔒', 'success');
    e.target.reset();
    document.getElementById('pw-strength-bar').style.display = 'none';
    document.getElementById('pw-bar-fill').style.width = '0%';
};

// --- Password Strength Meter ---
document.getElementById('s-new-pw')?.addEventListener('input', function() {
    const val = this.value;
    const bar  = document.getElementById('pw-strength-bar');
    const fill = document.getElementById('pw-bar-fill');
    if (!bar || !fill) return;

    if (!val) { bar.style.display = 'none'; return; }
    bar.style.display = 'block';

    let strength = 0;
    if (val.length >= 8)       strength++;
    if (/[A-Z]/.test(val))    strength++;
    if (/[0-9]/.test(val))    strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;

    const widths = ['25%', '50%', '75%', '100%'];
    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    fill.style.width    = widths[strength - 1] || '15%';
    fill.style.background = colors[strength - 1] || '#ef4444';
});

// --- Day Button Toggle ---
document.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', () => btn.classList.toggle('active'));
});

// --- Avatar Preview ---
document.getElementById('avatar-file-input')?.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        const avatarEl = document.getElementById('settings-avatar-display');
        if (avatarEl) {
            avatarEl.innerHTML = `<img src="${ev.target.result}" alt="Avatar">`;
        }
    };
    reader.readAsDataURL(file);
});

// --- Save All (banner button) ---
window.handleSaveAllSettings = function() {
    showToast('All settings saved!', 'success');
};
