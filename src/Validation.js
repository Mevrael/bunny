
import {BunnyFile} from "./file/file";
import {BunnyImage} from "./file/image";
import {Ajax} from "./bunny.ajax";
import {BunnyElement} from "./BunnyElement";

export const ValidationConfig = {

    // div/node class name selector which contains one label, one input, one help text etc.
    classInputGroup: 'form-group',
    // class to be applied on input group node if it has invalid input
    classInputGroupError: 'has-danger',

    // label to pick textContent from to insert field name into error message
    classLabel: 'form-control-label',

    // error message tag name
    tagNameError: 'small',
    // error message class
    classError: 'text-help',

    // query selector to search inputs within input groups to validate
    selectorInput: '[name]'

};

/**
 * Bunny Form Validation default Translations (EN)
 *
 * object key = validator method name
 * may use additional parameters in rejected (invalid) Promise
 * each invalid input will receive {label} parameter anyway
 * ajax error message should be received from server via JSON response in "message" key
 */
export const ValidationLang = {

    required: "'{label}' ir required!",
    email: "'{label}' should be a valid e-mail address!",
    tel: "'{label}' is not a valid telephone number!",
    maxLength: "'{label}' length must be < '{maxLength}'",
    minLength: "'{label}' length must be > '{minLength}'",
    maxFileSize: "Max file size must be < {maxFileSize}MB, uploaded {fileSize}MB",
    image: "'{label}' should be an image (JPG or PNG)",
    minImageDimensions: "'{label}' must be > {minWidth}x{minHeight}, uploaded {width}x{height}",
    maxImageDimensions: "'{label}' must be < {maxWidth}x{maxHeight}, uploaded {width}x{height}",
    requiredFromList: "Select '{label}' from list",
    confirmation: "'{label}' is not equal to '{originalLabel}'"

};

/**
 * Bunny Form Validation Validators
 *
 * Each validator is a separate method
 * Each validator return Promise
 * Each Promise has valid and invalid callbacks
 * Invalid callback may contain argument - string of error message or object of additional params for lang error message
 */
