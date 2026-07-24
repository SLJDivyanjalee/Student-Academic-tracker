/* ==========================================================================
   LevelUp Dashboard - Frontend interactivity
   ========================================================================== */

document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initSidebar();
    initLogout();
    initEmptyStateButtons();
    applyTimeBasedGreeting();
    applyProfileSettings();
    applyNotificationVisibility();
    if (document.getElementById('eventsCard') || document.getElementById('notifList')) {
        await loadDueSoonWidgets();
    }
    if (document.getElementById('notifPanel')) initNotifications();
    if (document.getElementById('calendarBody')) initCalendar();
    if (document.getElementById('timerCircle')) initTimer();
    if (document.getElementById('tasksTable')) initTasksTable();
    if (document.querySelector('.stat-num')) await loadDashboardStats();
    if (document.querySelector('.stat-num')) initStatCounters();
    if (document.getElementById('gettingStartedRow')) await initGettingStartedChecklist();
    initProgressAnimations();
    if (document.getElementById('todayScheduleList')) initTodaySchedule();
    if (document.getElementById('progressCard')) renderSubjectProgress();
    if (document.getElementById('streakCard')) initStreak();
    if (document.getElementById('attendanceLogTable')) initAttendance();
    if (document.getElementById('timetableTable')) initTimetable();
    if (document.getElementById('plannerTable')) await initStudyPlanner();
    if (document.getElementById('profileNameInput')) initSettingsPage();
    if (document.getElementById('notificationsToggle')) initNotificationsToggle();
    if (document.getElementById('attendanceChart')) initProgressCharts();
    initPageSearch();
});

/* ==========================================================================
   Date helpers
   ========================================================================== */

function toLocalIsoDate(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/* ==========================================================================
   Toasts
   ========================================================================== */

function showToast(message, type = 'default', timeout = 3800) {
    const stack = document.getElementById('toastStack');
    if (!stack) return;

    const toast = document.createElement('div');
    toast.className = `app-toast ${type}`;

    const icon = document.createElement('i');
    icon.className = type === 'success' ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-info';
    toast.appendChild(icon);

    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);

    stack.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('leaving');
        setTimeout(() => toast.remove(), 250);
    }, timeout);
}

/* ==========================================================================
   Dark mode
   ========================================================================== */

function initTheme() {
    const toggle = document.getElementById('themeToggle');
    const icon = toggle.querySelector('i');
    const saved = localStorage.getItem('levelup-theme');

    if (saved === 'dark') applyTheme(true);

    toggle.addEventListener('click', () => {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        applyTheme(!isDark);
        localStorage.setItem('levelup-theme', !isDark ? 'dark' : 'light');
    });

    function applyTheme(dark) {
        document.body.setAttribute('data-theme', dark ? 'dark' : 'light');
        icon.className = dark ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    }
}

/* ==========================================================================
   Settings - account details (name / email / faculty / semester / avatar)
   ========================================================================== */

const DEFAULT_PROFILE_NAME = 'Tharindu

function applyTimeBasedGreeting() {
    const greetingTitle = document.getElementById('greetingTitle');
    if (!greetingTitle) return;

    const text = greetingTitle.textContent;
    const match = text.match(/^Good (Morning|Afternoon|Evening)/);
    if (!match) return;

    const hour = new Date().getHours();
    let timeGreeting = 'Good Evening';
    if (hour < 12) timeGreeting = 'Good Morning';
    else if (hour < 17) timeGreeting = 'Good Afternoon';

    greetingTitle.textContent = text.replace(match[0], timeGreeting);
}

function setAvatarDisplay(imgEl, iconEl, avatarUrl) {
    if (!imgEl) return;
    if (avatarUrl) {
        imgEl.src = avatarUrl;
        imgEl.style.display = '';
        if (iconEl) iconEl.style.display = 'none';
    } else {
        imgEl.removeAttribute('src');
        imgEl.style.display = 'none';
        if (iconEl) iconEl.style.display = '';
    }
}

function applyProfileSettings() {
    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    if (!user) return;

    if (user.name) {
        document.querySelectorAll('.profile h6, #topbarProfileName').forEach(el => el.textContent = user.name);

        const greetingTitle = document.getElementById('greetingTitle');
        if (greetingTitle && greetingTitle.textContent.includes(DEFAULT_PROFILE_NAME)) {
            const firstName = user.name.trim().split(/\s+/)[0];
            greetingTitle.textContent = greetingTitle.textContent.replace(DEFAULT_PROFILE_NAME, firstName);
        }
    }

    document.querySelectorAll('.profile small, #topbarProfileFaculty').forEach(el => el.textContent = user.faculty || '');

    document.querySelectorAll('.profile img').forEach(img => setAvatarDisplay(img, img.nextElementSibling, user.avatarUrl));
    setAvatarDisplay(document.getElementById('settingsProfileAvatar'), document.getElementById('settingsProfileAvatarIcon'), user.avatarUrl);
}

/* Auth */
function initLogout() {
    const item = document.getElementById('logoutNavItem');
    if (!item) return;
    item.addEventListener('click', () => {
        if (typeof Auth !== 'undefined') Auth.logout();
    });
}

async function initSettingsPage() {
    const nameInput = document.getElementById('profileNameInput');
    const facultyInput = document.getElementById('profileFacultyInput');
    const emailInput = document.getElementById('profileEmailInput');
    const semesterInput = document.getElementById('profileSemesterInput');
    const currentPasswordInput = document.getElementById('currentPasswordInput');
    const newPasswordInput = document.getElementById('newPasswordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    const saveBtn = document.getElementById('saveProfileBtn');
    if (!nameInput || !facultyInput || !saveBtn) return;

    try {
        const profile = await ProfileApi.get();
        nameInput.value = profile.name || '';
        facultyInput.value = profile.faculty || '';
        if (emailInput) emailInput.value = profile.email || '';
        if (semesterInput) semesterInput.value = profile.semester || '';
        setAvatarDisplay(document.getElementById('settingsProfileAvatar'), document.getElementById('settingsProfileAvatarIcon'), profile.avatarUrl);
        const previewName = document.getElementById('settingsProfileName');
        const previewFaculty = document.getElementById('settingsProfileFaculty');
        if (previewName) previewName.textContent = profile.name || '';
        if (previewFaculty) previewFaculty.textContent = profile.faculty || '';
    } catch (err) {
        showToast(err.message || 'Could not load your profile.');
    }

    saveBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const faculty = facultyInput.value.trim();
        const email = emailInput ? emailInput.value.trim() : '';
        const semester = semesterInput ? semesterInput.value.trim() : '';
        const currentPassword = currentPasswordInput ? currentPasswordInput.value : '';
        const newPassword = newPasswordInput ? newPasswordInput.value : '';
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

        if (!name) {
            showToast('Enter your name before saving.');
            return;
        }
        if (email && !/^\S+@\S+\.\S+$/.test(email)) {
            showToast('Enter a valid email address.');
            return;
        }

        const wantsPasswordChange = newPassword.length > 0 || confirmPassword.length > 0;
        if (wantsPasswordChange) {
            if (!currentPassword) {
                showToast('Enter your current password to change it.');
                return;
            }
            if (newPassword.length < 8) {
                showToast('New password must be at least 8 characters.');
                return;
            }
            if (newPassword !== confirmPassword) {
                showToast('Passwords do not match.');
                return;
            }
        }

        saveBtn.disabled = true;
        try {
            const saved = await ProfileApi.save({
                name, faculty, email,
                semester,
                avatarUrl: (document.getElementById('settingsProfileAvatar') || {}).src,
                notificationsEnabled: notificationsEnabled()
            });
            Auth.setSession(Auth.getToken(), saved);
            applyProfileSettings();

            const previewName = document.getElementById('settingsProfileName');
            const previewFaculty = document.getElementById('settingsProfileFaculty');
            if (previewName) previewName.textContent = saved.name;
            if (previewFaculty) previewFaculty.textContent = saved.faculty || '';

            if (wantsPasswordChange) {
                await ProfileApi.changePassword(currentPassword, newPassword);
                if (currentPasswordInput) currentPasswordInput.value = '';
                if (newPasswordInput) newPasswordInput.value = '';
                if (confirmPasswordInput) confirmPasswordInput.value = '';
                showToast('Account updated! password changed.', 'success');
            } else {
                showToast('Account updated.', 'success');
            }
        } catch (err) {
            showToast(err.message || 'Could not save your profile.');
        } finally {
            saveBtn.disabled = false;
        }
    });

    initAvatarUpload();
    initDangerZone();
}

/* Reset Data + Delete Account (Settings > Danger Zone) */
function initDangerZone() {
    const resetBtn = document.getElementById('resetDataBtn');
    const confirmResetBtn = document.getElementById('confirmResetDataBtn');
    const resetModalEl = document.getElementById('resetDataModal');

    const deleteBtn = document.getElementById('deleteAccountBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteAccountBtn');
    const deleteModalEl = document.getElementById('deleteAccountModal');
    const deletePasswordInput = document.getElementById('deleteAccountPasswordInput');

    if (resetBtn && resetModalEl && typeof bootstrap !== 'undefined') {
        resetBtn.addEventListener('click', () => {
            bootstrap.Modal.getOrCreateInstance(resetModalEl).show();
        });
    }

    if (confirmResetBtn) {
        confirmResetBtn.addEventListener('click', async () => {
            confirmResetBtn.disabled = true;
            try {
                await ProfileApi.resetData();
                if (resetModalEl && typeof bootstrap !== 'undefined') {
                    bootstrap.Modal.getOrCreateInstance(resetModalEl).hide();
                }
                showToast('All academic data has been cleared. Your account is untouched.', 'success');
            } catch (err) {
                showToast(err.message || 'Could not reset your data.');
            } finally {
                confirmResetBtn.disabled = false;
            }
        });
    }

    if (deleteBtn && deleteModalEl && typeof bootstrap !== 'undefined') {
        deleteBtn.addEventListener('click', () => {
            if (deletePasswordInput) deletePasswordInput.value = '';
            bootstrap.Modal.getOrCreateInstance(deleteModalEl).show();
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            const password = deletePasswordInput ? deletePasswordInput.value : '';
            if (!password) {
                showToast('Enter your password to confirm account deletion.');
                return;
            }
            confirmDeleteBtn.disabled = true;
            try {
                await ProfileApi.deleteAccount(password);
                Auth.clearSession();
                location.href = 'login.html';
            } catch (err) {
                showToast(err.message || 'Could not delete your account.');
                confirmDeleteBtn.disabled = false;
            }
        });
    }
}

/* Profile photo */
function initAvatarUpload() {
    const editBtn = document.getElementById('avatarEditBtn');
    const fileInput = document.getElementById('avatarFileInput');
    if (!editBtn || !fileInput) return;

    editBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
        const file = fileInput.files && fileInput.files[0];
        if (!file) return;

        resizeImageToDataUrl(file, 200, async (dataUrl) => {
            if (!dataUrl) {
                showToast('Could not read that image! try a different file.');
                return;
            }
            setAvatarDisplay(document.getElementById('settingsProfileAvatar'), document.getElementById('settingsProfileAvatarIcon'), dataUrl);
            try {
                const current = await ProfileApi.get();
                const saved = await ProfileApi.save({ ...current, avatarUrl: dataUrl });
                Auth.setSession(Auth.getToken(), saved);
                applyProfileSettings();
                showToast('Profile photo updated.', 'success');
            } catch (err) {
                showToast(err.message || 'That image could not be saved.');
            }
        });

        fileInput.value = '';
    });
}

function resizeImageToDataUrl(file, maxDim, callback) {
    const reader = new FileReader();
    reader.onerror = () => callback(null);
    reader.onload = () => {
        const img = new Image();
        img.onerror = () => callback(null);
        img.onload = () => {
            const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            callback(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.src = reader.result;
    };
    reader.readAsDataURL(file);
}

/* ==========================================================================
   Settings : notifications on/off
   ========================================================================== */

const NOTIFICATIONS_ENABLED_KEY = 'levelup-notifications-enabled';

function notificationsEnabled() {
    return localStorage.getItem(NOTIFICATIONS_ENABLED_KEY) !== 'false'; // enabled by default
}

function applyNotificationVisibility() {
    const notifWrap = document.getElementById('notifWrap');
    if (notifWrap) notifWrap.style.display = notificationsEnabled() ? '' : 'none';
}

function initNotificationsToggle() {
    const toggle = document.getElementById('notificationsToggle');
    if (!toggle) return;

    toggle.checked = notificationsEnabled();

    toggle.addEventListener('change', () => {
        localStorage.setItem(NOTIFICATIONS_ENABLED_KEY, toggle.checked ? 'true' : 'false');
        applyNotificationVisibility();
        showToast(toggle.checked ? 'Notifications turned on.' : 'Notifications turned off.', 'success');
    });
}

/* ==========================================================================
   Sidebar: mobile drawer + section navigation
   ========================================================================== */

function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const menuToggle = document.getElementById('menuToggle');
    const closeBtn = document.getElementById('sidebarClose');
    const navItems = document.querySelectorAll('#sidebarNav li');

    function openDrawer() {
        sidebar.classList.add('open');
        overlay.classList.add('show');
    }
    function closeDrawer() {
        sidebar.classList.remove('open');
        overlay.classList.remove('show');
    }

    menuToggle.addEventListener('click', openDrawer);
    closeBtn.addEventListener('click', closeDrawer);
    overlay.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDrawer();
    });

    const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
    const currentFull = currentPage + window.location.search;
    navItems.forEach(item => {
        const href = item.dataset.href || '';
        const hrefPath = href.split('#')[0];
        const isMatch = hrefPath === currentFull || (!window.location.search && hrefPath === currentPage);
        item.classList.toggle('active', isMatch);
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const href = item.dataset.href;
            if (!href) return;
            const [hrefPage, hrefHash] = href.split('#');
            const targetPage = hrefPage || currentPage;
            if (targetPage === currentPage) {
                closeDrawer();
                if (hrefHash) {
                    const target = document.getElementById(hrefHash);
                    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                window.location.href = href;
            }
        });
    });
}

/* ==========================================================================
   Notifications: slide-in sidebar
   ========================================================================== */

function initNotifications() {
    const bell = document.getElementById('notifBell');
    const panel = document.getElementById('notifPanel');
    const overlay = document.getElementById('notifOverlay');
    const closeBtn = document.getElementById('notifClose');
    const countBadge = document.getElementById('notifCount');
    const markAllBtn = document.getElementById('markAllRead');
    const items = document.querySelectorAll('.notif-item');

    function updateCount() {
        const unread = document.querySelectorAll('.notif-item.unread').length;
        countBadge.textContent = unread;
        countBadge.style.display = unread === 0 ? 'none' : 'flex';
    }

    function openPanel() {
        panel.classList.add('open');
        overlay.classList.add('show');
    }

    function closePanel() {
        panel.classList.remove('open');
        overlay.classList.remove('show');
    }

    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        openPanel();
    });

    closeBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });

    items.forEach(item => {
        item.addEventListener('click', () => {
            item.classList.remove('unread');
            updateCount();
        });
    });

    markAllBtn.addEventListener('click', () => {
        items.forEach(item => item.classList.remove('unread'));
        updateCount();
        showToast('All notifications marked as read.');
    });

    updateCount();
}

/* ==========================================================================
   Dashboard: Upcoming Events card + Notification bell
   ========================================================================== */

const DUE_SOON_ICON_META = {
    TASK: { icon: 'bi-journal-text', bg: 'bg-purple' },
    ASSIGNMENT: { icon: 'bi-journal-text', bg: 'bg-purple' },
    EXAM: { icon: 'bi-pencil-square', bg: 'bg-danger' },
    STUDY_SESSION: { icon: 'bi-book', bg: 'bg-warning' }
};

async function loadDueSoonWidgets() {
    const eventsCard = document.getElementById('eventsCard');
    const notifList = document.getElementById('notifList');
    if (!eventsCard && !notifList) return;

    let items = [];
    try {
        items = await CalendarApi.dueSoon(7);
    } catch (err) {
        items = [];
    }

    if (eventsCard) renderUpcomingEvents(eventsCard, items);
    if (notifList) renderNotifications(notifList, items);
}

function renderUpcomingEvents(card, items) {
    card.querySelectorAll('.event-item, .events-empty').forEach(el => el.remove());

    if (!items.length) {
        const empty = document.createElement('p');
        empty.className = 'events-empty text-center text-muted py-3 mb-0';
        empty.textContent = ' Nothing scheduled. Plan a study session or add an event.';
        card.appendChild(empty);
        return;
    }

    items.slice(0, 5).forEach(item => {
        const meta = DUE_SOON_ICON_META[item.type] || DUE_SOON_ICON_META.TASK;
        const when = item.dueDate ? formatDateLabel(item.dueDate) : 'No due date';
        const subject = item.subject ? item.subject.name : '';
        const div = document.createElement('div');
        div.className = 'event-item';
        div.innerHTML = `
            <div class="event-icon ${meta.bg}"><i class="bi ${meta.icon}"></i></div>
            <div><h6>${escapeHtml(item.title)}</h6><small>${escapeHtml(when)}${subject ? ' • ' + escapeHtml(subject) : ''}</small></div>
        `;
        card.appendChild(div);
    });
}

