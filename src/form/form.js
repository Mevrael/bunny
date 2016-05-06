
// FormData wrapper for IE/Edge/Safari/Android etc which supports only FormData constructor and append()
function BunnyFormData(form) {
    /*if (form.constructor.name !== 'HTMLFormElement') {
        throw new Error('Form passed to BunnyFormData constructor is not an instance of HTMLFormElement');
    }*/

    // form
    this._form = form;

    // item collection;
    this._collection = {};

    // build collection from form elements
    for (var k = 0; k < this._form.elements.length; k++) {
        var input = this._form.elements[k];
        this._initSingleInput(input);
    }
}

BunnyFormData.prototype._initSingleInput = function _initSingleInput(input) {
    if (input.type === 'file') {
        this._collection[input.name] = (input.files[0] === undefined || input.files[0] === null) ? '' : input.files[0];
    } else if (this._collection[input.name] !== undefined) {
        // element with same name already exists in collection, make array
        if (!Array.isArray(this._collection[input.name])) {
            this._collection[input.name] = [this._collection[input.name]];
        }
        this._collection[input.name].push(input.value);
    } else {
        this._collection[input.name] = input.value;
    }
};

BunnyFormData.prototype.get = function get(input_name) {
    if (this._collection[input_name] === undefined) {
        return null;
    } else {
        return this._collection[input_name];
    }
};

// value can also be a Blob/File but this get() polyfill does not include 3rd argument filename
BunnyFormData.prototype.set = function get(input_name, value) {
    this._collection[input_name] = value;
};

BunnyFormData.prototype.append = function append(input_name, value) {
    if (this._collection[input_name] === undefined) {
        this._collection[input_name] = value;
    } else if (Array.isArray(this._collection[input_name])) {
        this._collection[input_name].push(value);
    } else {
        // convert single element into array and append new item
        const item = this._collection[input_name];
        this._collection[input_name] = [item, value];
    }
};

BunnyFormData.prototype.getAll = function getAll(input_name) {
    if (this._collection[input_name] === undefined) {
        return [];
    } else if (Array.isArray(this._collection[input_name])) {
        return this._collection[input_name];
    } else {
        return [this._collection[input_name]];
    }
};

// since entries(), keys(), values() return Iterator which is not supported in many browsers
// there is only one element to simply get object of key => value pairs of all form elements
// use this method instead of entries(), keys() or values()
BunnyFormData.prototype.getAllElements = function getAllElements() {
    return this._collection;
};

BunnyFormData.prototype.buildFormDataObject = function buildFormDataObject() {
    const formData = new FormData();
    for (let key in this._collection) {
        if (Array.isArray(this._collection[key])) {
            this._collection[key].forEach((item) => {
                formData.append(key, item);
            });
        } else {
            formData.append(key, this._collection[key]);
        }
    }
    return formData;
};

// remove instead of delete(). Also can remove element from array
BunnyFormData.prototype.remove = function remove(input_name, array_value = undefined) {
    if (array_value !== undefined) {
        // remove element from array
        if (Array.isArray(this._collection[input_name])) {
            let new_array = [];
            this._collection[input_name].forEach((item) => {
                if (item !== array_value) {
                    new_array.push(item);
                }
            });
            this._collection[input_name] = new_array;
        } else {
            // not an array, just remove single element
            delete this._collection[input_name];
        }
    } else {
        delete this._collection[input_name];
    }
};

/**
 * BunnyJS Form component
 * Wraps native FormData API to allow working with same form from multiple closures
 * and adds custom methods to make form processing, including AJAX submit, file uploads and date/times, easier
 * works only with real forms and elements in DOM
 * Whenever new input is added or removed from DOM - Form data is updated
 */
