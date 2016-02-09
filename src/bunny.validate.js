
export var Validate = {
    errorClass: 'has-danger', // class to be applied on form-group
    formGroupSelector: '.form-group', // main container selector which includes label, input, help text etc.
    formLabelSelector: '.form-control-label', // label to pick innerHTML from to insert field name into error message
    containerTag: 'small', // tag name of error message container
    containerClass: 'text-help', // class to add when creating error message container
    lang: { // error messages, keys must be same as validator names
        required: "Field '%s' ir required!",
        tel: "Field '%s' is not a valid telephone number!"
    },
    appendCallback: function(form_group, msg_container) { // where to insert error message
        return form_group.appendChild(msg_container);
    },
    toggleErrorClass: function(form_group) { // where to add/remove error class
        if (form_group.classList.contains(this.errorClass)) {
            form_group.classList.remove(this.errorClass);
        } else {
            form_group.classList.add(this.errorClass);
        }
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
    validate: function(form_el, events = {}, submit_handler) {

        var form = form_el;
        var self = this;
        var msg_containers = [];

        form.setAttribute('novalidate', '');

        // add event listener on form submit
        form.addEventListener("submit", function(e){
            e.preventDefault();
            var is_valid = true;
            var label_selector = self.formLabelSelector;
            var is_focused = false;
            var container_tag = self.containerTag;
            var container_class = self.containerClass;
            form.querySelectorAll(self.formGroupSelector).forEach(function(form_group){
                var form_input = form_group.querySelector('[name]');
                var input_name = form_input.getAttribute('name');
                var input_valid = true;
                var label = form_group.querySelector(label_selector);
                for (var validator in self.validators) {
                    var valid = self.validators[validator](form_input);
                    if (!valid) {
                        // form_input is NOT valid

                        var msg = self.lang[validator].replace('%s', label.innerHTML);
                        // check if container for error msg exists when pressing submit button again
                        if (msg_containers[input_name] === undefined) {
                            // container for error msg doesn't exists, create new
                            var el = document.createElement(container_tag);
                            el.setAttribute('class', container_class);
                            self.toggleErrorClass(form_group);
                            el.innerHTML = msg;
                            msg_containers[input_name] = self.appendCallback(form_group, el)
                        } else {
                            // container exists, update msg
                            msg_containers[input_name].innerHTML = msg;
                        }

                        if (!is_focused) {
                            if (events['on_focus'] !== undefined) {
                                events['on_focus'](form_input, form_group);
                            } else {
                                form_input.focus();
                            }
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
                    self.toggleErrorClass(form_group);
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
