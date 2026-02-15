// Admin Panel JavaScript - FIXED VERSION
let currentPage = 0;
const SIEM_PER_PAGE = 50;

// ============= INITIALIZATION =============
document.addEventListener('DOMContentLoaded', () => {
    initializeEventHandlers();
    setupCursorGlow();
    hideLoadingScreen();
    loadDashboard();
});

function initializeEventHandlers() {
    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
    
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach((tab, index) => {
        const sections = ['dashboard', 'users', 'content', 'keys', 'siem', 'ipbans', 'settings'];
        tab.addEventListener('click', () => showSection(sections[index]));
    });
    
    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        const modal = btn.closest('.modal');
        if (modal) {
            btn.addEventListener('click', () => closeModal(modal.id));
        }
    });
    
    // Close modals on background click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal.id);
        });
    });
    
    // Button event handlers
    setupButtonHandlers();
}

function setupButtonHandlers() {
    // Create user button
    const createUserBtn = document.querySelector('[data-action="create-user"]');
    if (createUserBtn) {
        createUserBtn.addEventListener('click', () => showModal('createUserModal'));
    }
    
    // Generate keys button  
    const generateKeysBtn = document.querySelector('[data-action="generate-keys"]');
    if (generateKeysBtn) {
        generateKeysBtn.addEventListener('click', generateKeys);
    }
    
    // Purge SIEM button
    const purgeSiemBtn = document.querySelector('[data-action="purge-siem"]');
    if (purgeSiemBtn) {
        purgeSiemBtn.addEventListener('click', purgeSiem);
    }
    
    // Filter SIEM button
    const filterSiemBtn = document.querySelector('[data-action="filter-siem"]');
    if (filterSiemBtn) {
        filterSiemBtn.addEventListener('click', loadSiem);
    }
    
    // Ban IP button
    const banIpBtn = document.querySelector('[data-action="ban-ip"]');
    if (banIpBtn) {
        banIpBtn.addEventListener('click', () => showModal('createBanModal'));
    }
    
    // Form submissions
    const createUserForm = document.getElementById('createUserForm');
    if (createUserForm) {
        createUserForm.addEventListener('submit', createUser);
    }
    
    const createBanForm = document.getElementById('createBanForm');
    if (createBanForm) {
        createBanForm.addEventListener('submit', createIPBan);
    }
    
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', changePassword);
    }
}

function setupCursorGlow() {
    const cursorGlow = document.querySelector('.cursor-glow');
    document.addEventListener('mousemove', (e) => {
        cursorGlow.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
    });
}

function hideLoadingScreen() {
    setTimeout(() => {
        document.getElementById('loadingScreen').classList.add('hidden');
    }, 1000);
}

// ============= NAVIGATION =============
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    
    document.getElementById(sectionId).classList.add('active');
    
    const tabs = document.querySelectorAll('.nav-tab');
    const sections = ['dashboard', 'users', 'content', 'keys', 'siem', 'ipbans', 'settings'];
    const index = sections.indexOf(sectionId);
    if (index !== -1 && tabs[index]) {
        tabs[index].classList.add('active');
    }
    
    switch(sectionId) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'users':
            loadUsers();
            break;
        case 'content':
            loadThreads();
            break;
        case 'keys':
            loadKeys();
            break;
        case 'siem':
            loadSiem();
            break;
        case 'ipbans':
            loadIPBans();
            break;
    }
}