/** Rebuilds the notification bell dropdown from real due-soon items (or shows "No data to display"). */
function renderNotifications(container, items) {
    container.innerHTML = '';

    if (!items.length) {
        container.innerHTML = '<p class="text-center text-muted py-3 mb-0">No data to display</p>';
        return;
    }

    items.slice(0, 8).forEach((item, idx) => {
        const meta = DUE_SOON_ICON_META[item.type] || DUE_SOON_ICON_META.TASK;
        const div = document.createElement('div');
        div.className = 'notif-item unread';
        div.dataset.id = item.id || idx;
        div.innerHTML = `<i class="bi ${meta.icon} text-primary"></i><div><p>${escapeHtml(item.notification || item.title)}</p></div>`;
        container.appendChild(div);
    });
}

/* ==========================================================================
   Calendar: real month navigation + day selection
   ========================================================================== */

async function initCalendar() {
    const monthLabel = document.getElementById('calendarMonthLabel');
    const body = document.getElementById('calendarBody');
    const prevBtn = document.getElementById('calPrev');
    const nextBtn = document.getElementById('calNext');
    const hint = document.getElementById('calendarHint');

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    let events = {};

    async function loadEvents() {
        try {
            const items = await CalendarApi.items();
            events = {};
            items.forEach(item => {
                if (!item.dueDate) return;
                const [y, m, d] = item.dueDate.split('-').map(Number);
                const key = `${y}-${m - 1}-${d}`;
                if (!events[key]) events[key] = [];
                events[key].push(item.title);
            });
        } catch (err) {
            showToast(err.message || 'Could not load your calendar events.');
        }
    }

    const today = new Date();
    let viewYear = today.getFullYear();
    let viewMonth = today.getMonth();

    function ordinal(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    function defaultHintText() {
        const eventDays = [];
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const key = `${viewYear}-${viewMonth}-${day}`;
            if (events[key] && events[key].length) eventDays.push(day);
        }
        if (!eventDays.length) return 'Click any day to see its events.';
        const parts = eventDays.map(ordinal);
        const list = parts.length === 1
            ? parts[0]
            : `${parts.slice(0, -1).join(', ')} & ${parts[parts.length - 1]}`;
        return `${list} ${eventDays.length === 1 ? 'has' : 'have'} events. Click any day to select it.`;
    }

    function render() {
        monthLabel.textContent = `${monthNames[viewMonth]} ${viewYear}`;
        body.innerHTML = '';
        hint.textContent = defaultHintText();

        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

        let row = document.createElement('tr');
        for (let i = 0; i < firstDay; i++) row.appendChild(document.createElement('td'));

        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('td');
            cell.textContent = day;

            const key = `${viewYear}-${viewMonth}-${day}`;
            const dayEvents = events[key];
            const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

            if (isToday) cell.classList.add('today');
            if (dayEvents && dayEvents.length) {
                cell.classList.add('event-day');
                cell.title = dayEvents.join(', ');
                cell.dataset.event = dayEvents.join(', ');
            }

            cell.addEventListener('click', () => {
                body.querySelectorAll('td.selected-day').forEach(td => td.classList.remove('selected-day'));
                cell.classList.add('selected-day');
                hint.textContent = dayEvents && dayEvents.length
                    ? `${monthNames[viewMonth]} ${day}: ${dayEvents.join(', ')}`
                    : `Selected ${monthNames[viewMonth]} ${day}, ${viewYear}. No events scheduled.`;
            });

            row.appendChild(cell);
            if ((firstDay + day) % 7 === 0) {
                body.appendChild(row);
                row = document.createElement('tr');
            }
        }
        if (row.children.length) body.appendChild(row);
    }

    prevBtn.addEventListener('click', () => {
        viewMonth--;
        if (viewMonth < 0) { viewMonth = 11; viewYear--; }
        render();
    });

    nextBtn.addEventListener('click', () => {
        viewMonth++;
        if (viewMonth > 11) { viewMonth = 0; viewYear++; }
        render();
    });

    await loadEvents();
    render();
}

/* ==========================================================================
   Focus Timer: manually-set countdown time + a sound that plays when the time runs out
   ========================================================================== */

function playAlarmSound(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;

        const tone = (freq, start, dur, wave = 'sine', vol = 0.18) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = wave;
            osc.frequency.setValueAtTime(freq, now + start);
            gain.gain.setValueAtTime(0.0001, now + start);
            gain.gain.exponentialRampToValueAtTime(vol, now + start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now + start);
            osc.stop(now + start + dur + 0.05);
        };

        switch (type) {
            case 'digital':
                tone(1000, 0, 0.12, 'square');
                tone(1000, 0.18, 0.12, 'square');
                tone(1000, 0.36, 0.12, 'square');
                break;
            case 'chime':
                tone(523.25, 0, 0.35, 'sine');
                tone(659.25, 0.15, 0.55, 'sine');
                break;
            case 'siren': {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                gain.gain.setValueAtTime(0.12, now);
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(800, now + 0.3);
                osc.frequency.linearRampToValueAtTime(400, now + 0.6);
                osc.connect(gain).connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.65);
                break;
            }
            case 'beep':
            default:
                tone(880, 0, 0.5, 'sine');
        }

        setTimeout(() => ctx.close(), 1300);
    } catch (e) { /* audio not available, silently skip */ }
}

function initTimer() {
    const display = document.getElementById('timerDisplay');
    const btn = document.getElementById('timerBtn');
    const btnIcon = document.getElementById('timerBtnIcon');
    const modeLabel = document.getElementById('timerModeLabel');
    const circle = document.getElementById('timerCircle');

    const hoursInput = document.getElementById('alarmHours');
    const minutesInput = document.getElementById('alarmMinutes');
    const secondsInput = document.getElementById('alarmSeconds');
    const soundSelect = document.getElementById('alarmSound');
    const setAlarmBtn = document.getElementById('setAlarmBtn');
    const previewBtn = document.getElementById('previewSoundBtn');
    const resetBtn = document.getElementById('resetTimerBtn');

    const timerCard = document.getElementById('timerCard');
    const maximizeBtn = document.getElementById('timerMaximizeBtn');
    const maximizeIcon = maximizeBtn ? maximizeBtn.querySelector('i') : null;

    let totalSeconds = 25 * 60;
    let seconds = totalSeconds;
    let interval = null;
    let ringInterval = null;
    let running = false;
    let ringing = false;
    let maximized = false;
    let sessionStartAt = null; 

    function format(s) {
        const h = String(Math.floor(s / 3600)).padStart(2, '0');
        const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
        const sec = String(s % 60).padStart(2, '0');
        return `${h}:${m}:${sec}`;
    }

    function updateRing() {
        const pct = 1 - seconds / totalSeconds;
        const angle = pct * 360;
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        const trackColor = isDark ? '#173d2f' : '#d1fae5';
        circle.style.background = `conic-gradient(#10b981 ${angle}deg, ${trackColor} ${angle}deg)`;
    }

    function setControlsDisabled(disabled) {
        hoursInput.disabled = disabled;
        minutesInput.disabled = disabled;
        secondsInput.disabled = disabled;
        setAlarmBtn.disabled = disabled;
    }

    function readAlarmInput() {
        const h = Math.max(0, Math.min(23, parseInt(hoursInput.value, 10) || 0));
        const m = Math.max(0, Math.min(59, parseInt(minutesInput.value, 10) || 0));
        const s = Math.max(0, Math.min(59, parseInt(secondsInput.value, 10) || 0));
        hoursInput.value = h;
        minutesInput.value = m;
        secondsInput.value = s;
        return h * 3600 + m * 60 + s;
    }

    function stopRinging() {
        clearInterval(ringInterval);
        ringInterval = null;
        ringing = false;
        circle.classList.remove('ringing');
    }

    function setButtonIdle(label) {
        btnIcon.className = 'bi bi-play-fill';
        btn.classList.remove('state-paused', 'state-ringing');
        btn.setAttribute('aria-label', label);
        btn.title = label;
    }

    function setAlarm() {
        if (running) {
            showToast('Pause or stop the current session before changing the timer.');
            return;
        }
        stopRinging();
        const newTotal = readAlarmInput();
        if (newTotal <= 0) {
            showToast('Set a timer duration greater than 0 seconds.');
            return;
        }
        totalSeconds = newTotal;
        seconds = totalSeconds;
        display.textContent = format(seconds);
        modeLabel.textContent = 'Ready';
        circle.style.background = '';
        setButtonIdle('Start session');
        showToast(`Timer set for ${format(totalSeconds)}.`);
    }

    /* Reset button: always available */
    function resetTimer() {
        clearInterval(interval);
        interval = null;
        running = false;
        stopRinging();

        seconds = totalSeconds;
        sessionStartAt = null;
        display.textContent = format(seconds);
        circle.style.background = '';
        circle.classList.remove('ringing');
        modeLabel.textContent = 'Ready';
        setButtonIdle('Start session');
        setControlsDisabled(false);
        showToast('Timer reset.');
    }

    function tick() {
        if (seconds <= 0) {
            clearInterval(interval);
            interval = null;
            running = false;
            ringing = true;

            modeLabel.textContent = "Time's up!";
            btnIcon.className = 'bi bi-stop-fill';
            btn.classList.remove('state-paused');
            btn.classList.add('state-ringing');
            btn.setAttribute('aria-label', 'Stop sound');
            btn.title = 'Stop sound';
            circle.style.background = '';
            circle.classList.add('ringing');

            playAlarmSound(soundSelect.value);
            ringInterval = setInterval(() => playAlarmSound(soundSelect.value), 1400);

            showToast('Time\'s up! Focus session complete.', 'success');
            bumpStudySession();

            const startedAt = sessionStartAt || new Date(Date.now() - totalSeconds * 1000);
            saveFocusSession(startedAt, new Date(), totalSeconds);
            sessionStartAt = null; 
            return;
        }
        seconds--;
        display.textContent = format(seconds);
        updateRing();
    }

    btn.addEventListener('click', () => {
        if (ringing) {
            resetTimer();
            return;
        }

        if (running) {
            clearInterval(interval);
            interval = null;
            running = false;
            btnIcon.className = 'bi bi-play-fill';
            btn.classList.remove('state-ringing');
            btn.classList.add('state-paused');
            btn.setAttribute('aria-label', 'Resume session');
            btn.title = 'Resume';
            modeLabel.textContent = 'Paused';
        } else {
            if (!sessionStartAt) sessionStartAt = new Date(); 
            running = true;
            btnIcon.className = 'bi bi-pause-fill';
            btn.classList.remove('state-paused', 'state-ringing');
            btn.setAttribute('aria-label', 'Pause session');
            btn.title = 'Pause';
            modeLabel.textContent = 'Focusing…';
            setControlsDisabled(true);
            interval = setInterval(tick, 1000);
        }
    });

    setAlarmBtn.addEventListener('click', setAlarm);
    previewBtn.addEventListener('click', () => playAlarmSound(soundSelect.value));
    resetBtn.addEventListener('click', resetTimer);

    /* Maximize / restore the timer */
    function setMaximized(state) {
        maximized = state;
        timerCard.classList.toggle('timer-maximized', maximized);
        document.body.classList.toggle('timer-fullscreen-active', maximized);
        if (maximizeIcon) {
            maximizeIcon.className = maximized ? 'bi bi-arrows-angle-contract' : 'bi bi-arrows-angle-expand';
        }
        if (maximizeBtn) {
            const label = maximized ? 'Restore timer' : 'Maximize timer';
            maximizeBtn.setAttribute('aria-label', label);
            maximizeBtn.title = maximized ? 'Restore' : 'Maximize';
        }
    }

    if (maximizeBtn) {
        maximizeBtn.addEventListener('click', () => setMaximized(!maximized));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && maximized) setMaximized(false);
        });
    }

    display.textContent = format(seconds);
}

async function saveFocusSession(startedAt, endedAt, totalSeconds) {
    const toHHMM = (d) => String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    let start = startedAt;
    let end = endedAt;
    if (toHHMM(start) === toHHMM(end)) {
        end = new Date(end.getTime() + 60000);
    }

    const minutes = Math.max(1, Math.round(totalSeconds / 60));
    try {
        await PlannerApi.createSession({
            title: `Focus session (${minutes} min)`,
            date: toLocalIsoDate(start),
            startTime: toHHMM(start),
            endTime: toHHMM(end),
            sessionType: 'regular',
            completed: true
        });
    } catch (err) {
        showToast(err.message || 'Focus session finished, but could not be saved.');
    }
}

function bumpStudySession() {
    const el = document.getElementById('statSessions');
    if (!el) return;
    const current = parseInt(el.textContent, 10) || 0;
    el.textContent = current + 1;
    el.dataset.count = current + 1;
    pulseCard(el);
}

function pulseCard(el) {
    const card = el.closest('.stat-card');
    if (!card) return;
    card.classList.add('pulse');
    setTimeout(() => card.classList.remove('pulse'), 500);
}

/* ==========================================================================
   Recent Tasks table
   ========================================================================== */

const TASK_STATUS_ORDER = ['pending', 'progress', 'done'];
const TASK_STATUS_LABELS = { pending: 'Pending', progress: 'In Progress', done: 'Completed' };
const TASK_URGENCY_ORDER = ['low', 'medium', 'high'];
const TASK_URGENCY_LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

async function populateSubjectDatalist(datalistId) {
    const list = document.getElementById(datalistId);
    if (!list) return;
    try {
        const subjects = await SubjectsApi.list();
        const existing = new Set(Array.from(list.options).map(o => o.value));
        subjects.forEach(s => {
            if (!existing.has(s.name)) {
                const opt = document.createElement('option');
                opt.value = s.name;
                list.appendChild(opt);
            }
        });
    } catch {  }
}

let tasksCache = [];

async function initTasksTable() {
    const table = document.getElementById('tasksTable');
    if (!table) return;

    await refreshTasksTable();
    populateSubjectDatalist('newTaskSubjectList');

    const activateStatusPill = async (pill) => {
        const row = pill.closest('tr');
        const taskId = Number(row.dataset.taskId);
        const current = pill.dataset.status;
        const next = TASK_STATUS_ORDER[(TASK_STATUS_ORDER.indexOf(current) + 1) % TASK_STATUS_ORDER.length];

        try {
            await TasksApi.update(taskId, { status: next });
        } catch (err) {
            showToast(err.message || 'Could not update that task.');
            return;
        }

        pill.classList.remove('status-pending', 'status-progress', 'status-done');
        pill.classList.add(`status-${next}`);
        pill.dataset.status = next;
        pill.textContent = TASK_STATUS_LABELS[next];
        row.dataset.status = next;

        const wasDone = current === 'done';
        const isDone = next === 'done';

        if (isDone && !wasDone) {
            row.classList.add('completed-row');
            bumpCompletedCount(1);
            showToast('Nice work! Task completed.', 'success');
        } else if (!isDone && wasDone) {
            row.classList.remove('completed-row');
            bumpCompletedCount(-1);
        }
        applyTaskFilters();
    };

    const activateUrgencyPill = async (pill) => {
        const row = pill.closest('tr');
        const taskId = Number(row.dataset.taskId);
        const current = pill.dataset.urgency;
        const next = TASK_URGENCY_ORDER[(TASK_URGENCY_ORDER.indexOf(current) + 1) % TASK_URGENCY_ORDER.length];

        try {
            await TasksApi.update(taskId, { urgency: next });
        } catch (err) {
            showToast(err.message || 'Could not update that task.');
            return;
        }

        pill.classList.remove('urgency-low', 'urgency-medium', 'urgency-high');
        pill.classList.add(`urgency-${next}`);
        pill.dataset.urgency = next;
        pill.textContent = TASK_URGENCY_LABELS[next];
        row.dataset.urgency = next;
        applyTaskFilters();
    };

    table.addEventListener('click', (e) => {
        const statusPill = e.target.closest('.status-pill');
        if (statusPill) { activateStatusPill(statusPill); return; }
        const urgencyPill = e.target.closest('.urgency-pill');
        if (urgencyPill) { activateUrgencyPill(urgencyPill); return; }
        const editBtn = e.target.closest('.action-edit-btn');
        if (editBtn) { openEditTaskModal(editBtn.closest('tr')); return; }
        const delBtn = e.target.closest('.log-delete-btn');
        if (delBtn) {
            const row = delBtn.closest('tr');
            const taskId = Number(row.dataset.taskId);
            const name = row.querySelector('.task-name')?.textContent || 'Task';
            TasksApi.remove(taskId)
                .then(() => {
                    row.remove();
                    tasksCache = tasksCache.filter(t => t.id !== taskId);
                    ensureTasksEmptyState();
                    applyTaskFilters();
                    showToast(`"${name}" deleted.`);
                })
                .catch(err => showToast(err.message || 'Could not delete that task.'));
        }
    });
    table.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const statusPill = e.target.closest('.status-pill');
        if (statusPill) { e.preventDefault(); activateStatusPill(statusPill); return; }
        const urgencyPill = e.target.closest('.urgency-pill');
        if (urgencyPill) { e.preventDefault(); activateUrgencyPill(urgencyPill); }
    });

    initAddTaskForm();
    initTaskFilters();
}

/** Fetches every task for the logged-in user and re-renders the table body. */
async function refreshTasksTable() {
    const body = document.getElementById('tasksTableBody');
    if (!body) return;
    try {
        tasksCache = await TasksApi.list();
    } catch (err) {
        showToast(err.message || 'Could not load your tasks.');
        return;
    }
    body.innerHTML = '';
    tasksCache.forEach(task => body.appendChild(buildTaskRow(task)));
    ensureTasksEmptyState();
}

