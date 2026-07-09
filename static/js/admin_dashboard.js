// -- Session Guard
fetch('/api/session/check').then(r => r.json()).then(d => {
    if (!d.logged_in || d.role !== 'admin') window.location.replace('/');
});

// -- Date
document.getElementById('current-date').textContent =
    new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

// -- Sidebar Tab Switching
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('.dashboard-section');

function switchTab(targetId) {
    sections.forEach(s => s.classList.remove('active'));
    navLinks.forEach(a => a.classList.remove('active'));
    const targetSection = document.getElementById(targetId);
    if (targetSection) targetSection.classList.add('active');
    navLinks.forEach(a => {
        if (a.getAttribute('href') === '#' + targetId) a.classList.add('active');
    });
}

navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        switchTab(this.getAttribute('href').substring(1));
    });
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href').substring(1);
        if (document.getElementById(targetId)) {
            e.preventDefault();
            switchTab(targetId);
        }
    });
});

// -- Logout
document.querySelector('.logout-btn').addEventListener('click', () => {
    window.location.href = '/logout';
});

// -- Load Dashboard Stats
async function loadDashboardStats() {
    try {
        const res = await fetch('/api/admin/stats');
        const stats = await res.json();
        
        document.querySelectorAll('.stat-card').forEach(card => {
            const label = card.querySelector('.stat-label');
            const value = card.querySelector('h3');
            
            if (label.textContent.includes('Total Clients')) {
                value.textContent = stats.total_clients;
            } else if (label.textContent.includes('Active Trainers')) {
                value.textContent = stats.active_trainers;
            } else if (label.textContent.includes('Monthly Revenue')) {
                value.textContent = '₹' + stats.monthly_revenue.toLocaleString();
            } else if (label.textContent.includes('Pending')) {
                value.textContent = stats.pending_approvals;
            }
        });
    } catch {
        console.error('Failed to load stats');
    }
}

// -- Load Recent Registrations
async function loadRecentRegistrations() {
    try {
        const res = await fetch('/api/admin/recent-users');
        const users = await res.json();
        const tbody = document.querySelector('#dashboard .table-container tbody');
        
        if (!users.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;color:#94a3b8;">No recent registrations.</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(u => {
            const badgeClass = u.status === 'Pending' ? 'status-pending' : u.status === 'Active' ? 'status-active' : 'status-inactive';
            return `<tr>
                <td>${u.first_name} ${u.last_name}</td>
                <td>${u.email}</td>
                <td>${u.created_at}</td>
                <td><span class="status-badge ${badgeClass}">${u.status}</span></td>
                <td>
                    <button class="action-btn edit-btn" onclick="switchTab('users')">View</button>
                </td>
            </tr>`;
        }).join('');
    } catch {
        console.error('Failed to load recent registrations');
    }
}

// -- Load Users
let allUsers = [];

async function loadUsers() {
    try {
        const res = await fetch('/api/admin/users');
        allUsers  = await res.json();
        renderUsers(allUsers);
        updatePendingCount(allUsers);
    } catch {
        renderUsers([]);
    }
}

// -- Update pending stat card
function updatePendingCount(users) {
    document.querySelectorAll('.stat-card').forEach(card => {
        const label = card.querySelector('.stat-label');
        if (label && label.textContent.includes('Pending')) {
            card.querySelector('h3').textContent = users.filter(u => u.status === 'Pending').length;
        }
    });
}

