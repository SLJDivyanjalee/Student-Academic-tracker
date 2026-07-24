/* ==========================================================================
   LevelUp Dashboard - Frontend interactivity
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initSidebar();
    applyTimeBasedGreeting();
    applyProfileSettings();
    applyNotificationVisibility();
    if (document.getElementById('notifPanel')) initNotifications();
    if (document.getElementById('calendarBody')) initCalendar();
    if (document.getElementById('timerCircle')) initTimer();
    if (document.getElementById('tasksTable')) initTasksTable();
    if (document.querySelector('.stat-num')) initStatCounters();
    initProgressAnimations();
    if (document.getElementById('attendanceLogTable')) initAttendance();
    if (document.getElementById('timetableTable')) initTimetable();
    if (document.getElementById('plannerTable')) initStudyPlanner();
    if (document.getElementById('profileNameInput')) initSettingsPage();
    if (document.getElementById('notificationsToggle')) initNotificationsToggle();
    if (document.getElementById('attendanceChart')) initProgressCharts();
    initPageSearch();
});

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

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
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
   Calendar: real month navigation + day selection
   ========================================================================== */

function initCalendar() {
    const monthLabel = document.getElementById('calendarMonthLabel');
    const body = document.getElementById('calendarBody');
    const prevBtn = document.getElementById('calPrev');
    const nextBtn = document.getElementById('calNext');
    const hint = document.getElementById('calendarHint');

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    // Events keyed as "YYYY-M-D" (month is 0-indexed)
    const events = {
        '2026-6-9': 'Database Project due',
        '2026-6-17': 'Statistics Quiz'
    };

    const today = new Date();
    let viewYear = 2026;
    let viewMonth = 6;

    function render() {
        monthLabel.textContent = `${monthNames[viewMonth]} ${viewYear}`;
        body.innerHTML = '';

        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

        let row = document.createElement('tr');
        for (let i = 0; i < firstDay; i++) row.appendChild(document.createElement('td'));

        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('td');
            cell.textContent = day;

            const key = `${viewYear}-${viewMonth}-${day}`;
            const isToday = today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;

            if (isToday) cell.classList.add('today');
            if (events[key]) {
                cell.classList.add('event-day');
                cell.title = events[key];
                cell.dataset.event = events[key];
            }

            cell.addEventListener('click', () => {
                body.querySelectorAll('td.selected-day').forEach(td => td.classList.remove('selected-day'));
                cell.classList.add('selected-day');
                hint.textContent = events[key]
                    ? `${monthNames[viewMonth]} ${day}: ${events[key]}`
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
        const trackColor = isDark ? '#2a2e4a' : '#ede9fe';
        circle.style.background = `conic-gradient(#6d5dfc ${angle}deg, ${trackColor} ${angle}deg)`;
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

    /* Puts the Start/Pause button back to its default "ready to start" look. */
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

function initTasksTable() {
    const table = document.getElementById('tasksTable');
    if (!table) return;

    const activateStatusPill = (pill) => {
        const row = pill.closest('tr');
        const current = pill.dataset.status;
        const next = TASK_STATUS_ORDER[(TASK_STATUS_ORDER.indexOf(current) + 1) % TASK_STATUS_ORDER.length];

        pill.classList.remove('status-pending', 'status-progress', 'status-done');
        pill.classList.add(`status-${next}`);
        pill.dataset.status = next;
        pill.textContent = TASK_STATUS_LABELS[next];

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
    };

    const activateUrgencyPill = (pill) => {
        const current = pill.dataset.urgency;
        const next = TASK_URGENCY_ORDER[(TASK_URGENCY_ORDER.indexOf(current) + 1) % TASK_URGENCY_ORDER.length];

        pill.classList.remove('urgency-low', 'urgency-medium', 'urgency-high');
        pill.classList.add(`urgency-${next}`);
        pill.dataset.urgency = next;
        pill.textContent = TASK_URGENCY_LABELS[next];
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
            const name = row.querySelector('.task-name')?.textContent || 'Task';
            row.remove();
            showToast(`"${name}" deleted.`);
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
}

/* Opens the Edit Task modal pre-filled with the given row's current values. */
function openEditTaskModal(row) {
    const modalEl = document.getElementById('editTaskModal');
    if (!row || !modalEl || typeof bootstrap === 'undefined') return;

    const nameEl = row.querySelector('.task-name');
    const subjectEl = row.querySelector('.task-subject');
    const dueEl = row.children[2];
    const urgencyPill = row.querySelector('.urgency-pill');

    document.getElementById('editTaskName').value = nameEl ? nameEl.textContent.trim() : '';
    document.getElementById('editTaskSubject').value = subjectEl ? subjectEl.textContent.trim() : '';
    document.getElementById('editTaskDue').value = dueEl ? dueEl.textContent.trim() : '';
    document.getElementById('editTaskUrgency').value = urgencyPill ? urgencyPill.dataset.urgency : 'medium';

    const saveBtn = document.getElementById('editTaskSaveBtn');
    saveBtn.onclick = () => {
        const name = document.getElementById('editTaskName').value.trim();
        const subject = document.getElementById('editTaskSubject').value.trim();
        const dueLabel = document.getElementById('editTaskDue').value.trim() || 'No due date';
        const urgency = document.getElementById('editTaskUrgency').value;

        if (!name) { showToast('Enter a task name before saving.'); return; }
        if (!subject) { showToast('Enter a subject before saving.'); return; }

        if (nameEl) nameEl.textContent = name;
        if (subjectEl) subjectEl.textContent = subject;
        if (dueEl) dueEl.textContent = dueLabel;
        if (urgencyPill) {
            const urgencyKey = TASK_URGENCY_ORDER.includes(urgency) ? urgency : 'medium';
            urgencyPill.classList.remove('urgency-low', 'urgency-medium', 'urgency-high');
            urgencyPill.classList.add(`urgency-${urgencyKey}`);
            urgencyPill.dataset.urgency = urgencyKey;
            urgencyPill.textContent = TASK_URGENCY_LABELS[urgencyKey];
        }

        row.classList.add('flash-highlight');
        setTimeout(() => row.classList.remove('flash-highlight'), 1600);

        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        showToast(`"${name}" updated.`, 'success');
    };

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

/* "Add Task" form */
function initAddTaskForm() {
    const addBtn = document.getElementById('addTaskBtn');
    if (!addBtn) return;

    addBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('newTaskName');
        const subjectInput = document.getElementById('newTaskSubject');
        const dueInput = document.getElementById('newTaskDue');
        const urgencyInput = document.getElementById('newTaskUrgency');

        const name = nameInput.value.trim();
        const subject = subjectInput.value.trim();
        const urgency = urgencyInput && TASK_URGENCY_ORDER.includes(urgencyInput.value) ? urgencyInput.value : 'medium';
        const dueLabel = dueInput.value ? formatDateLabel(dueInput.value) : 'No due date';

        if (!name) {
            showToast('Enter a task name before adding it.');
            return;
        }
        if (!subject) {
            showToast('Enter a subject before adding it.');
            return;
        }

        addTaskRow(name, subject, dueLabel, urgency);

        nameInput.value = '';
        subjectInput.value = '';
        dueInput.value = '';
        if (urgencyInput) urgencyInput.value = 'medium';
        nameInput.focus();

        showToast(`"${name}" added to your task list.`, 'success');
    });
}

/* Inserts a new pending row at the top of the Recent Tasks table. */
function addTaskRow(name, subject, dueLabel, urgency) {
    const body = document.querySelector('#tasksTable tbody');
    if (!body) return;

    const urgencyKey = TASK_URGENCY_ORDER.includes(urgency) ? urgency : 'medium';
    const row = document.createElement('tr');
    row.classList.add('flash-highlight');
    row.innerHTML = `
        <td class="task-title-cell"><i class="bi bi-journal-text text-primary me-2"></i><span class="task-name">${escapeHtml(name)}</span></td>
        <td class="task-subject">${escapeHtml(subject)}</td>
        <td>${escapeHtml(dueLabel)}</td>
        <td><span class="urgency-pill urgency-${urgencyKey}" data-urgency="${urgencyKey}" role="button" tabindex="0">${TASK_URGENCY_LABELS[urgencyKey]}</span></td>
        <td><span class="status-pill status-pending" data-status="pending" role="button" tabindex="0">Pending</span></td>
        <td class="task-actions"><button class="action-edit-btn" aria-label="Edit task"><i class="bi bi-pencil"></i></button><button class="log-delete-btn" aria-label="Delete task"><i class="bi bi-trash"></i></button></td>
    `;
    body.insertBefore(row, body.firstChild);
    setTimeout(() => row.classList.remove('flash-highlight'), 1600);
}

/* ==========================================================================
   Page search bars
   ========================================================================== */

function initPageSearch() {
    wireListFilter('taskSearch', '#tasksTable tbody tr');
    wireListFilter('attendanceSearch', '#attendanceLogTable tbody tr');
    initAssignmentsExamsTabs();
    initPageSearchPopup();
}

/* ==========================================================================
 Assignments & Exams page
   ========================================================================== */
function initAssignmentsExamsTabs() {
    const tabs = document.querySelectorAll('#aeTabs .ae-tab');
    const list = document.getElementById('aeList');
    if (!tabs.length || !list) return;

    let items = Array.from(document.querySelectorAll('.ae-item'));

    const params = new URLSearchParams(window.location.search);
    let activeType = params.get('type') === 'exam' ? 'exam' : (params.get('type') === 'assignment' ? 'assignment' : 'all');

    const heading = document.getElementById('aeHeading');
    const headingIcon = document.getElementById('aeHeadingIcon');
    const headingText = document.getElementById('aeHeadingText');
    const searchInput = document.getElementById('itemSearch');
    const noResults = document.getElementById('itemSearchNoResults');

    function updateHeading() {
        if (!heading) return;
        const label = activeType === 'exam' ? 'Exams'
            : activeType === 'assignment' ? 'Assignments'
            : 'Assignments & Exams';
        const iconClass = activeType === 'exam' ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-book-open';
        if (headingText) headingText.textContent = label;
        if (headingIcon) headingIcon.className = iconClass;
    }

    function emptyMessageFor(type) {
        if (type === 'exam') return { icon: 'fa-solid fa-champagne-glasses', text: 'No upcoming exams.' };
        if (type === 'assignment') return { icon: 'fa-solid fa-circle-check', text: "You're all caught up! No assignments pending." };
        return { icon: 'fa-solid fa-circle-check', text: "You're all caught up! Nothing due right now." };
    }

    function render() {
        const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
        let visible = 0;
        tabs.forEach(t => t.classList.toggle('active', t.dataset.type === activeType));
        items.forEach(item => {
            const typeOk = activeType === 'all' || item.dataset.type === activeType;
            const textOk = !q || item.textContent.toLowerCase().includes(q);
            const show = typeOk && textOk;
            item.style.display = show ? '' : 'none';
            if (show) visible++;
        });
        if (noResults) {
            if (visible === 0) {
                if (q) {
                    noResults.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i> Nothing matches your search.';
                } else {
                    const msg = emptyMessageFor(activeType);
                    noResults.innerHTML = `<i class="${msg.icon}"></i> ${msg.text}`;
                }
                noResults.style.display = 'block';
            } else {
                noResults.style.display = 'none';
            }
        }
    }

    function refreshItems() {
        items = Array.from(document.querySelectorAll('.ae-item'));
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

    initAddAeForm(refreshItems);

    list.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.action-edit-btn');
        if (editBtn) { openEditAeModal(editBtn.closest('.ae-item'), refreshItems); return; }
        const delBtn = e.target.closest('.log-delete-btn');
        if (delBtn) {
            const item = delBtn.closest('.ae-item');
            const title = item.querySelector('h6')?.textContent || 'Item';
            item.remove();
            showToast(`"${title}" deleted.`);
            refreshItems();
        }
    });

    updateHeading();
    render();
}

/* Opens the Edit Assignment/Exam modal pre-filled with the given item's current values. */
function openEditAeModal(item, onSaved) {
    const modalEl = document.getElementById('editAeModal');
    if (!item || !modalEl || typeof bootstrap === 'undefined') return;

    const titleEl = item.querySelector('h6');
    const smallEl = item.querySelector('small');
    const [currentSubject, currentDue] = smallEl ? smallEl.textContent.split('•').map(s => s.trim()) : ['', ''];

    document.getElementById('editAeName').value = titleEl ? titleEl.textContent.trim() : '';
    document.getElementById('editAeSubject').value = currentSubject || '';
    document.getElementById('editAeDue').value = currentDue || '';
    document.getElementById('editAeType').value = item.dataset.type === 'exam' ? 'exam' : 'assignment';

    const saveBtn = document.getElementById('editAeSaveBtn');
    saveBtn.onclick = () => {
        const name = document.getElementById('editAeName').value.trim();
        const subject = document.getElementById('editAeSubject').value.trim();
        const dueLabel = document.getElementById('editAeDue').value.trim() || 'No due date';
        const type = document.getElementById('editAeType').value === 'exam' ? 'exam' : 'assignment';

        if (!name) { showToast('Enter a title before saving.'); return; }
        if (!subject) { showToast('Enter a subject before saving.'); return; }

        const isExam = type === 'exam';
        item.dataset.type = isExam ? 'exam' : 'assignment';
        if (titleEl) titleEl.textContent = name;
        if (smallEl) smallEl.textContent = `${subject} • ${dueLabel}`;

        const iconWrap = item.querySelector('.event-icon');
        if (iconWrap) {
            iconWrap.classList.remove('bg-purple', 'bg-danger');
            iconWrap.classList.add(isExam ? 'bg-danger' : 'bg-purple');
            const icon = iconWrap.querySelector('i');
            if (icon) icon.className = `bi ${isExam ? 'bi-pencil-square' : 'bi-journal-text'}`;
        }

        item.classList.add('flash-highlight');
        setTimeout(() => item.classList.remove('flash-highlight'), 1600);

        bootstrap.Modal.getOrCreateInstance(modalEl).hide();
        showToast(`"${name}" updated.`, 'success');
        if (onSaved) onSaved();
    };

    bootstrap.Modal.getOrCreateInstance(modalEl).show();
}

/* "Add Assignment / Exam" form */
function initAddAeForm(onItemAdded) {
    const addBtn = document.getElementById('addAeBtn');
    if (!addBtn) return;

    addBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('newAeName');
        const subjectInput = document.getElementById('newAeSubject');
        const typeInput = document.getElementById('newAeType');
        const dueInput = document.getElementById('newAeDue');

        const name = nameInput.value.trim();
        const subject = subjectInput.value.trim();
        const type = typeInput && typeInput.value === 'exam' ? 'exam' : 'assignment';
        const dueLabel = dueInput.value ? `Due ${formatDateLabel(dueInput.value)}` : 'No due date';

        if (!name) {
            showToast('Enter a title before adding it.');
            return;
        }
        if (!subject) {
            showToast('Enter a subject before adding it.');
            return;
        }

        addAeItem(name, subject, dueLabel, type);

        nameInput.value = '';
        subjectInput.value = '';
        dueInput.value = '';
        if (typeInput) typeInput.value = 'assignment';
        nameInput.focus();

        showToast(`"${name}" added to your ${type === 'exam' ? 'exams' : 'assignments'}.`, 'success');
        if (onItemAdded) onItemAdded();
    });
}

/* Inserts a new assignment/exam entry at the top of the Assignments & Exams list. */
function addAeItem(name, subject, dueLabel, type) {
    const list = document.getElementById('aeList');
    if (!list) return;

    const isExam = type === 'exam';
    const item = document.createElement('div');
    item.className = 'event-item ae-item flash-highlight';
    item.dataset.type = isExam ? 'exam' : 'assignment';
    item.innerHTML = `
        <div class="event-icon ${isExam ? 'bg-danger' : 'bg-purple'}"><i class="bi ${isExam ? 'bi-pencil-square' : 'bi-journal-text'}"></i></div>
        <div><h6>${escapeHtml(name)}</h6><small>${escapeHtml(subject)} • ${escapeHtml(dueLabel)}</small></div>
        <div class="ae-actions"><button class="action-edit-btn" aria-label="Edit item"><i class="bi bi-pencil"></i></button><button class="log-delete-btn" aria-label="Delete item"><i class="bi bi-trash"></i></button></div>
    `;
    list.insertBefore(item, list.firstChild);
    setTimeout(() => item.classList.remove('flash-highlight'), 1600);
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

/* Navbar search icon -> popup search bar (used on Tasks, Assignments & Exams, Attendance) */
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

const ATTENDANCE_SUBJECT_COLORS = {
    'Object Oriented Programming': '#7c3aed',
    'Database Systems': '#2563eb',
    'Inferential Statistics': '#ef4444',
    'Data Structures & Algorithms': '#22c55e',
    'Linear Algebra': '#f59e0b'
};

function initAttendance() {
    initAttendanceLogRows();
    initQuickMarkLectures();
    recomputeAttendance();
    updateAttendanceLogEmptyState();
}

/* Click a Present/Absent pill in the log table to flip it; trash icon
   removes the row entirely. Both trigger a full recompute. */
function initAttendanceLogRows() {
    const body = document.getElementById('attendanceLogBody');
    if (!body) return;

    body.addEventListener('click', (e) => {
        const pill = e.target.closest('.status-pill');
        if (pill) {
            toggleAttendancePill(pill);
            recomputeAttendance();
            return;
        }
        const delBtn = e.target.closest('.log-delete-btn');
        if (delBtn) {
            delBtn.closest('tr').remove();
            recomputeAttendance();
            updateAttendanceLogEmptyState();
        }
    });

    body.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const pill = e.target.closest('.status-pill');
        if (!pill) return;
        e.preventDefault();
        toggleAttendancePill(pill);
        recomputeAttendance();
    });
}