// ============= MODAL =============
function showModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ============= DASHBOARD =============
async function loadDashboard() {
    try {
        const res = await fetch('/api/admin/stats', { credentials: 'include' });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to fetch stats');
        }
        
        const stats = await res.json();
        
        document.getElementById('totalUsers').textContent = stats.users.total;
        document.getElementById('totalThreads').textContent = stats.threads.total;
        document.getElementById('totalReplies').textContent = stats.replies.total;
        document.getElementById('activeKeys').textContent = stats.keys.active;
        document.getElementById('bannedUsers').textContent = stats.users.banned;
        document.getElementById('siemCritical').textContent = stats.siem.critical;
        
        const siemRes = await fetch('/api/admin/siem?limit=10', { credentials: 'include' });
        if (siemRes.ok) {
            const siemData = await siemRes.json();
            
            const container = document.getElementById('recentSiem');
            if (siemData.events.length === 0) {
                container.innerHTML = '<div class="empty-state">NO EVENTS</div>';
            } else {
                container.innerHTML = siemData.events.map(e => `
                    <div class="log-entry ${e.severity}">
                        <div class="log-meta">
                            <span class="badge badge-${e.severity === 'critical' ? 'critical' : 'active'}">${e.severity.toUpperCase()}</span>
                            <span>${new Date(e.created_at).toLocaleString()}</span>
                            <span>${e.username || 'ANONYMOUS'}</span>
                            <span>${e.ip_address}</span>
                        </div>
                        <div class="log-type">${e.event_type}</div>
                        ${e.details ? `<div class="log-details"><code>${e.details}</code></div>` : ''}
                    </div>
                `).join('');
            }
        }
    } catch (err) {
        console.error('Dashboard error:', err);
        if (err.message.includes('Admin access required') || err.message.includes('Failed to fetch stats')) {
            alert('Admin access required. Redirecting to login...');
            setTimeout(() => window.location.href = '/', 2000);
        } else {
            alert(`Failed to load dashboard: ${err.message}`);
        }
    }
}

// ============= USER MANAGEMENT =============
async function loadUsers() {
    try {
        const res = await fetch('/api/admin/users', { credentials: 'include' });
        const users = await res.json();
        
        const container = document.getElementById('userList');
        if (users.length === 0) {
            container.innerHTML = '<div class="empty-state">NO USERS</div>';
        } else {
            container.innerHTML = users.map(u => `
                <div class="user-item">
                    <div>
                        <div class="user-name">${u.username} ${u.is_admin ? '👑' : ''}</div>
                        <div class="user-email">${u.email}</div>
                    </div>
                    <div class="user-badges">
                        ${u.is_admin ? '<span class="badge badge-admin">ADMIN</span>' : ''}
                        ${u.has_private_access ? '<span class="badge badge-active">PRIVATE</span>' : ''}
                        ${u.is_banned ? '<span class="badge badge-critical">BANNED</span>' : ''}
                    </div>
                    <div class="user-actions">
                        <button class="btn-small" data-action="toggle-ban" data-user-id="${u.id}">
                            ${u.is_banned ? 'UNBAN' : 'BAN'}
                        </button>
                        <button class="btn-small" data-action="toggle-private" data-user-id="${u.id}">
                            ${u.has_private_access ? 'REVOKE' : 'GRANT'} PRIVATE
                        </button>
                    </div>
                </div>
            `).join('');
            
            // Attach event handlers to dynamically created buttons
            container.querySelectorAll('[data-action="toggle-ban"]').forEach(btn => {
                btn.addEventListener('click', () => toggleUserBan(btn.dataset.userId));
            });
            
            container.querySelectorAll('[data-action="toggle-private"]').forEach(btn => {
                btn.addEventListener('click', () => togglePrivateAccess(btn.dataset.userId));
            });
        }
    } catch (err) {
        console.error('Load users error:', err);
        alert('Failed to load users');
    }
}

async function createUser(e) {
    e.preventDefault();
    try {
        const formData = {
            username: document.getElementById('newUsername').value,
            email: document.getElementById('newEmail').value,
            password: document.getElementById('newPassword').value,
            isAdmin: document.getElementById('newIsAdmin').checked,
            hasPrivateAccess: document.getElementById('newPrivateAccess').checked
        };
        
        await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        
        closeModal('createUserModal');
        e.target.reset();
        loadUsers();
    } catch (err) {
        alert('Failed to create user');
    }
}

async function toggleUserBan(userId) {
    if (!confirm('Toggle ban status?')) return;
    try {
        await fetch(`/api/admin/users/${userId}/ban`, {
            method: 'POST',
            credentials: 'include'
        });
        loadUsers();
    } catch (err) {
        alert('Failed to toggle ban');
    }
}

