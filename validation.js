(() => {
    function initializeValidation() {
        const form = document.getElementById('feedbackForm');

        if (!form) {
            return;
        }

        const fields = {
            username: document.getElementById('username'),
            email: document.getElementById('email'),
            phone: document.getElementById('phone'),
            message: document.getElementById('message'),
            agreement: document.getElementById('agreement')
        };
        const errorElements = Object.fromEntries(
            Object.keys(fields).map((fieldName) => [
                fieldName,
                document.getElementById(`${fieldName}Error`)
            ])
        );
        const missingElements = [
            ...Object.entries(fields)
                .filter(([, field]) => !field)
                .map(([fieldName]) => `#${fieldName}`),
            ...Object.entries(errorElements)
                .filter(([, element]) => !element)
                .map(([fieldName]) => `#${fieldName}Error`)
        ];

        if (missingElements.length > 0) {
            console.error(`Feedback form is missing required elements: ${missingElements.join(', ')}`);
            return;
        }

        const messageCount = document.getElementById('messageCount');
        const successModal = document.getElementById('successModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const modalBackground = document.querySelectorAll(
            'body > .page > header, body > .page > aside, body > .page > main, body > .page > footer'
        );
        const touchedFields = new Set();
        let lastFocusedElement = null;
        let previousInertStates = [];

        function validateUsername() {
            const value = fields.username.value.trim();
            if (!value) return 'Введіть ім’я.';
            if (value.length < 2 || value.length > 80) {
                return 'Ім’я має містити від 2 до 80 символів.';
            }
            if (!/^[\p{L}]+(?:[ '\u2019-][\p{L}]+)*$/u.test(value)) {
                return 'Використовуйте лише літери, пробіли, дефіс або апостроф.';
            }
            return '';
        }

        function validateEmail() {
            const value = fields.email.value.trim();
            if (!value) return 'Введіть електронну пошту.';
            if (fields.email.validity.typeMismatch) {
                return 'Введіть коректну електронну адресу, наприклад name@example.com.';
            }
            return '';
        }

        function validatePhone() {
            const value = fields.phone.value.trim();
            if (!value) return '';
            if (!/^\+380[0-9]{9}$/.test(value)) {
                return 'Введіть номер у форматі +380XXXXXXXXX: рівно 9 цифр після +380, без пробілів.';
            }
            return '';
        }

        function validateMessage() {
            const value = fields.message.value.trim();
            if (!value) return 'Введіть повідомлення.';
            if (value.length < 10 || value.length > 2000) {
                return 'Повідомлення має містити від 10 до 2000 символів.';
            }
            return '';
        }

        function validateAgreement() {
            return fields.agreement.checked
                ? ''
                : 'Підтвердьте згоду на обробку персональних даних.';
        }

        const validators = {
            username: validateUsername,
            email: validateEmail,
            phone: validatePhone,
            message: validateMessage,
            agreement: validateAgreement
        };

        function updateFieldState(fieldName) {
            const field = fields[fieldName];
            const errorElement = errorElements[fieldName];
            const errorMessage = validators[fieldName]();
            const hasValue = field.type === 'checkbox'
                ? field.checked
                : Boolean(field.value.trim());

            field.classList.remove('border-red-600', 'border-emerald-600', 'bg-red-50', 'bg-emerald-50');
            field.setAttribute('aria-invalid', String(Boolean(errorMessage)));
            errorElement.textContent = errorMessage;
            errorElement.classList.toggle('hidden', !errorMessage);

            if (errorMessage) {
                field.classList.add('border-red-600');
                if (field.type !== 'checkbox') field.classList.add('bg-red-50');
            } else if (hasValue) {
                field.classList.add('border-emerald-600');
                if (field.type !== 'checkbox') field.classList.add('bg-emerald-50');
            }

            return !errorMessage;
        }

        Object.entries(fields).forEach(([fieldName, field]) => {
            const validateAfterInteraction = () => {
                touchedFields.add(fieldName);
                updateFieldState(fieldName);
            };

            if (field.type === 'checkbox') {
                field.addEventListener('change', validateAfterInteraction);
                return;
            }

            field.addEventListener('blur', validateAfterInteraction);
            field.addEventListener('input', () => {
                if (touchedFields.has(fieldName)) {
                    updateFieldState(fieldName);
                }
                if (fieldName === 'message' && messageCount) {
                    messageCount.textContent = String(field.value.length);
                }
            });
        });

        function openSuccessModal() {
            if (!successModal || !closeModalBtn) {
                console.error('Cannot open feedback confirmation: modal elements are missing.');
                return;
            }

            lastFocusedElement = document.activeElement;
            previousInertStates = Array.from(modalBackground, (element) => element.inert);
            modalBackground.forEach((element) => {
                element.inert = true;
            });
            successModal.classList.remove('hidden');
            successModal.classList.add('flex');
            closeModalBtn.focus();
        }

        function closeSuccessModal() {
            if (!successModal || !closeModalBtn || successModal.classList.contains('hidden')) {
                return;
            }

            successModal.classList.add('hidden');
            successModal.classList.remove('flex');
            modalBackground.forEach((element, index) => {
                element.inert = previousInertStates[index];
            });
            lastFocusedElement?.focus();
        }

        if (closeModalBtn && successModal) {
            closeModalBtn.addEventListener('click', closeSuccessModal);
            successModal.addEventListener('click', (event) => {
                if (event.target === successModal) closeSuccessModal();
            });
            successModal.addEventListener('keydown', (event) => {
                if (event.key === 'Escape') {
                    closeSuccessModal();
                } else if (event.key === 'Tab') {
                    event.preventDefault();
                    closeModalBtn.focus();
                }
            });
        }

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const fieldNames = Object.keys(fields);
            fieldNames.forEach((fieldName) => touchedFields.add(fieldName));
            const isFormValid = fieldNames
                .map(updateFieldState)
                .every(Boolean);

            if (!isFormValid) {
                const firstInvalidField = fieldNames
                    .map((fieldName) => fields[fieldName])
                    .find((field) => field.getAttribute('aria-invalid') === 'true');
                firstInvalidField?.focus();
                return;
            }

            openSuccessModal();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeValidation, { once: true });
    } else {
        initializeValidation();
    }
})();
