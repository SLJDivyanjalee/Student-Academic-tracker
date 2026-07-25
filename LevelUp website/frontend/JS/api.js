
const RENDER_BACKEND_URL = 'https://REPLACE-WITH-YOUR-RENDER-URL.onrender.com/api';

const API_BASE = location.hostname.endsWith('github.io')
    ? RENDER_BACKEND_URL
    : `${location.protocol}//${location.host}/api`;

const AUTH_TOKEN_KEY = 'levelup-auth-token';
const AUTH_USER_KEY = 'levelup-auth-user';

const Auth = {
    getToken() {
        return sessionStorage.getItem(AUTH_TOKEN_KEY);
    },
    getUser() {
        try { return JSON.parse(sessionStorage.getItem(AUTH_USER_KEY)); } catch { return null; }
    },
    isLoggedIn() {
        return !!this.getToken();
    },
    setSession(token, user) {
        sessionStorage.setItem(AUTH_TOKEN_KEY, token);
        sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    },
    clearSession() {
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        sessionStorage.removeItem(AUTH_USER_KEY);
    },
    /** Call at the top of every protected page. Redirects to login.html if not logged in. */
    requireAuth() {
        if (!this.isLoggedIn()) {
            const next = encodeURIComponent(location.pathname.split('/').pop());
            location.href = `login.html?next=${next}`;
        }
    },
    
    gateOnboarding() {
        const user = this.getUser();
        if (user && user.onboardingComplete === false) {
            const next = encodeURIComponent(location.pathname.split('/').pop());
            location.href = `onboarding.html?next=${next}`;
        }
    },
    /* Updates just the cached onboardingComplete flag once the wizard finishes. */
    markOnboardingComplete() {
        const user = this.getUser();
        if (user) {
            user.onboardingComplete = true;
            sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        }
    },
    async logout() {
        try {
            await apiRequest('POST', '/auth/logout');
        } catch { /* best-effort - clear locally regardless */ }
        this.clearSession();
        location.href = 'login.html';
    }
};


async function apiRequest(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let response;
    try {
        response = await fetch(API_BASE + path, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined
        });
    } catch (networkErr) {
        throw new Error('Could not reach the LevelUp server. Is the backend running on port 8080?');
    }

    if (response.status === 401) {
        Auth.clearSession();
        const next = encodeURIComponent(location.pathname.split('/').pop());
        location.href = `login.html?next=${next}`;
        return new Promise(() => {}); // navigation is happening; never resolve
    }

    let data = null;
    const text = await response.text();
    if (text) {
        try { data = JSON.parse(text); } catch { data = null; }
    }

    if (!response.ok) {
        const message = (data && (data.error || (data.details && data.details.join(', ')))) || `Request failed (${response.status})`;
        const err = new Error(message);
        err.status = response.status;
        err.data = data;
        throw err;
    }
    return data;
}

/* Auth endpoints  */
const AuthApi = {
    register(name, email, password) {
        return apiRequest('POST', '/auth/register', { name, email, password });
    },
    login(email, password) {
        return apiRequest('POST', '/auth/login', { email, password });
    },
    me() {
        return apiRequest('GET', '/auth/me');
    },
    forgotPassword(email) {
        return apiRequest('POST', '/auth/forgot-password', { email });
    },
    resetPassword(token, newPassword) {
        return apiRequest('POST', '/auth/reset-password', { token, newPassword });
    }
};

/* ----Onboarding (first-time setup wizard)----  */
const OnboardingApi = {
    status() { return apiRequest('GET', '/onboarding/status'); },
    /** payload: { semester, subjectsCount, dailyGoalHours, notifyAssignmentReminders, notifyExamReminders, notifyStudyReminders } */
    complete(payload) { return apiRequest('POST', '/onboarding/complete', payload || {}); }
};

/* ---- Subjects ---- */
const SubjectsApi = {
    list() { return apiRequest('GET', '/subjects'); },
    create(subject) { return apiRequest('POST', '/subjects', subject); },
    update(id, subject) { return apiRequest('PUT', `/subjects/${id}`, subject); },
    remove(id) { return apiRequest('DELETE', `/subjects/${id}`); },
    
    async findOrCreateByName(name) {
        const trimmed = (name || '').trim();
        if (!trimmed) return null;
        const subjects = await SubjectsApi.list();
        const existing = subjects.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
        if (existing) return existing.id;
        const created = await SubjectsApi.create({ name: trimmed });
        return created.id;
    }
};

