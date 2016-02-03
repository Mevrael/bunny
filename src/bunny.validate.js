'use strict'

export var Validate = {
    error_class: 'form-error-msg',
    formGroupSelector: '.form-group',
    formLabelSelector: 'span',
    lang: {
        required: "Field '%s' ir required!",
    },
    appendCallback: function(form_group, msg_container) {
        return form_group.parentNode.insertBefore(msg_container, form_group.nextSibling);
    },
    validators: {
        tel: function(input){
            if (input.getAttribute('type') === 'tel') {
                // input is tel, parse string to match tel regexp
                var Regex = /^[0-9\-\+\(\)\#\ \*]{6,20}$/;
                return Regex.test(input.value);
            }
            return true;
        },
        required: function(input){
            if (input.getAttribute('required') !== null) {
                // input is required, check value
                if (input.value === '') {
                    return false;
                } else {
                    return true;
                }
            }
            return true;
        }
    },
    validate: function(form_el, submit_handler) {

        var form = form_el;
        var self = this;
        var msg_containers = [];

        form.setAttribute('novalidate', '');

        // add event listener on form submit
        form.addEventListener("submit", function(e){
            e.preventDefault();
            var is_valid = true;
            var error_class = self.error_class;
            var label_selector = self.formLabelSelector;
            var is_focused = false;
            form.querySelectorAll(self.formGroupSelector).forEach(function(form_group){
                var form_input = form_group.querySelector('[name]');
                var input_name = form_input.getAttribute('name');
                var input_valid = true;
                for (var validator in self.validators) {
                    var valid = self.validators[validator](form_input);
                    if (!valid) {
                        // form_input is NOT valid
                        var msg = self.lang[validator].replace('%s', form_group.querySelector(label_selector).innerHTML);
                        // check if container for error msg exists when pressing submit button again
                        if (msg_containers[input_name] === undefined) {
                            // container for error msg doesn't exists, create new
                            var el = document.createElement('div');
                            el.setAttribute('class', error_class);
                            el.innerHTML = msg;
                            msg_containers[input_name] = self.appendCallback(form_group, el)
                        } else {
                            // container exists, update msg
                            msg_containers[input_name].innerHTML = msg;
                        }

                        if (!is_focused) {
                            form_input.focus();
                            is_focused = true;
                        }

                        is_valid = false;
                        input_valid = false;
                    }
                }
                // if input passed all validators, check if it still has msg container to remove it
                if (input_valid && msg_containers[input_name] !== undefined) {
                    msg_containers[input_name].parentNode.removeChild(msg_containers[input_name]);
                    msg_containers[input_name] = undefined;
                }
            });

            if (is_valid) {
                if (submit_handler === undefined) {
                    form.submit();
                } else {
                    submit_handler();
                }
            }
        }, false);
    }
};