// -- Render Users (with Plan Request + Active Plan columns)
function renderUsers(users) {
    const tbody = document.getElementById('users-tbody');
    if (!users.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#94a3b8;">No clients found.</td></tr>';
        return;
    }

    tbody.innerHTML = users.map((u, index) => {
        const isPending  = u.status === 'Pending';
        const isActive   = u.status === 'Active';
        const badgeClass = isPending ? 'status-pending' : isActive ? 'status-active' : 'status-inactive';

        // Subscription cell — shows pending request OR active plan
        let planCell = '<span style="color:#94a3b8;font-size:0.85rem;">No plan</span>';
        if (u.sub_id && u.sub_status === 'Pending') {
            planCell = `<div style="display:flex;flex-direction:column;gap:5px;">
                <span style="font-weight:600;color:#f59e0b;font-size:0.85rem;">
                    &#9203; ${u.sub_plan} &mdash; &#8377;${u.sub_amount}/yr
                    <span style="font-size:0.75rem;font-weight:400;color:#64748b;"> (Pending)</span>
                </span>
                <div style="display:flex;gap:5px;">
                    <button class="action-btn" style="background:rgba(16,185,129,0.12);color:#10b981;font-size:0.78rem;padding:4px 10px;"
                        onclick="approveSubscription(${u.sub_id})">&#10003; Approve</button>
                    <button class="action-btn delete-btn" style="font-size:0.78rem;padding:4px 10px;"
                        onclick="rejectSubscription(${u.sub_id})">&#10007; Reject</button>
                </div>
            </div>`;
        } else if (u.sub_id && u.sub_status === 'Active') {
            planCell = `<div style="display:flex;flex-direction:column;gap:5px;">
                <span style="font-weight:600;color:#10b981;font-size:0.85rem;">
                    &#10003; ${u.sub_plan} &mdash; &#8377;${u.sub_amount}/yr
                </span>
                <span style="font-size:0.75rem;color:#64748b;">Expires: ${u.sub_expiry}</span>
                <button class="action-btn" style="background:rgba(239,68,68,0.1);color:#ef4444;font-size:0.78rem;padding:4px 10px;margin-top:2px;"
                    onclick="cancelSubscription(${u.sub_id})">&#10007; Cancel Plan</button>
            </div>`;
        }

        const actions = isPending
            ? `<button class="action-btn" style="background:rgba(16,185,129,0.12);color:#10b981;font-size:0.82rem;padding:5px 10px;"
                   onclick="approveUser(${u.id})">&#10003; Approve</button>
               <button class="action-btn delete-btn" style="font-size:0.82rem;padding:5px 10px;"
                   onclick="rejectUser(${u.id})">&#10007; Reject</button>`
            : `<button class="action-btn edit-btn" style="font-size:0.82rem;padding:5px 10px;"
                   onclick="toggleUser(${u.id})">${isActive ? 'Deactivate' : 'Activate'}</button>
               <button class="action-btn delete-btn" style="font-size:0.82rem;padding:5px 10px;"
                   onclick="rejectUser(${u.id})">Delete</button>`;

        return `<tr>
            <td>${index + 1}</td>
            <td>${u.first_name} ${u.last_name}</td>
            <td>${u.email}</td>
            <td>${u.created_at}</td>
            <td><span class="status-badge ${badgeClass}">${u.status}</span></td>
            <td style="display:table-cell;gap:6px;flex-wrap:wrap;align-items:center;">${actions}</td>
            <td>${planCell}</td>
        </tr>`;
    }).join('');
}

// -- Search
document.getElementById('user-search-input').addEventListener('input', function () {
    const q = this.value.toLowerCase();
    renderUsers(allUsers.filter(u =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    ));
});

// -- Approve user account
async function approveUser(id) {
    const res  = await fetch(`/api/admin/users/${id}/approve`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message || 'User approved.', 'success');
    loadUsers();
}

// -- Reject / Delete user
async function rejectUser(id) {
    if (!confirm('Remove this user?')) return;
    const res  = await fetch(`/api/admin/users/${id}/reject`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message || 'User removed.', 'success');
    loadUsers();
}

// -- Toggle Active / Inactive
async function toggleUser(id) {
    const res  = await fetch(`/api/admin/users/${id}/toggle`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message, 'success');
    loadUsers();
}

// -- Approve subscription plan request
async function approveSubscription(subId) {
    const res  = await fetch(`/api/admin/subscription/${subId}/approve`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message || 'Subscription approved.', 'success');
    loadUsers();
}

// -- Reject subscription plan request
async function rejectSubscription(subId) {
    if (!confirm('Reject this plan request?')) return;
    const res  = await fetch(`/api/admin/subscription/${subId}/reject`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message || 'Subscription rejected.', 'success');
    loadUsers();
}

// -- Cancel active subscription
async function cancelSubscription(subId) {
    if (!confirm('Cancel this client\'s active plan? This cannot be undone.')) return;
    const res  = await fetch(`/api/admin/subscription/${subId}/cancel`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message || 'Subscription cancelled.', res.ok ? 'success' : 'error');
    loadUsers();
}