export const ValidationValidators = {

    required(input){
        return new Promise((valid, invalid) => {
            if (input.hasAttribute('required')) {
                // input is required, check value
                if (input.value === ''
                    || ((input.type === 'radio' || input.type === 'checkbox') && !input.checked)
                    || input.getAttribute('type') === 'file' && input.files.length === 0) {
                    // input is empty or file is not uploaded
                    invalid();
                } else {
                    valid();
                }
            } else {
                valid();
            }
        });
    },

    email(input) {
        return new Promise((valid, invalid) => {
            if (input.value.length > 0 && input.getAttribute('type') === 'email') {
                // input is email, parse string to match email regexp
                const Regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/;
                if (Regex.test(input.value)) {
                    valid();
                } else {
                    invalid();
                }
            } else {
                valid();
            }
        });
    },

    tel(input){
        return new Promise((valid, invalid) => {
            if (input.value.length > 0 && input.getAttribute('type') === 'tel') {
                // input is tel, parse string to match tel regexp
                const Regex = /^[0-9\-\+\(\)\#\ \*]{6,20}$/;
                if (Regex.test(input.value)) {
                    valid();
                } else {
                    invalid();
                }
            } else {
                valid();
            }
        });
    },

    maxLength(input) {
        return new Promise((valid, invalid) => {
            if (input.getAttribute('maxlength') !== null && input.value.length > input.getAttribute('maxlength')) {
                invalid({maxLength: input.getAttribute('maxlength')});
            } else {
                valid();
            }
        });
    },

    minLength(input) {
        return new Promise((valid, invalid) => {
            if (input.getAttribute('minlength') !== null && input.value.length < input.getAttribute('minlength')) {
                invalid({minLength: input.getAttribute('minlength')});
            } else {
                valid();
            }
        });
    },

    maxFileSize(input) {
        return new Promise((valid, invalid) => {
            if (input.getAttribute('type') === 'file' && input.hasAttribute('maxfilesize')) {
                const maxFileSize = parseFloat(input.getAttribute('maxfilesize')); // in MB
                if (input.files.length !== 0) {
                    const fileSize = (input.files[0].size / 1000000).toFixed(2); // in MB
                    if (fileSize <= maxFileSize) {
                        valid(input);
                    } else {
                        invalid({maxFileSize, fileSize});
                    }
                }
            } else {
                valid(input);
            }
        });
    },

    // if file input has "accept" attribute and it contains "image",
    // then check if uploaded file is a JPG or PNG
    image(input) {
        return new Promise((valid, invalid) => {
            if (
                input.getAttribute('type') === 'file'
                && input.getAttribute('accept').indexOf('image') > -1
                && input.files.length !== 0
            ) {
                BunnyFile.getSignature(input.files[0]).then(signature => {
                    if (BunnyFile.isJpeg(signature) || BunnyFile.isPng(signature)) {
                        valid();
                    } else {
                        invalid({signature});
                    }
                });
            } else {
                valid();
            }
        });
    },

    minImageDimensions(input) {
        return new Promise((valid, invalid) => {
            if (input.hasAttribute('mindimensions') && input.files.length !== 0) {
                const [minWidth, minHeight] = input.getAttribute('mindimensions').split('x');
                BunnyImage.getImageByBlob(input.files[0]).then(img => {
                    const width = BunnyImage.getImageWidth(img);
                    const height = BunnyImage.getImageHeight(img);
                    if (width < minWidth || height < minHeight) {
                        invalid({width: width, height: height, minWidth, minHeight});
                    } else {
                        valid();
                    }
                });
            } else {
                valid();
            }
        });
    },

    maxImageDimensions(input) {
        return new Promise((valid, invalid) => {
            if (input.hasAttribute('maxdimensions') && input.files.length !== 0) {
                const [maxWidth, maxHeight] = input.getAttribute('maxdimensions').split('x');
                BunnyImage.getImageByBlob(input.files[0]).then(img => {
                    const width = BunnyImage.getImageWidth(img);
                    const height = BunnyImage.getImageHeight(img);
                    if (width > maxWidth || height > maxHeight) {
                        invalid({width: width, height: height, maxWidth, maxHeight});
                    } else {
                        valid();
                    }
                });
            } else {
                valid();
            }
        });
    },

    requiredFromList(input) {
        return new Promise((valid, invalid) => {
            const srcInput = document.getElementById(input.name + '_id');
            if (srcInput) {
                if (srcInput.value.length > 0) {
                    valid();
                } else {
                    invalid();
                }
            } else {
                valid();
            }
        });
    },

    confirmation(input) {
        return new Promise((valid, invalid) => {
            if (input.name.indexOf('_confirmation') > -1) {
                const originalInputId = input.name.substr(0, input.name.length - 13);
                console.log(originalInputId);
                const originalInput = document.getElementById(originalInputId);
                if (originalInput.value == input.value) {
                    valid();
                } else {
                    invalid({originalLabel: ValidationUI.getLabel(ValidationUI.getInputGroup(originalInput)).textContent});
                }
            } else {
                valid();
            }
        });
    },

    // if input's value is not empty and input has attribute "data-ajax" which should contain ajax URL with {value}
    // which will be replaced by URI encoded input.value
    // then ajax request will be made to validate input
    //
    // ajax request should return JSON response
    // if JSON response has "message" key and message key is not empty string - input is invalid
    // server should return validation error message, it may contain {label}
    // Does not works with file inputs
    ajax(input) {
        return new Promise((valid, invalid) => {
            if (input.dataset.ajax !== undefined && input.value.length > 0) {
                const url = input.dataset.ajax.replace('{value}', encodeURIComponent(input.value))
                Ajax.get(url, data => {
                    data = JSON.parse(data);
                    if (data.message !== undefined && data.message !== '') {
                        invalid(data.message);
                    } else {
                        valid();
                    }
                }, () => {
                    invalid('Ajax error');
                });
            } else {
                valid();
            }
        });
    }

};

/**
 * @package BunnyJS
 * @component Validation
 *
 * Base Object to work with DOM, creates error messages
 * and searches for inputs within "input groups" and related elements
 * Each input should be wrapped around an "input group" element
 * Each "input group" should contain one input, may contain one label
 * Multiple inputs within same "Input group" should not be used for validation
 * <fieldset> is recommended to be used to wrap more then one input
 */
export const ValidationUI = {

    config: ValidationConfig,

    /* ************************************************************************
     * ERROR MESSAGE
     */

    /**
     * DOM algorithm - where to insert error node/message
     *
     * @param {HTMLElement} inputGroup
     * @param {HTMLElement} errorNode
     */
    insertErrorNode(inputGroup, errorNode) {
        inputGroup.appendChild(errorNode);
    },



    /**
     * DOM algorithm - where to add/remove error class
     *
     * @param {HTMLElement} inputGroup
     */
    toggleErrorClass(inputGroup) {
        inputGroup.classList.toggle(this.config.classInputGroupError);
    },



    /**
     * Create DOM element for error message
     *
     * @returns {HTMLElement}
     */
    createErrorNode() {
        const el = document.createElement(this.config.tagNameError);
        el.classList.add(this.config.classError);
        return el;
    },



    /**
     * Find error message node within input group or false if not found
     *
     * @param {HTMLElement} inputGroup
     *
     * @returns {HTMLElement|boolean}
     */
    getErrorNode(inputGroup) {
        return inputGroup.getElementsByClassName(this.config.classError)[0] || false;
    },



    /**
     * Removes error node and class from input group if exists
     *
     * @param {HTMLElement} inputGroup
     */
    removeErrorNode(inputGroup) {
        const el = this.getErrorNode(inputGroup);
        if (el) {
            el.parentNode.removeChild(el);
            this.toggleErrorClass(inputGroup);
        }
    },



    /**
     * Creates and includes into DOM error node or updates error message
     *
     * @param {HTMLElement} inputGroup
     * @param {String} message
     */
    setErrorMessage(inputGroup, message) {
        let errorNode = this.getErrorNode(inputGroup);
        if (errorNode === false) {
            // container for error message doesn't exists, create new
            errorNode = this.createErrorNode();
            this.toggleErrorClass(inputGroup);
            this.insertErrorNode(inputGroup, errorNode)
        }
        // set or update error message
        errorNode.textContent = message;
    },



    /* ************************************************************************
     * SEARCH DOM
     */

    /**
     * DOM Algorithm - which inputs should be selected for validation
     *
     * @param {HTMLElement} inputGroup
     *
     * @returns {HTMLElement|boolean}
     */
    getInput(inputGroup) {
        return inputGroup.querySelector(this.config.selectorInput) || false;
    },



    /**
     * Find closest parent inputGroup element by Input element
     *
     * @param {HTMLElement} input
     *
     * @returns {HTMLElement}
     */
    getInputGroup(input) {
        let el = input;
        while ((el = el.parentNode) && !el.classList.contains(this.config.classInputGroup));
        return el;
    },


    
    /**
     * Find inputs in section
     *
     * @meta if second argument true - return object with meta information to use during promise resolving
     *
     * @param {HTMLElement} node
     * @param {boolean} resolving = false
     *
     * @returns {Array|Object}
     */
    getInputsInSection(node, resolving = false) {
        const inputGroups = this.getInputGroupsInSection(node);
        let inputs;
        if (resolving) {
            inputs = {
                inputs: {},
                invalidInputs: {},
                length: 0,
                unresolvedLength: 0,
                invalidLength: 0
            };
        } else {
            inputs = [];
        }
        for (let k = 0; k < inputGroups.length; k++) {
            const input = this.getInput(inputGroups[k]);
            if (resolving) {
                inputs.inputs[k] = {
                    input: input,
                    isValid: null
                };
                inputs.length++;
                inputs.unresolvedLength++;
            } else {
                inputs.push(input);
            }
        }
        return inputs;
    },


    
    /**
     * Find label associated with input within input group
     *
     * @param {HTMLElement} inputGroup
     *
     * @returns {HTMLElement|boolean}
     */
    getLabel(inputGroup) {
        return inputGroup.getElementsByTagName('label')[0] || false;
    },
    


    /**
     * Find all input groups within section
     *
     * @param {HTMLElement} node
     *
     * @returns {HTMLCollection}
     */
    getInputGroupsInSection(node) {
        return node.getElementsByClassName(this.config.classInputGroup);
    }

};

export const Validation = {

    validators: ValidationValidators,
    lang: ValidationLang,
    ui: ValidationUI,

    init(form) {
        // disable browser built-in validation
        form.setAttribute('novalidate', '');

        form.addEventListener('submit', e => {
            e.preventDefault();
            const submitBtn = form.querySelector('[type="submit"]');
            submitBtn.disabled = true;
            this.validateSection(form).then(result => {
                if (result === true) {
                    submitBtn.disabled = false;
                    form.submit();
                } else {
                    submitBtn.disabled = false;
                    this.focusInput(result[0]);
                }
            })
        })
    },

    validateSection(node) {
        if (node.__bunny_validation_state === undefined) {
            node.__bunny_validation_state = true;
        } else {
            throw new Error('Bunny Validation: validation already in progress.');
        }
        return new Promise(resolve => {
            const resolvingInputs = this.ui.getInputsInSection(node, true);
            // run async validation for each input
            // when last async validation will be completed, call validSection or invalidSection
            for(let i = 0; i < resolvingInputs.length; i++) {
                const input = resolvingInputs.inputs[i].input;
                this.checkInput(input).then(() => {
                    this._addValidInput(resolvingInputs, input);
                    if (resolvingInputs.unresolvedLength === 0) {
                        this._endSectionValidation(node, resolvingInputs, resolve);
                    }
                }).catch(errorMessage => {
                    this._addInvalidInput(resolvingInputs, input);
                    if (resolvingInputs.unresolvedLength === 0) {
                        this._endSectionValidation(node, resolvingInputs, resolve);
                    }
                });
            }
        });
    },

    focusInput(input, delay = 500, offset = -50) {
        BunnyElement.scrollTo(input, delay, offset);
        input.focus();
        if (
            input.setSelectionRange !== undefined
            && typeof input.setSelectionRange === 'function'
        ) {
            input.setSelectionRange(input.value.length, input.value.length);
        }
    },

    checkInput(input) {
        return new Promise((valid, invalid) => {
            this._checkInput(input, 0, valid, invalid);
        });

    },

    _addValidInput(resolvingInputs, input) {
        resolvingInputs.unresolvedLength--;
        for (let k in resolvingInputs.inputs) {
            if (input === resolvingInputs.inputs[k].input) {
                resolvingInputs.inputs[k].isValid = true;
                break;
            }
        }
    },

    _addInvalidInput(resolvingInputs, input) {
        resolvingInputs.unresolvedLength--;
        resolvingInputs.invalidLength++;
        for (let k in resolvingInputs.inputs) {
            if (input === resolvingInputs.inputs[k].input) {
                resolvingInputs.inputs[k].isValid = false;
                resolvingInputs.invalidInputs[k] = input;
                break;
            }
        }
    },

    _endSectionValidation(node, resolvingInputs, resolve) {
        delete node.__bunny_validation_state;

        if (resolvingInputs.invalidLength === 0) {
            // form or section is valid
            return resolve(true);
        } else {
            let invalidInputs = [];
            for(let k in resolvingInputs.invalidInputs) {
                invalidInputs.push(resolvingInputs.invalidInputs[k]);
            }
            // form or section has invalid inputs
            return resolve(invalidInputs);
        }
    },

    _checkInput(input, index, valid, invalid) {
        const validators = Object.keys(this.validators);
        const currentValidatorName = validators[index];
        const currentValidator = this.validators[currentValidatorName];
        currentValidator(input).then(() => {
            index++;
            if (validators[index] !== undefined) {
                this._checkInput(input, index, valid, invalid)
            } else {
                // if has error message, remove it
                this.ui.removeErrorNode(this.ui.getInputGroup(input));

                valid();
            }
        }).catch(data => {
            // get input group and label
            const inputGroup = this.ui.getInputGroup(input);
            const label = this.ui.getLabel(inputGroup);

            // get error message
            const errorMessage = this._getErrorMessage(currentValidatorName, input, label, data);

            // set error message
            this.ui.setErrorMessage(inputGroup, errorMessage);
            invalid(errorMessage);
        });
    },

    _getErrorMessage(validatorName, input, label, data) {
        let message = '';
        if (typeof data === 'string') {
            // if validator returned string (from ajax for example), use it
            message = data;
        } else {
            if (this.lang[validatorName] === undefined) {
                throw new Error('Bunny Validation: Lang message not found for validator: ' + validatorName);
            }
            message = this.lang[validatorName];
        }

        // replace params in error message
        if (label !== false) {
            message = message.replace('{label}', label.textContent);
        } else {
            message = message.replace('{label}', input.name)
        }

        for (let paramName in data) {
            message = message.replace('{' + paramName + '}', data[paramName]);
        }
        return message;
    },


};
