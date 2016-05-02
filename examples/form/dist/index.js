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
        this._attachChangeEvent(form_id);
        this._collection[form_id] = new FormData(form);
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

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            var _loop = function _loop() {
                var form_control = _step.value;

                form_control.addEventListener('change', function () {
                    if (form_control.type === 'file') {
                        var fd = new FormData(document.forms[form_id]);
                        _this._collection[form_id].set(form_control.id, fd.get(form_control.name));
                    } else {
                        _this._collection[form_id].set(form_control.id, form_control.value);
                    }
                });
            };

            for (var _iterator = document.forms[form_id].elements[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                _loop();
            }
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
    },

    /**
     * Init all forms in DOM
     * Must be called after DOMContentLoaded (ready)
     */
    initAll: function initAll() {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
            for (var _iterator2 = document.forms[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var form = _step2.value;

                this.init(form.id);
            }
        } catch (err) {
            _didIteratorError2 = true;
            _iteratorError2 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion2 && _iterator2.return) {
                    _iterator2.return();
                }
            } finally {
                if (_didIteratorError2) {
                    throw _iteratorError2;
                }
            }
        }
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
     *
     * @param {string} form_id
     * @param {string} input_name
     * @param {string|Blob|Object} input_value
     */
    set: function set(form_id, input_name, input_value) {
        this._checkInit(form_id);
        this._collection[form_id].set(input_name, input_value);
        // update input value if input is in DOM and not file input
        if (document.forms[form_id].elements[input_name] !== undefined && document.forms[form_id].elements[input_name].type !== 'file') {
            document.forms[form_id].elements[input_name].value = input_value;
        }
        // update mirror if mirrored
        if (this._mirrorCollection[form_id] !== undefined) {
            if (this._mirrorCollection[form_id][input_name] === true) {
                this.setMirrors(form_id, input_name);
            }
        }
        // update calc mirrors if mirrored
        /*if (this._calcMirrorCollection[form_id] !== undefined) {
            if (this._calcMirrorCollection[form_id][input_name] !== undefined) {
                for(let input2name in this._calcMirrorCollection[form_id][input_name]) {
                    this._calcMirrorCollection[form_id][input_name][input2name].textContent = input_value * document.forms[form_id].elements[input2name].value;
                }
            }
        }*/
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
        var items = this._collection[form_id].entries();
        var data = {};
        var _iteratorNormalCompletion3 = true;
        var _didIteratorError3 = false;
        var _iteratorError3 = undefined;

        try {
            for (var _iterator3 = items[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var item = _step3.value;

                data[item[0]] = item[1];
            }
        } catch (err) {
            _didIteratorError3 = true;
            _iteratorError3 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion3 && _iterator3.return) {
                    _iterator3.return();
                }
            } finally {
                if (_didIteratorError3) {
                    throw _iteratorError3;
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
        var _this2 = this;

        this._checkInit(form_id);
        if (this._mirrorCollection[form_id] === undefined) {
            this._mirrorCollection[form_id] = {};
        }
        this._mirrorCollection[form_id][input_name] = true;

        var input = document.forms[form_id].elements[input_name];
        this.setMirrors(form_id, input_name);
        input.addEventListener('change', function () {
            _this2.setMirrors(form_id, input_name);
        });
    },

    /**
     * Mirrors all inputs of form
     * See Form.mirror() for detailed description
     * @param form_id
     */
    mirrorAll: function mirrorAll(form_id) {
        this._checkInit(form_id);
        var inputs = document.forms[form_id].elements;
        var _iteratorNormalCompletion4 = true;
        var _didIteratorError4 = false;
        var _iteratorError4 = undefined;

        try {
            for (var _iterator4 = inputs[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                var input = _step4.value;

                this.mirror(form_id, input.name);
            }
        } catch (err) {
            _didIteratorError4 = true;
            _iteratorError4 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion4 && _iterator4.return) {
                    _iterator4.return();
                }
            } finally {
                if (_didIteratorError4) {
                    throw _iteratorError4;
                }
            }
        }
    },
    getMirrors: function getMirrors(form_id, input_name) {
        this._checkInit(form_id);
        return document.querySelectorAll('[data-mirror="' + form_id + '.' + input_name + '"]');
    },
    setMirrors: function setMirrors(form_id, input_name) {
        console.log('Setting mirrors for ' + input_name);
        this._checkInit(form_id);
        var mirrors = this.getMirrors(form_id, input_name);
        var input = document.forms[form_id].elements[input_name];
        var _iteratorNormalCompletion5 = true;
        var _didIteratorError5 = false;
        var _iteratorError5 = undefined;

        try {
            for (var _iterator5 = mirrors[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                var mirror = _step5.value;

                if (mirror.tagName === 'IMG') {
                    var data = this.get(form_id, input_name);
                    if (data !== '') {
                        mirror.src = URL.createObjectURL(this.get(form_id, input_name));
                    }
                } else {
                    mirror.textContent = input.value;
                }
            }
        } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion5 && _iterator5.return) {
                    _iterator5.return();
                }
            } finally {
                if (_didIteratorError5) {
                    throw _iteratorError5;
                }
            }
        }
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
        var _this3 = this;

        var request = new XMLHttpRequest();
        var p = new Promise(function (success, fail) {
            request.onload = function () {
                if (request.status === 200) {
                    var blob = request.response;
                    _this3.set(form_id, input_name, blob);
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

        request.send(this._collection[form_id]);

        return p;
    }
};

Form.initAll();
Form.mirrorAll('form1');
//Form.calcMirrorAll('form2');

document.forms[0].addEventListener('submit', function (e) {
    e.preventDefault();

    Form.setFileFromUrl(document.forms[0].id, 'photo', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/400px-Google_2015_logo.svg.png').then(function (blob) {
        Form.submit(document.forms[0].id).then(function (responseData) {
            console.log(responseData);
        }).catch(function (response) {
            console.log(response);
        });
    });
});