export const Form = {

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
        this._attachChangeEvent(form_id);
        this._attachDOMChangeEvent(form_id);
    },

    /**
     * Update FormData when user changed input's value
     *
     * @param {string} form_id
     *
     * @private
     */
    _attachChangeEvent(form_id) {
        [].forEach.call(document.forms[form_id].elements, (form_control) => {
            this.__attachSingleChangeEvent(form_id, form_control);
        });
    },

    __attachSingleChangeEvent(form_id, form_control) {
        form_control.addEventListener('change', (e) => {
            if (form_control.type === 'file') {
                if (e.isTrusted) {
                    // file selected by user
                    const fd = new FormData(document.forms[form_id]);
                    this._collection[form_id].set(form_control.name, fd.get(form_control.name));
                    // TODO: fix get() not supported for IE
                } else {
                    // file set from script, do nothing because blob was set in Form.set() for File input.
                }
            } else if (form_control.type === 'radio') {
                const list = document.forms[form_id].elements[form_control.name];
                list.value = form_control.value;
                this._collection[form_id].set(form_control.name, form_control.value);
            } else {
                this._collection[form_id].set(form_control.name, form_control.value);
            }

            // update mirror if mirrored
            if (this._mirrorCollection[form_id] !== undefined) {
                if (this._mirrorCollection[form_id][form_control.name] === true) {
                    this.setMirrors(form_id, form_control.name);
                }
            }
        });
    },

    _attachDOMChangeEvent(form_id) {
        const target = document.forms[form_id];
        const observer_config = { childList: true, subtree: true };
        const observer = new MutationObserver( (mutations) => {
            mutations.forEach( (mutation) => {
                if (mutation.addedNodes.length > 0) {
                    // probably new input added, update form data
                    for (let k = 0; k < mutation.addedNodes.length; k++) {
                        let node = mutation.addedNodes[k];
                        if (node.tagName == 'input') {
                            let input = node;
                            this._collection[form_id]._initSingleInput(input);
                            this.__attachSingleChangeEvent(form_id, input);
                        } else {
                            let inputs = node.getElementsByTagName('input');
                            if (inputs.length > 0) {
                                for (let k2 = 0; k2 < inputs.length; k2++) {
                                    let input = inputs[k2];
                                    this._collection[form_id]._initSingleInput(input);
                                    this.__attachSingleChangeEvent(form_id, input);
                                }
                            }
                        }
                    }
                } else if (mutation.removedNodes.length > 0) {
                    // probably input removed, update form data
                    for (let k = 0; k < mutation.removedNodes.length; k++) {
                        let node = mutation.removedNodes[k];
                        if (node.tagName == 'input') {
                            let input = node;
                            this._collection[form_id].remove(input.name, input.value);
                        } else {
                            let inputs = node.getElementsByTagName('input');
                            if (inputs.length > 0) {
                                // input(s) removed from DOM, update form data
                                for (let k2 = 0; k2 < inputs.length; k2++) {
                                    let input = inputs[k2];
                                    this._collection[form_id].remove(input.name, input.value);
                                }
                            }
                        }
                    }
                }
            });
        });
        observer.observe(target, observer_config);
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
     * Actually fires change event and values are set in _attachChangeEvent()
     *
     * @param {string} form_id
     * @param {string} input_name
     * @param {string|Blob|Object} input_value
     */
    set(form_id, input_name, input_value) {
        this._checkInit(form_id);
        //this._collection[form_id].set(input_name, input_value);
        const input = document.forms[form_id].elements[input_name];
        const event = new CustomEvent('change');
        if (input.constructor.name !== 'RadioNodeList') {
            if (input.type === 'file') {
                this._collection[form_id].set(input_name, input_value);
            } else {
                input.value = input_value;
            }
            input.dispatchEvent(event);
            return true;
        } else {
            for (let k = 0; k < input.length; k++) {
                let radio_input = input[k];
                if (radio_input.value === input_value) {
                    input.value = input_value;
                    radio_input.dispatchEvent(event);
                    return true;
                }
            }
            throw new TypeError('Trying to Form.set() on radio with unexisted value="'+input_value+'"');
        }
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
        if (document.forms[form_id].elements[input_name].constructor.name !== 'HTMLInputElement') {
            throw new Error('Cannot mirror radio buttons or checkboxes.')
        }
        if (this._mirrorCollection[form_id] === undefined) {
            this._mirrorCollection[form_id] = {};
        }
        this._mirrorCollection[form_id][input_name] = true;

        const input = document.forms[form_id].elements[input_name];
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
        const inputs = document.forms[form_id].elements;
        [].forEach.call(inputs, (input) => {
            if (document.forms[form_id].elements[input.name].constructor.name === 'HTMLInputElement') {
                // make sure it is normal input and not RadioNodeList or other interfaces
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
        const input = document.forms[form_id].elements[input_name];
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
