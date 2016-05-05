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
var Form = {

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
    init: function init(form_id) {
        var form = document.forms[form_id];
        if (form === undefined) {
            console.trace();
            throw new Error('Form with ID ' + form_id + ' not found in DOM!');
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
    _attachChangeEvent: function _attachChangeEvent(form_id) {
        var _this = this;

        [].forEach.call(document.forms[form_id].elements, function (form_control) {
            form_control.addEventListener('change', function (e) {
                if (form_control.type === 'file') {
                    if (e.isTrusted) {
                        // file selected by user
                        var fd = new FormData(document.forms[form_id]);
                        _this._collection[form_id].set(form_control.name, fd.get(form_control.name));
                    } else {
                        // file set from script, do nothing because blob was set in Form.set() for File input.
                    }
                } else if (form_control.type === 'radio') {
                        var list = document.forms[form_id].elements[form_control.name];
                        list.value = form_control.value;
                        _this._collection[form_id].set(form_control.name, form_control.value);
                    } else {
                        _this._collection[form_id].set(form_control.name, form_control.value);
                    }

                // update mirror if mirrored
                if (_this._mirrorCollection[form_id] !== undefined) {
                    if (_this._mirrorCollection[form_id][form_control.name] === true) {
                        _this.setMirrors(form_id, form_control.name);
                    }
                }
            });
        });
    },


    /**
     * Init all forms in DOM
     * Must be called after DOMContentLoaded (ready)
     */
    initAll: function initAll() {
        var _this2 = this;

        [].forEach.call(document.forms, function (form) {
            _this2.init(form.id);
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
    _checkInit: function _checkInit(form_id) {
        if (this._collection[form_id] === undefined) {
            console.trace();
            throw new Error('Form with ID ' + form_id + ' is not initiated! Init form with Form.init(form_id) first.');
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
    set: function set(form_id, input_name, input_value) {
        this._checkInit(form_id);
        //this._collection[form_id].set(input_name, input_value);
        var input = document.forms[form_id].elements[input_name];
        var event = new CustomEvent('change');
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
            for (var k = 0; k < input.length; k++) {
                var radio_input = input[k];
                if (radio_input.value === input_value) {
                    input.value = input_value;
                    radio_input.dispatchEvent(event);
                    return true;
                }
            }
            throw new TypeError('Trying to Form.set() on radio with unexisted value="' + input_value + '"');
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
    get: function get(form_id, input_name) {
        this._checkInit(form_id);
        return this._collection[form_id].get(input_name);
    },


    /**
     * Get all form input values as key - value object
     * @param form_id
     * @returns {object}
     */
    getAll: function getAll(form_id) {
        this._checkInit(form_id);
        var data = {};
        /*if (FormData.prototype.get === undefined) {
            for (let item in this._collection[form_id]._polyfillCollection) {
                data[item] = this._collection[form_id]._polyfillCollection[item];
            }
        } else {*/
        var items = this._collection[form_id].entries();
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = items[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var item = _step.value;

                data[item[0]] = item[1];
            }
            //}
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return data;
    },


    /**
     * Get native FormData object
     * For example, to submit form with custom handler
     * @param {string} form_id
     * @returns {FormData}
     */
    getFormDataObject: function getFormDataObject(form_id) {
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
    mirror: function mirror(form_id, input_name) {
        var _this3 = this;

        this._checkInit(form_id);
        if (document.forms[form_id].elements[input_name].constructor.name !== 'HTMLInputElement') {
            console.trace();
            throw new Error('Cannot mirror radio buttons or checkboxes.');
        }
        if (this._mirrorCollection[form_id] === undefined) {
            this._mirrorCollection[form_id] = {};
        }
        this._mirrorCollection[form_id][input_name] = true;

        var input = document.forms[form_id].elements[input_name];
        this.setMirrors(form_id, input_name);
        input.addEventListener('change', function () {
            _this3.setMirrors(form_id, input_name);
        });
    },


    /**
     * Mirrors all inputs of form
     * Does not mirror radio buttons and checkboxes
     * See Form.mirror() for detailed description
     * @param form_id
     */
    mirrorAll: function mirrorAll(form_id) {
        var _this4 = this;

        this._checkInit(form_id);
        var inputs = document.forms[form_id].elements;
        [].forEach.call(inputs, function (input) {
            if (document.forms[form_id].elements[input.name].constructor.name === 'HTMLInputElement') {
                // make sure it is normal input and not RadioNodeList or other interfaces
                _this4.mirror(form_id, input.name);
            }
        });
    },
    getMirrors: function getMirrors(form_id, input_name) {
        this._checkInit(form_id);
        return document.querySelectorAll('[data-mirror="' + form_id + '.' + input_name + '"]');
    },
    setMirrors: function setMirrors(form_id, input_name) {
        var _this5 = this;

        this._checkInit(form_id);
        var mirrors = this.getMirrors(form_id, input_name);
        var input = document.forms[form_id].elements[input_name];
        [].forEach.call(mirrors, function (mirror) {
            if (mirror.tagName === 'IMG') {
                var data = _this5.get(form_id, input_name);
                if (data !== '' && data.size !== 0) {
                    mirror.src = URL.createObjectURL(_this5.get(form_id, input_name));
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
    setFileFromUrl: function setFileFromUrl(form_id, input_name, url) {
        var _this6 = this;

        var request = new XMLHttpRequest();
        var p = new Promise(function (success, fail) {
            request.onload = function () {
                if (request.status === 200) {
                    var blob = request.response;
                    _this6.set(form_id, input_name, blob);
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

    submit: function submit(form_id) {
        var url = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
        var method = arguments.length <= 2 || arguments[2] === undefined ? 'POST' : arguments[2];
        var headers = arguments.length <= 3 || arguments[3] === undefined ? { 'X-Requested-With': 'XMLHttpRequest' } : arguments[3];

        this._checkInit(form_id);
        var request = new XMLHttpRequest();
        if (url === null) {
            if (document.forms[form_id].hasAttribute('action')) {
                url = document.forms[form_id].getAttribute('action');
            } else {
                //throw new Error('Form.submit() is missing 2nd URL argument');
                url = '';
            }
        }

        request.open(method, url);

        var p = new Promise(function (success, fail) {
            request.onload = function () {
                if (request.status === 200) {
                    success(request.responseText);
                } else {
                    fail(request);
                }
            };
        });

        for (var header in headers) {
            request.setRequestHeader(header, headers[header]);
        }

        this._collection[form_id].set('categories', [2, 3]);

        request.send(this._collection[form_id]);

        return p;
    }
};

Form.initAll();
Form.mirrorAll('form1');
//Form.calcMirrorAll('form2');

var link = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/400px-Google_2015_logo.svg.png';

document.forms[0].addEventListener('submit', function (e) {
    e.preventDefault();

    Form.setFileFromUrl('form1', 'photo', link).then(function (blob) {
        Form.submit(document.forms[0].id).then(function (responseData) {
            console.log('ok');
        }).catch(function (response) {
            console.log('fail');
        });
    }).catch(function (e) {
        console.log(e);
    });
});