async function togglePrivateAccess(userId) {
    if (!confirm('Toggle private access?')) return;
    try {
        await fetch(`/api/admin/users/${userId}/private`, {
            method: 'POST',
            credentials: 'include'
        });
        loadUsers();
    } catch (err) {
        alert('Failed to toggle private access');
    }
}

// ============= CONTENT MANAGEMENT =============
async function loadThreads() {
    try {
        const res = await fetch('/api/admin/threads', { credentials: 'include' });
        const threads = await res.json();
        
        const container = document.getElementById('threadList');
        if (threads.length === 0) {
            container.innerHTML = '<div class="empty-state">NO THREADS</div>';
        } else {
            container.innerHTML = threads.map(t => `
                <div class="thread-item">
                    <div>
                        <div class="thread-title">
                            ${t.is_pinned ? '📌 ' : ''}${t.title}
                            ${t.is_private ? '<span class="badge badge-active">PRIVATE</span>' : ''}
                        </div>
                        <div class="thread-meta">
                            By ${t.author_username} • ${new Date(t.created_at).toLocaleDateString()} • ${t.reply_count || 0} replies
                        </div>
                    </div>
                    <div class="thread-actions">
                        <button class="btn-small" data-action="pin-thread" data-thread-id="${t.id}">
                            ${t.is_pinned ? 'UNPIN' : 'PIN'}
                        </button>
                        <button class="btn-small btn-danger" data-action="delete-thread" data-thread-id="${t.id}">
                            DELETE
                        </button>
                    </div>
                </div>
            `).join('');
            
            // Attach event handlers
            container.querySelectorAll('[data-action="pin-thread"]').forEach(btn => {
                btn.addEventListener('click', () => toggleThreadPin(btn.dataset.threadId));
            });
            
            container.querySelectorAll('[data-action="delete-thread"]').forEach(btn => {
                btn.addEventListener('click', () => deleteThread(btn.dataset.threadId));
            });
        }
    } catch (err) {
        console.error('Load threads error:', err);
        alert('Failed to load threads');
    }
}

async function toggleThreadPin(threadId) {
    try {
        await fetch(`/api/admin/threads/${threadId}/pin`, {
            method: 'POST',
            credentials: 'include'
        });
        loadThreads();
    } catch (err) {
        alert('Failed to toggle pin');
    }
}

async function deleteThread(threadId) {
    if (!confirm('Delete this thread? This cannot be undone.')) return;
    try {
        await fetch(`/api/admin/threads/${threadId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        loadThreads();
    } catch (err) {
        alert('Failed to delete thread');
    }
}

// ============= KEYS MANAGEMENT =============
async function loadKeys() {
    try {
        const res = await fetch('/api/admin/keys', { credentials: 'include' });
        const keys = await res.json();
        
        const container = document.getElementById('keyList');
        if (keys.length === 0) {
            container.innerHTML = '<div class="empty-state">NO KEYS</div>';
        } else {
            container.innerHTML = keys.map(k => `
                <div class="key-item">
                    <div>
                        <div class="key-code">${k.key_code}</div>
                        <div class="key-status ${k.is_active ? 'active' : ''}">
                            ${k.is_active ? 'Active' : `Used by: ${k.used_by_username || 'Unknown'}`}
                        </div>
                    </div>
                    <span>${new Date(k.created_at).toLocaleDateString()}</span>
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Load keys error:', err);
        alert('Failed to load keys');
    }
}

async function generateKeys() {
    const count = parseInt(document.getElementById('keyCount').value);
    if (count < 1 || count > 50) {
        alert('Count must be between 1 and 50');
        return;
    }
    try {
        await fetch('/api/admin/keys/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ count })
        });
        alert(`${count} keys generated`);
        loadKeys();
    } catch (err) {
        alert('Failed to generate keys');
    }
}