function ensureTasksEmptyState() {
    const body = document.getElementById('tasksTableBody');
    if (!body) return;
    const hasRows = !!body.querySelector('tr:not(.empty-state-row):not(.filters-empty-row)');
    if (!hasRows) {
        const filtersRow = body.querySelector('.filters-empty-row');
        if (filtersRow) filtersRow.remove();
        if (!body.querySelector('.empty-state-row')) {
            body.appendChild(buildEmptyStateRow(6, {
                message: 'No tasks yet',
                buttonLabel: 'Add Task',
                targetSelector: '#addTaskCard',
                focusSelector: '#newTaskName'
            }));
        }
    } else {
        const emptyRow = body.querySelector('.empty-state-row');
        if (emptyRow) emptyRow.remove();
    }
}

function subjectOrTagHtml(subjectName, category) {
    if (subjectName) return escapeHtml(subjectName);
    const tagName = category || 'Personal';
    return tagName.toLowerCase() === 'personal'
        ? '<span class="badge-personal"><i class="bi bi-person"></i> Personal</span>'
        : `<span class="badge-personal"><i class="bi bi-tag"></i> ${escapeHtml(tagName)}</span>`;
}

function buildTaskRow(task) {
    const urgencyKey = TASK_URGENCY_ORDER.includes(task.urgency) ? task.urgency : 'medium';
    const statusKey = TASK_STATUS_ORDER.includes(task.status) ? task.status : 'pending';
    const dueLabel = task.dueDate ? formatDateLabel(task.dueDate) : 'No due date';
    const subjectName = task.subject ? task.subject.name : null;
    const subjectCellHtml = subjectOrTagHtml(subjectName, task.category);

    const row = document.createElement('tr');
    row.dataset.taskId = task.id;
    row.dataset.dueDate = task.dueDate || '';
    row.dataset.subjectId = task.subject ? task.subject.id : '';
    row.dataset.category = task.category || '';
    row.dataset.urgency = urgencyKey;
    row.dataset.status = statusKey;
    if (statusKey === 'done') row.classList.add('completed-row');
    row.innerHTML = `
        <td class="task-title-cell"><i class="bi bi-journal-text text-primary me-2"></i><span class="task-name">${escapeHtml(task.title)}</span></td>
        <td class="task-subject">${subjectCellHtml}</td>
        <td>${escapeHtml(dueLabel)}</td>
        <td><span class="urgency-pill urgency-${urgencyKey}" data-urgency="${urgencyKey}" role="button" tabindex="0">${TASK_URGENCY_LABELS[urgencyKey]}</span></td>
        <td><span class="status-pill status-${statusKey}" data-status="${statusKey}" role="button" tabindex="0">${TASK_STATUS_LABELS[statusKey]}</span></td>
        <td class="task-actions"><button class="action-edit-btn" aria-label="Edit task"><i class="bi bi-pencil"></i></button><button class="log-delete-btn" aria-label="Delete task"><i class="bi bi-trash"></i></button></td>
    `;
    return row;
}

function openEditTaskModal(row) {
    const modalEl = document.getElementById('editTaskModal');
    if (!row || !modalEl || typeof bootstrap === 'undefined') return;

    const taskId = Number(row.dataset.taskId);
    const nameEl = row.querySelector('.task-name');
    const subjectEl = row.querySelector('.task-subject');
    const urgencyPill = row.querySelector('.urgency-pill');

    document.getElementById('editTaskName').value = nameEl ? nameEl.textContent.trim() : '';
    document.getElementById('editTaskSubject').value = row.dataset.subjectId ? (subjectEl ? subjectEl.textContent.trim() : '') : '';
    document.getElementById('editTaskDue').value = row.dataset.dueDate || '';
    document.getElementById('editTaskUrgency').value = urgencyPill ? urgencyPill.dataset.urgency : 'medium';

    const saveBtn = document.getElementById('editTaskSaveBtn');
    saveBtn.onclick = async () => {
        const name = document.getElementById('editTaskName').value.trim();
        const subject = document.getElementById('editTaskSubject').value.trim();
        const dueDate = document.getElementById('editTaskDue').value || null;
        const urgency = document.getElementById('editTaskUrgency').value;

        if (!name) { showToast('Enter a task name before saving.'); return; }

        saveBtn.disabled = true;
        try {
            const subjectId = subject ? await SubjectsApi.findOrCreateByName(subject) : null;
            const category = subjectId ? null : (row.dataset.category || 'Personal');
            await TasksApi.update(taskId, { title: name, subjectId, dueDate, urgency, category });

            if (nameEl) nameEl.textContent = name;
            if (subjectEl) subjectEl.innerHTML = subjectOrTagHtml(subject || null, category);
            row.dataset.dueDate = dueDate || '';
            row.dataset.subjectId = subjectId || '';
            row.dataset.category = category || '';
            row.children[2].textContent = dueDate ? formatDateLabel(dueDate) : 'No due date';
            if (urgencyPill) {
                const urgencyKey = TASK_URGENCY_ORDER.includes(urgency) ? urgency : 'medium';
                urgencyPill.classList.remove('urgency-low', 'urgency-medium', 'urgency-high');
                urgencyPill.classList.add(`urgency-${urgencyKey}`);
                urgencyPill.dataset.urgency = urgencyKey;
                urgencyPill.textContent = TASK_URGENCY_LABELS[urgencyKey];
                row.dataset.urgency = urgencyKey;
            }

            row.classList.add('flash-highlight');
            setTimeout(() => row.classList.remove('flash-highlight'), 1600);

            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
            showToast(`"${name}" updated.`, 'success');
            applyTaskFilters();
        } catch (err) {
            showToast(err.message || 'Could not save that task.');
        } finally {
            saveBtn.disabled = false;
        }
    };

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

/* "Add Task" form */
function initAddTaskForm() {
    const addBtn = document.getElementById('addTaskBtn');
    if (!addBtn) return;

    const nameInput = document.getElementById('newTaskName');
    const subjectInput = document.getElementById('newTaskSubject');
    const dueInput = document.getElementById('newTaskDue');
    const urgencyInput = document.getElementById('newTaskUrgency');

    const tagModalEl = document.getElementById('taskTagModal');
    const tagInput = document.getElementById('taskTagInput');
    const tagConfirmBtn = document.getElementById('taskTagConfirmBtn');
    const tagQuickPicks = tagModalEl ? tagModalEl.querySelectorAll('.tag-quick-pick') : [];

    async function submitTask({ subjectName, tagName }) {
        const name = nameInput.value.trim();
        const urgency = urgencyInput && TASK_URGENCY_ORDER.includes(urgencyInput.value) ? urgencyInput.value : 'medium';
        const dueDate = dueInput.value || null;

        addBtn.disabled = true;
        try {
            const subjectId = subjectName ? await SubjectsApi.findOrCreateByName(subjectName) : null;
            const task = await TasksApi.create({
                title: name, subjectId, dueDate, urgency, status: 'pending',
                category: subjectId ? null : (tagName || 'Personal')
            });
            addTaskRow(task);

            nameInput.value = '';
            subjectInput.value = '';
            dueInput.value = '';
            if (urgencyInput) urgencyInput.value = 'medium';
            nameInput.focus();

            showToast(`"${name}" added to your task list.`, 'success');
            return true;
        } catch (err) {
            showToast(err.message || 'Could not add that task.');
            return false;
        } finally {
            addBtn.disabled = false;
        }
    }

    addBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const subject = subjectInput.value.trim();

        if (!name) {
            showToast('Enter a task name before adding it.');
            return;
        }

        if (subject) {
            await submitTask({ subjectName: subject });
            return;
        }

        if (tagModalEl && typeof bootstrap !== 'undefined') {
            tagInput.value = 'Personal';
            bootstrap.Modal.getOrCreateInstance(tagModalEl).show();
            setTimeout(() => tagInput.focus(), 300);
        } else {
            await submitTask({ tagName: 'Personal' });
        }
    });

    if (tagConfirmBtn) {
        tagConfirmBtn.addEventListener('click', async () => {
            const tagName = tagInput.value.trim() || 'Personal';
            const ok = await submitTask({ tagName });
            if (ok) bootstrap.Modal.getOrCreateInstance(tagModalEl).hide();
        });
    }

    tagQuickPicks.forEach(btn => {
        btn.addEventListener('click', () => {
            tagInput.value = btn.dataset.tag;
            tagInput.focus();
        });
    });

    if (tagInput) {
        tagInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                tagConfirmBtn.click();
            }
        });
    }
}

/* Inserts a freshly-created task at the top of the Recent Tasks table. */
function addTaskRow(task) {
    const body = document.getElementById('tasksTableBody');
    if (!body) return;
    const emptyRow = body.querySelector('.empty-state-row');
    if (emptyRow) emptyRow.remove();

    const row = buildTaskRow(task);
    row.classList.add('flash-highlight');
    body.insertBefore(row, body.firstChild);
    setTimeout(() => row.classList.remove('flash-highlight'), 1600);
    applyTaskFilters();
}

/* ==========================================================================
   Tasks page filter
   ========================================================================== */
async function initTaskFilters() {
    const bar = document.getElementById('taskFiltersBar');
    if (!bar) return;

    const subjectSelect = document.getElementById('taskFilterSubject');
    if (subjectSelect) {
        try {
            const subjects = await SubjectsApi.list();
            subjects.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.name;
                subjectSelect.appendChild(opt);
            });
        } catch { /* subject dropdown is a nice-to-have filter - fail silently */ }
    }

    ['taskFilterSubject', 'taskFilterDue', 'taskFilterUrgency', 'taskFilterStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyTaskFilters);
    });
    const searchInput = document.getElementById('taskSearch');
    if (searchInput) searchInput.addEventListener('input', applyTaskFilters);

    applyTaskFilters();
}

function taskDueBucket(dueDateStr) {
    if (!dueDateStr) return 'later';
    const due = new Date(dueDateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due - today) / 86400000);
    if (diffDays < 0) return 'overdue';
    if (diffDays === 0) return 'today';
    if (diffDays <= 7) return 'week';
    return 'later';
}

function applyTaskFilters() {
    const body = document.getElementById('tasksTableBody');
    if (!body) return;
    const rows = Array.from(body.querySelectorAll('tr:not(.empty-state-row):not(.filters-empty-row)'));
    if (!rows.length) return; 
    const q = (document.getElementById('taskSearch')?.value || '').trim().toLowerCase();
    const subjectId = document.getElementById('taskFilterSubject')?.value || '';
    const due = document.getElementById('taskFilterDue')?.value || '';
    const urgency = document.getElementById('taskFilterUrgency')?.value || '';
    const status = document.getElementById('taskFilterStatus')?.value || '';

    let visible = 0;
    rows.forEach(row => {
        const show = (!q || row.textContent.toLowerCase().includes(q))
            && (!subjectId || row.dataset.subjectId === subjectId)
            && (!due || taskDueBucket(row.dataset.dueDate) === due)
            && (!urgency || row.dataset.urgency === urgency)
            && (!status || row.dataset.status === status);
        row.style.display = show ? '' : 'none';
        if (show) visible++;
    });

    let emptyRow = body.querySelector('.filters-empty-row');
    if (visible === 0) {
        if (!emptyRow) {
            emptyRow = document.createElement('tr');
            emptyRow.className = 'filters-empty-row';
            emptyRow.innerHTML = `<td colspan="6" class="empty-state-cell"><div class="empty-state-block">
                <i class="fa-solid fa-filter-circle-xmark"></i>
                <p>No tasks match your filters.</p>
                <button type="button" class="btn btn-sm btn-outline-secondary filters-clear-btn" id="taskFiltersClearBtn">Clear Filters</button>
            </div></td>`;
            body.appendChild(emptyRow);
            document.getElementById('taskFiltersClearBtn').addEventListener('click', clearTaskFilters);
        }
    } else if (emptyRow) {
        emptyRow.remove();
    }

    const legacyNoResults = document.getElementById('taskSearchNoResults');
    if (legacyNoResults) legacyNoResults.style.display = 'none';
}

function clearTaskFilters() {
    ['taskSearch', 'taskFilterSubject', 'taskFilterDue', 'taskFilterUrgency', 'taskFilterStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    applyTaskFilters();
}

/* ==========================================================================
   Page search bars
   ========================================================================== */

function initPageSearch() {
    wireListFilter('attendanceSearch', '#attendanceLogTable tbody tr');
    initAssignmentsExamsTabs();
    initPageSearchPopup();
}

/* Assignments & Exams page */
let aeCache = [];

async function initAssignmentsExamsTabs() {
    const tabs = document.querySelectorAll('#aeTabs .ae-tab');
    const list = document.getElementById('aeList');
    if (!tabs.length || !list) return;

    const params = new URLSearchParams(window.location.search);
    let activeType = params.get('type') === 'exam' ? 'exam' : (params.get('type') === 'assignment' ? 'assignment' : 'all');

    const heading = document.getElementById('aeHeading');
    const headingIcon = document.getElementById('aeHeadingIcon');
    const headingText = document.getElementById('aeHeadingText');
    const navbarTitle = document.getElementById('greetingTitle');
    const navbarSub = document.getElementById('greetingSub');
    const searchInput = document.getElementById('itemSearch');
    const noResults = document.getElementById('itemSearchNoResults');
    const subjectSelect = document.getElementById('aeFilterSubject');
    const dateFromInput = document.getElementById('aeFilterDateFrom');
    const dateToInput = document.getElementById('aeFilterDateTo');

    function updateHeading() {
        if (!heading) return;
        const label = activeType === 'exam' ? 'Exams'
            : activeType === 'assignment' ? 'Assignments'
            : 'Assignments & Exams';
        const iconClass = activeType === 'exam' ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-book-open';
        if (headingText) headingText.textContent = label;
        if (headingIcon) headingIcon.className = iconClass;

        if (navbarTitle) navbarTitle.textContent = label;
        if (navbarSub) {
            navbarSub.textContent = activeType === 'exam'
                ? 'Track your exam dates before they sneak up on you.'
                : activeType === 'assignment'
                ? 'Track deadlines before they sneak up on you.'
                : 'Track deadlines and exam dates before they sneak up on you.';
        }
    }

    function emptyMessageFor(type) {
        if (type === 'exam') return { icon: 'fa-solid fa-champagne-glasses', text: 'No upcoming exams.' };
        if (type === 'assignment') return { icon: 'fa-solid fa-circle-check', text: "You're all caught up! No assignments pending." };
        return { icon: 'fa-solid fa-circle-check', text: "You're all caught up! Nothing due right now." };
    }

    /** Used only when there is truly no data at all yet (not just filtered/completed). */
    function genuinelyEmptyMessageFor(type) {
        if (type === 'exam') return { icon: 'fa-solid fa-champagne-glasses', text: 'No exams yet. Add your first exam to stay ahead of test day.' };
        if (type === 'assignment') return { icon: 'fa-solid fa-note-sticky', text: ' No assignments yet. Create your first assignment to keep track of deadlines.' };
        return { icon: 'fa-solid fa-note-sticky', text: ' No assignments yet. Create your first assignment to keep track of deadlines.' };
    }

    function clearAeFilters() {
        if (searchInput) searchInput.value = '';
        if (subjectSelect) subjectSelect.value = '';
        if (dateFromInput) dateFromInput.value = '';
        if (dateToInput) dateToInput.value = '';
        render();
    }

    function render() {
        const items = Array.from(document.querySelectorAll('.ae-item'));
        const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const subjectId = subjectSelect ? subjectSelect.value : '';
        const dateFrom = dateFromInput ? dateFromInput.value : '';
        const dateTo = dateToInput ? dateToInput.value : '';
        const filtersActive = !!(q || subjectId || dateFrom || dateTo);

        let visible = 0;
        tabs.forEach(t => t.classList.toggle('active', t.dataset.type === activeType));
        items.forEach(item => {
            const typeOk = activeType === 'all' || item.dataset.type === activeType;
            const textOk = !q || item.textContent.toLowerCase().includes(q);
            const subjectOk = !subjectId || item.dataset.subjectId === subjectId;
            const due = item.dataset.dueDate;
            const dateOk = (!dateFrom || (due && due >= dateFrom)) && (!dateTo || (due && due <= dateTo));
            const show = typeOk && textOk && subjectOk && dateOk;
            item.style.display = show ? '' : 'none';
            if (show) visible++;
        });

        if (noResults) {
            if (visible === 0 && aeCache.length === 0) {
                noResults.innerHTML = buildEmptyStateHtml({
                    icon: genuinelyEmptyMessageFor(activeType).icon,
                    message: genuinelyEmptyMessageFor(activeType).text,
                    buttonLabel: activeType === 'exam' ? 'Add Exam' : activeType === 'assignment' ? 'Add Assignment' : 'Add Item',
                    targetSelector: '#addAeCard',
                    focusSelector: '#newAeName'
                });
                noResults.style.display = 'block';
            } else if (visible === 0 && filtersActive) {
                noResults.innerHTML = `<i class="fa-solid fa-filter-circle-xmark"></i> No assignments/exams match your filters.
                    <div class="mt-2"><button type="button" class="btn btn-sm btn-outline-secondary filters-clear-btn" id="aeFiltersClearBtn">Clear Filters</button></div>`;
                noResults.style.display = 'block';
                const clearBtn = document.getElementById('aeFiltersClearBtn');
                if (clearBtn) clearBtn.addEventListener('click', clearAeFilters);
            } else if (visible === 0) {
                const msg = emptyMessageFor(activeType);
                noResults.innerHTML = `<i class="${msg.icon}"></i> ${msg.text}`;
                noResults.style.display = 'block';
            } else {
                noResults.style.display = 'none';
            }
        }
    }

    async function refreshItems() {
        try {
            aeCache = await AssignmentsExamsApi.list();
        } catch (err) {
            showToast(err.message || 'Could not load your assignments/exams.');
            return;
        }
        list.innerHTML = '';
        aeCache.forEach(item => list.appendChild(buildAeItem(item)));
        render();
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            activeType = tab.dataset.type;
            updateHeading();
            render();
        });
    });

    if (searchInput) searchInput.addEventListener('input', render);
    if (subjectSelect) subjectSelect.addEventListener('change', render);
    if (dateFromInput) dateFromInput.addEventListener('change', render);
    if (dateToInput) dateToInput.addEventListener('change', render);

    if (subjectSelect) {
        try {
            const subjects = await SubjectsApi.list();
            subjects.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s.id;
                opt.textContent = s.name;
                subjectSelect.appendChild(opt);
            });
        } catch { }
    }

    initAddAeForm(refreshItems);

    list.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.action-edit-btn');
        if (editBtn) { openEditAeModal(editBtn.closest('.ae-item'), refreshItems); return; }
        const delBtn = e.target.closest('.log-delete-btn');
        if (delBtn) {
            const item = delBtn.closest('.ae-item');
            const itemId = Number(item.dataset.itemId);
            const title = item.querySelector('h6')?.textContent || 'Item';
            AssignmentsExamsApi.remove(itemId)
                .then(() => {
                    item.remove();
                    aeCache = aeCache.filter(a => a.id !== itemId);
                    showToast(`"${title}" deleted.`);
                    render();
                })
                .catch(err => showToast(err.message || 'Could not delete that item.'));
        }
    });

    updateHeading();
    await refreshItems();
    populateSubjectDatalist('newAeSubjectList');
}