// -- Export CSV
document.getElementById('export-csv-btn').addEventListener('click', () => {
    const rows = [['TRX ID', 'Date', 'User', 'Type', 'Amount', 'Status']];
    document.querySelectorAll('#financials table tbody tr').forEach(tr => {
        rows.push([...tr.querySelectorAll('td')].map(td => td.textContent.trim()));
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const a   = document.createElement('a');
    a.href    = 'data:text/csv,' + encodeURIComponent(csv);
    a.download = 'transactions.csv';
    a.click();
});

// -- Toast
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast     = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        padding:12px 20px;border-radius:8px;color:white;font-weight:500;
        background:${type === 'success' ? '#10b981' : '#ef4444'};
        box-shadow:0 4px 12px rgba(0,0,0,0.15);animation:fadeIn 0.3s ease;
    `;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// -- Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

if (menuToggle) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('active');
    });
}

if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        sidebarOverlay.classList.remove('active');
    });
}

// Close sidebar when clicking nav links on mobile
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        }
    });
});

// -- Init
loadDashboardStats();
loadRecentRegistrations();
loadUsers();
loadTrainers().then(() => {
    populateTrainerDropdown();
    loadAvailableClients();
});

// -- Load Trainers
let allTrainers = [];


async function loadTrainers() {
    try {
        const res = await fetch('/api/admin/trainers');
        allTrainers = await res.json();
        renderTrainers(allTrainers);
    } catch {
        renderTrainers([]);
    }
}

// -- Render Trainers
function renderTrainers(trainers) {
    const tbody = document.getElementById('trainers-tbody');
    if (!trainers.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#94a3b8;">No trainers found.</td></tr>';
        return;
    }

    tbody.innerHTML = trainers.map((t, index) => {
        const isPending = t.status === 'Pending';
        const isActive = t.status === 'Active';
        const badgeClass = isPending ? 'status-pending' : isActive ? 'status-active' : 'status-inactive';

        const actions = isPending
            ? `<button class="action-btn" style="background:rgba(16,185,129,0.12);color:#10b981;font-size:0.82rem;padding:5px 10px;"
                   onclick="approveTrainer(${t.id})">&#10003; Approve</button>
               <button class="action-btn delete-btn" style="font-size:0.82rem;padding:5px 10px;"
                   onclick="rejectTrainer(${t.id})">&#10007; Reject</button>`
            : `<button class="action-btn edit-btn" style="font-size:0.82rem;padding:5px 10px;"
                   onclick="toggleTrainer(${t.id})">${isActive ? 'Deactivate' : 'Activate'}</button>
               <button class="action-btn delete-btn" style="font-size:0.82rem;padding:5px 10px;"
                   onclick="rejectTrainer(${t.id})">Delete</button>`;

        return `<tr>
            <td>${index + 1}</td>
            <td>${t.first_name} ${t.last_name}</td>
            <td>${t.email}</td>
            <td>${t.specialization}</td>
            <td>${t.experience} years</td>
            <td>${t.created_at}</td>
            <td><span class="status-badge ${badgeClass}">${t.status}</span></td>
            <td style="display:table-cell;gap:6px;flex-wrap:wrap;align-items:center;">${actions}</td>
        </tr>`;
    }).join('');
}

// -- Approve trainer
async function approveTrainer(id) {
    const res = await fetch(`/api/admin/trainers/${id}/approve`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message || 'Trainer approved.', 'success');
    await loadTrainers();
    populateTrainerDropdown();
    loadDashboardStats();
}

// -- Reject / Delete trainer
async function rejectTrainer(id) {
    if (!confirm('Remove this trainer?')) return;
    const res = await fetch(`/api/admin/trainers/${id}/reject`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message || 'Trainer removed.', 'success');
    await loadTrainers();
    populateTrainerDropdown();
    loadDashboardStats();
}

// -- Toggle trainer Active / Inactive
async function toggleTrainer(id) {
    const res = await fetch(`/api/admin/trainers/${id}/toggle`, { method: 'POST' });
    const data = await res.json();
    showToast(data.message, 'success');
    await loadTrainers();
    populateTrainerDropdown();
    loadDashboardStats();
}

// ============================================
// CLIENT-TRAINER ASSIGNMENT FUNCTIONALITY
// ============================================

let selectedTrainerId = null;
let availableClients = [];

// Populate trainer dropdown
function populateTrainerDropdown() {
    const select = document.getElementById('assign-trainer-select');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Choose a Trainer --</option>';
    
    const activeTrainers = allTrainers.filter(t => t.status === 'Active');
    activeTrainers.forEach(trainer => {
        const option = document.createElement('option');
        option.value = trainer.id;
        option.textContent = `${trainer.first_name} ${trainer.last_name} - ${trainer.specialization}`;
        select.appendChild(option);
    });
}

// Load available clients for assignment
async function loadAvailableClients() {
    try {
        const res = await fetch('/api/admin/users');
        const users = await res.json();
        availableClients = users.filter(u => u.status === 'Active');
    } catch (error) {
        console.error('Failed to load clients:', error);
        availableClients = [];
    }
}

// Display client checkboxes
function displayClientCheckboxes(trainerId) {
    const container = document.getElementById('assign-clients-container');
    if (!container) return;
    
    if (!availableClients.length) {
        container.innerHTML = '<p style="color: var(--text-light); text-align: center;">No active clients available</p>';
        return;
    }
    
    container.innerHTML = availableClients.map(client => {
        return `
            <div style="display: flex; align-items: center; gap: 10px; padding: 8px; border-bottom: 1px solid #e2e8f0;">
                <input type="checkbox" id="client-${client.id}" value="${client.id}" 
                    style="width: 18px; height: 18px; cursor: pointer;">
                <label for="client-${client.id}" style="cursor: pointer; flex: 1;">
                    <strong>${client.first_name} ${client.last_name}</strong>
                    <span style="color: var(--text-light); font-size: 0.85rem; margin-left: 8px;">${client.email}</span>
                    ${client.sub_plan ? `<span style="color: #10b981; font-size: 0.8rem; margin-left: 8px;">• ${client.sub_plan}</span>` : ''}
                </label>
            </div>
        `;
    }).join('');
}

