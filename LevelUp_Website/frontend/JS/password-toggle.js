
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('input[type="password"]').forEach(input => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pw-toggle-btn';
        btn.setAttribute('aria-label', 'Show password');
        btn.innerHTML = '<i class="bi bi-eye"></i>';

        const existingWrapper = input.closest('.lp-input-group');
        if (existingWrapper) {
            existingWrapper.classList.add('has-pw-toggle');
            existingWrapper.appendChild(btn);
        } else {
            const wrapper = document.createElement('div');
            wrapper.className = 'pw-field-wrap';
            input.parentNode.insertBefore(wrapper, input);

            const lockIcon = document.createElement('i');
            lockIcon.className = 'bi bi-lock pw-lock-icon';
            wrapper.appendChild(lockIcon);

            wrapper.appendChild(input);
            wrapper.appendChild(btn);
        }

        btn.addEventListener('click', () => {
            const isHidden = input.type === 'password';
            input.type = isHidden ? 'text' : 'password';
            btn.innerHTML = isHidden ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
            btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
        });
    });
});