function buildAeItem(record) {
    const isExam = record.itemType === 'exam';
    const subjectName = record.subject ? record.subject.name : 'General';
    const dueLabel = record.dueDate ? `Due ${formatDateLabel(record.dueDate)}` : 'No due date';

    const item = document.createElement('div');
    item.className = 'event-item ae-item';
    item.dataset.type = isExam ? 'exam' : 'assignment';
    item.dataset.itemId = record.id;
    item.dataset.dueDate = record.dueDate || '';
    item.dataset.subjectId = record.subject ? record.subject.id : '';
    item.innerHTML = `
        <div class="event-icon ${isExam ? 'bg-danger' : 'bg-purple'}"><i class="bi ${isExam ? 'bi-pencil-square' : 'bi-journal-text'}"></i></div>
        <div><h6>${escapeHtml(record.title)}</h6><small>${escapeHtml(subjectName)} • ${escapeHtml(dueLabel)}</small></div>
        <div class="ae-actions"><button class="action-edit-btn" aria-label="Edit item"><i class="bi bi-pencil"></i></button><button class="log-delete-btn" aria-label="Delete item"><i class="bi bi-trash"></i></button></div>
    `;
    return item;
}

function openEditAeModal(item, onSaved) {
    const modalEl = document.getElementById('editAeModal');
    if (!item || !modalEl || typeof bootstrap === 'undefined') return;

    const itemId = Number(item.dataset.itemId);
    const titleEl = item.querySelector('h6');
    const smallEl = item.querySelector('small');
    const currentSubject = smallEl ? smallEl.textContent.split('•')[0].trim() : '';

    document.getElementById('editAeName').value = titleEl ? titleEl.textContent.trim() : '';
    document.getElementById('editAeSubject').value = currentSubject || '';
    document.getElementById('editAeDue').value = item.dataset.dueDate || '';
    document.getElementById('editAeType').value = item.dataset.type === 'exam' ? 'exam' : 'assignment';

    const saveBtn = document.getElementById('editAeSaveBtn');
    saveBtn.onclick = async () => {
        const name = document.getElementById('editAeName').value.trim();
        const subject = document.getElementById('editAeSubject').value.trim();
        const dueDate = document.getElementById('editAeDue').value || null;
        const type = document.getElementById('editAeType').value === 'exam' ? 'exam' : 'assignment';

        if (!name) { showToast('Enter a title before saving.'); return; }
        if (!subject) { showToast('Enter a subject before saving.'); return; }

        saveBtn.disabled = true;
        try {
            const subjectId = await SubjectsApi.findOrCreateByName(subject);
            const originalType = item.dataset.type;
            if (type !== originalType) {
                await AssignmentsExamsApi.remove(itemId);
                await AssignmentsExamsApi.create({ title: name, subjectId, dueDate, itemType: type });
            } else {
                await AssignmentsExamsApi.update(itemId, { title: name, subjectId, dueDate });
            }

            item.classList.add('flash-highlight');
            setTimeout(() => item.classList.remove('flash-highlight'), 1600);

            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
            showToast(`"${name}" updated.`, 'success');
            if (onSaved) onSaved();
        } catch (err) {
            showToast(err.message || 'Could not save that item.');
        } finally {
            saveBtn.disabled = false;
        }
    };

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

/* "Add Assignment / Exam" form */
function initAddAeForm(onItemAdded) {
    const addBtn = document.getElementById('addAeBtn');
    if (!addBtn) return;

    addBtn.addEventListener('click', async () => {
        const nameInput = document.getElementById('newAeName');
        const subjectInput = document.getElementById('newAeSubject');
        const typeInput = document.getElementById('newAeType');
        const dueInput = document.getElementById('newAeDue');

        const name = nameInput.value.trim();
        const subject = subjectInput.value.trim();
        const type = typeInput && typeInput.value === 'exam' ? 'exam' : 'assignment';
        const dueDate = dueInput.value || null;

        if (!name) {
            showToast('Enter a title before adding it.');
            return;
        }
        if (!subject) {
            showToast('Enter a subject before adding it.');
            return;
        }

        addBtn.disabled = true;
        try {
            const subjectId = await SubjectsApi.findOrCreateByName(subject);
            await AssignmentsExamsApi.create({ title: name, subjectId, dueDate, itemType: type });

            nameInput.value = '';
            subjectInput.value = '';
            dueInput.value = '';
            if (typeInput) typeInput.value = 'assignment';
            nameInput.focus();

            showToast(`"${name}" added to your ${type === 'exam' ? 'exams' : 'assignments'}.`, 'success');
            if (onItemAdded) await onItemAdded();
        } catch (err) {
            showToast(err.message || 'Could not add that item.');
        } finally {
            addBtn.disabled = false;
        }
    });
}

function wireListFilter(inputId, itemSelector) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const items = document.querySelectorAll(itemSelector);
    const noResults = document.getElementById(inputId + 'NoResults');

    input.addEventListener('input', () => {
        const q = input.value.trim().toLowerCase();
        let visibleCount = 0;
        items.forEach(item => {
            const matches = item.textContent.toLowerCase().includes(q);
            item.style.display = matches ? '' : 'none';
            if (matches) visibleCount++;
        });
        if (noResults) noResults.style.display = (q && visibleCount === 0) ? 'block' : 'none';
    });
}

/* Navbar search icon  */
function initPageSearchPopup() {
    const toggle = document.getElementById('pageSearchToggle');
    const popup = document.getElementById('pageSearchPopup');
    if (!toggle || !popup) return;

    const input = popup.querySelector('input');

    const openPopup = () => {
        popup.classList.add('open');
        toggle.classList.add('active');
        if (input) setTimeout(() => input.focus(), 50);
    };
    const closePopup = () => {
        popup.classList.remove('open');
        toggle.classList.remove('active');
    };

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        popup.classList.contains('open') ? closePopup() : openPopup();
    });

    popup.addEventListener('click', (e) => e.stopPropagation());

    document.addEventListener('click', () => closePopup());

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closePopup();
    });
}

function bumpCompletedCount(delta) {
    const el = document.getElementById('statCompleted');
    if (!el) return;
    const current = parseInt(el.textContent, 10) || 0;
    const next = Math.max(0, current + delta);
    el.textContent = next;
    el.dataset.count = next;
    pulseCard(el);
}

/* ==========================================================================
   Dashboard stat cards: real counts from the database
   ========================================================================== */

function currentWeekRangeIso() {
    const isoMonday = getMondayISO(new Date());
    const sunday = new Date(isoMonday + 'T00:00:00');
    sunday.setDate(sunday.getDate() + 6);
    return { isoMonday, isoSunday: toLocalIsoDate(sunday) };
}

async function loadDashboardStats() {
    const examsEl = document.getElementById('statExams');
    const assignmentsEl = document.getElementById('statAssignments');
    const sessionsEl = document.getElementById('statSessions');
    const completedEl = document.getElementById('statCompleted');
    if (!examsEl && !assignmentsEl && !sessionsEl && !completedEl) return;

    const { isoMonday, isoSunday } = currentWeekRangeIso();

    if (examsEl) {
        try {
            const todayIso = toLocalIsoDate();
            const sevenDaysIso = toLocalIsoDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
            const exams = await AssignmentsExamsApi.list('exam');
            const upcoming = exams.filter(e => e.dueDate && e.dueDate >= todayIso && e.dueDate <= sevenDaysIso).length;
            examsEl.dataset.count = upcoming;
        } catch (err) {
            examsEl.dataset.count = 0;
        }
    }

    if (assignmentsEl) {
        try {
            const assignments = await AssignmentsExamsApi.list('assignment');
            const pending = assignments.filter(a => a.submissionStatus !== 'submitted').length;
            assignmentsEl.dataset.count = pending;
        } catch (err) {
            assignmentsEl.dataset.count = 0;
        }
    }

    if (sessionsEl) {
        try {
            const sessions = await PlannerApi.listSessions(isoMonday, isoSunday);
            sessionsEl.dataset.count = (sessions || []).length;
        } catch (err) {
            sessionsEl.dataset.count = 0;
        }
    }

    if (completedEl) {
        try {
            const doneTasks = await TasksApi.list('done');
            const doneThisWeek = doneTasks.filter(t => t.dueDate && t.dueDate >= isoMonday && t.dueDate <= isoSunday).length;
            completedEl.dataset.count = doneThisWeek;
        } catch (err) {
            completedEl.dataset.count = 0;
        }
    }
}

const GETTING_STARTED_VISIBLE_KEY = 'levelup-show-getting-started';

const GETTING_STARTED_TASKS = [
    { key: 'subject', label: 'Add your first Subject' },
    { key: 'assignment', label: 'Add your first Assignment' },
    { key: 'timetable', label: 'Create your Timetable' },
    { key: 'studySession', label: 'Schedule your first Study Session' },
    { key: 'profile', label: 'Complete your Profile' }
];

async function initGettingStartedChecklist() {
    const row = document.getElementById('gettingStartedRow');
    const card = document.getElementById('gettingStartedCard');
    if (!row || !card) return;

    let shouldShow = false;
    try { shouldShow = localStorage.getItem(GETTING_STARTED_VISIBLE_KEY) === 'true'; } catch { shouldShow = false; }
    if (!shouldShow) return;

    const progress = await loadGettingStartedProgress();
    if (!progress) return; 

    renderGettingStartedCard(card, progress);
    row.style.display = '';
}

async function loadGettingStartedProgress() {
    try {
        const [subjects, assignments, lectures, sessions, profile] = await Promise.all([
            SubjectsApi.list().catch(() => []),
            AssignmentsExamsApi.list('assignment').catch(() => []),
            TimetableApi.list().catch(() => []),
            PlannerApi.listSessions().catch(() => []),
            ProfileApi.get().catch(() => null)
        ]);

        const profileComplete = !!(profile && profile.name && profile.faculty && profile.semester);

        return {
            subject: subjects.length > 0,
            assignment: assignments.length > 0,
            timetable: lectures.length > 0,
            studySession: (sessions || []).length > 0,
            profile: profileComplete
        };
    } catch (err) {
        return null;
    }
}

function renderGettingStartedCard(card, progress) {
    const doneCount = GETTING_STARTED_TASKS.filter(t => progress[t.key]).length;
    const total = GETTING_STARTED_TASKS.length;

    if (doneCount === total) {
        card.innerHTML = `
            <button type="button" class="getting-started-dismiss" id="gsDismissBtn" aria-label="Dismiss">
                <i class="bi bi-x-lg"></i>
            </button>
            <div class="getting-started-congrats">
                <div class="onboarding-emoji onboarding-checkmark">🎉</div>
                <h4>Congratulations!</h4>
                <p class="text-muted mb-0">Your LevelUp workspace is fully configured.</p>
            </div>
        `;
    } else {
        const itemsHtml = GETTING_STARTED_TASKS.map(task => {
            const done = !!progress[task.key];
            return `
                <div class="getting-started-item ${done ? 'done' : ''}">
                    <span class="gs-check">${done ? '<i class="bi bi-check-lg"></i>' : ''}</span>
                    <span class="gs-label">${escapeHtml(task.label)}</span>
                </div>
            `;
        }).join('');

        card.innerHTML = `
            <button type="button" class="getting-started-dismiss" id="gsDismissBtn" aria-label="Dismiss">
                <i class="bi bi-x-lg"></i>
            </button>
            <div class="getting-started-header">
                <h4><i class="fa-solid fa-bullseye"></i> Getting Started</h4>
                <span class="getting-started-count">${doneCount}/${total} Completed</span>
            </div>
            <div class="getting-started-progress">
                <div class="getting-started-progress-bar" style="width:${(doneCount / total) * 100}%"></div>
            </div>
            <div class="getting-started-list">${itemsHtml}</div>
        `;
    }

    const dismissBtn = document.getElementById('gsDismissBtn');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            try { localStorage.setItem(GETTING_STARTED_VISIBLE_KEY, 'false'); } catch { /* storage unavailable - just hide it for this view */ }
            const row = document.getElementById('gettingStartedRow');
            if (row) row.style.display = 'none';
        });
    }
}

/* ==========================================================================
   Stat card count-up animation
   ========================================================================== */

function initStatCounters() {
    const nums = document.querySelectorAll('.stat-num');
    nums.forEach(el => {
        const target = parseInt(el.dataset.count, 10) || 0;
        animateCount(el, target);
    });
}

function animateCount(el, target, duration = 900) {
    const start = performance.now();
    function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(frame);
        else el.textContent = target;
    }
    requestAnimationFrame(frame);
}

/* ==========================================================================
   Attendance Tracker - mark lectures attended/missed, per-subject stats
   ========================================================================== */

async function initAttendance() {
    initAttendanceLogRows();
    await renderQuickMarkList();
    initQuickMarkLectures();
    await refreshAttendanceLog();
}

async function getTodaysMarkedLectures() {
    const todayIso = toLocalIsoDate();
    let records;
    try {
        records = await AttendanceApi.list();
    } catch (err) {
        return new Map();
    }
    const marked = new Map();
    records.forEach(record => {
        if (!record.subject || !record.date) return;
        if (record.date.slice(0, 10) !== todayIso) return;
        const status = record.status === 'absent' ? 'absent' : 'present';
        const key = record.lectureId != null ? `lecture:${record.lectureId}` : `subject:${record.subject.name}`;
        marked.set(key, status);
    });
    return marked;
}

function initAttendanceLogRows() {
    const body = document.getElementById('attendanceLogBody');
    if (!body) return;

    body.addEventListener('click', (e) => {
        const pill = e.target.closest('.status-pill');
        if (pill) { toggleAttendancePill(pill); return; }
        const delBtn = e.target.closest('.log-delete-btn');
        if (delBtn) {
            const row = delBtn.closest('tr');
            const recordId = Number(row.dataset.recordId);
            AttendanceApi.remove(recordId)
                .then(() => { row.remove(); updateAttendanceLogEmptyState(); recomputeAttendance(); })
                .catch(err => showToast(err.message || 'Could not delete that record.'));
        }
    });

    body.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const pill = e.target.closest('.status-pill');
        if (!pill) return;
        e.preventDefault();
        toggleAttendancePill(pill);
    });
}

async function toggleAttendancePill(pill) {
    const row = pill.closest('tr');
    const recordId = Number(row.dataset.recordId);
    const next = pill.dataset.status === 'present' ? 'absent' : 'present';
    try {
        await AttendanceApi.update(recordId, { status: next });
    } catch (err) {
        showToast(err.message || 'Could not update that record.');
        return;
    }
    setAttendancePill(pill, next);
    recomputeAttendance();
}

function setAttendancePill(pill, status) {
    const classForStatus = { present: 'status-done', absent: 'status-missed', cancelled: 'status-cancelled' };
    const labelForStatus = { present: 'Present', absent: 'Absent', cancelled: 'Cancelled' };

    pill.dataset.status = status;
    pill.classList.remove('status-done', 'status-missed', 'status-cancelled');
    pill.classList.add(classForStatus[status] || 'status-done');
    pill.textContent = labelForStatus[status] || 'Present';
}

