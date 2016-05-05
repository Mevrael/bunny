
// FormData polyfill extension for IE/Edge which supports only FormData constructor and append()
/*FormData.prototype.init = function init(form) {

    this._polyfillCollection = {};

    for (var k = 0; k < form.elements.length; k++) {
        var input = form.elements[k];
        if (input.type === 'file') {
            this._polyfillCollection[input.name] = (input.files[0] === null) ? '' : input.files[0];
        } else {
            this._polyfillCollection[input.name] = input.value;
        }
    }
};

if (FormData.prototype.get === undefined) {
    FormData.prototype.get = function get(input_name) {
        if (this._polyfillCollection[input_name] === undefined) {
            return null;
        } else {
            return this._polyfillCollection[input_name];
        }

    };
    FormData.prototype.set = function get(input_name, value) {
        this._polyfillCollection[input_name] = value;
    }
    FormData.prototype.entries = function entries() {
        for (var item in this._polyfillCollection) {

        }
    }
}*/

/**
 * BunnyJS Form component
 * Wraps native FormData API to allow working with same form from multiple closures
 * and adds custom methods to make form processing, including AJAX submit, file uploads and date/times, easier
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
            console.trace();
            throw new Error(`Form with ID ${form_id} not found in DOM!`);
        }
        this._collection[form_id] = new FormData(form);
        //this._collection[form_id].init(form);
        this._attachChangeEvent(form_id);
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
            form_control.addEventListener('change', (e) => {
                if (form_control.type === 'file') {
                    if (e.isTrusted) {
                        // file selected by user
                        const fd = new FormData(document.forms[form_id]);
                        this._collection[form_id].set(form_control.name, fd.get(form_control.name));
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
        });
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
            console.trace();
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
                console.log(input_value);
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
        const data = {};
        /*if (FormData.prototype.get === undefined) {
            for (let item in this._collection[form_id]._polyfillCollection) {
                data[item] = this._collection[form_id]._polyfillCollection[item];
            }
        } else {*/
            const items = this._collection[form_id].entries();
            for (let item of items) {
                data[item[0]] = item[1];
            }
        //}
        return data;
    },

    /**
     * Get native FormData object
     * For example, to submit form with custom handler
     * @param {string} form_id
     * @returns {FormData}
     */
    getFormDataObject(form_id) {
        this._checkInit(form_id);
        return this._collection[form_id];
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
            console.trace();
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

        request.send(this._collection[form_id]);

        return p;
    }

};
