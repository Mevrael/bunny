
import {BunnyFile} from "./file/file";
import {BunnyImage} from "./file/image";
import {Ajax} from "./bunny.ajax";
import {BunnyElement} from "./BunnyElement";

export const ValidationConfig = {

    // div/node class name selector which contains one label, one input, one help text etc.
    classInputGroup: 'form-group',
    // class to be applied on input group node if it has invalid input
    classInputGroupError: 'has-danger',
    // class to be applied on input group node if it input passed validation (is valid)
    classInputGroupSuccess: 'has-success',

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

    required: "'{label}' is required",
    email: "'{label}' should be a valid e-mail address",
    url: "{label} should be a valid website URL",
    tel: "'{label}' is not a valid telephone number",
    maxLength: "'{label}' length must be < '{maxLength}'",
    minLength: "'{label}' length must be > '{minLength}'",
    maxFileSize: "Max file size must be < {maxFileSize}MB, uploaded {fileSize}MB",
    image: "'{label}' should be an image (JPG or PNG)",
    minImageDimensions: "'{label}' must be > {minWidth}x{minHeight}, uploaded {width}x{height}",
    maxImageDimensions: "'{label}' must be < {maxWidth}x{maxHeight}, uploaded {width}x{height}",
    requiredFromList: "Select '{label}' from list",
    confirmation: "'{label}' is not equal to '{originalLabel}'",
    minOptions: "Please select at least {minOptionsCount} options"

};

/**
 * Bunny Validation helper - get file to validate
 * @param {HTMLInputElement} input
 * @returns {File|Blob|boolean} - If no file uploaded - returns false
 * @private
 */