async function renderQuickMarkList() {
    const list = document.getElementById('quickMarkList');
    if (!list) return;

    let lectures;
    let markedLectures;
    try {
        [lectures, markedLectures] = await Promise.all([TimetableApi.list(), getTodaysMarkedLectures()]);
    } catch (err) {
        showToast(err.message || 'Could not load your timetable.');
        lectures = [];
        markedLectures = new Map();
    }

    const today = getTodayDayAbbr();
    const todays = lectures
        .filter(l => l.dayOfWeek === today)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (!todays.length) {
        list.innerHTML = buildEmptyStateHtml({
            icon: 'fa-solid fa-calendar-day',
            message: 'No lectures scheduled for today',
            buttonLabel: 'Add Lecture',
            targetSelector: '#addTimetableCard',
            focusSelector: '#ttMainSubjectInput'
        });
        return;
    }

    list.innerHTML = todays.map(l => {
        const subjectName = l.subject ? l.subject.name : 'General';
        const module = l.location || 'Lecture';
        const icon = quickMarkIconFor(module);
        const markedStatus = markedLectures.get(`lecture:${l.id}`) || markedLectures.get(`subject:${subjectName}`);
        const isMarked = Boolean(markedStatus);
        return `
            <div class="quick-mark-item${isMarked ? ' marked' : ''}" data-lecture-id="${l.id}" data-subject-id="${l.subject ? l.subject.id : ''}" data-subject="${escapeHtml(subjectName)}" data-lecture="${escapeHtml(subjectName + ' (' + module + ')')}">
                <div class="quick-mark-info">
                    <i class="${icon} text-primary"></i>
                    <div>
                        <h6>${escapeHtml(subjectName)}</h6>
                        <small>${escapeHtml(module)} • ${formatTimeRange(l.startTime, l.endTime)}</small>
                    </div>
                </div>
                <div class="quick-mark-actions">
                    <button class="quick-mark-btn present${markedStatus === 'present' ? ' selected' : ''}" data-action="present"${isMarked ? ' disabled' : ''}><i class="bi bi-check-lg"></i> Present</button>
                    <button class="quick-mark-btn absent${markedStatus === 'absent' ? ' selected' : ''}" data-action="absent"${isMarked ? ' disabled' : ''}><i class="bi bi-x-lg"></i> Absent</button>
                    <button class="quick-mark-btn cancelled" data-action="cancelled"${isMarked ? ' disabled' : ''}><i class="bi bi-dash-circle"></i> Cancelled</button>
                </div>
            </div>`;
    }).join('');
}

function quickMarkIconFor(module) {
    const key = (module || '').toLowerCase();
    if (key.includes('lab') || key.includes('practical')) return 'bi bi-hdd-stack';
    if (key.includes('tutorial')) return 'bi bi-people';
    return 'bi bi-book';
}

function initQuickMarkLectures() {
    const items = document.querySelectorAll('.quick-mark-item');
    items.forEach(item => {
        const buttons = item.querySelectorAll('.quick-mark-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', async () => {
                const status = btn.dataset.action; // 'present' | 'absent' | 'cancelled'
                const subject = item.dataset.subject;
                const lecture = item.dataset.lecture;
                const lectureId = item.dataset.lectureId ? Number(item.dataset.lectureId) : null;

                buttons.forEach(b => b.disabled = true);

                if (status === 'cancelled') {
                    buttons.forEach(b => b.classList.toggle('selected', b === btn));
                    item.classList.add('marked');
                    showToast(`Marked "${lecture}" as cancelled.`);
                    return;
                }

                try {
                    const subjectId = await SubjectsApi.findOrCreateByName(subject);
                    const record = await AttendanceApi.create({
                        subjectId, lectureId, date: toLocalIsoDate(), status
                    });
                    showToast(status === 'present' ? `Marked "${lecture}" as attended.` : `Marked "${lecture}" as missed.`, status === 'present' ? 'success' : 'default');

                    await refreshAttendanceLog();
                    const newRow = document.querySelector(`#attendanceLogBody tr[data-record-id="${record.id}"]`);
                    if (newRow) {
                        newRow.classList.add('flash-highlight');
                        setTimeout(() => newRow.classList.remove('flash-highlight'), 1600);
                    }
                    await renderQuickMarkList();
                    initQuickMarkLectures(); 
                } catch (err) {
                    if (err.status === 409) {
                        showToast('This lecture was already marked for today.');
                        await renderQuickMarkList();
                        initQuickMarkLectures();
                        return;
                    }
                    buttons.forEach(b => b.disabled = false);
                    showToast(err.message || 'Could not record attendance.');
                }
            });
        });
    });
}

function updateAttendanceLogEmptyState() {
    const body = document.getElementById('attendanceLogBody');
    if (!body) return;
    const hasRows = !!body.querySelector('tr:not(.empty-state-row)');
    let emptyRow = body.querySelector('.empty-state-row');

    if (!hasRows) {
        if (!emptyRow) {
            body.appendChild(buildEmptyStateRow(5, {
                icon: 'fa-solid fa-clipboard-list',
                message: ' No attendance records available yet.',
                buttonLabel: 'Mark Attendance',
                targetSelector: '#todayLecturesCard',
                focusSelector: null
            }));
        }
    } else if (emptyRow) {
        emptyRow.remove();
    }
}

async function refreshAttendanceLog() {
    const body = document.getElementById('attendanceLogBody');
    if (!body) return;
    let records;
    try {
        records = await AttendanceApi.list();
    } catch (err) {
        showToast(err.message || 'Could not load your attendance records.');
        return;
    }
    body.innerHTML = '';
    records.forEach(record => body.appendChild(buildAttendanceRow(record)));
    updateAttendanceLogEmptyState();
    recomputeAttendance();
}

function buildAttendanceRow(record) {
    const subjectName = record.subject ? record.subject.name : 'General';
    const dateLabel = formatDateLabel(record.date);
    const iconByStatus = { present: 'bi bi-book text-success me-2', absent: 'bi bi-book text-danger me-2' };
    const pillClassByStatus = { present: 'status-done', absent: 'status-missed' };
    const pillLabelByStatus = { present: 'Present', absent: 'Absent' };
    const status = record.status === 'absent' ? 'absent' : 'present';

    const row = document.createElement('tr');
    row.dataset.recordId = record.id;
    row.dataset.subject = subjectName;
    row.innerHTML = `
        <td class="task-title-cell"><i class="${iconByStatus[status]}"></i><span class="task-name">${escapeHtml(subjectName)} session</span></td>
        <td class="task-subject">${escapeHtml(subjectName)}</td>
        <td>${escapeHtml(dateLabel)}</td>
        <td><span class="status-pill ${pillClassByStatus[status]}" data-status="${status}" role="button" tabindex="0">${pillLabelByStatus[status]}</span></td>
        <td><button class="log-delete-btn" aria-label="Delete record"><i class="bi bi-trash"></i></button></td>
    `;
    return row;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}


function buildEmptyStateHtml({ icon = 'fa-solid fa-inbox', message, buttonLabel, buttonHref, targetSelector, focusSelector }) {
    let button = '';
    if (buttonLabel) {
        const attrs = buttonHref
            ? `data-empty-href="${escapeHtml(buttonHref)}"`
            : `data-empty-target="${escapeHtml(targetSelector || '')}" data-empty-focus="${escapeHtml(focusSelector || '')}"`;
        button = `<button type="button" class="btn btn-sm btn-primary empty-state-btn" ${attrs}><i class="bi bi-plus-lg"></i> ${escapeHtml(buttonLabel)}</button>`;
    }
    return `<div class="empty-state-block"><i class="${icon}"></i><p>${escapeHtml(message)}</p>${button}</div>`;
}

/** Same as buildEmptyStateHtml, but wrapped in a <tr><td colspan=...> for table bodies. */
function buildEmptyStateRow(colspan, opts) {
    const row = document.createElement('tr');
    row.className = 'empty-state-row';
    row.innerHTML = `<td colspan="${colspan}" class="empty-state-cell">${buildEmptyStateHtml(opts)}</td>`;
    return row;
}

function initEmptyStateButtons() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.empty-state-btn');
        if (!btn) return;

        if (btn.dataset.emptyHref) {
            window.location.href = btn.dataset.emptyHref;
            return;
        }
        const target = btn.dataset.emptyTarget ? document.querySelector(btn.dataset.emptyTarget) : null;
        if (!target) return;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const focusEl = btn.dataset.emptyFocus ? document.querySelector(btn.dataset.emptyFocus) : null;
        if (focusEl) setTimeout(() => focusEl.focus(), 400);
    });
}

function formatTodayLabel() {
    return formatDateLabel(toLocalIsoDate());
}

