var babelHelpers = {};
babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
};
babelHelpers;

/**
 * Hack in support for Function.name for browsers that don't support it.
 * IE, I'm looking at you.
 **/

(function () {
    if (Function.prototype.name === undefined && Object.defineProperty !== undefined) {
        Object.defineProperty(Function.prototype, 'name', {
            get: function get() {
                console.log(55);
                var funcNameRegex = /function\s([^(]{1,})\(/;
                var results = funcNameRegex.exec(this.toString());
                return results && results.length > 1 ? results[1].trim() : "";
            },
            set: function set(value) {}
        });
    }
})();

/**
 * CustomEvent polyfill for IE 11
 */
(function () {

    if (typeof window.CustomEvent === "function") return false;

    function CustomEvent(event, params) {
        params = params || { bubbles: false, cancelable: false, detail: undefined };
        var evt = document.createEvent('CustomEvent');
        evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
        return evt;
    }

    CustomEvent.prototype = window.Event.prototype;

    window.CustomEvent = CustomEvent;
})();

(function (root) {

  // Store setTimeout reference so promise-polyfill will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var setTimeoutFunc = setTimeout;

  function noop() {}

  // Use polyfill for setImmediate for performance gains
  var asap = typeof setImmediate === 'function' && setImmediate || function (fn) {
    setTimeoutFunc(fn, 1);
  };

  var onUnhandledRejection = function onUnhandledRejection(err) {
    if (typeof console !== 'undefined' && console) {
      console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
    }
  };

  // Polyfill for Function.prototype.bind
  function bind(fn, thisArg) {
    return function () {
      fn.apply(thisArg, arguments);
    };
  }

  function Promise(fn) {
    if (babelHelpers.typeof(this) !== 'object') throw new TypeError('Promises must be constructed via new');
    if (typeof fn !== 'function') throw new TypeError('not a function');
    this._state = 0;
    this._handled = false;
    this._value = undefined;
    this._deferreds = [];

    doResolve(fn, this);
  }

  function handle(self, deferred) {
    while (self._state === 3) {
      self = self._value;
    }
    if (self._state === 0) {
      self._deferreds.push(deferred);
      return;
    }
    self._handled = true;
    asap(function () {
      var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
      if (cb === null) {
        (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
        return;
      }
      var ret;
      try {
        ret = cb(self._value);
      } catch (e) {
        reject(deferred.promise, e);
        return;
      }
      resolve(deferred.promise, ret);
    });
  }

  function resolve(self, newValue) {
    try {
      // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
      if (newValue === self) throw new TypeError('A promise cannot be resolved with itself.');
      if (newValue && ((typeof newValue === 'undefined' ? 'undefined' : babelHelpers.typeof(newValue)) === 'object' || typeof newValue === 'function')) {
        var then = newValue.then;
        if (newValue instanceof Promise) {
          self._state = 3;
          self._value = newValue;
          finale(self);
          return;
        } else if (typeof then === 'function') {
          doResolve(bind(then, newValue), self);
          return;
        }
      }
      self._state = 1;
      self._value = newValue;
      finale(self);
    } catch (e) {
      reject(self, e);
    }
  }

  function reject(self, newValue) {
    self._state = 2;
    self._value = newValue;
    finale(self);
  }

  function finale(self) {
    if (self._state === 2 && self._deferreds.length === 0) {
      setTimeout(function () {
        if (!self._handled) {
          onUnhandledRejection(self._value);
        }
      }, 1);
    }

    for (var i = 0, len = self._deferreds.length; i < len; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }

  function Handler(onFulfilled, onRejected, promise) {
    this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
    this.onRejected = typeof onRejected === 'function' ? onRejected : null;
    this.promise = promise;
  }

  /**
   * Take a potentially misbehaving resolver function and make sure
   * onFulfilled and onRejected are only called once.
   *
   * Makes no guarantees about asynchrony.
   */
  function doResolve(fn, self) {
    var done = false;
    try {
      fn(function (value) {
        if (done) return;
        done = true;
        resolve(self, value);
      }, function (reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      });
    } catch (ex) {
      if (done) return;
      done = true;
      reject(self, ex);
    }
  }

  Promise.prototype['catch'] = function (onRejected) {
    return this.then(null, onRejected);
  };

  Promise.prototype.then = function (onFulfilled, onRejected) {
    var prom = new Promise(noop);
    handle(this, new Handler(onFulfilled, onRejected, prom));
    return prom;
  };

  Promise.all = function (arr) {
    var args = Array.prototype.slice.call(arr);

    return new Promise(function (resolve, reject) {
      if (args.length === 0) return resolve([]);
      var remaining = args.length;

      function res(i, val) {
        try {
          if (val && ((typeof val === 'undefined' ? 'undefined' : babelHelpers.typeof(val)) === 'object' || typeof val === 'function')) {
            var then = val.then;
            if (typeof then === 'function') {
              then.call(val, function (val) {
                res(i, val);
              }, reject);
              return;
            }
          }
          args[i] = val;
          if (--remaining === 0) {
            resolve(args);
          }
        } catch (ex) {
          reject(ex);
        }
      }

      for (var i = 0; i < args.length; i++) {
        res(i, args[i]);
      }
    });
  };

  Promise.resolve = function (value) {
    if (value && (typeof value === 'undefined' ? 'undefined' : babelHelpers.typeof(value)) === 'object' && value.constructor === Promise) {
      return value;
    }

    return new Promise(function (resolve) {
      resolve(value);
    });
  };

  Promise.reject = function (value) {
    return new Promise(function (resolve, reject) {
      reject(value);
    });
  };

  Promise.race = function (values) {
    return new Promise(function (resolve, reject) {
      for (var i = 0, len = values.length; i < len; i++) {
        values[i].then(resolve, reject);
      }
    });
  };

  /**
   * Set the immediate function to execute callbacks
   * @param fn {function} Function to execute
   * @private
   */
  Promise._setImmediateFn = function _setImmediateFn(fn) {
    asap = fn;
  };

  Promise._setUnhandledRejectionFn = function _setUnhandledRejectionFn(fn) {
    onUnhandledRejection = fn;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Promise;
  } else if (!root.Promise) {
    root.Promise = Promise;
  }
})(this);

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
        this._collection[input.name] = input.files[0] === undefined || input.files[0] === null ? '' : input.files[0];
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
        var item = this._collection[input_name];
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
    var _this = this;

    var formData = new FormData();

    var _loop = function _loop(key) {
        if (Array.isArray(_this._collection[key])) {
            _this._collection[key].forEach(function (item) {
                formData.append(key, item);
            });
        } else {
            formData.append(key, _this._collection[key]);
        }
    };

    for (var key in this._collection) {
        _loop(key);
    }
    return formData;
};

// remove instead of delete(). Also can remove element from array
BunnyFormData.prototype.remove = function remove(input_name) {
    var _this2 = this;

    var array_value = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];

    if (array_value !== undefined) {
        // remove element from array
        if (Array.isArray(this._collection[input_name])) {
            (function () {
                var new_array = [];
                _this2._collection[input_name].forEach(function (item) {
                    if (item !== array_value) {
                        new_array.push(item);
                    }
                });
                _this2._collection[input_name] = new_array;
            })();
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
            throw new Error('Form with ID ' + form_id + ' not found in DOM!');
        }
        if (this._collection[form_id] !== undefined) {
            throw new Error('Form with ID ' + form_id + ' already initiated!');
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
    _attachChangeEvent: function _attachChangeEvent(form_id) {
        var _this3 = this;

        [].forEach.call(document.forms[form_id].elements, function (form_control) {
            _this3.__attachSingleChangeEvent(form_id, form_control);
        });
    },
    __attachSingleChangeEvent: function __attachSingleChangeEvent(form_id, form_control) {
        var _this4 = this;

        form_control.addEventListener('change', function (e) {
            if (form_control.type === 'file') {
                if (e.isTrusted) {
                    // file selected by user
                    var fd = new FormData(document.forms[form_id]);
                    _this4._collection[form_id].set(form_control.name, fd.get(form_control.name));
                    // TODO: fix get() not supported for IE
                } else {
                        // file set from script, do nothing because blob was set in Form.set() for File input.
                    }
            } else if (form_control.type === 'radio') {
                    var list = document.forms[form_id].elements[form_control.name];
                    list.value = form_control.value;
                    _this4._collection[form_id].set(form_control.name, form_control.value);
                } else {
                    _this4._collection[form_id].set(form_control.name, form_control.value);
                }

            // update mirror if mirrored
            if (_this4._mirrorCollection[form_id] !== undefined) {
                if (_this4._mirrorCollection[form_id][form_control.name] === true) {
                    _this4.setMirrors(form_id, form_control.name);
                }
            }
        });
    },
    _attachDOMChangeEvent: function _attachDOMChangeEvent(form_id) {
        var _this5 = this;

        var target = document.forms[form_id];
        var observer_config = { childList: true, subtree: true };
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (mutation.addedNodes.length > 0) {
                    // probably new input added, update form data
                    for (var k = 0; k < mutation.addedNodes.length; k++) {
                        var node = mutation.addedNodes[k];
                        if (node.tagName == 'input') {
                            var input = node;
                            _this5._collection[form_id]._initSingleInput(input);
                            _this5.__attachSingleChangeEvent(form_id, input);
                        } else {
                            var inputs = node.getElementsByTagName('input');
                            if (inputs.length > 0) {
                                for (var k2 = 0; k2 < inputs.length; k2++) {
                                    var input = inputs[k2];
                                    _this5._collection[form_id]._initSingleInput(input);
                                    _this5.__attachSingleChangeEvent(form_id, input);
                                }
                            }
                        }
                    }
                } else if (mutation.removedNodes.length > 0) {
                    // probably input removed, update form data
                    for (var k = 0; k < mutation.removedNodes.length; k++) {
                        var node = mutation.removedNodes[k];
                        if (node.tagName == 'input') {
                            var input = node;
                            _this5._collection[form_id].remove(input.name, input.value);
                        } else {
                            var inputs = node.getElementsByTagName('input');
                            if (inputs.length > 0) {
                                // input(s) removed from DOM, update form data
                                for (var k2 = 0; k2 < inputs.length; k2++) {
                                    var input = inputs[k2];
                                    _this5._collection[form_id].remove(input.name, input.value);
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
    initAll: function initAll() {
        var _this6 = this;

        [].forEach.call(document.forms, function (form) {
            _this6.init(form.id);
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
    getFormDataObject: function getFormDataObject(form_id) {
        this._checkInit(form_id);
        return this._collection[form_id].buildFormDataObject();
    },


    /*
     virtual checkbox, item list, tag list, etc methods
     */
    append: function append(form_id, array_name, value) {
        this._checkInit(form_id);
        var formData = this._collection[form_id];
        formData.append(array_name, value);
    },
    remove: function remove(form_id, array_name) {
        var value = arguments.length <= 2 || arguments[2] === undefined ? undefined : arguments[2];

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
    mirror: function mirror(form_id, input_name) {
        var _this7 = this;

        this._checkInit(form_id);
        if (document.forms[form_id].elements[input_name].constructor.name !== 'HTMLInputElement') {
            throw new Error('Cannot mirror radio buttons or checkboxes.');
        }
        if (this._mirrorCollection[form_id] === undefined) {
            this._mirrorCollection[form_id] = {};
        }
        this._mirrorCollection[form_id][input_name] = true;

        var input = document.forms[form_id].elements[input_name];
        this.setMirrors(form_id, input_name);
        input.addEventListener('change', function () {
            _this7.setMirrors(form_id, input_name);
        });
    },


    /**
     * Mirrors all inputs of form
     * Does not mirror radio buttons and checkboxes
     * See Form.mirror() for detailed description
     * @param form_id
     */
    mirrorAll: function mirrorAll(form_id) {
        var _this8 = this;

        this._checkInit(form_id);
        var inputs = document.forms[form_id].elements;
        [].forEach.call(inputs, function (input) {
            if (document.forms[form_id].elements[input.name].constructor.name === 'HTMLInputElement') {
                // make sure it is normal input and not RadioNodeList or other interfaces
                _this8.mirror(form_id, input.name);
            }
        });
    },
    getMirrors: function getMirrors(form_id, input_name) {
        this._checkInit(form_id);
        return document.querySelectorAll('[data-mirror="' + form_id + '.' + input_name + '"]');
    },
    setMirrors: function setMirrors(form_id, input_name) {
        var _this9 = this;

        this._checkInit(form_id);
        var mirrors = this.getMirrors(form_id, input_name);
        var input = document.forms[form_id].elements[input_name];
        [].forEach.call(mirrors, function (mirror) {
            if (mirror.tagName === 'IMG') {
                var data = _this9.get(form_id, input_name);
                if (data !== '' && data.size !== 0) {
                    mirror.src = URL.createObjectURL(_this9.get(form_id, input_name));
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
        var _this10 = this;

        var request = new XMLHttpRequest();
        var p = new Promise(function (success, fail) {
            request.onload = function () {
                if (request.status === 200) {
                    var blob = request.response;
                    _this10.set(form_id, input_name, blob);
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

        request.send(this.getFormDataObject(form_id));

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

var counter = 1;

document.getElementById('add').addEventListener('click', function () {
    var input = document.createElement('input');
    input.type = 'text';
    input.name = 'custom_input';
    input.value = counter++;
    var close = document.createElement('a');
    close.classList.add('btn');
    close.classList.add('btn-danger');
    close.textContent = 'Delete';
    var div = document.createElement('div');
    div.appendChild(input);
    div.appendChild(close);
    close.addEventListener('click', function () {
        document.forms.form1.removeChild(div);
    });
    document.forms.form1.appendChild(div);
});