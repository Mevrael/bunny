
import BunnyFormData from '../polyfills/BunnyFormData';

/**
 * BunnyJS Form component
 * Wraps native FormData API to allow working with same form from multiple closures
 * and adds custom methods to make form processing, including AJAX submit, file uploads and date/times, easier
 * works only with real forms and elements in DOM
 * Whenever new input is added or removed from DOM - Form data is updated
 */
export default Form = {

    /*
    properties
    */

    /**
     * Collection of FormData
     * @private
     */
    _collection: {},

    /**
     * Collection of mirrored elements
     * See Form.mirror() for detailed description
     */
    _mirrorCollection: {},

    //_calcMirrorCollection: {},


    /*
    init methods
     */

    /**
     * Init form
     * Must be called after DOMContentLoaded (ready)
     *
     * @param {string} form_id
     *
     * @throws Error
     */
    init(form_id) {
        const form = document.forms[form_id];
        if (form === undefined) {
            throw new Error(`Form with ID ${form_id} not found in DOM!`);
        }
        if (this._collection[form_id] !== undefined) {
            throw new Error(`Form with ID ${form_id} already initiated!`);
        }
        this._collection[form_id] = new BunnyFormData(form);
        this._attachChangeAndDefaultFileEvent(form_id);
        this._attachRadioListChangeEvent(form_id);
        this._attachDOMChangeEvent(form_id);
    },

    isInitiated(form_id) {
        return this._collection[form_id] !== undefined;
    },

    /**
     * Update FormData when user changed input's value
     * or when value changed from script
     *
     * Also init default value for File inputs
     *
     * @param {string} form_id
     *
     * @private
     */
    _attachChangeAndDefaultFileEvent(form_id) {
        const elements = this._collection[form_id].getInputs();
        [].forEach.call(elements, (form_control) => {

            this.__attachSingleChangeEvent(form_id, form_control);
            this.__observeSingleValueChange(form_id, form_control);

            if (form_control.type === 'file' && form_control.hasAttribute('value')) {
                const url = form_control.getAttribute('value');
                if (url !== '') {
                    this.setFileFromUrl(form_id, form_control.name, url);
                }
            }
        });
    },

    _attachRadioListChangeEvent(form_id) {
        const radio_lists = this._collection[form_id].getRadioLists();
        for (let radio_group_name in radio_lists) {
            let single_radio_list = radio_lists[radio_group_name];
            this.__observeSingleValueChange(form_id, single_radio_list);
        }
    },

    __attachSingleChangeEvent(form_id, form_control) {
        form_control.addEventListener('change', (e) => {

            this._parseFormControl(form_id, form_control, form_control.value);

            if (form_control.type === 'file') {
                if (e.isTrusted) {
                    // file selected by user
                    this._collection[form_id].set(form_control.name, form_control.files[0]);
                }
            }

            // update mirror if mirrored
            if (this._mirrorCollection[form_id] !== undefined) {
                if (this._mirrorCollection[form_id][form_control.name] === true) {
                    this.setMirrors(form_id, form_control.name);
                }
            }
        });
    },

    // handlers for different input types
    // with 3rd argument - setter
    // without 3rd argument - getter
    // called from .value property observer
    _parseFormControl(form_id, form_control, value = undefined) {
        if (form_control.tagName === 'TEXTAREA') {
            form_control.type = 'textarea';
        } else if (form_control instanceof RadioNodeList) {
            form_control.type = 'radiolist';
        }

        // check if parser for specific input type exists and call it instead
        let method = form_control.type.toLowerCase();
        method = method.charAt(0).toUpperCase() + method.slice(1); // upper case first char
        method = '_parseFormControl' + method;

        if (value === undefined) {
            method = method + 'Getter';
        }

        if (this[method] !== undefined) {
            return this[method](form_id, form_control, value);
        } else {
            // call default parser
            // if input with same name exists - override
            if (value === undefined) {
                return this._parseFormControlDefaultGetter(form_id, form_control);
            } else {
                this._parseFormControlDefault(form_id, form_control, value);
            }
        }
    },

    _parseFormControlDefault(form_id, form_control, value) {
        this._collection[form_id].set(form_control.name, value);
    },

    _parseFormControlDefaultGetter(form_id, form_control) {
        return Object.getOwnPropertyDescriptor(form_control.constructor.prototype, 'value').get.call(form_control);
        //return this._collection[form_id].get(form_control.name);
    },

    _parseFormControlRadiolist(form_id, form_control, value) {
        let found = false;
        for (let k = 0; k < form_control.length; k++) {
            let radio_input = form_control[k];
            if (radio_input.value === value) {
                this._collection[form_id].set(radio_input.name, value);
                found = true;
                break;
            }
        }

        if (!found) {
            throw new TypeError('Trying to Form.set() on radio with unexisted value="'+value+'"');
        }
    },

    _parseFormControlCheckbox(form_id, form_control, value) {
        const fd = this._collection[form_id];
        fd.setCheckbox(form_control.name, value, form_control.checked);
    },

    _parseFormControlFile(form_id, form_control, value) {
        if (!(value instanceof Blob)) {
            throw new TypeError('Only Blob object is allowed to be assigned to .value property of file input using Bunny Form');
        } else {
            if (value.name === undefined) {
                value.name = 'blob';
            }
            this._collection[form_id].set(form_control.name, value);
        }
    },

    _parseFormControlFileGetter(form_id, form_control) {
        // Override native file input .value logic
        // return Blob or File object or empty string if no file set
        return this.get(form_id, form_control.name);
    },




    __observeSingleValueChange(form_id, form_control) {
        const self = this;
        Object.defineProperty(form_control, 'value', {
            get: function() {
                return self._parseFormControl(form_id, form_control);
            },
            set: function (value) {
                // call parent setter to redraw changes in UI, update checked etc.
                if (form_control.type !== 'file') {
                    Object.getOwnPropertyDescriptor(form_control.constructor.prototype, 'value').set.call(form_control, value);
                }

                self._parseFormControl(form_id, form_control, value);
                if (!(form_control instanceof RadioNodeList)) {
                    const event = new CustomEvent('change');
                    form_control.dispatchEvent(event);
                }
            }
        });
    },

    _initNewInput(form_id, input) {
        this._checkInit(form_id);
        this._collection[form_id]._initSingleInput(input);
        this.__attachSingleChangeEvent(form_id, input);
        this.__observeSingleValueChange(form_id, input);
    },

    _attachDOMChangeEvent(form_id) {
        const target = document.forms[form_id];
        const observer_config = { childList: true, subtree: true };
        const observer = new MutationObserver( (mutations) => {
            mutations.forEach( (mutation) => {
                if (mutation.addedNodes.length > 0) {
                    // probably new input added, update form data
                    this.__handleAddedNodes(form_id, mutation.addedNodes);
                } else if (mutation.removedNodes.length > 0) {
                    // probably input removed, update form data
                    this.__handleRemovedNodes(form_id, mutation.removedNodes);
                }
            });
        });

        observer.observe(target, observer_config);
    },

        __handleAddedNodes(form_id, added_nodes) {
            for (let k = 0; k < added_nodes.length; k++) {
                let node = added_nodes[k];
                if (node.tagName == 'input') {
                    this._initNewInput(form_id, node);
                } else {
                    let inputs = node.getElementsByTagName('input');
                    if (inputs.length > 0) {
                        for (let k2 = 0; k2 < inputs.length; k2++) {
                            this._initNewInput(form_id, inputs[k2]);
                        }
                    }
                }
            }
        },

        __handleRemovedNodes(form_id, removed_nodes) {
            for (let k = 0; k < removed_nodes.length; k++) {
                let node = removed_nodes[k];
                if (node.tagName == 'input') {
                    let input = node;
                    this._collection[form_id].remove(input.name, input.value);
                } else {
                    let inputs = node.getElementsByTagName('input');
                    if (inputs.length > 0) {
                        for (let k2 = 0; k2 < inputs.length; k2++) {
                            let input = inputs[k2];
                            this._collection[form_id].remove(input.name, input.value);
                        }
                    }
                }
            }
        },

    /**
     * Init all forms in DOM
     * Must be called after DOMContentLoaded (ready)
     */
    initAll() {
        [].forEach.call(document.forms, (form) => {
            this.init(form.id)
        });
    },

    /**
     * Check if form is initiated
     *
     * @param {string} form_id
     *
     * @throws Error
     * @private
     */
    _checkInit(form_id) {
        if (this._collection[form_id] === undefined) {
            throw new Error(`Form with ID ${form_id} is not initiated! Init form with Form.init(form_id) first.`);
        }
    },


    /*
    Get and set form data methods
     */

    /**
     * Set new value of real DOM input or virtual input
     * Actually fires change event and values are set in _attachChangeAndDefaultFileEvent()
     *
     * @param {string} form_id
     * @param {string} input_name
     * @param {string|Blob|Object} input_value
     */
    set(form_id, input_name, input_value) {
        this._checkInit(form_id);
        const input = this._collection[form_id].getInput(input_name);
        input.value = input_value;
    },

    /**
     * Get value of real DOM input or virtual input
     *
     * @param {string} form_id
     * @param {string} input_name
     *
     * @returns {string|File|Blob}
     */
    get(form_id, input_name) {
        this._checkInit(form_id);
        return this._collection[form_id].get(input_name);
    },

    /**
     * Get all form input values as key - value object
     * @param form_id
     * @returns {object}
     */
    getAll(form_id) {
        this._checkInit(form_id);
        /*const data = {};
        const items = this._collection[form_id].entries();
        for (let item of items) {
            data[item[0]] = item[1];
        }
        return data;*/
        return this._collection[form_id].getAllElements();
    },

    /**
     * Get native FormData object
     * For example, to submit form with custom handler
     * @param {string} form_id
     * @returns {FormData}
     */
    getFormDataObject(form_id) {
        this._checkInit(form_id);
        return this._collection[form_id].buildFormDataObject();
    },

    getInput(form_id, input_name) {
        return this._collection[form_id].getInput(input_name);
    },


    /*
     virtual checkbox, item list, tag list, etc methods
     */
    append(form_id, array_name, value) {
        this._checkInit(form_id);
        const formData = this._collection[form_id];
        formData.append(array_name, value);
    },

    remove(form_id, array_name, value = undefined) {
        this._checkInit(form_id);
        /*const formData = this._collection[form_id];
        formData.delete(array_name);
        const collection = formData.getAll(array_name);
        collection.forEach( (item) => {
            if (item !== value) {
                formData.append(array_name, item);
            }
        });*/
        this._collection[form_id].remove(array_name, value);
    },


    /*
    binding (mirror) methods
     */

    /**
     * Mirrors real DOM input's value with any DOM element (two-way data binding)
     * All DOM elements with attribute data-mirror="form_id.input_name" are always updated when input value changed
     * @param {string} form_id
     * @param {string} input_name
     */
    mirror(form_id, input_name) {
        this._checkInit(form_id);
        const input = this._collection[form_id].getInput(input_name);
        if (!(input instanceof HTMLInputElement)) {
            // make sure it is normal input and not RadioNodeList or other interfaces which don't have addEventListener
            throw new Error('Cannot mirror radio buttons or checkboxes.')
        }
        if (this._mirrorCollection[form_id] === undefined) {
            this._mirrorCollection[form_id] = {};
        }
        this._mirrorCollection[form_id][input_name] = true;

        //const input = document.forms[form_id].elements[input_name];
        this.setMirrors(form_id, input_name);
        input.addEventListener('change', () => {
            this.setMirrors(form_id, input_name);
        });
    },

    /**
     * Mirrors all inputs of form
     * Does not mirror radio buttons and checkboxes
     * See Form.mirror() for detailed description
     * @param form_id
     */
    mirrorAll(form_id) {
        this._checkInit(form_id);
        const inputs = this._collection[form_id].getInputs();
        [].forEach.call(inputs, (input) => {
            if (input instanceof HTMLInputElement && input.type !== 'checkbox' && input.type !== 'radio') {
                // make sure it is normal input and not RadioNodeList or other interfaces which don't have addEventListener
                this.mirror(form_id, input.name);
            }
        });
    },

    getMirrors(form_id, input_name) {
        this._checkInit(form_id);
        return document.querySelectorAll(`[data-mirror="${form_id}.${input_name}"]`);
    },

    setMirrors(form_id, input_name) {
        this._checkInit(form_id);
        const mirrors = this.getMirrors(form_id, input_name);
        const input = this._collection[form_id].getInput(input_name);
        //const input = document.forms[form_id].elements[input_name];
        [].forEach.call(mirrors, (mirror) => {
            if (mirror.tagName === 'IMG') {
                let data = this.get(form_id, input_name);
                if (data !== '' && data.size !== 0) {
                    mirror.src = URL.createObjectURL(this.get(form_id, input_name));
                }
            } else {
                mirror.textContent = input.value;
            }
        });
    },


    /*
    Calc methods
     */
    /*_getCalcMirrors(form_id) {
        this._checkInit(form_id);
        return document.querySelectorAll(`[data-mirror="${form_id}"]`);
    },

    _getCalcMirrorFunction(calc_mirror_el) {
        return calc_mirror_el.getAttribute('data-mirror-function');
    },

    _calcMirror(form_id, calc_mirror, calc_mirror_function) {
        // parse function
        const input_names = calc_mirror_function.split('*');
        console.log(input_names);
        // get arguments (inputs)
        const input1 = document.forms[form_id].elements[input_names[0]];
        const input2 = document.forms[form_id].elements[input_names[1]];

        const value1 = (input1.value === '') ? 0 : input1.value;
        const value2 = (input2.value === '') ? 0 : input2.value;

        // update collection
        if (this._calcMirrorCollection[form_id] === undefined) {
            this._calcMirrorCollection[form_id] = {};
        }
        if (this._calcMirrorCollection[form_id][input1.name] === undefined) {
            this._calcMirrorCollection[form_id][input1.name] = {}
        }
        if (this._calcMirrorCollection[form_id][input2.name] === undefined) {
            this._calcMirrorCollection[form_id][input2.name] = {}
        }
        this._calcMirrorCollection[form_id][input1.name][input2.name] = calc_mirror;
        this._calcMirrorCollection[form_id][input2.name][input1.name] = calc_mirror;

        // set initial value
        calc_mirror.textContent = value1 * value2;

        // set new value when input value changed
        input1.addEventListener('change', () => {
            calc_mirror.textContent = input1.value * document.forms[form_id].elements[input2.name].value;
        });
        input2.addEventListener('change', () => {
            calc_mirror.textContent = input2.value * document.forms[form_id].elements[input1.name].value;
        });
    },

    calcMirrorAll(form_id) {
        this._checkInit(form_id);
        const calc_mirrors = this._getCalcMirrors(form_id);
        for(let calc_mirror of calc_mirrors) {
            let f = this._getCalcMirrorFunction(calc_mirror);
            if (f === undefined) {
                console.trace();
                throw new Error('Calc mirror element with attribute data-mirror does not have attribute data-mirror-function')
            } else {
                this._calcMirror(form_id, calc_mirror, f);
            }
        }
    },*/

    /*
    file methods
     */
    setFileFromUrl(form_id, input_name, url) {
        var request = new XMLHttpRequest();
        const p = new Promise( (success, fail) => {
            request.onload = () => {
                if (request.status === 200) {
                    const blob = request.response;
                    this.set(form_id, input_name, blob);
                    success(blob);
                } else {
                    fail(request);
                }
            };
        });

        request.open('GET', url, true);
        request.responseType = 'blob';
        request.send();
        return p;
    },


    /*
    submit methods
     */

    submit(form_id, url = null, method = 'POST', headers = {'X-Requested-With': 'XMLHttpRequest'}) {
        this._checkInit(form_id);
        const request = new XMLHttpRequest();
        if (url === null) {
            if (document.forms[form_id].hasAttribute('action')) {
                url = document.forms[form_id].getAttribute('action');
            } else {
                //throw new Error('Form.submit() is missing 2nd URL argument');
                url = '';
            }
        }
        request.open(method, url);
        const p = new Promise( (success, fail) => {
            request.onload = () => {
                if (request.status === 200) {
                    success(request.responseText);
                } else {
                    fail(request);
                }
            };
        });
        for (let header in headers) {
            request.setRequestHeader(header, headers[header]);
        }
        this._collection[form_id].set('categories', [2, 3]);
        request.send(this.getFormDataObject(form_id));
        return p;
    }

};
