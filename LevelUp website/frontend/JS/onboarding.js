

document.addEventListener('DOMContentLoaded', () => {
    applySavedTheme();
    initOnboardingWizard();
});

/* Respect whatever theme the person already picked elsewhere in the app,
   so the wizard doesn't feel like a different product for a moment. */
function applySavedTheme() {
    if (localStorage.getItem('levelup-theme') === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
    }
}

/* Small self-contained toast, matching the app-wide look (CSS/style.css
   .toast-stack / .app-toast) without depending on the full script.js. */
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

function initOnboardingWizard() {
    const modalEl = document.getElementById('onboardingModal');
    if (!modalEl) return;

    const steps = Array.from(document.querySelectorAll('.onboarding-step'));
    const dots = Array.from(document.querySelectorAll('.onboarding-dot'));
    const errorBox = document.getElementById('onboardingError');

    const form = document.getElementById('onboardingForm');
    const semesterInput = document.getElementById('obSemester');
    const subjectsInput = document.getElementById('obSubjectsCount');
    const dailyGoalInput = document.getElementById('obDailyGoal');
    const dailyGoalValue = document.getElementById('obDailyGoalValue');

    const skipBtn = document.getElementById('obSkipBtn');
    const getStartedBtn = document.getElementById('obGetStartedBtn');
    const backBtn = document.getElementById('obBackBtn');
    const continueBtn = document.getElementById('obContinueBtn');
    const finishBtn = document.getElementById('obFinishBtn');

    let currentStep = 1;

    const modal = new bootstrap.Modal(modalEl, { backdrop: 'static', keyboard: false });
    modal.show();

    // Blur the page behind the wizard once Bootstrap has built the backdrop element.
    modalEl.addEventListener('shown.bs.modal', () => {
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) backdrop.classList.add('onboarding-blur-backdrop');
    });

    
    dailyGoalInput.addEventListener('input', () => {
        const hrs = dailyGoalInput.value;
        dailyGoalValue.textContent = `${hrs} hr${hrs === '1' ? '' : 's'}/day`;
    });

    function showError(message) {
        errorBox.textContent = message;
        errorBox.classList.add('show');
    }

    function clearError() {
        errorBox.classList.remove('show');
        errorBox.textContent = '';
    }

    function goToStep(stepNumber) {
        currentStep = stepNumber;
        steps.forEach(step => {
            step.classList.toggle('active', Number(step.dataset.step) === stepNumber);
        });
        dots.forEach(dot => {
            dot.classList.toggle('active', Number(dot.dataset.dot) === stepNumber);
            dot.classList.toggle('done', Number(dot.dataset.dot) < stepNumber);
        });
    }

    function setBusy(button, busy, busyLabel, idleLabel) {
        button.disabled = busy;
        button.textContent = busy ? busyLabel : idleLabel;
    }

    /* Reads the Academic Setup form into the shape OnboardingApi.complete() expects. */
    function collectPayload() {
        return {
            semester: semesterInput.value || null,
            subjectsCount: subjectsInput.value ? Number(subjectsInput.value) : null,
            dailyGoalHours: Number(dailyGoalInput.value),
            notifyAssignmentReminders: document.getElementById('obNotifyAssignments').checked,
            notifyExamReminders: document.getElementById('obNotifyExams').checked,
            notifyStudyReminders: document.getElementById('obNotifyStudy').checked
        };
    }

    /* Marks onboarding complete locally + on the server, then hands off to the dashboard. */
    async function finishOnboarding(payload, triggerButton, busyLabel, idleLabel) {
        setBusy(triggerButton, true, busyLabel, idleLabel);
        try {
            await OnboardingApi.complete(payload);
            Auth.markOnboardingComplete();
            try { localStorage.setItem('levelup-show-getting-started', 'true'); } catch { /* storage unavailable - checklist just won't appear */ }

            const params = new URLSearchParams(location.search);
            const next = params.get('next');
            location.href = (next && next.endsWith('.html')) ? next : 'dashboard.html';
        } catch (err) {
            setBusy(triggerButton, false, busyLabel, idleLabel);
            showToast(err.message || 'Could not save your setup. Please try again.');
        }
    }

    getStartedBtn.addEventListener('click', () => goToStep(2));
    backBtn.addEventListener('click', () => goToStep(1));

    continueBtn.addEventListener('click', () => {
        clearError();
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        const subjectsCount = Number(subjectsInput.value);
        if (!Number.isInteger(subjectsCount) || subjectsCount < 1 || subjectsCount > 30) {
            showError('Please enter a number of subjects between 1 and 30.');
            return;
        }
        goToStep(3);
    });

    skipBtn.addEventListener('click', () => {
        finishOnboarding({}, skipBtn, 'Skipping...', 'Skip Setup');
    });

    finishBtn.addEventListener('click', () => {
        finishOnboarding(collectPayload(), finishBtn, 'Setting up...', 'Go to Dashboard');
    });
}
