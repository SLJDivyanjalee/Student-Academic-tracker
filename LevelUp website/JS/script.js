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