function formatDateLabel(isoDate) {
    if (!isoDate) return formatTodayLabel();
    const d = new Date(isoDate + 'T00:00:00');
    if (isNaN(d)) return isoDate;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function recomputeAttendance() {
    const rows = document.querySelectorAll('#attendanceLogBody tr');
    const subjectStats = {};
    let totalPresent = 0, totalCount = 0;

    rows.forEach(row => {
        const subject = row.dataset.subject;
        const pill = row.querySelector('.status-pill');
        if (!subject || !pill) return;
        if (pill.dataset.status === 'cancelled') return; // cancelled lectures don't count toward the rate

        const present = pill.dataset.status === 'present';

        if (!subjectStats[subject]) subjectStats[subject] = { present: 0, total: 0 };
        subjectStats[subject].total++;
        if (present) subjectStats[subject].present++;

        totalCount++;
        if (present) totalPresent++;
    });

    const overallPct = totalCount ? Math.round((totalPresent / totalCount) * 100) : 0;
    const riskCount = Object.values(subjectStats).filter(s => s.total && (s.present / s.total) * 100 < 75).length;

    setStatValue('attOverallPct', overallPct);
    setStatValue('attPresentCount', totalPresent);
    setStatValue('attAbsentCount', totalCount - totalPresent);
    setStatValue('attRiskCount', riskCount);

    renderAttendanceSubjectList(subjectStats);
}

function setStatValue(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
    el.dataset.count = value;
}

function renderAttendanceSubjectList(subjectStats) {
    const list = document.getElementById('attendanceSubjectList');
    if (!list) return;

    const subjects = Object.keys(subjectStats).sort();
    if (!subjects.length) {
        list.innerHTML = '<p class="text-muted mb-0"> No attendance records available yet.</p>';
        return;
    }

    list.innerHTML = subjects.map(subject => {
        const { present, total } = subjectStats[subject];
        const pct = total ? Math.round((present / total) * 100) : 0;
        const color = getMainSubjectColor(subject);

        let pillClass, pillLabel;
        if (pct >= 85) { pillClass = 'green-pill'; pillLabel = 'Excellent'; }
        else if (pct >= 75) { pillClass = 'blue-pill'; pillLabel = 'Good'; }
        else if (pct >= 60) { pillClass = 'orange-pill'; pillLabel = 'At Risk'; }
        else { pillClass = 'red-pill'; pillLabel = 'Below 75%'; }

        return `
            <div class="subject-row">
                <div class="subject-info">
                    <span class="subject-dot" style="background:${color}"></span>
                    <span class="subject-name">${escapeHtml(subject)}</span>
                    <span class="subject-pct">${pct}%</span>
                </div>
                <div class="subject-bar-track">
                    <div class="subject-bar-fill" style="width:${pct}%; background:${color}"></div>
                </div>
                <div class="subject-meta">
                    <span class="badge-pill ${pillClass}">${pillLabel}</span>
                    <span class="subject-tasks">${present}/${total} lectures attended</span>
                </div>
            </div>
        `;
    }).join('');
}

/* ==========================================================================
   Weekly Lecture Timetable
   ========================================================================== */

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WEEKEND_DAYS = ['Sat', 'Sun'];
function isWeekend(day) { return WEEKEND_DAYS.includes(day); }

function getTodayDayAbbr() {
    return DAY_ORDER[(new Date().getDay() + 6) % 7]; // JS getDay(): 0=Sun..6=Sat
}

const MAIN_SUBJECT_PALETTE = ['#7c3aed', '#22c55e', '#ef4444', '#f59e0b', '#2563eb', '#0ea5e9', '#ec4899', '#84cc16', '#f97316', '#14b8a6'];
let mainSubjectColorAssignments = {};

function getMainSubjectColor(subject) {
    const key = (subject || '').trim().toLowerCase();
    if (!key) return '#10b981';
    if (!mainSubjectColorAssignments[key]) {
        const usedCount = Object.keys(mainSubjectColorAssignments).length;
        mainSubjectColorAssignments[key] = MAIN_SUBJECT_PALETTE[usedCount % MAIN_SUBJECT_PALETTE.length];
    }
    return mainSubjectColorAssignments[key];
}

let timetableLectures = [];

async function initTimetable() {
    await refreshTimetable();

    const addBtn = document.getElementById('addTimetableBtn');
    if (!addBtn) return;

    addBtn.addEventListener('click', async () => {
        const day = document.getElementById('ttDaySelect').value;
        const start = document.getElementById('ttStartInput').value;
        const end = document.getElementById('ttEndInput').value;
        const mainSubject = document.getElementById('ttMainSubjectInput').value.trim();
        const module = document.getElementById('ttModuleInput').value.trim();

        if (!start || !end) {
            showToast('Set both a start and end time.');
            return;
        }
        if (start >= end) {
            showToast('End time must be after the start time.');
            return;
        }
        if (!mainSubject) {
            showToast('Enter a main subject.');
            return;
        }

        addBtn.disabled = true;
        try {
            const subjectId = await SubjectsApi.findOrCreateByName(mainSubject);
            const payload = { subjectId, dayOfWeek: day, startTime: start, endTime: end, location: module || 'Lecture' };
            await createLectureOrResolveConflict(payload, mainSubject);
        } catch (err) {
            showToast(err.message || 'Could not add that lecture.');
        } finally {
            addBtn.disabled = false;
        }
    });

    const table = document.getElementById('timetableTable');
    table.addEventListener('click', async (e) => {
        const delBtn = e.target.closest('.timetable-delete-btn');
        if (!delBtn) return;
        const id = parseInt(delBtn.closest('.tt-block').dataset.id, 10);
        try {
            await TimetableApi.remove(id);
            await refreshTimetable();
            await refreshTodayLectures();
        } catch (err) {
            showToast(err.message || 'Could not remove that lecture.');
        }
    });
}

async function refreshTodayLectures() {
    await renderQuickMarkList();
    initQuickMarkLectures();
}

async function createLectureOrResolveConflict(payload, subjectLabel) {
    try {
        await TimetableApi.create(payload);
        await refreshTimetable();
        await refreshTodayLectures();
        document.getElementById('ttMainSubjectInput').value = '';
        document.getElementById('ttModuleInput').value = '';
        document.getElementById('ttMainSubjectInput').focus();
        showToast(`Added ${subjectLabel} to ${dayFullName(payload.dayOfWeek)}.`, 'success');
    } catch (err) {
        if (err.status === 409 && err.data && err.data.conflict) {
            await promptLectureConflict(err.data.conflict, payload, subjectLabel);
            return;
        }
        throw err;
    }
}

function promptLectureConflict(existingLecture, newPayload, subjectLabel) {
    return new Promise((resolve) => {
        const modalEl = document.getElementById('lectureConflictModal');
        const existingLine = document.getElementById('lectureConflictExisting');
        existingLine.textContent =
            `${existingLecture.subject.name} - ${dayFullName(existingLecture.dayOfWeek)}, ${formatTimeRange(existingLecture.startTime, existingLecture.endTime)}`;

        const keepExistingBtn = document.getElementById('keepExistingLectureBtn');
        const keepNewBtn = document.getElementById('keepNewLectureBtn');
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

        const freshKeepExisting = keepExistingBtn.cloneNode(true);
        keepExistingBtn.replaceWith(freshKeepExisting);
        const freshKeepNew = keepNewBtn.cloneNode(true);
        keepNewBtn.replaceWith(freshKeepNew);

        freshKeepExisting.addEventListener('click', () => {
            showToast('Kept the existing lecture. The new one was not added.', 'default');
            resolve();
        }, { once: true });

        freshKeepNew.addEventListener('click', async () => {
            freshKeepNew.disabled = true;
            try {
                await TimetableApi.remove(existingLecture.id);
                modal.hide();
                await createLectureOrResolveConflict(newPayload, subjectLabel);
            } catch (err) {
                showToast(err.message || 'Could not replace that lecture.');
            } finally {
                freshKeepNew.disabled = false;
                resolve();
            }
        }, { once: true });

        modal.show();
    });
}

async function refreshTimetable() {
    try {
        const lectures = await TimetableApi.list();
        timetableLectures = lectures.map(l => ({
            id: l.id,
            day: l.dayOfWeek,
            start: l.startTime,
            end: l.endTime,
            mainSubject: l.subject ? l.subject.name : 'General',
            module: l.location || 'Lecture'
        }));
    } catch (err) {
        showToast(err.message || 'Could not load your timetable.');
        timetableLectures = [];
    }
    renderTimetable();
}

function dayFullName(abbr) {
    const map = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
    return map[abbr] || abbr;
}

function formatTimeRange(start, end) {
    return `${formatTime(start)} – ${formatTime(end)}`;
}

function formatTime(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function timeToMinutes(hhmm) {
    const [h, m] = hhmm.split(':').map(Number);
    return h * 60 + m;
}

function minutesToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const SLOT_MINUTES = 30;

function renderTimetable() {
    const table = document.getElementById('timetableTable');
    if (!table) return;

    const wrapper = table.closest('.timetable-wrapper') || table.parentElement;
    let banner = wrapper ? wrapper.querySelector('#timetableEmptyBanner') : null;

    const isEmpty = !timetableLectures.length;

    if (wrapper) {
        if (isEmpty) {
            if (!banner) {
                banner = document.createElement('div');
                banner.id = 'timetableEmptyBanner';
                banner.className = 'timetable-empty-banner';
                wrapper.insertBefore(banner, table);
            }
            banner.innerHTML = buildEmptyStateHtml({
                message: 'No lectures added yet',
                buttonLabel: 'Add Lecture',
                targetSelector: '#addTimetableCard',
                focusSelector: '#ttMainSubjectInput'
            });
            banner.style.display = '';
        } else if (banner) {
            banner.style.display = 'none';
        }
    }

    const thead = `<thead><tr><th class="tt-time-head">Time</th>${DAY_ORDER.map(d => `<th>${dayFullName(d)}</th>`).join('')}</tr></thead>`;

    let minStart = 8 * 60;
    let maxEnd = 22 * 60;

    if (!isEmpty) {
        minStart = Math.min(...timetableLectures.map(l => timeToMinutes(l.start)));
        maxEnd = Math.max(...timetableLectures.map(l => timeToMinutes(l.end)));
        minStart = Math.floor(minStart / 60) * 60;
        maxEnd = Math.ceil(maxEnd / 60) * 60;
    }

    const slotStarts = [];
    for (let t = minStart; t < maxEnd; t += SLOT_MINUTES) slotStarts.push(t);

    // Tracks day
    const consumed = new Set();

    const rows = slotStarts.map(slotStart => {
        const slotEnd = slotStart + SLOT_MINUTES;

        const cells = DAY_ORDER.map(day => {
            const key = `${day}|${slotStart}`;
            if (consumed.has(key)) return '';

            const entry = timetableLectures.find(l => {
                const s = timeToMinutes(l.start);
                return l.day === day && s >= slotStart && s < slotEnd;
            });

            if (!entry) return '<td class="tt-cell tt-empty"></td>';

            const entryEnd = timeToMinutes(entry.end);
            const span = Math.max(1, Math.round((entryEnd - slotStart) / SLOT_MINUTES));
            for (let s = 1; s < span; s++) consumed.add(`${day}|${slotStart + s * SLOT_MINUTES}`);

            const color = getMainSubjectColor(entry.mainSubject);
            return `
                <td class="tt-cell" rowspan="${span}">
                    <div class="tt-block" data-id="${entry.id}" style="background:${color}22; border-left-color:${color};">
                        <button class="timetable-delete-btn" aria-label="Remove lecture"><i class="bi bi-x"></i></button>
                        <div class="tt-module">${escapeHtml(entry.module || entry.mainSubject)}</div>
                        <div class="tt-subject" style="color:${color}">${escapeHtml(entry.mainSubject)}</div>
                        <div class="tt-time-range">${formatTimeRange(entry.start, entry.end)}</div>
                    </div>
                </td>`;
        }).join('');

        return `<tr><td class="tt-time">${formatTime(minutesToTime(slotStart))}</td>${cells}</tr>`;
    }).join('');

    table.innerHTML = thead + `<tbody>${rows}</tbody>`;
}

/* ==========================================================================
   Dashboard - Today's Schedule
   ========================================================================== */
async function initTodaySchedule() {
    const list = document.getElementById('todayScheduleList');
    if (!list) return;

    const todayIso = toLocalIsoDate();
    const todayAbbr = getTodayDayAbbr();

    let lectures = [];
    try {
        lectures = await TimetableApi.list();
    } catch (err) {
        showToast(err.message || 'Could not load your timetable.');
    }
    const [sessions, tasks, aeItems] = await Promise.all([
        PlannerApi.listSessions(todayIso, todayIso).catch(() => []),
        TasksApi.list().catch(() => []),
        AssignmentsExamsApi.list().catch(() => [])
    ]);

    const entries = [];

    lectures.filter(l => l.dayOfWeek === todayAbbr).forEach(l => {
        const subjectName = l.subject ? l.subject.name : 'General';
        entries.push({
            sortKey: timeToMinutes(l.startTime),
            timeLabel: formatTime(l.startTime),
            title: subjectName,
            subtitle: `${l.location || 'Lecture'} • ${formatTimeRange(l.startTime, l.endTime)}`,
            color: getMainSubjectColor(subjectName)
        });
    });

    (sessions || []).filter(s => s.dueDate === todayIso).forEach(s => {
        const subjectName = s.subject ? s.subject.name : 'Study';
        entries.push({
            sortKey: s.startTime ? timeToMinutes(s.startTime) : (24 * 60),
            timeLabel: s.startTime ? formatTime(s.startTime) : 'Today',
            title: s.title || `${subjectName} Study Session`,
            subtitle: (s.startTime && s.endTime) ? `Study Session • ${formatTimeRange(s.startTime, s.endTime)}` : 'Study Session',
            color: getMainSubjectColor(subjectName)
        });
    });

    (tasks || []).filter(t => t.dueDate === todayIso && t.status !== 'done').forEach(t => {
        const subjectName = t.subject ? t.subject.name : 'General';
        entries.push({
            sortKey: 24 * 60 + 1,
            timeLabel: 'Due Today',
            title: t.title,
            subtitle: `Task • ${subjectName}`,
            color: getMainSubjectColor(subjectName)
        });
    });

    (aeItems || []).filter(a => a.dueDate === todayIso).forEach(a => {
        const subjectName = a.subject ? a.subject.name : 'General';
        const isExam = a.itemType === 'exam';
        entries.push({
            sortKey: 24 * 60 + 2,
            timeLabel: 'Due Today',
            title: a.title,
            subtitle: `${isExam ? 'Exam' : 'Assignment'} • ${subjectName}`,
            color: getMainSubjectColor(subjectName)
        });
    });

    if (!entries.length) {
        list.innerHTML = buildEmptyStateHtml({
            icon: 'fa-solid fa-calendar-day',
            message: 'Nothing scheduled for today',
            buttonLabel: 'Add Lecture',
            buttonHref: 'attendance.html#addTimetableCard'
        });
        return;
    }

    entries.sort((a, b) => a.sortKey - b.sortKey);

    list.innerHTML = entries.map(e => `
        <div class="timeline-item">
            <div class="time">${escapeHtml(e.timeLabel)}</div>
            <div class="timeline-dot" style="background:${e.color}"></div>
            <div class="timeline-content">
                <h5>${escapeHtml(e.title)}</h5>
                <p>${escapeHtml(e.subtitle)}</p>
            </div>
        </div>`).join('');
}

/* ==========================================================================
   Subject Progress (dashboard + progress)
   ========================================================================== */
async function renderSubjectProgress() {
    const containers = document.querySelectorAll('#progressCard .subject-list');
    if (!containers.length) return;

    let subjects, tasks;
    try {
        [subjects, tasks] = await Promise.all([SubjectsApi.list(), TasksApi.list()]);
    } catch (err) {
        showToast(err.message || 'Could not load subject progress.');
        return;
    }

    if (!subjects.length) {
        const html = buildEmptyStateHtml({
            message: ' No subjects yet. Add your first subject to begin organizing your semester.',
            buttonLabel: 'Add Task',
            buttonHref: 'tasks.html'
        });
        containers.forEach(el => el.innerHTML = html);
        return;
    }

    const rows = subjects.map(subject => {
        const subjectTasks = tasks.filter(t => t.subject && t.subject.id === subject.id);
        const total = subjectTasks.length;
        const done = subjectTasks.filter(t => t.status === 'done').length;
        const pct = total ? Math.round((done / total) * 100) : 0; // real zero, never hidden (item 6)
        const color = getMainSubjectColor(subject.name);

        let pillClass, pillLabel;
        if (pct >= 85) { pillClass = 'green-pill'; pillLabel = 'Excellent'; }
        else if (pct >= 65) { pillClass = 'blue-pill'; pillLabel = 'On Track'; }
        else if (pct >= 45) { pillClass = 'orange-pill'; pillLabel = 'Catch Up'; }
        else { pillClass = 'red-pill'; pillLabel = 'Needs Attention'; }

        return `
            <div class="subject-row">
                <div class="subject-info">
                    <span class="subject-dot" style="background:${color}"></span>
                    <span class="subject-name">${escapeHtml(subject.name)}</span>
                    <span class="subject-pct">${pct}%</span>
                </div>
                <div class="subject-bar-track">
                    <div class="subject-bar-fill" style="width:${pct}%; background:${color}"></div>
                </div>
                <div class="subject-meta">
                    <span class="badge-pill ${pillClass}">${pillLabel}</span>
                    <span class="subject-tasks">${done}/${total} tasks done</span>
                </div>
            </div>`;
    });

    containers.forEach(el => el.innerHTML = rows.join(''));
    initProgressAnimations(); // (re)animate the bars just injected
}

/* ==========================================================================
   Productivity Streak (dashboard + progress)
   ========================================================================== */
const STREAK_MILESTONES = [
    { days: 7, label: '7 days', name: 'Bronze', medalClass: 'medal-bronze' },
    { days: 14, label: '14 days', name: 'Silver', medalClass: 'medal-silver' },
    { days: 30, label: '30 days', name: 'Gold', medalClass: 'medal-gold' }
];

async function initStreak() {
    const card = document.getElementById('streakCard');
    if (!card) return;

    let data;
    try {
        data = await ProgressApi.streak();
    } catch (err) {
        showToast(err.message || 'Could not load your streak.');
        data = { currentStreak: 0, last7Days: [] };
    }

    const streak = data.currentStreak || 0;
    const days = data.last7Days || [];

    setTextIfPresent('streakCountLabel', `${streak} day${streak === 1 ? '' : 's'}`);
    setTextIfPresent('streakNumber', streak);

    renderStreakWeek(days);
    renderStreakMilestones(streak);
}

function setTextIfPresent(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function renderStreakWeek(days) {
    const weekEl = document.getElementById('streakWeek');
    if (!weekEl) return;

    if (!days.length) {
        weekEl.innerHTML = '<p class="text-muted mb-0">No data to display</p>';
        return;
    }

    weekEl.innerHTML = days.map(d => {
        const classes = ['day-cell'];
        if (d.active) classes.push('done');
        else if (d.isToday) classes.push('today-cell');
        const icon = d.active ? '<i class="bi bi-check-lg"></i>' : (d.isToday ? '<i class="bi bi-clock"></i>' : '');
        return `<div class="${classes.join(' ')}"><span>${escapeHtml(d.dayLabel)}</span>${icon}</div>`;
    }).join('');
}

function renderStreakMilestones(streak) {
    const milestonesEl = document.getElementById('streakMilestones');
    const tipEl = document.getElementById('streakTip');

    if (milestonesEl) {
        const parts = [];
        STREAK_MILESTONES.forEach((m, i) => {
            const reached = streak >= m.days;
            const isNext = !reached && (i === 0 || streak >= STREAK_MILESTONES[i - 1].days);
            parts.push(`<div class="milestone ${reached ? 'reached' : ''} ${isNext ? 'active-ms' : ''}"><span><i class="fa-solid fa-medal ${m.medalClass}"></i></span><small>${m.label}</small></div>`);
            if (i < STREAK_MILESTONES.length - 1) {
                parts.push(`<div class="milestone-line ${reached ? 'reached' : ''}"></div>`);
            }
        });
        milestonesEl.innerHTML = parts.join('');
    }

    if (tipEl) {
        const next = STREAK_MILESTONES.find(m => streak < m.days);
        if (next) {
            const remaining = next.days - streak;
            tipEl.innerHTML = `${remaining} more day${remaining === 1 ? '' : 's'} to unlock the ${next.name} Streak badge! <i class="fa-solid fa-medal ${next.medalClass}"></i>`;
        } else {
            tipEl.textContent = "You've unlocked every streak badge - amazing work!";
        }
    }
}

function initProgressAnimations() {
    const selectors = '.subject-bar-fill, .progress-bar';
    const bars = document.querySelectorAll(selectors);

    bars.forEach(bar => {
        const target = bar.dataset.target ? bar.dataset.target + '%' : (bar.style.width || '0%');
        bar.dataset.animTarget = target;
        bar.style.width = '0%';
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                requestAnimationFrame(() => {
                    bar.style.width = bar.dataset.animTarget;
                });
                observer.unobserve(bar);
            }
        });
    }, { threshold: 0.2 });

    bars.forEach(bar => observer.observe(bar));
}

/* ==========================================================================
   Study Planner
   Auto-builds a weekly schedule out of three sources:
     1. The lecture timetable
     2. "Fixed" items - assignments/exams/tasks with a day + time.
     3. Auto-generated study sessions 
   ========================================================================== */

const PLANNER_STATE_KEY = 'levelup-planner-state';

let plannerCanGenerate = true;

async function hasSchedulableDeadlines() {
    try {
        const [tasks, aeItems] = await Promise.all([TasksApi.list(), AssignmentsExamsApi.list()]);
        return tasks.some(t => t.dueDate) || aeItems.some(a => a.dueDate);
    } catch {
        return true; /
    }
}
const PLANNER_HOURS_KEY = 'levelup-planner-hours';
const PLANNER_REST_KEY = 'levelup-planner-rest-on-holidays';

function loadRestOnHolidays() {
    try { return localStorage.getItem(PLANNER_REST_KEY) === 'true'; } catch { return false; }
}
function saveRestOnHolidays(value) {
    try { 
        localStorage.setItem(PLANNER_REST_KEY, value ? 'true' : 'false'); 
    } catch { /* storage unavailable */ }
}
const PLANNER_DAY_START_DEFAULT = 7 * 60;  // 07:00, in minutes since midnight
const PLANNER_DAY_END_DEFAULT = 22 * 60;   // 22:00

/* The student's own working-hours preference */
let PLANNER_DAY_START = PLANNER_DAY_START_DEFAULT;
let PLANNER_DAY_END = PLANNER_DAY_END_DEFAULT;

function loadPlannerHours() {
    try {
        const raw = localStorage.getItem(PLANNER_HOURS_KEY);
        if (!raw) return null;
        const { start, end } = JSON.parse(raw);
        return { start, end };
    } catch { return null; }
}

function savePlannerHours(startHHMM, endHHMM) {
    try { localStorage.setItem(PLANNER_HOURS_KEY, JSON.stringify({ start: startHHMM, end: endHHMM })); } catch { /* storage unavailable! */ }
}
const STUDY_HOURS_PER_SUBJECT_PER_WEEK = 2;
const STUDY_BLOCK_MINUTES = 60;

/* Exam-prep tuning */
const EXAM_PREP_BONUS_MINUTES = 180; // +3 hours of dedicated exam-prep study

/* "Don't overwork them" rules */
const STUDY_SESSION_GAP_MINUTES = 30;      // breather enforced right after every generated study block
const MAX_STUDY_MINUTES_PER_DAY = 120;     // normal-week cap so sessions spread across days instead of piling on one
const MAX_EXAM_PREP_MINUTES_PER_DAY = 180; // slightly higher cap allowed only on the run-up to an exam

const PLANNER_TYPE_META = {
    lecture:    { icon: 'bi-book' },
    study:      { icon: 'bi-lightbulb' },
    assignment: { icon: 'bi-journal-text' },
    exam:       { icon: 'bi-pencil-square' },
    task:       { icon: 'bi-check2-square' }
};