const _bn_getFile = (input) => {
    // if there is custom file upload logic, for example, images are resized client-side
    // generated Blobs should be assigned to fileInput._file
    // and can be sent via ajax with FormData

    // if file was deleted, custom field can be set to an empty string

    // Bunny Validation detects if there is custom Blob assigned to file input
    // and uses this file for validation instead of original read-only input.files[]
    if (input._file !== undefined && input._file !== '') {
        if (input._file instanceof Blob === false) {
            console.error(`Custom file for input ${input.name} is not an instance of Blob`);
            return false;
        }
        return input._file;
    }
    return input.files[0] || false;
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
                if (
                    input.getAttribute('type') !== 'file' && input.value === ''
                    || ((input.type === 'radio' || input.type === 'checkbox') && !input.checked)
                    || input.getAttribute('type') === 'file' && _bn_getFile(input) === false) {
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
                const Regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
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

    url(input){
        return new Promise((valid, invalid) => {
            if (input.value.length > 0 && input.getAttribute('type') === 'url') {
                // input is URL, parse string to match website URL regexp
                const Regex = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi;
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
            if (
                input.getAttribute('type') === 'file'
                && input.hasAttribute('maxfilesize')
                && _bn_getFile(input) !== false
            ) {
                const maxFileSize = parseFloat(input.getAttribute('maxfilesize')); // in MB
                const fileSize = (_bn_getFile(input).size / 1000000).toFixed(2); // in MB
                if (fileSize <= maxFileSize) {
                    valid(input);
                } else {
                    invalid({maxFileSize, fileSize});
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
                && _bn_getFile(input) !== false
            ) {
                BunnyFile.getSignature(_bn_getFile(input)).then(signature => {
                    if (BunnyFile.isJpeg(signature) || BunnyFile.isPng(signature)) {
                        valid();
                    } else {
                        invalid({signature});
                    }
                }).catch(e => {
                    invalid(e);
                });
            } else {
                valid();
            }
        });
    },

    minImageDimensions(input) {
        return new Promise((valid, invalid) => {
            if (input.hasAttribute('mindimensions') && _bn_getFile(input) !== false) {
                const [minWidth, minHeight] = input.getAttribute('mindimensions').split('x');
                BunnyImage.getImageByBlob(_bn_getFile(input)).then(img => {
                    const width = BunnyImage.getImageWidth(img);
                    const height = BunnyImage.getImageHeight(img);
                    if (width < minWidth || height < minHeight) {
                        invalid({width: width, height: height, minWidth, minHeight});
                    } else {
                        valid();
                    }
                }).catch(e => {
                    invalid(e);
                });
            } else {
                valid();
            }
        });
    },

    maxImageDimensions(input) {
        return new Promise((valid, invalid) => {
            if (input.hasAttribute('maxdimensions') && _bn_getFile(input) !== false) {
                const [maxWidth, maxHeight] = input.getAttribute('maxdimensions').split('x');
                BunnyImage.getImageByBlob(_bn_getFile(input)).then(img => {
                    const width = BunnyImage.getImageWidth(img);
                    const height = BunnyImage.getImageHeight(img);
                    if (width > maxWidth || height > maxHeight) {
                        invalid({width: width, height: height, maxWidth, maxHeight});
                    } else {
                        valid();
                    }
                }).catch(e => {
                    invalid(e);
                });
            } else {
                valid();
            }
        });
    },

    requiredFromList(input) {
        return new Promise((valid, invalid) => {
            let id;
            if (input.hasAttribute('requiredfromlist')) {
                id = input.getAttribute('requiredfromlist')
            } else {
                id = input.name + '_id';
            }
            const srcInput = document.getElementById(id);
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

    minOptions(input) {
        return new Promise((valid, invalid) => {
            if (input.hasAttribute('minoptions')) {
                const minOptionsCount = parseInt(input.getAttribute('minoptions'));
                const inputGroup = ValidationUI.getInputGroup(input);
                const hiddenInputs = inputGroup.getElementsByTagName('input');
                let selectedOptionsCount = 0;
                [].forEach.call(hiddenInputs, hiddenInput => {
                    if (hiddenInput !== input && hiddenInput.value !== '') {
                        selectedOptionsCount++
                    }
                });
                if (selectedOptionsCount < minOptionsCount) {
                    invalid({minOptionsCount});
                } else {
                    valid();
                }
            } else {
                valid();
            }
        })
    },

    confirmation(input) {
        return new Promise((valid, invalid) => {
            if (input.name.indexOf('_confirmation') > -1) {
                const originalInputId = input.name.substr(0, input.name.length - 13);
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
   * Removes all error node and class from input group if exists within section
   *
   * @param {HTMLElement} section
   */
    removeErrorNodesFromSection(section) {
      [].forEach.call(this.getInputGroupsInSection(section), inputGroup => {
        this.removeErrorNode(inputGroup);
      });
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



    /**
     * Marks input as valid
     *
     * @param {HTMLElement} inputGroup
     */
    setInputValid(inputGroup) {
      inputGroup.classList.add(this.config.classInputGroupSuccess);
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
            if (input === false) {
                console.error(inputGroups[k]);
                throw new Error('Bunny Validation: Input group has no input');
            }
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

    init(form, inline = false) {
        // disable browser built-in validation
        form.setAttribute('novalidate', '');

        form.addEventListener('submit', e => {
            e.preventDefault();
            const submitBtns = form.querySelectorAll('[type="submit"]');
            [].forEach.call(submitBtns, submitBtn => {
                submitBtn.disabled = true;
            });
            this.validateSection(form).then(result => {
                [].forEach.call(submitBtns, submitBtn => {
                    submitBtn.disabled = false;
                });
                if (result === true) {
                    form.submit();
                } else {
                    this.focusInput(result[0]);
                }
            })
        });

        if (inline) {
            this.initInline(form);
        }
    },

    initInline(node) {
        const inputs = this.ui.getInputsInSection(node);
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                this.checkInput(input).catch(e => {});
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
            if (resolvingInputs.length === 0) {
                // nothing to validate, end
                this._endSectionValidation(node, resolvingInputs, resolve);
            } else {
                // run async validation for each input
                // when last async validation will be completed, call validSection or invalidSection
                let promises = [];
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

                // if there are not resolved promises after 3s, terminate validation, mark pending inputs as invalid
                setTimeout(() => {
                    if (resolvingInputs.unresolvedLength > 0) {
                        let unresolvedInputs = this._getUnresolvedInputs(resolvingInputs);
                        for (let i = 0; i < unresolvedInputs.length; i++) {
                            const input = unresolvedInputs[i];
                            const inputGroup = this.ui.getInputGroup(input);
                            this._addInvalidInput(resolvingInputs, input);
                            this.ui.setErrorMessage(inputGroup, 'Validation terminated after 3s');
                            if (resolvingInputs.unresolvedLength === 0) {
                                this._endSectionValidation(node, resolvingInputs, resolve);
                            }
                        }
                    }
                }, 3000);
            }
        });
    },

    focusInput(input, delay = 500, offset = -50) {
        BunnyElement.scrollTo(input, delay, offset);
        input.focus();
        if (
            input.offsetParent !== null
            && input.setSelectionRange !== undefined
            && ['text', 'search', 'url', 'tel', 'password'].indexOf(input.type) !== -1
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

    _getUnresolvedInputs(resolvingInputs) {
        let unresolvedInputs = [];
        for (let k in resolvingInputs.inputs) {
            if (!resolvingInputs.inputs[k].isValid) {
                unresolvedInputs.push(resolvingInputs.inputs[k].input);
            }
        }
        return unresolvedInputs;
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
                const inputGroup = this.ui.getInputGroup(input);
                // if has error message, remove it
                this.ui.removeErrorNode(inputGroup);

                if (input.form !== undefined && input.form.hasAttribute('showvalid')) {
                  // mark input as valid
                  this.ui.setInputValid(inputGroup);
                }

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
        } else if (input.placeholder && input.placeholder !== '') {
            message = message.replace('{label}', input.placeholder);
        } else {
            message = message.replace('{label}', '');
        }

        for (let paramName in data) {
            message = message.replace('{' + paramName + '}', data[paramName]);
        }
        return message;
    },


};

document.addEventListener('DOMContentLoaded', () => {
    [].forEach.call(document.forms, form => {
        if (form.getAttribute('validator') === 'bunny') {
            const inline = form.hasAttribute('validator-inline');
            Validation.init(form, inline);
        }
    });
});