// ============= SIEM =============
async function loadSiem() {
    try {
        const severity = document.getElementById('siemSeverity')?.value || '';
        const eventType = document.getElementById('siemEventType')?.value || '';
        
        let url = `/api/admin/siem?limit=100&offset=${currentPage * SIEM_PER_PAGE}`;
        if (severity) url += `&severity=${severity}`;
        if (eventType) url += `&eventType=${eventType}`;
        
        const res = await fetch(url, { credentials: 'include' });
        const data = await res.json();
        
        const container = document.getElementById('siemList');
        if (data.events.length === 0) {
            container.innerHTML = '<div class="empty-state">NO EVENTS</div>';
        } else {
            container.innerHTML = data.events.map(e => `
                <div class="log-entry ${e.severity}">
                    <div class="log-meta">
                        <span class="badge badge-${e.severity === 'critical' ? 'critical' : 'active'}">${e.severity.toUpperCase()}</span>
                        <span>${new Date(e.created_at).toLocaleString()}</span>
                        <span>${e.username || 'ANONYMOUS'}</span>
                        <span>${e.ip_address}</span>
                    </div>
                    <div class="log-type">${e.event_type}</div>
                    ${e.details ? `<div class="log-details"><code>${e.details}</code></div>` : ''}
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Load SIEM error:', err);
        alert('Failed to load SIEM logs');
    }
}

async function purgeSiem() {
    if (!confirm('Delete all SIEM logs? This cannot be undone.')) return;
    try {
        await fetch('/api/admin/siem', {
            method: 'DELETE',
            credentials: 'include'
        });
        alert('SIEM logs purged');
        loadSiem();
    } catch (err) {
        alert('Failed to purge SIEM logs');
    }
}

// ============= IP BANS =============
async function loadIPBans() {
    try {
        const res = await fetch('/api/admin/ip-bans', { credentials: 'include' });
        const bans = await res.json();
        
        const container = document.getElementById('ipBanList');
        if (bans.length === 0) {
            container.innerHTML = '<div class="empty-state">NO IP BANS</div>';
        } else {
            container.innerHTML = bans.map(b => `
                <div class="ban-item">
                    <div>
                        <div class="ban-ip">${b.ip_address}</div>
                        <div class="ban-reason">${b.reason || 'No reason'}</div>
                    </div>
                    <button class="btn-small btn-danger" data-action="unban-ip" data-ban-id="${b.id}">UNBAN</button>
                </div>
            `).join('');
            
            container.querySelectorAll('[data-action="unban-ip"]').forEach(btn => {
                btn.addEventListener('click', () => removeIPBan(btn.dataset.banId));
            });
        }
    } catch (err) {
        console.error('Load IP bans error:', err);
        alert('Failed to load IP bans');
    }
}

async function createIPBan(e) {
    e.preventDefault();
    try {
        const formData = {
            ip: document.getElementById('banIP').value,
            reason: document.getElementById('banReason').value,
            duration: parseInt(document.getElementById('banDuration').value)
        };
        
        await fetch('/api/admin/ip-bans', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        
        closeModal('createBanModal');
        e.target.reset();
        loadIPBans();
    } catch (err) {
        alert('Failed to create IP ban');
    }
}

async function removeIPBan(banId) {
    if (!confirm('Remove this IP ban?')) return;
    try {
        await fetch(`/api/admin/ip-bans/${banId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        loadIPBans();
    } catch (err) {
        alert('Failed to remove IP ban');
    }
}

// ============= SETTINGS =============
async function changePassword(e) {
    e.preventDefault();
    try {
        const formData = {
            currentPassword: document.getElementById('currentPassword').value,
            newPassword: document.getElementById('newPassword').value
        };
        
        const confirmPassword = document.getElementById('confirmPassword').value;
        if (formData.newPassword !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
        
        await fetch('/api/admin/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(formData)
        });
        
        alert('Password changed successfully');
        e.target.reset();
    } catch (err) {
        alert('Failed to change password');
    }
}

// ============= LOGOUT =============
async function logout() {
    try {
        await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/';
    } catch (err) {
        console.error('Logout error:', err);
        window.location.href = '/';
    }
}