async function initStudyPlanner() {
    await refreshTimetable(); 

    const currentMonday = getMondayISO(new Date());

    const savedHours = loadPlannerHours();
    if (savedHours) {
        PLANNER_DAY_START = timeToMinutes(savedHours.start);
        PLANNER_DAY_END = timeToMinutes(savedHours.end);
    }

    let state = loadPlannerState();
    let restOnHolidays = loadRestOnHolidays();
    plannerCanGenerate = await hasSchedulableDeadlines();

    function freshState(carryArgs) {
        return plannerCanGenerate
            ? generateWeekSchedule({ ...carryArgs, restOnHolidays })
            : { fixedItems: [], studySessions: [], conflicts: [], shiftNotes: [], unscheduled: [] };
    }

    try {
        if (!state) {
            state = { weekStart: currentMonday, ...freshState() };
            savePlannerState(state);
        } else if (state.weekStart !== currentMonday) {
            const carryArgs = buildCarryOver(state);
            state = { weekStart: currentMonday, ...freshState(carryArgs) };
            savePlannerState(state);
            if (plannerCanGenerate) {
                showToast('New week: your planner was regenerated and any missed sessions carried forward.', 'success', 5200);
            }
        }

        renderPlannerLegend();
        renderPlanner(state);
    } catch (err) {
        console.error('Study Planner: cached state was invalid, rebuilding a fresh week.', err);
        try { localStorage.removeItem(PLANNER_STATE_KEY); } catch { /* storage unavailable */ }
        state = { weekStart: currentMonday, ...freshState() };
        savePlannerState(state);
        renderPlannerLegend();
        renderPlanner(state);
        showToast('Your study planner data looked out of date, so it was rebuilt fresh.', 'success', 5200);
    }

    const regenBtn = document.getElementById('plannerRegenerateBtn');
    const regenerateModalEl = document.getElementById('regenerateWeekModal');

    function runRegenerate(wantsMoreRest) {
        if (!plannerCanGenerate) {
            showToast('Add at least one task, assignment, or exam with a due date before generating your study plan.');
            return;
        }
        restOnHolidays = wantsMoreRest;
        saveRestOnHolidays(restOnHolidays);
        const { carryStudyMinutes, carryMovable, carryUserMoved } = buildCarryOver(state);
        state = { weekStart: currentMonday, ...generateWeekSchedule({ carryStudyMinutes, carryMovable, carryUserMoved, restOnHolidays }) };
        savePlannerState(state);
        renderPlanner(state);
        showToast(wantsMoreRest ? 'Planner regenerated, free weekends left open to rest.' : 'Planner regenerated for this week.', 'success');
    }

    if (regenBtn) {
        regenBtn.addEventListener('click', () => {
            if (!plannerCanGenerate) {
                showToast('Add at least one task, assignment, or exam with a due date before generating your study plan.');
                return;
            }
            if (regenerateModalEl && typeof bootstrap !== 'undefined') {
                bootstrap.Modal.getOrCreateInstance(regenerateModalEl).show();
            } else {
                runRegenerate(restOnHolidays); // no modal available! fall back to last-known preference
            }
        });
    }
    const regenMoreRestBtn = document.getElementById('regenerateMoreRestBtn');
    if (regenMoreRestBtn) regenMoreRestBtn.addEventListener('click', () => runRegenerate(true));
    const regenNoRestBtn = document.getElementById('regenerateNoRestBtn');
    if (regenNoRestBtn) regenNoRestBtn.addEventListener('click', () => runRegenerate(false));

    /* Working-hours preference */
    const hoursStartInput = document.getElementById('plannerDayStart');
    const hoursEndInput = document.getElementById('plannerDayEnd');
    if (hoursStartInput && hoursEndInput) {
        hoursStartInput.value = minutesToTime(PLANNER_DAY_START);
        hoursEndInput.value = minutesToTime(PLANNER_DAY_END);
    }

    const hoursApplyBtn = document.getElementById('plannerHoursApplyBtn');
    if (hoursApplyBtn) {
        hoursApplyBtn.addEventListener('click', () => {
            const startVal = hoursStartInput.value;
            const endVal = hoursEndInput.value;
            if (!startVal || !endVal) {
                showToast('Set both a start and end time.');
                return;
            }
            const startMin = timeToMinutes(startVal);
            const endMin = timeToMinutes(endVal);
            if (endMin <= startMin) {
                showToast('End time must be after the start time! use 11:59 PM for midnight.');
                return;
            }
            if (endMin - startMin < 120) {
                showToast('Leave yourself at least a couple of hours to work with.');
                return;
            }

            PLANNER_DAY_START = startMin;
            PLANNER_DAY_END = endMin;
            savePlannerHours(startVal, endVal);

            const { carryStudyMinutes, carryMovable, carryUserMoved } = buildCarryOver(state);
            state = { weekStart: currentMonday, ...generateWeekSchedule({ carryStudyMinutes, carryMovable, carryUserMoved, restOnHolidays }) };
            savePlannerState(state);
            renderPlanner(state);
            showToast(`Study hours set to ${formatTimeRange(startVal, endVal)} ! sessions rebuilt around it.`, 'success');
        });
    }

    const grid = document.getElementById('plannerTable');
    if (grid) {
        grid.addEventListener('click', (e) => {
            const moveBtn = e.target.closest('.planner-move-btn');
            if (moveBtn) {
                e.stopPropagation();
                openMoveSessionModal(moveBtn.closest('.planner-block').dataset.id);
                return;
            }

            const block = e.target.closest('.planner-block[data-toggle="done"]');
            if (!block) return;
            const id = block.dataset.id;
            const item = state.fixedItems.find(i => i.id === id) || state.studySessions.find(i => i.id === id);
            if (!item) return;
            item.done = !item.done;
            savePlannerState(state);
            renderPlanner(state);
        });
    }

    const bannerEl = document.getElementById('plannerBanner');
    if (bannerEl) {
        bannerEl.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-overlap-action]');
            if (!btn) return;
            const sessionId = btn.dataset.sessionId;
            const session = state.studySessions.find(s => s.id === sessionId);
            if (!session) return;

            if (btn.dataset.overlapAction === 'keep') {
                session.hasOverlap = false;
                savePlannerState(state);
                renderPlannerBanner(state);
                showToast(`Kept "${session.title}" where it is.`, 'success');
            } else if (btn.dataset.overlapAction === 'change') {
                openMoveSessionModal(sessionId);
            }
        });
    }

    function buildBusyByDayExcluding(excludeId) {
        const busyByDay = {};
        DAY_ORDER.forEach(d => busyByDay[d] = []);
        timetableLectures.forEach(l => addBusy(busyByDay, l.day, timeToMinutes(l.start), timeToMinutes(l.end), `${l.mainSubject} ${l.module}`));
        state.fixedItems.forEach(i => addBusy(busyByDay, i.day, timeToMinutes(i.start), timeToMinutes(i.end), i.title));
        state.studySessions.forEach(s => {
            if (s.id === excludeId) return;
            const en = timeToMinutes(s.end);
            addBusy(busyByDay, s.day, timeToMinutes(s.start), en, s.title);
            addBusy(busyByDay, s.day, en, en + STUDY_SESSION_GAP_MINUTES, 'study break'); // keep the breather rule when moving too
        });
        return busyByDay;
    }

    function populateMoveTimeOptions(session, busyByDay) {
        const timeSelect = document.getElementById('moveSessionTime');
        if (!timeSelect) return;
        const day = document.getElementById('moveSessionDay').value;
        const duration = timeToMinutes(session.end) - timeToMinutes(session.start);
        const options = [];
        for (let t = PLANNER_DAY_START; t + duration <= PLANNER_DAY_END; t += SLOT_MINUTES) {
            if (isFreeSlot(day, t, t + duration, busyByDay)) options.push(t);
        }
        timeSelect.innerHTML = options.length
            ? options.map(t => `<option value="${t}">${formatTimeRange(minutesToTime(t), minutesToTime(t + duration))}</option>`).join('')
            : '<option value="" disabled selected>No free slots this day</option>';
    }

    function openMoveSessionModal(sessionId) {
        const session = state.studySessions.find(s => s.id === sessionId);
        if (!session) return;

        const modalEl = document.getElementById('moveSessionModal');
        if (!modalEl || typeof bootstrap === 'undefined') return;

        document.getElementById('moveSessionTitle').textContent = session.title;
        const daySelect = document.getElementById('moveSessionDay');
        daySelect.innerHTML = DAY_ORDER.map(d => `<option value="${d}" ${d === session.day ? 'selected' : ''}>${dayFullName(d)}</option>`).join('');

        const busyByDay = buildBusyByDayExcluding(sessionId);
        populateMoveTimeOptions(session, busyByDay);

        daySelect.onchange = () => populateMoveTimeOptions(session, busyByDay);

        const confirmBtn = document.getElementById('moveSessionConfirmBtn');
        confirmBtn.onclick = () => {
            const day = daySelect.value;
            const timeSelect = document.getElementById('moveSessionTime');
            const startMin = timeSelect.value !== '' ? parseInt(timeSelect.value, 10) : null;
            if (startMin == null) {
                showToast('No free slot available on that day.');
                return;
            }
            const duration = timeToMinutes(session.end) - timeToMinutes(session.start);
            session.day = day;
            session.start = minutesToTime(startMin);
            session.end = minutesToTime(startMin + duration);
            session.userMoved = true;
            session.hasOverlap = false; // modal only offers slots that are actually free
            savePlannerState(state);
            renderPlanner(state);
            bootstrap.Modal.getOrCreateInstance(modalEl).hide();
            showToast(`Moved "${session.title}" to ${dayFullName(day)}, ${formatTimeRange(session.start, session.end)}.`, 'success');
        };

        bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
}

function isValidPlannerState(state) {
    return !!state
        && typeof state.weekStart === 'string'
        && Array.isArray(state.fixedItems)
        && Array.isArray(state.studySessions);
}

function loadPlannerState() {
    try {
        const raw = localStorage.getItem(PLANNER_STATE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return isValidPlannerState(parsed) ? parsed : null;
    } catch { return null; }
}

function savePlannerState(state) {
    try { localStorage.setItem(PLANNER_STATE_KEY, JSON.stringify(state)); } catch { /* storage unavailable ! planner still works in-memory for this session */ }
}

function getMondayISO(d) {
    const date = new Date(d);
    const day = date.getDay(); // 0 = Sun ... 6 = Sat
    const diff = (day === 0 ? -6 : 1) - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return toLocalIsoDate(date);
}

function buildCarryOver(prevState) {
    const carryStudyMinutes = {};
    const carryUserMoved = [];
    (prevState.studySessions || []).forEach(s => {
        if (s.done) return;
        if (s.userMoved) {
           
            carryUserMoved.push({ subject: s.subject, title: s.title, day: s.day, start: s.start, end: s.end, examPrep: !!s.examPrep });
        } else {
            carryStudyMinutes[s.subject] = (carryStudyMinutes[s.subject] || 0) + (timeToMinutes(s.end) - timeToMinutes(s.start));
        }
    });

    const carryMovable = [];
    (prevState.fixedItems || []).forEach(item => {
        if (item.type !== 'exam' && !item.done) {
            carryMovable.push({
                title: item.title, subject: item.subject, type: item.type, priority: item.priority,
                day: item.day, start: null, end: null,
                duration: timeToMinutes(item.end) - timeToMinutes(item.start)
            });
        }
    });

    return { carryStudyMinutes, carryMovable, carryUserMoved };
}

function getStudySubjects() {
    const seen = new Set();
    const subjects = [];
    timetableLectures.forEach(l => {
        if (!seen.has(l.mainSubject)) { seen.add(l.mainSubject); subjects.push(l.mainSubject); }
    });
    return subjects;
}

function subjectFirstLectureDay(subject) {
    const entries = timetableLectures
        .filter(l => l.mainSubject === subject)
        .sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) || timeToMinutes(a.start) - timeToMinutes(b.start));
    return entries.length ? entries[0].day : DAY_ORDER[0];
}

function nextDayInOrder(day) {
    const idx = DAY_ORDER.indexOf(day);
    return DAY_ORDER[(idx + 1) % DAY_ORDER.length];
}

function rotateDays(startDay) {
    const idx = DAY_ORDER.indexOf(startDay);
    if (idx === -1) return [...DAY_ORDER];
    return [...DAY_ORDER.slice(idx), ...DAY_ORDER.slice(0, idx)];
}

function daysUpTo(day) {
    const idx = DAY_ORDER.indexOf(day);
    return idx === -1 ? [...DAY_ORDER] : DAY_ORDER.slice(0, idx + 1);
}

function isFreeSlot(day, s, en, busyByDay) {
    return !busyByDay[day].some(b => s < b.end && b.start < en);
}

function addBusy(busyByDay, day, s, en, label) {
    busyByDay[day].push({ start: s, end: en, label });
}

function findFreeSlot(day, duration, busyByDay) {
    for (let t = PLANNER_DAY_START; t + duration <= PLANNER_DAY_END; t += SLOT_MINUTES) {
        if (isFreeSlot(day, t, t + duration, busyByDay)) return t;
    }
    return null;
}

function placeMovableItem(item, busyByDay) {
    const duration = item.duration != null ? item.duration : (timeToMinutes(item.end) - timeToMinutes(item.start));
    let placement = null;
    let wasShifted = false;

    if (item.start && item.day) {
        const s = timeToMinutes(item.start);
        const en = s + duration;
        if (isFreeSlot(item.day, s, en, busyByDay)) placement = { day: item.day, start: s, end: en };
    }

    if (!placement) {
        wasShifted = true;
        const startDay = item.day || DAY_ORDER[0];
        for (const day of rotateDays(startDay)) {
            const slot = findFreeSlot(day, duration, busyByDay);
            if (slot != null) { placement = { day, start: slot, end: slot + duration }; break; }
        }
    }

    return { placement, wasShifted, duration };
}

function placeStudySessionSpaced(dayPool, duration, busyByDay, dailyStudyMinutes, dayCap) {
    for (const day of dayPool) {
        if ((dailyStudyMinutes[day] || 0) + duration > dayCap) continue;
        const slot = findFreeSlot(day, duration, busyByDay);
        if (slot != null) return { placement: { day, start: slot, end: slot + duration }, wasShifted: false };
    }
    for (const day of [...dayPool, ...DAY_ORDER.filter(d => !dayPool.includes(d))]) {
        const slot = findFreeSlot(day, duration, busyByDay);
        if (slot != null) return { placement: { day, start: slot, end: slot + duration }, wasShifted: true };
    }
    return { placement: null, wasShifted: true };
}

function generateWeekSchedule({ carryStudyMinutes = {}, carryMovable = [], carryUserMoved = [], restOnHolidays = false } = {}) {
    const busyByDay = {};
    DAY_ORDER.forEach(d => busyByDay[d] = []);
    timetableLectures.forEach(l => addBusy(busyByDay, l.day, timeToMinutes(l.start), timeToMinutes(l.end), `${l.mainSubject} ${l.module}`));

    const conflicts = [];
    const shiftNotes = [];
    const unscheduledRaw = []; // raw failures, deduped+counted into `unscheduled` just before returning
    const fixedItems = [];
    let nextId = 1;

    const movableAll = [...carryMovable];

    movableAll.forEach(item => {
        const { placement, wasShifted, duration } = placeMovableItem(item, busyByDay);
        if (!placement) {
            unscheduledRaw.push({ key: `movable:${item.title}`, kind: 'movable', label: item.title });
            return;
        }
        addBusy(busyByDay, placement.day, placement.start, placement.end, item.title);
        if (wasShifted) {
            shiftNotes.push(`"${item.title}" was auto-shifted to ${dayFullName(placement.day)}, ${formatTimeRange(minutesToTime(placement.start), minutesToTime(placement.end))} to avoid a clash.`);
        }
        fixedItems.push({
            id: `F${nextId++}`, title: item.title, subject: item.subject, type: item.type, priority: item.priority, done: false,
            day: placement.day, start: minutesToTime(placement.start), end: minutesToTime(placement.end)
        });
    });

    const examDayBySubject = {};

    const studySessions = [];
    let studyId = 1;
    const dailyStudyMinutes = {}; 
    const reservedMinutesBySubject = {}; 

    carryUserMoved.forEach(m => {
        const clashes = busyByDay[m.day].filter(b => s < b.end && b.start < en);

        addBusy(busyByDay, m.day, s, en, `${m.subject} Study Session`);
        addBusy(busyByDay, m.day, en, en + STUDY_SESSION_GAP_MINUTES, `${m.subject} study break`);
        dailyStudyMinutes[m.day] = (dailyStudyMinutes[m.day] || 0) + (en - s);
        reservedMinutesBySubject[m.subject] = (reservedMinutesBySubject[m.subject] || 0) + (en - s);

        studySessions.push({
            id: `S${studyId++}`, subject: m.subject, type: 'study', title: m.title,
            priority: m.examPrep ? 'high' : null, done: false, examPrep: !!m.examPrep, userMoved: true,
            day: m.day, start: m.start, end: m.end,
            hasOverlap: clashes.length > 0,
            overlapWith: clashes.map(c => c.label)
        });
    });

    getStudySubjects().forEach(subject => {
        const examDay = examDayBySubject[subject];
        const isExamPrep = !!examDay;
        const totalMinutes = Math.max(0,
            STUDY_HOURS_PER_SUBJECT_PER_WEEK * 60
            + (carryStudyMinutes[subject] || 0)
            + (isExamPrep ? EXAM_PREP_BONUS_MINUTES : 0)
            - (reservedMinutesBySubject[subject] || 0)
        );

        const blocks = [];
        let remaining = totalMinutes;
        while (remaining > 0) {
            blocks.push(Math.min(STUDY_BLOCK_MINUTES, remaining));
            remaining -= Math.min(STUDY_BLOCK_MINUTES, remaining);
        }
        if (!blocks.length) return;

     
        const dayPool = isExamPrep ? daysUpTo(examDay) : rotateDays(nextDayInOrder(subjectFirstLectureDay(subject)));
        const dayCap = isExamPrep ? MAX_EXAM_PREP_MINUTES_PER_DAY : MAX_STUDY_MINUTES_PER_DAY;

        blocks.forEach(len => {
            const orderedDays = [...dayPool].sort((a, b) => {
                const loadDiff = (dailyStudyMinutes[a] || 0) - (dailyStudyMinutes[b] || 0);
                if (loadDiff !== 0) return loadDiff;
                return (isWeekend(a) ? 0 : 1) - (isWeekend(b) ? 0 : 1);
            });
            const { placement, wasShifted } = placeStudySessionSpaced(orderedDays, len, busyByDay, dailyStudyMinutes, dayCap);
            if (!placement) {
                unscheduledRaw.push({ key: `study:${subject}:${isExamPrep}`, kind: 'study', subject, isExamPrep });
                return;
            }

            addBusy(busyByDay, placement.day, placement.start, placement.end, `${subject} Study Session`);
            addBusy(busyByDay, placement.day, placement.end, placement.end + STUDY_SESSION_GAP_MINUTES, `${subject} study break`);
            dailyStudyMinutes[placement.day] = (dailyStudyMinutes[placement.day] || 0) + len;

            studySessions.push({
                id: `S${studyId++}`, subject, type: 'study',
                title: isExamPrep ? `${subject} Exam Prep` : `${subject} Study Session`,
                priority: isExamPrep ? 'high' : null, done: false, examPrep: isExamPrep, userMoved: false,
                day: placement.day, start: minutesToTime(placement.start), end: minutesToTime(placement.end)
            });
        });
    });

    const subjectsForFill = getStudySubjects();
    DAY_ORDER.forEach(day => {
        if (isWeekend(day) && restOnHolidays) return;
        if (!subjectsForFill.length) return;

        const wasEmptyBefore = busyByDay[day].length === 0;
        let added = 0;
        let subjectCursor = 0;
        let safety = 0; // guards against ever looping forever
        const maxIterations = subjectsForFill.length * 50;

        while (safety++ < maxIterations) {
            const slot = findFreeSlot(day, STUDY_BLOCK_MINUTES, busyByDay);
            if (slot == null) break;

            const rotation = subjectsForFill.slice().sort((a, b) => {
                const aDay = examDayBySubject[a];
                const bDay = examDayBySubject[b];
                const aUpcoming = (aDay && DAY_ORDER.indexOf(day) <= DAY_ORDER.indexOf(aDay)) ? 0 : 1;
                const bUpcoming = (bDay && DAY_ORDER.indexOf(day) <= DAY_ORDER.indexOf(bDay)) ? 0 : 1;
                return aUpcoming - bUpcoming;
            });
            const subject = rotation[subjectCursor % rotation.length];
            subjectCursor++;

            const examDay = examDayBySubject[subject];
            const isExamPrep = !!examDay && DAY_ORDER.indexOf(day) <= DAY_ORDER.indexOf(examDay);

            addBusy(busyByDay, day, slot, slot + STUDY_BLOCK_MINUTES, `${subject} Study Session`);
            addBusy(busyByDay, day, slot + STUDY_BLOCK_MINUTES, slot + STUDY_BLOCK_MINUTES + STUDY_SESSION_GAP_MINUTES, `${subject} study break`);
            dailyStudyMinutes[day] = (dailyStudyMinutes[day] || 0) + STUDY_BLOCK_MINUTES;

            studySessions.push({
                id: `S${studyId++}`, subject, type: 'study',
                title: isExamPrep ? `${subject} Exam Prep` : `${subject} Study Session`,
                priority: isExamPrep ? 'high' : null, done: false, examPrep: isExamPrep, userMoved: false,
                day, start: minutesToTime(slot), end: minutesToTime(slot + STUDY_BLOCK_MINUTES)
            });
            added++;
        }
        if (added && wasEmptyBefore) shiftNotes.push(`${dayFullName(day)} was completely free, so its whole study window was filled with review sessions.`);
    });

    const unscheduledGroups = new Map();
    unscheduledRaw.forEach(u => {
        const g = unscheduledGroups.get(u.key) || { ...u, count: 0 };
        g.count++;
        unscheduledGroups.set(u.key, g);
    });
    const unscheduled = [...unscheduledGroups.values()].map(g => {
        if (g.kind === 'movable') {
            return g.count === 1
                ? `Couldn't find a free slot for "${g.label}" this week: your week is fully booked.`
                : `Couldn't find a free slot for ${g.count} items (e.g. "${g.label}") this week: your week is fully booked.`;
        }
        const nounSingular = g.isExamPrep ? 'an exam-prep session' : 'a study session';
        const nounPlural = g.isExamPrep ? 'exam-prep sessions' : 'study sessions';
        return g.count === 1
            ? `Couldn't fit ${nounSingular} for ${g.subject} this week: your week is fully booked.`
            : `Couldn't fit ${g.count} ${nounPlural} for ${g.subject} this week: your week is fully booked.`;
    });

    return { fixedItems, studySessions, conflicts, shiftNotes, unscheduled };
}

