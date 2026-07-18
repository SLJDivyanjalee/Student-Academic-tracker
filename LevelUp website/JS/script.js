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
   Page search bars
   ========================================================================== */

function initPageSearch() {
    wireListFilter('taskSearch', '#tasksTable tbody tr');
    wireListFilter('attendanceSearch', '#attendanceLogTable tbody tr');
    initAssignmentsExamsTabs();
    initPageSearchPopup();
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