function toggleAttendancePill(pill) {
    const order = ['present', 'absent', 'cancelled'];
    const idx = order.indexOf(pill.dataset.status);
    const next = order[(idx + 1) % order.length];
    setAttendancePill(pill, next);
}

function setAttendancePill(pill, status) {
    const classForStatus = { present: 'status-done', absent: 'status-missed', cancelled: 'status-cancelled' };
    const labelForStatus = { present: 'Present', absent: 'Absent', cancelled: 'Cancelled' };

    pill.dataset.status = status;
    pill.classList.remove('status-done', 'status-missed', 'status-cancelled');
    pill.classList.add(classForStatus[status] || 'status-done');
    pill.textContent = labelForStatus[status] || 'Present';
}

/* "Today's Lectures" quick-mark card */
function initQuickMarkLectures() {
    const items = document.querySelectorAll('.quick-mark-item');
    items.forEach(item => {
        const buttons = item.querySelectorAll('.quick-mark-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const status = btn.dataset.action; // 'present' | 'absent' | 'cancelled'
                const subject = item.dataset.subject;
                const lecture = item.dataset.lecture;

                addAttendanceRow(lecture, subject, formatTodayLabel(), status, true);

                buttons.forEach(b => {
                    b.disabled = true;
                    b.classList.toggle('selected', b === btn);
                });
                item.classList.add('marked');

                if (status === 'present') {
                    showToast(`Marked "${lecture}" as attended.`, 'success');
                } else if (status === 'cancelled') {
                    showToast(`Marked "${lecture}" as cancelled.`);
                } else {
                    showToast(`Marked "${lecture}" as missed.`);
                }
                recomputeAttendance();
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
            emptyRow = document.createElement('tr');
            emptyRow.className = 'empty-state-row';
            emptyRow.innerHTML = '<td colspan="5" class="timetable-empty-cell"><i class="fa-solid fa-clipboard-list"></i> No attendance records yet! mark a lecture to get started.</td>';
            body.appendChild(emptyRow);
        }
    } else if (emptyRow) {
        emptyRow.remove();
    }
}

/* Inserts a new row at the top of the Attendance Log table. */
function addAttendanceRow(lecture, subject, dateLabel, status, highlight) {
    const body = document.getElementById('attendanceLogBody');
    if (!body) return;
    const existingEmptyRow = body.querySelector('.empty-state-row');
    if (existingEmptyRow) existingEmptyRow.remove();

    const iconByStatus = {
        present: 'bi bi-book text-success me-2',
        absent: 'bi bi-book text-danger me-2',
        cancelled: 'bi bi-calendar-x text-warning me-2'
    };
    const pillClassByStatus = { present: 'status-done', absent: 'status-missed', cancelled: 'status-cancelled' };
    const pillLabelByStatus = { present: 'Present', absent: 'Absent', cancelled: 'Cancelled' };

    const iconClass = iconByStatus[status] || iconByStatus.present;
    const pillClass = pillClassByStatus[status] || 'status-done';
    const pillLabel = pillLabelByStatus[status] || 'Present';

    const row = document.createElement('tr');
    row.dataset.subject = subject;
    if (highlight) row.classList.add('flash-highlight');
    row.innerHTML = `
        <td class="task-title-cell"><i class="${iconClass}"></i><span class="task-name">${escapeHtml(lecture)}</span></td>
        <td class="task-subject">${escapeHtml(subject)}</td>
        <td>${escapeHtml(dateLabel)}</td>
        <td><span class="status-pill ${pillClass}" data-status="${status}" role="button" tabindex="0">${pillLabel}</span></td>
        <td><button class="log-delete-btn" aria-label="Delete record"><i class="bi bi-trash"></i></button></td>
    `;
    body.insertBefore(row, body.firstChild);
    if (highlight) setTimeout(() => row.classList.remove('flash-highlight'), 1600);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatTodayLabel() {
    return formatDateLabel(new Date().toISOString().slice(0, 10));
}

function formatDateLabel(isoDate) {
    if (!isoDate) return formatTodayLabel();
    const d = new Date(isoDate + 'T00:00:00');
    if (isNaN(d)) return isoDate;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* Recalculates overall + per-subject attendance from every row currently
   in the log table and re-renders the stat cards and subject bars. */
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
        list.innerHTML = '<p class="text-muted mb-0">No attendance records yet! mark a lecture to get started.</p>';
        return;
    }

    list.innerHTML = subjects.map(subject => {
        const { present, total } = subjectStats[subject];
        const pct = total ? Math.round((present / total) * 100) : 0;
        const color = ATTENDANCE_SUBJECT_COLORS[subject] || '#6d5dfc';

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
   Weekly Lecture Timetable - frontend-only schedule builder
   ========================================================================== */

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/* Weekend days are treated as "holiday" days -no lectures ever land here,
   so they're natural candidates for extra, lighter study time. */
const WEEKEND_DAYS = ['Sat', 'Sun'];
function isWeekend(day) { return WEEKEND_DAYS.includes(day); }

/* Colors are assigned per MAIN SUBJECT (not per module), so every module
   of the same main subject (Lecture, Tutorial, Practical...) shares a color
   in the timetable */
const MAIN_SUBJECT_COLORS = {
    'object oriented programming': '#7c3aed',
    'data structures & algorithms': '#22c55e',
    'inferential statistics': '#ef4444',
    'linear algebra': '#f59e0b',
    'real analysis': '#0ea5e9',
    'database systems': '#2563eb'
};
const MAIN_SUBJECT_PALETTE = ['#7c3aed', '#22c55e', '#ef4444', '#f59e0b', '#2563eb', '#0ea5e9', '#ec4899', '#84cc16', '#f97316', '#14b8a6'];
let mainSubjectColorAssignments = {};

function getMainSubjectColor(subject) {
    const key = (subject || '').trim().toLowerCase();
    if (!key) return '#6d5dfc';
    if (MAIN_SUBJECT_COLORS[key]) return MAIN_SUBJECT_COLORS[key];
    if (!mainSubjectColorAssignments[key]) {
        const usedCount = Object.keys(mainSubjectColorAssignments).length;
        mainSubjectColorAssignments[key] = MAIN_SUBJECT_PALETTE[usedCount % MAIN_SUBJECT_PALETTE.length];
    }
    return mainSubjectColorAssignments[key];
}

/* In-memory only for now (no backend yet), resets on reload. */
let timetableLectures = [
    { id: 1, day: 'Mon', start: '08:00', end: '10:00', mainSubject: 'Object Oriented Programming', module: 'Lecture' },
    { id: 2, day: 'Mon', start: '11:00', end: '13:00', mainSubject: 'Database Systems', module: 'Lab' },
    { id: 3, day: 'Tue', start: '09:00', end: '10:30', mainSubject: 'Inferential Statistics', module: 'Lecture' },
    { id: 4, day: 'Tue', start: '13:00', end: '14:30', mainSubject: 'Linear Algebra', module: 'Tutorial' },
    { id: 5, day: 'Wed', start: '08:00', end: '09:30', mainSubject: 'Data Structures & Algorithms', module: 'Lecture' },
    { id: 6, day: 'Wed', start: '10:00', end: '12:00', mainSubject: 'Database Systems', module: 'Lecture' },
    { id: 7, day: 'Thu', start: '09:00', end: '10:30', mainSubject: 'Object Oriented Programming', module: 'Practical' },
    { id: 8, day: 'Thu', start: '11:00', end: '12:30', mainSubject: 'Inferential Statistics', module: 'Tutorial' },
    { id: 9, day: 'Fri', start: '08:00', end: '09:30', mainSubject: 'Linear Algebra', module: 'Lecture' },
    { id: 10, day: 'Fri', start: '10:00', end: '11:30', mainSubject: 'Data Structures & Algorithms', module: 'Practical' }
];
let timetableNextId = 11;

function initTimetable() {
    renderTimetable();

    const addBtn = document.getElementById('addTimetableBtn');
    if (!addBtn) return;

    addBtn.addEventListener('click', () => {
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

        timetableLectures.push({ id: timetableNextId++, day, start, end, mainSubject, module: module || 'Lecture' });
        renderTimetable();
        showToast(`Added ${mainSubject} to ${dayFullName(day)}.`, 'success');
    });

    const table = document.getElementById('timetableTable');
    table.addEventListener('click', (e) => {
        const delBtn = e.target.closest('.timetable-delete-btn');
        if (!delBtn) return;
        const id = parseInt(delBtn.closest('.tt-block').dataset.id, 10);
        timetableLectures = timetableLectures.filter(l => l.id !== id);
        renderTimetable();
    });
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

/* Builds a proper Time-slot × Day grid */
const SLOT_MINUTES = 30;

function renderTimetable() {
    const table = document.getElementById('timetableTable');
    if (!table) return;

    if (!timetableLectures.length) {
        table.innerHTML = '<tbody><tr><td class="timetable-empty-cell">No lectures added yet! use the form to build your weekly timetable.</td></tr></tbody>';
        return;
    }

    let minStart = Math.min(...timetableLectures.map(l => timeToMinutes(l.start)));
    let maxEnd = Math.max(...timetableLectures.map(l => timeToMinutes(l.end)));
    // Snap to clean hour boundaries so the grid always starts/ends on the hour.
    minStart = Math.floor(minStart / 60) * 60;
    maxEnd = Math.ceil(maxEnd / 60) * 60;

    const slotStarts = [];
    for (let t = minStart; t < maxEnd; t += SLOT_MINUTES) slotStarts.push(t);

    const thead = `<thead><tr><th class="tt-time-head">Time</th>${DAY_ORDER.map(d => `<th>${dayFullName(d)}</th>`).join('')}</tr></thead>`;

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
const PLANNER_HOURS_KEY = 'levelup-planner-hours';
const PLANNER_REST_KEY = 'levelup-planner-rest-on-holidays';

function loadRestOnHolidays() {
    try { return localStorage.getItem(PLANNER_REST_KEY) === 'true'; } catch { return false; }
}
function saveRestOnHolidays(value) {
    try { 
        localStorage.setItem(PLANNER_REST_KEY, value ? 'true' : 'false'); 
    } catch { /* storage unavailable! preference just won't persist across reloads */ }
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
    try { localStorage.setItem(PLANNER_HOURS_KEY, JSON.stringify({ start: startHHMM, end: endHHMM })); } catch { /* storage unavailable! preference just won't persist across reloads */ }
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

const PLANNER_SEED_EVENTS = [
    { id: 'seed-1', title: 'Database ER Diagram', subject: 'Database Systems', type: 'assignment', priority: 'high', day: 'Mon', start: '14:00', end: '15:00' },
    { id: 'seed-2', title: 'DSA Assignment 3', subject: 'Data Structures & Algorithms', type: 'assignment', priority: 'medium', day: 'Wed', start: '14:00', end: '15:00' },
    { id: 'seed-3', title: 'OOP Lab Exercise 4', subject: 'Object Oriented Programming', type: 'assignment', priority: 'low', day: 'Thu', start: '14:00', end: '15:00' },
    { id: 'seed-4', title: 'Revise OOP Inheritance Notes', subject: 'Object Oriented Programming', type: 'task', priority: 'medium', day: 'Tue', start: '16:00', end: '17:00' },
    { id: 'seed-5', title: 'Organize Rotaract Event Notes', subject: 'General', type: 'task', priority: 'low', day: 'Sat', start: '13:00', end: '14:00' },
    { id: 'seed-6', title: 'Statistics Quiz', subject: 'Inferential Statistics', type: 'exam', priority: 'high', day: 'Sat', start: '10:00', end: '11:00' },
    { id: 'seed-7', title: 'Linear Algebra Midterm', subject: 'Linear Algebra', type: 'exam', priority: 'high', day: 'Sat', start: '10:00', end: '11:00' },
    { id: 'seed-8', title: 'DSA Final', subject: 'Data Structures & Algorithms', type: 'exam', priority: 'high', day: 'Thu', start: '14:00', end: '16:00' }
];

function initStudyPlanner() {
    const currentMonday = getMondayISO(new Date());

    const savedHours = loadPlannerHours();
    if (savedHours) {
        PLANNER_DAY_START = timeToMinutes(savedHours.start);
        PLANNER_DAY_END = timeToMinutes(savedHours.end);
    }

    let state = loadPlannerState();
    let restOnHolidays = loadRestOnHolidays();

    try {
        if (!state) {
            state = { weekStart: currentMonday, ...generateWeekSchedule({ includeSeed: true, restOnHolidays }) };
            savePlannerState(state);
        } else if (state.weekStart !== currentMonday) {
            const { carryStudyMinutes, carryMovable, carryUserMoved } = buildCarryOver(state);
            state = { weekStart: currentMonday, ...generateWeekSchedule({ carryStudyMinutes, carryMovable, carryUserMoved, restOnHolidays }) };
            savePlannerState(state);
            showToast('New week: your planner was regenerated and any missed sessions carried forward.', 'success', 5200);
        }

        renderPlannerLegend();
        renderPlanner(state);
    } catch (err) {
        // Cached planner data from an earlier version of the app (or a corrupted
        // save) can't be trusted - wipe it and rebuild a fresh week rather than
        // leaving the page stuck with a half-wired planner (buttons that were
        // never attached because we threw before reaching them below).
        console.error('Study Planner: cached state was invalid, rebuilding a fresh week.', err);
        try { localStorage.removeItem(PLANNER_STATE_KEY); } catch { /* storage unavailable */ }
        state = { weekStart: currentMonday, ...generateWeekSchedule({ includeSeed: true, restOnHolidays }) };
        savePlannerState(state);
        renderPlannerLegend();
        renderPlanner(state);
        showToast('Your study planner data looked out of date, so it was rebuilt fresh.', 'success', 5200);
    }

    const regenBtn = document.getElementById('plannerRegenerateBtn');
    const regenerateModalEl = document.getElementById('regenerateWeekModal');

    function runRegenerate(wantsMoreRest) {
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
            // Only study/exam-prep sessions the app generated can be moved 
            // lectures are locked out entirely, and other item types don't
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

    /* Banner actions for a user-added session that overlaps something:
       "Keep it as is" just dismisses the notice (the session stays right
       where the student put it); "Change time" opens the same move modal
       used elsewhere, pre-filtered to actually-free slots. */
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

    /* ---- Move-session modal: reschedule a single generated study/exam-prep
       block to another free day+time. Lectures never appear here, this
       modal only ever opens for state.studySessions entries. ---- */
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
    return date.toISOString().slice(0, 10);
}

/* Carries forward anything not marked done */
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

/* Every day from Monday up to (and including) the given day, used to keep
   exam-prep sessions landing BEFORE the exam instead of after it. */
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

/* Places an exam exactly where it's set, exams aren't moved. Any overlap
   it runs into (another exam, a lecture) is reported as a conflict for
   the person to resolve manually, since neither side can be safely
   auto-shifted for them. */
function placeExam(item, busyByDay, conflicts) {
    const s = timeToMinutes(item.start), en = timeToMinutes(item.end);
    const clashes = busyByDay[item.day].filter(b => s < b.end && b.start < en);
    clashes.forEach(c => {
        conflicts.push(`"${item.title}" clashes with "${c.label}" on ${dayFullName(item.day)}, ${formatTimeRange(item.start, item.end)}! please move one of these manually.`);
    });
    addBusy(busyByDay, item.day, s, en, `${item.title} (exam)`);
    return { day: item.day, start: item.start, end: item.end };
}

/* Places a task/assignment. Tries its own preferred day+time first (if it
   has one); if that's taken, auto-shifts to the next free slot same
   day first, then later days and reports the shift. */
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

/* Places one generated study/exam-prep block. Tries the given day pool in
   order (already sorted by whoever's least loaded so sessions spread out
   instead of stacking), respecting a per-day minute cap so the student
   isn't overworked. Falls back to ignoring the cap (any free slot, any
   day) only if that's the sole way to fit the requested time in. */
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

function generateWeekSchedule({ carryStudyMinutes = {}, carryMovable = [], carryUserMoved = [], includeSeed = false, restOnHolidays = false } = {}) {
    const busyByDay = {};
    DAY_ORDER.forEach(d => busyByDay[d] = []);
    timetableLectures.forEach(l => addBusy(busyByDay, l.day, timeToMinutes(l.start), timeToMinutes(l.end), `${l.mainSubject} ${l.module}`));

    const conflicts = [];
    const shiftNotes = [];
    const unscheduledRaw = []; // raw failures, deduped+counted into `unscheduled` just before returning
    const fixedItems = [];
    let nextId = 1;

    const seedSource = includeSeed ? PLANNER_SEED_EVENTS.map(e => ({ ...e })) : [];
    const exams = seedSource.filter(e => e.type === 'exam');
    const movableAll = [...seedSource.filter(e => e.type !== 'exam'), ...carryMovable];

    exams.forEach(e => {
        const placement = placeExam(e, busyByDay, conflicts);
        fixedItems.push({ id: `F${nextId++}`, title: e.title, subject: e.subject, type: e.type, priority: e.priority, done: false, ...placement });
    });

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
    exams.forEach(e => {
        const existing = examDayBySubject[e.subject];
        if (!existing || DAY_ORDER.indexOf(e.day) < DAY_ORDER.indexOf(existing)) examDayBySubject[e.subject] = e.day;
    });

    const studySessions = [];
    let studyId = 1;
    const dailyStudyMinutes = {}; // generated-study minutes only, used to keep any single day from being overloaded
    const reservedMinutesBySubject = {}; // minutes already covered by sessions the student manually moved

    carryUserMoved.forEach(m => {
        const s = timeToMinutes(m.start), en = timeToMinutes(m.end);
        // A user-placed session's own time is respected even if something
        // else now lands on it (e.g. carried forward across weeks and a
        // new lecture/task claimed that slot) - it's kept right where the
        // student put it, and the specific overlap is surfaced so they can
        // decide whether to leave it or move it, rather than silently
        // auto-relocating something they chose themselves.
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

    /* Collapse repeat failures (e.g. 10x "DSA study session, week's full")
       into one line with a count instead of listing the same reason over
       and over. */
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

    if (!merged.length) {
        table.innerHTML = '<tbody><tr><td class="timetable-empty-cell">Nothing scheduled yet! add lectures to your Timetable first.</td></tr></tbody>';
        return;
    }

    let minStart = Math.min(PLANNER_DAY_START, ...merged.map(i => timeToMinutes(i.start)));
    let maxEnd = Math.max(PLANNER_DAY_END, ...merged.map(i => timeToMinutes(i.end)));
    minStart = Math.floor(minStart / 60) * 60;
    maxEnd = Math.ceil(maxEnd / 60) * 60;

    const slotStarts = [];
    for (let t = minStart; t < maxEnd; t += SLOT_MINUTES) slotStarts.push(t);

    const thead = `<thead><tr><th class="tt-time-head">Time</th>${DAY_ORDER.map(d => `<th>${dayFullName(d)}</th>`).join('')}</tr></thead>`;
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

function initProgressCharts() {
    if (typeof Chart === 'undefined') return; // CDN blocked/offline, page still works without charts

    Chart.defaults.font.family = "'Poppins', sans-serif";

    renderAttendanceChart();
    renderProductivityChart();
    renderStudyHoursChart();

    // Charts are drawn once with baked-in colors, so redraw on theme flips
    // rather than trying to live-patch every color inside each chart.
    const observer = new MutationObserver(() => {
        Object.values(progressCharts).forEach(c => c && c.destroy());
        renderAttendanceChart();
        renderProductivityChart();
        renderStudyHoursChart();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
}

/* Pulls live theme colors so charts match light/dark mode instead of
   hard-coding a palette that only looks right in one of them. */
function chartThemeColors() {
    const styles = getComputedStyle(document.body);
    return {
        text: styles.getPropertyValue('--text-muted').trim() || '#6b7280',
        grid: styles.getPropertyValue('--border-soft').trim() || '#f3f4f6',
    };
}

/*  Attendance - present/absent rate per subject, from the same demo lecture records seeded on the Attendance page. */
function renderAttendanceChart() {
    const ctx = document.getElementById('attendanceChart');
    if (!ctx) return;
    const { text, grid } = chartThemeColors();

    const subjects = Object.keys(ATTENDANCE_SUBJECT_COLORS);
    // Mirrors the seed rows in attendance.html's log table.
    const attendanceRate = {
        'Object Oriented Programming': 80,
        'Data Structures & Algorithms': 100,
        'Database Systems': 75,
        'Inferential Statistics': 50,
        'Linear Algebra': 50
    };

    progressCharts.attendance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: subjects.map(s => s.length > 18 ? s.replace(' & ', ' &\n') : s),
            datasets: [{
                data: subjects.map(s => attendanceRate[s] ?? 0),
                backgroundColor: subjects.map(s => ATTENDANCE_SUBJECT_COLORS[s]),
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

/*  Weekly Productivity - mirrors the streak card's Mon–Sun status
   (done / today / upcoming) as a completed-tasks-per-day view.  */
function renderProductivityChart() {
    const ctx = document.getElementById('productivityChart');
    if (!ctx) return;
    const { text, grid } = chartThemeColors();

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    // Same shape as the streak-week cells above: Mon–Thu complete, Fri is
    // today (in progress), Sat/Sun haven't happened yet.
    const tasksDone = [5, 6, 4, 7, 3, 0, 0];
    const todayIndex = 4;

    progressCharts.productivity = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                data: tasksDone,
                backgroundColor: days.map((_, i) => i === todayIndex ? '#f59e0b' : (i > todayIndex ? grid : '#6d5dfc')),
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

/* ---- Study Hours - reads this week's real study sessions out of the
   Study Planner's saved state, so it reflects whatever the student has
   actually generated/edited there. Falls back to sample data if the
   planner hasn't been used yet. ---- */
function renderStudyHoursChart() {
    const ctx = document.getElementById('studyHoursChart');
    if (!ctx) return;
    const { text, grid } = chartThemeColors();
    const subEl = document.getElementById('studyHoursSub');

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    let hoursByDay = null;

    try {
        const raw = localStorage.getItem(PLANNER_STATE_KEY);
        if (raw) {
            const state = JSON.parse(raw);
            if (state && Array.isArray(state.studySessions) && state.studySessions.length) {
                hoursByDay = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
                state.studySessions.forEach(s => {
                    const mins = timeToMinutes(s.end) - timeToMinutes(s.start);
                    if (hoursByDay[s.day] != null && mins > 0) hoursByDay[s.day] += mins / 60;
                });
            }
        }
    } catch { /* corrupted/unavailable planner state - fall back to sample data below */ }

    const usingRealData = !!hoursByDay;
    if (!hoursByDay) hoursByDay = { Mon: 1.5, Tue: 2, Wed: 1, Thu: 2.5, Fri: 1.5, Sat: 3, Sun: 2 };
    if (subEl) subEl.textContent = usingRealData ? 'From your Study Planner' : 'Sample - build a Study Planner for real data';

    progressCharts.studyHours = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                data: days.map(d => Math.round(hoursByDay[d] * 10) / 10),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.15)',
                pointBackgroundColor: '#2563eb',
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

/* ==========================================================================
   Settings - account details (name / email / faculty / semester / avatar)
   ========================================================================== */

const PROFILE_NAME_KEY = 'levelup-profile-name';
const PROFILE_FACULTY_KEY = 'levelup-profile-faculty';
const PROFILE_EMAIL_KEY = 'levelup-profile-email';
const PROFILE_SEMESTER_KEY = 'levelup-profile-semester';
const PROFILE_AVATAR_KEY = 'levelup-profile-avatar';
const DEFAULT_PROFILE_NAME = 'Sunil';
const DEFAULT_PROFILE_FACULTY = 'Computer Science';
const DEFAULT_PROFILE_SEMESTER = 'Semester 3';

/* Swaps the dashboard's greeting based on the visitor's current local time. */
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

/* Applies the saved name/faculty/avatar to every navbar profile chip on every page. */
function applyProfileSettings() {
    const savedName = localStorage.getItem(PROFILE_NAME_KEY);
    const savedFaculty = localStorage.getItem(PROFILE_FACULTY_KEY);
    const savedAvatar = localStorage.getItem(PROFILE_AVATAR_KEY);

    if (savedName) {
        document.querySelectorAll('.profile h6').forEach(el => el.textContent = savedName);

        const greetingTitle = document.getElementById('greetingTitle');
        if (greetingTitle && greetingTitle.textContent.includes(DEFAULT_PROFILE_NAME)) {
            greetingTitle.textContent = greetingTitle.textContent.replace(DEFAULT_PROFILE_NAME, savedName);
        }
    }

    if (savedFaculty) {
        document.querySelectorAll('.profile small').forEach(el => el.textContent = savedFaculty);
    }

    if (savedAvatar) {
        document.querySelectorAll('.profile img').forEach(el => el.src = savedAvatar);
        const settingsAvatar = document.getElementById('settingsProfileAvatar');
        if (settingsAvatar) settingsAvatar.src = savedAvatar;
    }
}

function initSettingsPage() {
    const nameInput = document.getElementById('profileNameInput');
    const facultyInput = document.getElementById('profileFacultyInput');
    const emailInput = document.getElementById('profileEmailInput');
    const semesterInput = document.getElementById('profileSemesterInput');
    const newPasswordInput = document.getElementById('newPasswordInput');
    const confirmPasswordInput = document.getElementById('confirmPasswordInput');
    const saveBtn = document.getElementById('saveProfileBtn');
    if (!nameInput || !facultyInput || !saveBtn) return;

    nameInput.value = localStorage.getItem(PROFILE_NAME_KEY) || DEFAULT_PROFILE_NAME;
    facultyInput.value = localStorage.getItem(PROFILE_FACULTY_KEY) || DEFAULT_PROFILE_FACULTY;
    if (emailInput) emailInput.value = localStorage.getItem(PROFILE_EMAIL_KEY) || '';
    if (semesterInput) semesterInput.value = localStorage.getItem(PROFILE_SEMESTER_KEY) || DEFAULT_PROFILE_SEMESTER;

    saveBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        const faculty = facultyInput.value.trim();
        const email = emailInput ? emailInput.value.trim() : '';
        const semester = semesterInput ? semesterInput.value.trim() : '';
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
            if (newPassword.length < 8) {
                showToast('New password must be at least 8 characters.');
                return;
            }
            if (newPassword !== confirmPassword) {
                showToast('Passwords do not match.');
                return;
            }
        }

        localStorage.setItem(PROFILE_NAME_KEY, name);
        localStorage.setItem(PROFILE_FACULTY_KEY, faculty || DEFAULT_PROFILE_FACULTY);
        if (emailInput) localStorage.setItem(PROFILE_EMAIL_KEY, email);
        if (semesterInput) localStorage.setItem(PROFILE_SEMESTER_KEY, semester || DEFAULT_PROFILE_SEMESTER);

        applyProfileSettings();

        const previewName = document.getElementById('settingsProfileName');
        const previewFaculty = document.getElementById('settingsProfileFaculty');
        if (previewName) previewName.textContent = name;
        if (previewFaculty) previewFaculty.textContent = faculty || DEFAULT_PROFILE_FACULTY;

        if (wantsPasswordChange) {
            if (newPasswordInput) newPasswordInput.value = '';
            if (confirmPasswordInput) confirmPasswordInput.value = '';
            showToast('Account updated! password changed.', 'success');
        } else {
            showToast('Account updated.', 'success');
        }
    });

    initAvatarUpload();
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

        resizeImageToDataUrl(file, 200, (dataUrl) => {
            if (!dataUrl) {
                showToast('Could not read that image! try a different file.');
                return;
            }
            try {
                localStorage.setItem(PROFILE_AVATAR_KEY, dataUrl);
            } catch (err) {
                showToast('That image is too large to save.');
                return;
            }
            applyProfileSettings();
            showToast('Profile photo updated.', 'success');
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