function renderPlannerLegend() {
    const wrap = document.getElementById('plannerSubjectLegend');
    if (!wrap) return;
    wrap.innerHTML = getStudySubjects().map(s =>
        `<span class="planner-legend-item"><span class="planner-swatch" style="background:${getMainSubjectColor(s)}"></span>${escapeHtml(s)}</span>`
    ).join('');
}

function renderPlanner(state) {
    renderPlannerBanner(state);
    renderPlannerGrid(state);
    renderPlannerSummary(state);
}

function renderPlannerBanner(state) {
    const wrap = document.getElementById('plannerBanner');
    if (!wrap) return;

    const conflicts = state.conflicts || [];
    const shifts = state.shiftNotes || [];
    const unscheduled = state.unscheduled || [];
    const userOverlaps = (state.studySessions || []).filter(s => s.userMoved && s.hasOverlap);

    if (!plannerCanGenerate && !conflicts.length && !shifts.length && !unscheduled.length && !userOverlaps.length) {
        wrap.innerHTML = `<div class="planner-banner-group planner-banner-shift">
            <h6><i class="bi bi-info-circle-fill"></i> Nothing to generate yet</h6>
            <ul><li>Add at least one task, assignment, or exam with a due date before generating your study plan.
                <div class="planner-banner-actions"><a href="tasks.html" class="btn btn-sm btn-outline-primary">Go to Tasks</a></div>
            </li></ul>
        </div>`;
        return;
    }
    if (!conflicts.length && !shifts.length && !unscheduled.length && !userOverlaps.length) {
        wrap.innerHTML = '';
        return;
    }

    let html = '';
    if (userOverlaps.length) {
        html += `<div class="planner-banner-group planner-banner-conflict">
            <h6><i class="bi bi-exclamation-triangle-fill"></i> Your sessions overlap with something</h6>
            <ul>${userOverlaps.map(s => `<li>
                "${escapeHtml(s.title)}" (${dayFullName(s.day)}, ${formatTimeRange(s.start, s.end)}) overlaps with ${s.overlapWith.map(w => `"${escapeHtml(w)}"`).join(' and ')}.
                <div class="planner-banner-actions">
                    <button type="button" class="btn btn-sm btn-outline-secondary" data-overlap-action="keep" data-session-id="${s.id}">Keep it as is</button>
                    <button type="button" class="btn btn-sm btn-outline-primary" data-overlap-action="change" data-session-id="${s.id}">Change time</button>
                </div>
            </li>`).join('')}</ul>
        </div>`;
    }
    if (conflicts.length) {
        html += `<div class="planner-banner-group planner-banner-conflict">
            <h6><i class="bi bi-exclamation-triangle-fill"></i> Overlaps that need your attention</h6>
            <ul>${conflicts.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>
        </div>`;
    }
    if (shifts.length) {
        html += `<div class="planner-banner-group planner-banner-shift">
            <h6><i class="bi bi-arrow-left-right"></i> Your items auto-rescheduled to avoid clashes</h6>
            <ul>${shifts.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
        </div>`;
    }
    if (unscheduled.length) {
        html += `<div class="planner-banner-group planner-banner-unscheduled">
            <h6><i class="bi bi-calendar-x"></i> Couldn't fit everything in</h6>
            <ul>${unscheduled.map(u => `<li>${escapeHtml(u)}</li>`).join('')}</ul>
        </div>`;
    }
    wrap.innerHTML = html;
}

function renderPlannerGrid(state) {
    const table = document.getElementById('plannerTable');
    if (!table) return;

    const exams = state.fixedItems.filter(i => i.type === 'exam');
    const others = state.fixedItems.filter(i => i.type !== 'exam');
    const lectures = timetableLectures.map(l => ({
        id: `L${l.id}`, title: l.module || l.mainSubject, subject: l.mainSubject, type: 'lecture',
        priority: null, day: l.day, start: l.start, end: l.end, done: false, locked: true
    }));
    const merged = [...exams, ...lectures, ...others, ...state.studySessions];

    const thead = `<thead><tr><th class="tt-time-head">Time</th>${DAY_ORDER.map(d => `<th>${dayFullName(d)}</th>`).join('')}</tr></thead>`;

    if (!merged.length) {
        const emptyHtml = buildEmptyStateHtml({
            message: ' Ready to focus? Create your first study plan.'
        });
        table.innerHTML = thead + `<tbody><tr><td colspan="${DAY_ORDER.length + 1}" class="empty-state-cell">${emptyHtml}</td></tr></tbody>`;
        return;
    }

    let minStart = Math.min(PLANNER_DAY_START, ...merged.map(i => timeToMinutes(i.start)));
    let maxEnd = Math.max(PLANNER_DAY_END, ...merged.map(i => timeToMinutes(i.end)));
    minStart = Math.floor(minStart / 60) * 60;
    maxEnd = Math.ceil(maxEnd / 60) * 60;

    const slotStarts = [];
    for (let t = minStart; t < maxEnd; t += SLOT_MINUTES) slotStarts.push(t);

    const consumed = new Set();

    const rows = slotStarts.map(slotStart => {
        const slotEnd = slotStart + SLOT_MINUTES;

        const cells = DAY_ORDER.map(day => {
            const key = `${day}|${slotStart}`;
            if (consumed.has(key)) return '';

            const entry = merged.find(item => {
                const s = timeToMinutes(item.start);
                return item.day === day && s >= slotStart && s < slotEnd;
            });

            if (!entry) return '<td class="tt-cell tt-empty"></td>';

            const entryEnd = timeToMinutes(entry.end);
            const span = Math.max(1, Math.round((entryEnd - slotStart) / SLOT_MINUTES));
            for (let s = 1; s < span; s++) consumed.add(`${day}|${slotStart + s * SLOT_MINUTES}`);

            const color = getMainSubjectColor(entry.subject);
            const meta = PLANNER_TYPE_META[entry.type] || PLANNER_TYPE_META.task;
            const icon = (entry.type === 'study' && entry.examPrep) ? 'bi-mortarboard-fill' : meta.icon;
            const doneClass = entry.done ? 'is-done' : '';
            const toggleAttr = entry.locked ? '' : 'data-toggle="done"';
            const priorityDot = entry.priority ? `<span class="planner-priority-dot priority-${entry.priority}" title="${entry.priority} priority"></span>` : '';
            const checkIcon = entry.locked ? '' : `<span class="planner-done-check"><i class="bi ${entry.done ? 'bi-check-circle-fill' : 'bi-circle'}"></i></span>`;

            const moveBtn = (entry.type === 'study' && !entry.locked)
                ? `<button class="planner-move-btn" data-action="move" aria-label="Move this session" title="Move this session"><i class="bi bi-arrows-move"></i></button>`
                : '';

            return `
                <td class="tt-cell" rowspan="${span}">
                    <div class="planner-block ${doneClass}" data-id="${entry.id}" ${toggleAttr} style="background:${color}22; border-left-color:${color};">
                        ${checkIcon}
                        ${moveBtn}
                        <div class="tt-module"><i class="bi ${icon}"></i> ${escapeHtml(entry.title)}</div>
                        <div class="tt-subject" style="color:${color}">${escapeHtml(entry.subject)}${priorityDot}</div>
                        <div class="tt-time-range">${formatTimeRange(entry.start, entry.end)}</div>
                    </div>
                </td>`;
        }).join('');

        return `<tr><td class="tt-time">${formatTime(minutesToTime(slotStart))}</td>${cells}</tr>`;
    }).join('');

    table.innerHTML = thead + `<tbody>${rows}</tbody>`;
}

function renderPlannerSummary(state) {
    const label = document.getElementById('plannerWeekLabel');
    if (label) {
        const start = new Date(state.weekStart + 'T00:00:00');
        const end = new Date(start);
        end.setDate(end.getDate() + 6); // Mon → Sun
        const opts = { month: 'short', day: 'numeric' };
        label.textContent = `Week of ${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
    }

    const statsEl = document.getElementById('plannerStats');
    if (statsEl) {
        const totalStudy = state.studySessions.length;
        const doneStudy = state.studySessions.filter(s => s.done).length;
        const totalItems = state.fixedItems.length;
        const doneItems = state.fixedItems.filter(i => i.done).length;

        if (totalStudy === 0 && totalItems === 0) {
            statsEl.innerHTML = '<i class="fa-solid fa-book-open"></i> Add your first study session - add lectures on your Timetable and we\'ll build your week.';
        } else if (totalStudy === 0) {
            statsEl.innerHTML = `<i class="fa-solid fa-book-open"></i> No study sessions yet this week · ${doneItems}/${totalItems} tasks & deadlines done`;
        } else {
            statsEl.textContent = `${doneStudy}/${totalStudy} study sessions done · ${doneItems}/${totalItems} tasks & deadlines done`;
        }
    }
}

/* ==========================================================================
   Progress Page : Charts (attendance, weekly productivity, study hours)
   ========================================================================== */

let progressCharts = {};

async function initProgressCharts() {
    if (typeof Chart === 'undefined') return; // CDN blocked/offline, page still works without charts

    Chart.defaults.font.family = "'Poppins', sans-serif";

    await Promise.all([renderAttendanceChart(), renderProductivityChart(), renderStudyHoursChart()]);

    const observer = new MutationObserver(() => {
        Object.values(progressCharts).forEach(c => c && c.destroy());
        renderAttendanceChart();
        renderProductivityChart();
        renderStudyHoursChart();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
}

function chartThemeColors() {
    const styles = getComputedStyle(document.body);
    return {
        text: styles.getPropertyValue('--text-muted').trim() || '#6b7280',
        grid: styles.getPropertyValue('--border-soft').trim() || '#f3f4f6',
    };
}

/*  Attendance - present/absent rate per subject, from real records in the database. */
async function renderAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    const { text, grid } = chartThemeColors();

    let rows = [];
    try {
        const summary = await AttendanceApi.summary();
        rows = summary.subjects || [];
    } catch (err) {
        showToast(err.message || 'Could not load attendance data for the chart.');
    }

    const labels = rows.map(r => r.subjectName.length > 18 ? r.subjectName.replace(' & ', ' &\n') : r.subjectName);
    const colors = rows.map(r => r.colorHex || '#10b981');
    const values = rows.map(r => r.percentage);

    if (progressCharts.attendance) progressCharts.attendance.destroy();
    progressCharts.attendance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderRadius: 8,
                maxBarThickness: 26
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (item) => `${item.raw}% attended` } }
            },
            scales: {
                x: { min: 0, max: 100, ticks: { color: text, callback: v => v + '%' }, grid: { color: grid } },
                y: { ticks: { color: text, font: { size: 11 } }, grid: { display: false } }
            }
        }
    });
}

/*  Weekly Productivity */
async function renderProductivityChart() {
    const ctx = document.getElementById('productivityChart');
    if (!ctx) return;
    const { text, grid } = chartThemeColors();

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const todayIndex = (today.getDay() + 6) % 7; // convert Sun=0..Sat=6 to Mon=0..Sun=6

    const monday = new Date(today);
    monday.setDate(today.getDate() - todayIndex);
    const weekDates = days.map((_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return toLocalIsoDate(d);
    });

    const tasksDone = [0, 0, 0, 0, 0, 0, 0];
    try {
        const tasks = await TasksApi.list('done');
        tasks.forEach(t => {
            if (!t.dueDate) return;
            const idx = weekDates.indexOf(t.dueDate);
            if (idx !== -1) tasksDone[idx]++;
        });
    } catch (err) {
        showToast(err.message || 'Could not load task data for the chart.');
    }

    if (progressCharts.productivity) progressCharts.productivity.destroy();
    progressCharts.productivity = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                data: tasksDone,
                backgroundColor: days.map((_, i) => i === todayIndex ? '#f59e0b' : (i > todayIndex ? grid : '#10b981')),
                borderRadius: 8,
                maxBarThickness: 34
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (item) => `${item.raw} tasks completed` } }
            },
            scales: {
                x: { ticks: { color: text }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { color: text, stepSize: 2 }, grid: { color: grid } }
            }
        }
    });
}

/* ---- Study Hours. ---- */
async function renderStudyHoursChart() {
    const ctx = document.getElementById('studyHoursChart');
    if (!ctx) return;
    const { text, grid } = chartThemeColors();
    const subEl = document.getElementById('studyHoursSub');

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const todayIndex = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - todayIndex);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const isoMonday = toLocalIsoDate(monday);
    const isoSunday = toLocalIsoDate(sunday);

    const hoursByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
    let hasData = false;
    try {
        const sessions = await PlannerApi.listSessions(isoMonday, isoSunday);
        if (sessions && sessions.length) {
            hasData = true;
            sessions.forEach(s => {
                const mins = timeToMinutes(s.endTime) - timeToMinutes(s.startTime);
                const dayIdx = (new Date(s.date + 'T00:00:00').getDay() + 6) % 7;
                const dayKey = days[dayIdx];
                if (mins > 0) hoursByDay[dayKey] += mins / 60;
            });
        }
    } catch (err) {

    }

    if (subEl) subEl.textContent = hasData ? 'From your Study Planner' : 'No data to display';

    if (progressCharts.studyHours) progressCharts.studyHours.destroy();
    progressCharts.studyHours = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                data: days.map(d => Math.round(hoursByDay[d] * 10) / 10),
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                pointBackgroundColor: '#10b981',
                pointRadius: 4,
                tension: 0.35,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: (item) => `${item.raw}h studied` } }
            },
            scales: {
                x: { ticks: { color: text }, grid: { display: false } },
                y: { beginAtZero: true, ticks: { color: text, callback: v => v + 'h' }, grid: { color: grid } }
            }
        }
    });
}
