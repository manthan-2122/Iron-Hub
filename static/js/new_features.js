// ===== New Features JavaScript =====

// ===== BMI CALCULATOR =====
function calculateBMI() {
    const height = parseFloat(document.getElementById('bmi_height').value);
    const weight = parseFloat(document.getElementById('bmi_weight').value);

    if (!height || !weight || height <= 0 || weight <= 0) {
        showToast('Please enter valid height and weight', 'warning');
        return;
    }

    // Call backend API
    fetch('/api/features/bmi/calculate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ height, weight })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }

        const bmi = data.bmi;
        const category = data.category;

        // Determine color based on category
        let color;
        if (category === 'Underweight') color = '#3b82f6';
        else if (category === 'Normal Weight') color = '#10b981';
        else if (category === 'Overweight') color = '#f59e0b';
        else color = '#ef4444';

        // Update results
        document.getElementById('bmi_result').textContent = bmi;
        document.getElementById('bmi_category').textContent = category;
        document.getElementById('bmi_description').innerHTML = data.message;

        // Change the result container color
        const resultContainer = document.querySelector('[style*="linear-gradient(135deg"]');
        if (resultContainer) {
            resultContainer.style.background = `linear-gradient(135deg, ${color}, ${adjustColor(color, 20)})`;
        }

        showToast(`Your BMI is ${bmi} - ${category}`, 'success');
    })
    .catch(error => {
        showToast('Error calculating BMI: ' + error.message, 'error');
    });
}

// Adjust color brightness
function adjustColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255))
        .toString(16).slice(1);
}

// ===== MEMBERSHIP EXPIRY NOTIFICATION =====
function checkMembershipExpiry() {
    fetch('/api/features/membership-expiry')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.warn('Membership expiry check failed:', data.error);
                return;
            }
            if (data.expiring_soon) {
                showMembershipNotification(data.expiry_date, data.days_left);
            }
            sessionStorage.setItem('membership_expiry', data.expiry_date || '');
        })
        .catch(error => {
            console.warn('Error fetching membership expiry data:', error);
        });
}

function showMembershipNotification(expiryDate, daysLeft) {
    const notification = document.getElementById('membership-notification');
    const expiryElement = document.getElementById('expiry-date');
    const messageElement = document.getElementById('expiry-message');

    if (notification) {
        const formattedDate = new Date(expiryDate).toLocaleDateString('en-IN');
        expiryElement.textContent = formattedDate;
        messageElement.innerHTML = `Your membership expires on <strong>${formattedDate}</strong> (in ${daysLeft} days)`;
        notification.style.display = 'block';
    }
}

// ===== LIVE CHAT =====
function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();

    if (!message) {
        showToast('Please type a message', 'warning');
        return;
    }

    // Add user message to chat
    addChatMessage(message, 'user');
    input.value = '';

    fetch('/api/features/chat/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        // Request auto response from server after sending user message
        fetch('/api/features/chat/auto-response', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        })
        .then(resp => resp.json())
        .then(auto => {
            if (auto.response) {
                addChatMessage(auto.response, 'support');
            }
        })
        .catch(err => {
            console.warn('Auto response failed:', err);
        });
    })
    .catch(error => {
        showToast('Unable to send message', 'error');
        console.warn('Chat send error:', error);
    });
}

function addChatMessage(text, sender, createdAt) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${sender}`;

    const time = createdAt ? new Date(createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    messageDiv.innerHTML = `
        <div>
            <div class="chat-bubble">${escapeHtml(text)}</div>
            <div class="chat-timestamp">${time}</div>
        </div>
    `;

    messagesContainer.appendChild(messageDiv);

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendQuickMessage(message) {
    document.getElementById('chat-input').value = message;
    sendChatMessage();
}

function loadChatMessages() {
    fetch('/api/features/chat/messages')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.warn('Unable to load chat messages:', data.error);
                return;
            }
            const messagesContainer = document.getElementById('chat-messages');
            messagesContainer.innerHTML = '';
            data.messages.forEach(message => {
                addChatMessage(message.message, message.sender_type, message.created_at);
            });
        })
        .catch(error => {
            console.warn('Error loading chat messages:', error);
        });
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== PDF EXPORT =====
function exportProgressReportPDF() {
    const exportUrl = '/api/features/report/export';

    fetch(exportUrl)
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => Promise.reject(data.error || 'Failed to export report'));
            }
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `fitness-progress-report-${Date.now()}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast('✅ Report exported successfully!', 'success');
        })
        .catch(error => {
            showToast(`Unable to export report: ${error}`, 'error');
            console.warn('Report export error:', error);
        });
}

// Initialize PDF export button
function initializePDFExport() {
    const exportBtn = document.getElementById('export-pdf-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportProgressReportPDF);
    }
}

// ===== EMAIL NOTIFICATION PREFERENCES =====
function saveEmailNotifications() {
    const preferences = {
        membership_expiry: document.getElementById('email-expiry-toggle')?.checked || false,
        workout_reminders: document.getElementById('email-workout-toggle')?.checked || false,
        progress_reports: document.getElementById('email-progress-toggle')?.checked || false,
        new_offers: document.getElementById('email-offers-toggle')?.checked || false,
        chat_notifications: document.getElementById('email-chat-toggle')?.checked || false
    };

    fetch('/api/features/email-preferences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showToast(data.error, 'error');
            return;
        }
        showToast('Email preferences updated!', 'success');
    })
    .catch(error => {
        showToast('Unable to save email preferences', 'error');
        console.warn('Email preference update error:', error);
    });
}

function loadEmailPreferences() {
    fetch('/api/features/email-preferences')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.warn('Unable to load email preferences:', data.error);
                return;
            }
            document.getElementById('email-expiry-toggle').checked = data.membership_expiry;
            document.getElementById('email-workout-toggle').checked = data.workout_reminders;
            document.getElementById('email-progress-toggle').checked = data.progress_reports;
            document.getElementById('email-offers-toggle').checked = data.new_offers;
            document.getElementById('email-chat-toggle').checked = data.chat_notifications;
        })
        .catch(error => {
            console.warn('Error loading email preferences:', error);
        });
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function () {
    // Check membership expiry on load
    checkMembershipExpiry();

    // Initialize PDF export
    initializePDFExport();

    // Initialize chat input listener
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }

    // Load chat history
    loadChatMessages();

    // Initialize email notification toggles
    const emailToggles = [
        'email-expiry-toggle',
        'email-workout-toggle',
        'email-progress-toggle',
        'email-offers-toggle',
        'email-chat-toggle'
    ];

    emailToggles.forEach(id => {
        const toggle = document.getElementById(id);
        if (toggle) {
            toggle.addEventListener('change', saveEmailNotifications);
        }
    });

    loadEmailPreferences();
});

// Add a global showToast function if it doesn't exist
if (typeof showToast === 'undefined') {
    window.showToast = function (message, type = 'info', duration = 3500) {
        const container = document.getElementById('toast-container');
        if (!container) {
            const newContainer = document.createElement('div');
            newContainer.id = 'toast-container';
            newContainer.style.position = 'fixed';
            newContainer.style.top = '100px';
            newContainer.style.right = '20px';
            newContainer.style.zIndex = '10000';
            document.body.appendChild(newContainer);
            window.showToast(message, type, duration);
            return;
        }

        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.style.cssText = `
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
            color: white;
            padding: 1rem 1.25rem;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        toast.innerHTML = `
            <span>${icons[type] || icons.info}</span>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    };
}
