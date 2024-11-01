(function ($) {

    $.fn.bsPassword = function (options) {
        // support multiple elements
        if (this.length > 1) {
            this.each(function () {
                $(this).bsPassword(options);
            });
            return this;
        }

        let settings = $.extend({}, {
            conditions: {
                minLength: 10,
                minLengthTitle: 'Password must be at least %value% characters long',
                minLowercase: 1,
                minLowercaseTitle: 'At least %value% lowercase letters',
                minUppercase: 1,
                minUppercaseTitle: 'At least %value% uppercase letters',
                minNumbers: 1,
                minNumbersTitle: 'At least %value% numbers',
                minSpecialChars: 1,
                specialChars: '\\$@#&!()=\\-.%',
                minSpecialCharsTitle: 'At least %value% special characters ($@#&!()=-.%)'
            },
            activationButton: null,
            passwordRepeat: null,
            classes: {
                toggleButton: 'btn btn-outline-secondary rounded-end',
            },
            icons: {
                show: 'bi bi-eye',
                hide: 'bi bi-eye-slash',
                success: 'bi bi-check-lg text-success me-1',
                error: 'bi bi-x-lg text-danger me-1'
            },
        }, options || {});


        // Funktion zur Ersetzung von Platzhaltern im Titel
        function generateTitle(template, value) {
            return template.replace('%value%', value);
        }

        const required = []; // Initialisiere das Array für die Anforderungen


        if (settings.conditions.minLowercase) {
            required.push({
                title: generateTitle(settings.conditions.minLowercaseTitle, settings.conditions.minLowercase),
                match: () => {
                    return new RegExp(`([a-zäöüß].*){${settings.conditions.minLowercase},}`);
                },
                active: true,
                valid: false
            });
        }

        if (settings.conditions.minUppercase) {
            required.push({
                title: generateTitle(settings.conditions.minUppercaseTitle, settings.conditions.minUppercase),
                match: () => {
                    return new RegExp(`([A-ZÄÖÜ].*){${settings.conditions.minUppercase},}`);
                },
                active: true,
                valid: false
            });
        }
        if (settings.conditions.minNumbers) {
            required.push({
                title: generateTitle(settings.conditions.minNumbersTitle, settings.conditions.minNumbers),
                match: () => {
                    return new RegExp(`([0-9].*){${settings.conditions.minNumbers},}`);
                },
                active: true,
                valid: false
            });
        }
        if (settings.conditions.minSpecialChars) {
            required.push({
                title: generateTitle(settings.conditions.minSpecialCharsTitle, settings.conditions.minSpecialChars),
                match: () => {
                    return new RegExp(`([${settings.conditions.specialChars}].*){${settings.conditions.minSpecialChars},}`);
                },
                active: true,
                valid: false
            });
        }
        if (settings.conditions.minLength) {
            required.push({
                title: generateTitle(settings.conditions.minLengthTitle, settings.conditions.minLength),
                match: () => {
                    let ex = `^.{${settings.conditions.minLength},}$`;
                    return new RegExp(ex, 'i');
                },
                active: true,
                valid: false
            });
        }

        const wrapperClass = 'js-wc-password-wrapper';
        const input = $(this);
        let bar = null,
            content = null,
            toggleButton = null;

        function buildGUI() {
            const isFormFloating = input.closest('.form-floating').length;

            if (!isFormFloating) {
                if (!input.closest('.input-group').length) {
                    input.wrap('<div class="input-group"></div>');
                }
            } else {
                input.closest('.form-floating').wrap('<div class="input-group"></div>');
            }
            const label = $(`label[for="${input.attr('id')}"]`);

            if (label.length) {
                label.insertAfter(input);
            }

            const inputGroup = input.closest('.input-group');


            const wrapper2 = $('<div>', {class: wrapperClass});
            inputGroup.wrap(wrapper2);

            toggleButton = $('<button>', {
                class: settings.classes.toggleButton,
                type: 'button',
                html: `<i class="${settings.icons.show}"></i>`
            }).appendTo(inputGroup)

            let wrapper = input.closest('.input-group');

            content = $('<div>', {
                class: 'collapse'
            }).appendTo(wrapper)

            let insertCollapseAfter = inputGroup;


            const collapse = $('<div>', {
                class: 'collapse mt-1',
                html: `<div class="card">
                            <div class="px-3 pt-3">
                            <div class="progress" style="height: 4px" role="progressbar"  aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
                              <div class="progress-bar bg-success" style="width: 0%"></div>
                            </div>
                            </div>
                            <div class="card-body"></div>
                    </div>`
            }).insertAfter(insertCollapseAfter)


            if (settings.activationButton) {
                $(settings.activationButton).prop('disabled', true);
            }
        }

        function init() {
            if (!input.data('jsWcPasswordInit')) {
                buildGUI();
                events();
                input.data('jsWcPasswordInit', true);
            }

            checkPassword();
            return input;
        }

        function events() {
            const wrapper = input.closest('.' + wrapperClass);
            const collapse = wrapper.find('.collapse');
            toggleButton
                .on('click', function (e) {
                    let btn = $(e.currentTarget),
                        icon = btn.find('i');

                    icon.toggleClass('bi-eye bi-eye-slash');

                    let type = input.prop('type') === 'password' ? 'text' : 'password';
                    input.prop('type', type);

                    if (input.prop('type') === 'text') {
                        setTimeout(function () {
                            btn.trigger('click');
                        }, 3000)
                    }

                });
            input
                .on('keyup change input', function(e) {
                    // Entferne alle Leerzeichen
                    const inputElement = $(e.currentTarget);
                    const cleaned = inputElement.val().replace(/\s/g, '');
                    inputElement.val(cleaned);
                    checkPassword();
                })
                .on('focusout blur', function () {
                    if (isValueEmpty(input.val())) {
                        input.removeClass('is-invalid');
                    }
                    collapse.collapse('hide');
                });

            if (settings.passwordRepeat !== null) {
                $(settings.passwordRepeat)
                    .on('keyup input change', checkRepeat)
            }
        }

        function getContent() {
            let html = [];
            let iconSuccess = '<i class="bi bi-check-lg text-success me-2"></i>';
            let iconError = '<i class="bi bi-x-lg text-danger me-2"></i>';
            required.forEach(obj => {
                if(!obj.valid){


                let icon = obj.valid ? iconSuccess : iconError;
                let title = '<span class="text-muted">' + obj.title + '</span>';
                html.push('<div class="list-group-item p-1 d-flex flex-nowrap align-items-center">' + icon + ' ' + title + '</div>');
                }
            });
            return '<div class="list-group list-group-flush">' + html.join('') + '</div>';

        }

        function isValueEmpty(value) {
            if (value === null || value === undefined) {
                return true; // Null or undefined
            }
            if (Array.isArray(value)) {
                return value.length === 0; // Empty array
            }
            if (typeof value === 'string') {
                return value.trim().length === 0; // Empty string (including only spaces)
            }
            return false; // All other values are considered non-empty (including numbers)
        }

        function checkRepeat() {
            if (null !== settings.passwordRepeat) {
                let el = $(settings.passwordRepeat);
                el.removeClass('is-invalid is-valid');
                if (!el.val() || el.val() === "") {
                    return;
                }

                if (el.val() !== input.val()) {
                    el.addClass('is-invalid');
                } else {
                    el.addClass('is-valid');
                }
            }
        }

        function toggleCollapse() {
            const wrapper = input.closest('.' + wrapperClass);
            const collapse = wrapper.find('.collapse');
            collapse.find('.card-body').html(getContent);
            const isEmpty = isValueEmpty(input.val());

            if (input.hasClass('is-invalid') && !isEmpty) {
                collapse.collapse('show');
            } else {
                collapse.collapse('hide');
            }
        }

        function checkPassword() {
            const isEmpty = isValueEmpty(input.val());
            input.removeClass('is-valid');
            if (isEmpty) {
                return false;
            }

            const wrapper = input.closest('.' + wrapperClass);
            const collapse = wrapper.find('.collapse');
            const bar = collapse.find('.progress-bar');
            let password = input.val();

            // reset check
            required.forEach(obj => {
                obj.valid = false;
            });

            let strength = 0;
            let count = 0;
            let valid = 0;
            required.forEach(obj => {
                if (obj.active) {
                    count++;
                    if (password.match(obj.match())) {
                        valid++;
                        strength++;
                        obj.valid = true;
                    }
                }

            });

            const percent = (!valid ? 0 : (valid / count)) * 100;
            const isValid = percent >= 95;
            let progressClass = '';
            switch (strength) {
                case 0:
                    progressClass = 'danger';
                    break;
                case 1:
                    progressClass = 'danger';
                    break;
                case 2:
                    progressClass = 'warning';
                    break;
                case 3:
                    progressClass = 'warning';
                    break;
                case 4:
                    progressClass = 'success';
                    break;
                case 5:
                    progressClass = 'success';
                    break;
            }

            if (!isValid) {
                input.addClass('is-invalid');
            } else {
                input.addClass('is-valid')
                input.removeClass('is-invalid');

            }


            if (null !== settings.activationButton) {
                $(settings.activationButton).prop('disabled', !isValid);
            }


            bar.removeClass('bg-danger bg-warning bg-success').addClass('bg-' + progressClass);
            bar.animate({
                width: percent + '%'
            }, 1);

            toggleCollapse();
            checkRepeat();
        }

        return init();
    }

})(jQuery);
