document.addEventListener('DOMContentLoaded', () => {
    initHomeTheme();
    initMobileNav();
    initScrollReveal();
    initContactForm();
});

function initHomeTheme() {
    const toggle = document.getElementById('homeThemeToggle');
    if (!toggle) return;
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

function initMobileNav() {
    const burger = document.getElementById('homeBurger');
    const links = document.getElementById('homeNavLinks');
    if (!burger || !links) return;

    burger.addEventListener('click', () => {
        links.classList.toggle('lp-open');
        burger.querySelector('i').className = links.classList.contains('lp-open')
            ? 'bi bi-x-lg'
            : 'bi bi-list';
    });

    links.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
        links.classList.remove('lp-open');
        burger.querySelector('i').className = 'bi bi-list';
    }));
}

function initScrollReveal() {
    const items = document.querySelectorAll('.lp-reveal');
    if (!items.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('lp-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    items.forEach(item => observer.observe(item));
}

function initContactForm() {
    const form = document.getElementById('homeContactForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const original = btn.innerHTML;
        btn.innerHTML = '<i class="bi bi-check2"></i> Message sent';
        btn.disabled = true;
        form.reset();
        setTimeout(() => {
            btn.innerHTML = original;
            btn.disabled = false;
        }, 2600);
    });
}