/* ---- Tasks ---- */
const TasksApi = {
    list(status) { return apiRequest('GET', status ? `/tasks?status=${status}` : '/tasks'); },
    create(task) { return apiRequest('POST', '/tasks', task); },
    update(id, task) { return apiRequest('PUT', `/tasks/${id}`, task); },
    remove(id) { return apiRequest('DELETE', `/tasks/${id}`); }
};

/* ---- Assignments & Exams ---- */
const AssignmentsExamsApi = {
    list(itemType) { return apiRequest('GET', itemType ? `/assignments-exams?itemType=${itemType}` : '/assignments-exams'); },
    create(item) { return apiRequest('POST', '/assignments-exams', item); },
    update(id, item) { return apiRequest('PUT', `/assignments-exams/${id}`, item); },
    remove(id) { return apiRequest('DELETE', `/assignments-exams/${id}`); }
};

/* ---- Attendance ---- */
const AttendanceApi = {
    list(subjectId) { return apiRequest('GET', subjectId ? `/attendance?subjectId=${subjectId}` : '/attendance'); },
    summary() { return apiRequest('GET', '/attendance/summary'); },
    create(record) { return apiRequest('POST', '/attendance', record); },
    update(id, record) { return apiRequest('PUT', `/attendance/${id}`, record); },
    remove(id) { return apiRequest('DELETE', `/attendance/${id}`); }
};

/* ---- Timetable ---- */
const TimetableApi = {
    list() { return apiRequest('GET', '/timetable'); },
    create(lecture) { return apiRequest('POST', '/timetable', lecture); },
    update(id, lecture) { return apiRequest('PUT', `/timetable/${id}`, lecture); },
    remove(id) { return apiRequest('DELETE', `/timetable/${id}`); }
};

/* ---- Study Planner ---- */
const PlannerApi = {
    getSettings() { return apiRequest('GET', '/planner/settings'); },
    saveSettings(settings) { return apiRequest('PUT', '/planner/settings', settings); },
    listSessions(from, to) {
        const q = (from && to) ? `?from=${from}&to=${to}` : '';
        return apiRequest('GET', `/planner/sessions${q}`);
    },
    generate(from, to) {
        const q = (from && to) ? `?from=${from}&to=${to}` : '';
        return apiRequest('POST', `/planner/generate${q}`);
    },
    createSession(session) { return apiRequest('POST', '/planner/sessions', session); },
    updateSession(id, session) { return apiRequest('PUT', `/planner/sessions/${id}`, session); },
    removeSession(id) { return apiRequest('DELETE', `/planner/sessions/${id}`); }
};

/* ---- Calendar (aggregated feed) ---- */
const CalendarApi = {
    items(from, to) {
        const q = (from && to) ? `?from=${from}&to=${to}` : '';
        return apiRequest('GET', `/calendar${q}`);
    },
    dueSoon(days) { return apiRequest('GET', `/calendar/due-soon?days=${days || 3}`); }
};

/* ---- Progress (productivity streak) ---- */
const ProgressApi = {
    streak() { return apiRequest('GET', '/progress/streak'); }
};

/* ---- Profile ---- */
const ProfileApi = {
    get() { return apiRequest('GET', '/profile'); },
    save(profile) { return apiRequest('PUT', '/profile', profile); },
    changePassword(currentPassword, newPassword) {
        return apiRequest('POST', '/profile/password', { currentPassword, newPassword });
    },
    resetData() { return apiRequest('POST', '/profile/reset'); },
    deleteAccount(password) { return apiRequest('DELETE', '/profile', { password }); }
};

/* ---- AI help assistant ---- */
const AiHelpApi = {
    /** page is the current filename (e.g. "tasks.html"), used as light context. */
    ask(question, page) { return apiRequest('POST', '/ai/ask', { question, page }); }
};