// Load assigned clients for selected trainer
async function loadAssignedClients(trainerId) {
    try {
        const res = await fetch(`/api/admin/trainer/${trainerId}/clients`);
        const clients = await res.json();
        
        const section = document.getElementById('assigned-clients-section');
        const tbody = document.getElementById('assigned-clients-tbody');
        
        if (!clients.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1rem;color:#94a3b8;">No clients assigned yet</td></tr>';
            section.style.display = 'block';
            return;
        }
        
        tbody.innerHTML = clients.map(client => {
            const statusClass = client.status === 'Active' ? 'status-active' : 'status-inactive';
            return `
                <tr>
                    <td>${client.first_name} ${client.last_name}</td>
                    <td>${client.email}</td>
                    <td>${client.plan_name || 'No Plan'}</td>
                    <td><span class="status-badge ${statusClass}">${client.status}</span></td>
                    <td>
                        <button class="action-btn delete-btn" style="font-size:0.82rem;padding:5px 10px;" 
                            onclick="unassignClient(${trainerId}, ${client.id})">Unassign</button>
                    </td>
                </tr>
            `;
        }).join('');
        
        section.style.display = 'block';
    } catch (error) {
        console.error('Failed to load assigned clients:', error);
    }
}

// Trainer selection change handler
document.getElementById('assign-trainer-select')?.addEventListener('change', function() {
    selectedTrainerId = this.value ? parseInt(this.value) : null;
    
    if (selectedTrainerId) {
        displayClientCheckboxes(selectedTrainerId);
        loadAssignedClients(selectedTrainerId);
    } else {
        document.getElementById('assign-clients-container').innerHTML = '<p style="color: var(--text-light); text-align: center;">Select a trainer first</p>';
        document.getElementById('assigned-clients-section').style.display = 'none';
    }
});

// Save assignment button
document.getElementById('save-assignment-btn')?.addEventListener('click', async function() {
    if (!selectedTrainerId) {
        showToast('Please select a trainer first', 'error');
        return;
    }
    
    const checkboxes = document.querySelectorAll('#assign-clients-container input[type="checkbox"]:checked');
    const clientIds = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (!clientIds.length) {
        showToast('Please select at least one client', 'error');
        return;
    }
    
    try {
        const res = await fetch(`/api/admin/trainer/${selectedTrainerId}/assign-clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ client_ids: clientIds })
});
        
        const data = await res.json();
        
        if (res.ok) {
            showToast(data.message, 'success');
            loadAssignedClients(selectedTrainerId);
            // Uncheck all checkboxes
            checkboxes.forEach(cb => cb.checked = false);
        } else {
            showToast(data.error || 'Failed to assign clients', 'error');
        }
    } catch (error) {
        showToast('Error assigning clients', 'error');
        console.error('Assignment error:', error);
    }
});

// Clear selection button
document.getElementById('clear-assignment-btn')?.addEventListener('click', function() {
    document.querySelectorAll('#assign-clients-container input[type="checkbox"]').forEach(cb => {
        cb.checked = false;
    });
});

// Unassign client from trainer
async function unassignClient(trainerId, clientId) {
    if (!confirm('Remove this client from the trainer?')) return;
    
    try {
        const res = await fetch(`/api/admin/trainer/${trainerId}/unassign-client/${clientId}`, {
            method: 'DELETE'
        });
        
        const data = await res.json();
        
        if (res.ok) {
            showToast(data.message, 'success');
            loadAssignedClients(trainerId);
        } else {
            showToast(data.error || 'Failed to unassign client', 'error');
        }
    } catch (error) {
        showToast('Error unassigning client', 'error');
        console.error('Unassignment error:', error);
    }
}

// Initialize assignment functionality when trainers section is loaded
function initializeAssignmentSection() {
    loadAvailableClients();
    populateTrainerDropdown();
}

// Call initialization after trainers are loaded
const originalLoadTrainers = loadTrainers;
loadTrainers = async function() {
    await originalLoadTrainers();
    initializeAssignmentSection();
};

// -- Generate & Download Reports
document.getElementById('download-financial-pdf')?.addEventListener('click', () => {
    window.location.href = '/api/admin/reports/financial/export';
});

document.getElementById('download-activity-csv')?.addEventListener('click', () => {
    window.location.href = '/api/admin/reports/activity/export';
});

document.getElementById('download-trainer-pdf')?.addEventListener('click', () => {
    window.location.href = '/api/admin/reports/trainer/export';
});
