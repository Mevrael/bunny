
//  /!\ DEPRECATED AND WILL BE REMOVED IN 1.0 - USE src/Validation INSTEAD
//  Examples available on bunnyjs.com

export var Validate = {

    /* public properties */

    errorClass: 'has-danger', // class to be applied on form-group
    formGroupClass: 'form-group', // main container selector which includes label, input, help text etc.
    formLabelClass: 'form-control-label', // label to pick innerHTML from to insert field name into error message
    errorContainerTag: 'small', // tag name of error message container
    errorContainerClass: 'text-help', // class to add when creating error message container
    lang: { // error messages, keys must be same as validator names
        required: "Field '%s' ir required!",
        tel: "Field '%s' is not a valid telephone number!",
        email: "Field '%s' should be a valid e-mail address!",
        //image: "Uploaded file '%s' should be an image (jpeg, png, bmp, gif, or svg)",
        fileMaxSize: 'Max file size must be < %maxsizeMB, uploaded file with %filesizeMB',
        maxlength: "Input '%s' length is too long, must be < '%maxlength'",
        minlength: "Input '%s' length is too short, must be > '%minlength'"
    },

    /* error container methods */

    insertErrorContainer: function(form_group_el, error_container) { // where to insert error message container
        return form_group_el.appendChild(error_container);
    },

    toggleErrorClass: function(form_group_el) { // where to add/remove error class
        if (form_group_el.classList.contains(this.errorClass)) {
            form_group_el.classList.remove(this.errorClass);
        } else {
            form_group_el.classList.add(this.errorClass);
        }
    },

    createErrorContainer() {
        var el = document.createElement(this.errorContainerTag);
        el.setAttribute('class', this.errorContainerClass);
        return el;
    },

    getErrorContainer(form_group_el) {
        return form_group_el.querySelector('.' + this.errorContainerClass);
    },

    /**
     * Removes error container and class if exists
     * @param form_group_el
     */
    removeErrorContainer(form_group_el) {
        var el = this.getErrorContainer(form_group_el);
        if (el !== null) {
            el.parentNode.removeChild(el);
            this.toggleErrorClass(form_group_el);
        }
    },

    /**
     * Creates and includes into DOM error container or updates error message
     * @param form_group_el_or_id
     * @param msg
     */
    setErrorMessage(form_group_el_or_id, msg) {
        if (typeof form_group_el_or_id === 'string') {
            var form_group = document.getElementById(form_group_el_or_id);
        } else {
            var form_group = form_group_el_or_id;
        }

        var error_container = this.getErrorContainer(form_group);

        if (error_container === null) {
            // container for error msg doesn't exists, create new
            var el = this.createErrorContainer();
            this.toggleErrorClass(form_group);
            el.innerHTML = msg;
            this.insertErrorContainer(form_group, el)
        } else {
            // container exists, update msg
            error_container.innerHTML = msg;
        }
    },

    /* validators */

    validators: {

        maxlength: function(input) {
            if (input.getAttribute('maxlength') !== null && input.value.length > input.getAttribute('maxlength')) {
                return {maxlength: input.getAttribute('maxlength')};
            }
            return true;
        },

        minlength: function(input) {
            if (input.getAttribute('minlength') !== null && input.value.length < input.getAttribute('minlength')) {
                return {minlength: input.getAttribute('minlength')};
            }
            return true;
        },

        // TODO: add mindimensions, maxdimensions validators
        // TODO  (form): add _processor to file input to allow custom file processing layer, for example, to resize big images

        // TODO: remake Validate component to use Promise
        // TODO: Use BunnyFile.getSignature() to parse real MIME-type
        /*image: function(input) {
            if (input.getAttribute('type') === 'file' && input.getAttribute('accept') === 'image/!*') {
                if (input.files.length !== 0) {
                    var mime_types = [
                        'image/jpeg',
                        'image/png',
                        'image/bmp',
                        'image/gif',
                        'image/svg+xml'
                    ];
                    if (mime_types.indexOf(input.files[0].type) > -1) {
                        return true;
                    }
                    return false;
                }
                return true;
            }
            return true;
        },*/

        fileMaxSize: function(input) {
            if (input.getAttribute('type') === 'file' && input.hasAttribute('maxfilesize')) {
                var max_file_size = parseInt(input.getAttribute('maxfilesize')); // in MB
                if (input.files.length !== 0) {
                    var file_size = Math.round(input.files[0].size / 1000000).toFixed(2); // in MB
                    if (file_size <= max_file_size) {
                        return true;
                    }
                    return {maxsize: max_file_size, filesize: file_size};
                }
                return true;
            }
            return true;
        },

        email: function(input) {
            if (input.value.length > 0 && input.getAttribute('type') === 'email') {
                // input is email, parse string to match email regexp
                var Regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
                return Regex.test(input.value);
            }
            return true;
        },

        tel: function(input){
            if (input.value.length > 0 && input.getAttribute('type') === 'tel') {
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

    /**
     * Validate form
     * @param form_el
     * @param events
     * @param submit_handler
     */
    validate: function(form_el, events = {}, submit_handler) {

        var form = form_el;
        var self = this;

        form.setAttribute('novalidate', '');

        // add event listener on form submit
        form.addEventListener("submit", function(e){
            e.preventDefault();
            var is_valid = true;
            var is_focused = false;
            form.querySelectorAll('.' + self.formGroupClass).forEach(function(form_group){

                if (self.isFormGroupForInput(form_group)) {
                    var res = self.checkInput(form_group);

                    if (res.valid === false) {
                        is_valid = false;
                        self.setErrorMessage(form_group, res.msg);

                        if (!is_focused) {
                            if (events['on_focus'] !== undefined) {
                                events['on_focus'](res.inputElements.input, form_group);
                            } else {
                                self.focus(res.inputElements.input);
                            }
                            is_focused = true;
                        }

                    } else {
                        self.removeErrorContainer(form_group);
                    }
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
    },

    /**
     * Return form group element, input element and label element
     * @param form_group_el_or_id
     * @returns {object} 3 keys: formGroup, input, label
     */
    getInputElementsByFormGroup(form_group_el_or_id) {
        if (typeof form_group_el_or_id === 'string') {
            var form_group = document.getElementById(form_group_el_or_id);
        } else {
            var form_group = form_group_el_or_id;
        }
        var input = form_group.querySelector('[name]');
        var label = form_group.getElementsByTagName('label')[0];
        if (label === undefined) {
            label = null;
        }
        return {
            formGroup: form_group,
            input: input,
            label: label
        }
    },

    isFormGroupForInput(form_group_el_or_id) {
        var input_elements = this.getInputElementsByFormGroup(form_group_el_or_id);
        if (input_elements.input === null) {
            return false;
        }
        return true;
    },

    _checkInputAgainstValidator(input, label, validator) {
        if (this.validators[validator] === undefined) {
            console.error('Bunny Validate error: validator "' + validator + '" not found.');
            return {valid: false, msg: 'ERROR: Validator not found'};
        }
        var validator_result = this.validators[validator](input);
        var valid = false;
        var validator_data = {};
        var input_valid = true;
        var msg = '';

        if (typeof validator_result !== 'boolean') {
            for (var k in validator_result) {
                valid = false;
                validator_data[k] = validator_result[k];
            }
        } else {
            valid = validator_result;
        }

        if (!valid) {
            // form_input is NOT valid
            var input_title = '';
            if (label === null) {
                var placeholder = input.getAttribute('placeholder');
                if (placeholder !== null) {
                    input_title = placeholder;
                }
            } else {
                input_title = label.innerHTML;
            }

            msg = this.lang[validator].replace('%s', input_title);
            for (var d in validator_data) {
                msg = msg.replace('%'+d, validator_data[d]);
            }

            input_valid = false;
        }

        return {
            valid: input_valid,
            msg: msg
        };
    },

    checkInputAgainstValidator(form_group_el_or_id, validator) {
        var input_elements = this.getInputElementsByFormGroup(form_group_el_or_id);
        return this._checkInputAgainstValidator(input_elements.input, input_elements.label, validator);
    },

    /**
     * Check if input is valid or not, return object containing two keys: valid and msg
     * If input is invalid valid key will be false and msg will contain error message
     * If input is valid, valid key will be true and msg empty string
     * @param {string} form_group_el_or_id
     * @returns {object} valid: boolean, msg: string
     */
    checkInput(form_group_el_or_id) {
        if (typeof form_group_el_or_id === 'string') {
            var form_group = document.getElementById(form_group_el_or_id);
        } else {
            var form_group = form_group_el_or_id;
        }
        var input_elements = this.getInputElementsByFormGroup(form_group);
        var input_valid = true;
        var msg = '';
        for (var validator in this.validators) {
            var res = this._checkInputAgainstValidator(input_elements.input, input_elements.label, validator);
            if (res.valid === false) {
                input_valid = false;
                msg = res.msg;
                break;
            }
        }
        return {
            valid: input_valid,
            msg: msg,
            inputElements: input_elements
        };
    },

    validateSection(section_el, events = {}) {
        var self = this;
        var section_valid = true;
        var is_focused = false;

        section_el.querySelectorAll('.' + this.formGroupClass).forEach(function(form_group) {
            if (self.isFormGroupForInput(form_group)) {
                var res = self.checkInput(form_group);

                if (res.valid === false) {
                    section_valid = false;
                    self.setErrorMessage(form_group, res.msg);

                    if (!is_focused) {
                        if (events['on_focus'] !== undefined) {
                            events['on_focus'](res.inputElements.input, form_group);
                        } else {
                            self.focus(res.inputElements.input);
                        }
                        is_focused = true;
                    }

                } else {
                    self.removeErrorContainer(form_group);
                }
            }
        });

        return section_valid;
    },

    focus(input) {
        input.focus();
        input.scrollIntoView(false);
    }
};
