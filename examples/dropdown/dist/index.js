(function (global) {

  //
  // Check for native Promise and it has correct interface
  //

  var NativePromise = global['Promise'];
  var nativePromiseSupported = NativePromise &&
  // Some of these methods are missing from
  // Firefox/Chrome experimental implementations
  'resolve' in NativePromise && 'reject' in NativePromise && 'all' in NativePromise && 'race' in NativePromise &&
  // Older version of the spec had a resolver object
  // as the arg rather than a function
  function () {
    var resolve;
    new NativePromise(function (r) {
      resolve = r;
    });
    return typeof resolve === 'function';
  }();

  //
  // export if necessary
  //

  if (typeof exports !== 'undefined' && exports) {
    // node.js
    exports.Promise = nativePromiseSupported ? NativePromise : Promise;
    exports.Polyfill = Promise;
  } else {
    // AMD
    if (typeof define == 'function' && define.amd) {
      define(function () {
        return nativePromiseSupported ? NativePromise : Promise;
      });
    } else {
      // in browser add to global
      if (!nativePromiseSupported) global['Promise'] = Promise;
    }
  }

  //
  // Polyfill
  //

  var PENDING = 'pending';
  var SEALED = 'sealed';
  var FULFILLED = 'fulfilled';
  var REJECTED = 'rejected';
  var NOOP = function NOOP() {};

  function isArray(value) {
    return Object.prototype.toString.call(value) === '[object Array]';
  }

  // async calls
  var asyncSetTimer = typeof setImmediate !== 'undefined' ? setImmediate : setTimeout;
  var asyncQueue = [];
  var asyncTimer;

  function asyncFlush() {
    // run promise callbacks
    for (var i = 0; i < asyncQueue.length; i++) {
      asyncQueue[i][0](asyncQueue[i][1]);
    } // reset async asyncQueue
    asyncQueue = [];
    asyncTimer = false;
  }

  function asyncCall(callback, arg) {
    asyncQueue.push([callback, arg]);

    if (!asyncTimer) {
      asyncTimer = true;
      asyncSetTimer(asyncFlush, 0);
    }
  }

  function invokeResolver(resolver, promise) {
    function resolvePromise(value) {
      resolve(promise, value);
    }

    function rejectPromise(reason) {
      reject(promise, reason);
    }

    try {
      resolver(resolvePromise, rejectPromise);
    } catch (e) {
      rejectPromise(e);
    }
  }

  function invokeCallback(subscriber) {
    var owner = subscriber.owner;
    var settled = owner.state_;
    var value = owner.data_;
    var callback = subscriber[settled];
    var promise = subscriber.then;

    if (typeof callback === 'function') {
      settled = FULFILLED;
      try {
        value = callback(value);
      } catch (e) {
        reject(promise, e);
      }
    }

    if (!handleThenable(promise, value)) {
      if (settled === FULFILLED) resolve(promise, value);

      if (settled === REJECTED) reject(promise, value);
    }
  }

  function handleThenable(promise, value) {
    var resolved;

    try {
      if (promise === value) throw new TypeError('A promises callback cannot return that same promise.');

      if (value && (typeof value === 'function' || (typeof value === 'undefined' ? 'undefined' : babelHelpers.typeof(value)) === 'object')) {
        var then = value.then; // then should be retrived only once

        if (typeof then === 'function') {
          then.call(value, function (val) {
            if (!resolved) {
              resolved = true;

              if (value !== val) resolve(promise, val);else fulfill(promise, val);
            }
          }, function (reason) {
            if (!resolved) {
              resolved = true;

              reject(promise, reason);
            }
          });

          return true;
        }
      }
    } catch (e) {
      if (!resolved) reject(promise, e);

      return true;
    }

    return false;
  }

  function resolve(promise, value) {
    if (promise === value || !handleThenable(promise, value)) fulfill(promise, value);
  }

  function fulfill(promise, value) {
    if (promise.state_ === PENDING) {
      promise.state_ = SEALED;
      promise.data_ = value;

      asyncCall(publishFulfillment, promise);
    }
  }

  function reject(promise, reason) {
    if (promise.state_ === PENDING) {
      promise.state_ = SEALED;
      promise.data_ = reason;

      asyncCall(publishRejection, promise);
    }
  }

  function publish(promise) {
    var callbacks = promise.then_;
    promise.then_ = undefined;

    for (var i = 0; i < callbacks.length; i++) {
      invokeCallback(callbacks[i]);
    }
  }

  function publishFulfillment(promise) {
    promise.state_ = FULFILLED;
    publish(promise);
  }

  function publishRejection(promise) {
    promise.state_ = REJECTED;
    publish(promise);
  }

  /**
  * @class
  */
  function Promise(resolver) {
    if (typeof resolver !== 'function') throw new TypeError('Promise constructor takes a function argument');

    if (this instanceof Promise === false) throw new TypeError('Failed to construct \'Promise\': Please use the \'new\' operator, this object constructor cannot be called as a function.');

    this.then_ = [];

    invokeResolver(resolver, this);
  }

  Promise.prototype = {
    constructor: Promise,

    state_: PENDING,
    then_: null,
    data_: undefined,

    then: function then(onFulfillment, onRejection) {
      var subscriber = {
        owner: this,
        then: new this.constructor(NOOP),
        fulfilled: onFulfillment,
        rejected: onRejection
      };

      if (this.state_ === FULFILLED || this.state_ === REJECTED) {
        // already resolved, call callback async
        asyncCall(invokeCallback, subscriber);
      } else {
        // subscribe
        this.then_.push(subscriber);
      }

      return subscriber.then;
    },

    'catch': function _catch(onRejection) {
      return this.then(null, onRejection);
    }
  };

  Promise.all = function (promises) {
    var Class = this;

    if (!isArray(promises)) throw new TypeError('You must pass an array to Promise.all().');

    return new Class(function (resolve, reject) {
      var results = [];
      var remaining = 0;

      function resolver(index) {
        remaining++;
        return function (value) {
          results[index] = value;
          if (! --remaining) resolve(results);
        };
      }

      for (var i = 0, promise; i < promises.length; i++) {
        promise = promises[i];

        if (promise && typeof promise.then === 'function') promise.then(resolver(i), reject);else results[i] = promise;
      }

      if (!remaining) resolve(results);
    });
  };

  Promise.race = function (promises) {
    var Class = this;

    if (!isArray(promises)) throw new TypeError('You must pass an array to Promise.race().');

    return new Class(function (resolve, reject) {
      for (var i = 0, promise; i < promises.length; i++) {
        promise = promises[i];

        if (promise && typeof promise.then === 'function') promise.then(resolve, reject);else resolve(promise);
      }
    });
  };

  Promise.resolve = function (value) {
    var Class = this;

    if (value && (typeof value === 'undefined' ? 'undefined' : babelHelpers.typeof(value)) === 'object' && value.constructor === Class) return value;

    return new Class(function (resolve) {
      resolve(value);
    });
  };

  Promise.reject = function (reason) {
    var Class = this;

    return new Class(function (resolve, reject) {
      reject(reason);
    });
  };
})(typeof window != 'undefined' ? window : typeof global != 'undefined' ? global : typeof self != 'undefined' ? self : undefined);

(function () {
    if (typeof Object.assign != 'function') {
        Object.assign = function (target) {
            'use strict';

            if (target == null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }

            target = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var source = arguments[index];
                if (source != null) {
                    for (var key in source) {
                        if (Object.prototype.hasOwnProperty.call(source, key)) {
                            target[key] = source[key];
                        }
                    }
                }
            }
            return target;
        };
    }
})();

(function (self) {
  'use strict';

  if (self.fetch) {
    return;
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && function () {
      try {
        new Blob();
        return true;
      } catch (e) {
        return false;
      }
    }(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  if (support.arrayBuffer) {
    var viewClasses = ['[object Int8Array]', '[object Uint8Array]', '[object Uint8ClampedArray]', '[object Int16Array]', '[object Uint16Array]', '[object Int32Array]', '[object Uint32Array]', '[object Float32Array]', '[object Float64Array]'];

    var isDataView = function isDataView(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj);
    };

    var isArrayBufferView = ArrayBuffer.isView || function (obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
    };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name');
    }
    return name.toLowerCase();
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
      value = String(value);
    }
    return value;
  }

  // Build a destructive iterator for the value list
  function iteratorFor(items) {
    var iterator = {
      next: function next() {
        var value = items.shift();
        return { done: value === undefined, value: value };
      }
    };

    if (support.iterable) {
      iterator[Symbol.iterator] = function () {
        return iterator;
      };
    }

    return iterator;
  }

  function Headers(headers) {
    this.map = {};

    if (headers instanceof Headers) {
      headers.forEach(function (value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function (header) {
        this.append(header[0], header[1]);
      }, this);
    } else if (headers) {
      Object.getOwnPropertyNames(headers).forEach(function (name) {
        this.append(name, headers[name]);
      }, this);
    }
  }

  Headers.prototype.append = function (name, value) {
    name = normalizeName(name);
    value = normalizeValue(value);
    var oldValue = this.map[name];
    this.map[name] = oldValue ? oldValue + ',' + value : value;
  };

  Headers.prototype['delete'] = function (name) {
    delete this.map[normalizeName(name)];
  };

  Headers.prototype.get = function (name) {
    name = normalizeName(name);
    return this.has(name) ? this.map[name] : null;
  };

  Headers.prototype.has = function (name) {
    return this.map.hasOwnProperty(normalizeName(name));
  };

  Headers.prototype.set = function (name, value) {
    this.map[normalizeName(name)] = normalizeValue(value);
  };

  Headers.prototype.forEach = function (callback, thisArg) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(thisArg, this.map[name], name, this);
      }
    }
  };

  Headers.prototype.keys = function () {
    var items = [];
    this.forEach(function (value, name) {
      items.push(name);
    });
    return iteratorFor(items);
  };

  Headers.prototype.values = function () {
    var items = [];
    this.forEach(function (value) {
      items.push(value);
    });
    return iteratorFor(items);
  };

  Headers.prototype.entries = function () {
    var items = [];
    this.forEach(function (value, name) {
      items.push([name, value]);
    });
    return iteratorFor(items);
  };

  if (support.iterable) {
    Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
  }

  function consumed(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'));
    }
    body.bodyUsed = true;
  }

  function fileReaderReady(reader) {
    return new Promise(function (resolve, reject) {
      reader.onload = function () {
        resolve(reader.result);
      };
      reader.onerror = function () {
        reject(reader.error);
      };
    });
  }

  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsArrayBuffer(blob);
    return promise;
  }

  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);
    reader.readAsText(blob);
    return promise;
  }

  function readArrayBufferAsText(buf) {
    var view = new Uint8Array(buf);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }
    return chars.join('');
  }

  function bufferClone(buf) {
    if (buf.slice) {
      return buf.slice(0);
    } else {
      var view = new Uint8Array(buf.byteLength);
      view.set(new Uint8Array(buf));
      return view.buffer;
    }
  }

  function Body() {
    this.bodyUsed = false;

    this._initBody = function (body) {
      this._bodyInit = body;
      if (!body) {
        this._bodyText = '';
      } else if (typeof body === 'string') {
        this._bodyText = body;
      } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
        this._bodyBlob = body;
      } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
        this._bodyFormData = body;
      } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
        this._bodyText = body.toString();
      } else if (support.arrayBuffer && support.blob && isDataView(body)) {
        this._bodyArrayBuffer = bufferClone(body.buffer);
        // IE 10-11 can't handle a DataView body.
        this._bodyInit = new Blob([this._bodyArrayBuffer]);
      } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
        this._bodyArrayBuffer = bufferClone(body);
      } else {
        throw new Error('unsupported BodyInit type');
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
        }
      }
    };

    if (support.blob) {
      this.blob = function () {
        var rejected = consumed(this);
        if (rejected) {
          return rejected;
        }

        if (this._bodyBlob) {
          return Promise.resolve(this._bodyBlob);
        } else if (this._bodyArrayBuffer) {
          return Promise.resolve(new Blob([this._bodyArrayBuffer]));
        } else if (this._bodyFormData) {
          throw new Error('could not read FormData body as blob');
        } else {
          return Promise.resolve(new Blob([this._bodyText]));
        }
      };

      this.arrayBuffer = function () {
        if (this._bodyArrayBuffer) {
          return consumed(this) || Promise.resolve(this._bodyArrayBuffer);
        } else {
          return this.blob().then(readBlobAsArrayBuffer);
        }
      };
    }

    this.text = function () {
      var rejected = consumed(this);
      if (rejected) {
        return rejected;
      }

      if (this._bodyBlob) {
        return readBlobAsText(this._bodyBlob);
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
      } else if (this._bodyFormData) {
        throw new Error('could not read FormData body as text');
      } else {
        return Promise.resolve(this._bodyText);
      }
    };

    if (support.formData) {
      this.formData = function () {
        return this.text().then(decode);
      };
    }

    this.json = function () {
      return this.text().then(JSON.parse);
    };

    return this;
  }

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method;
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read');
      }
      this.url = input.url;
      this.credentials = input.credentials;
      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }
      this.method = input.method;
      this.mode = input.mode;
      if (!body && input._bodyInit != null) {
        body = input._bodyInit;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'omit';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests');
    }
    this._initBody(body);
  }

  Request.prototype.clone = function () {
    return new Request(this, { body: this._bodyInit });
  };

  function decode(body) {
    var form = new FormData();
    body.trim().split('&').forEach(function (bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
    return form;
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    rawHeaders.split(/\r?\n/).forEach(function (line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers;
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = 'status' in options ? options.status : 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

  Body.call(Response.prototype);

  Response.prototype.clone = function () {
    return new Response(this._bodyInit, {
      status: this.status,
      statusText: this.statusText,
      headers: new Headers(this.headers),
      url: this.url
    });
  };

  Response.error = function () {
    var response = new Response(null, { status: 0, statusText: '' });
    response.type = 'error';
    return response;
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function (url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code');
    }

    return new Response(null, { status: status, headers: { location: url } });
  };

  self.Headers = Headers;
  self.Request = Request;
  self.Response = Response;

  self.fetch = function (input, init) {
    return new Promise(function (resolve, reject) {
      var request = new Request(input, init);
      var xhr = new XMLHttpRequest();

      xhr.onload = function () {
        var options = {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function () {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function () {
        reject(new TypeError('Network request failed'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function (value, name) {
        xhr.setRequestHeader(name, value);
      });

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    });
  };
  self.fetch.polyfill = true;
})(typeof self !== 'undefined' ? self : undefined);

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

// Polyfill for IE 9-11 classList on <svg> elements
if (Object.getOwnPropertyDescriptor(Element.prototype, 'classList') === undefined) {
  Object.defineProperty(Element.prototype, 'classList', Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'classList'));
}

function ready(callback) {
    if (document.readyState !== 'loading') {
        callback();
    } else {
        document.addEventListener('DOMContentLoaded', function () {
            callback();
        });
    }
}

(function () {
    window.KEY_BACKSPACE = 8;
    window.KEY_TAB = 9;
    window.KEY_ENTER = 13;
    window.KEY_SHIFT = 16;
    window.KEY_CTRL = 17;
    window.KEY_ALT = 18;
    window.KEY_ESCAPE = 27;
    window.KEY_SPACE = 32;
    window.KEY_PAGE_UP = 33;
    window.KEY_PAGE_DOWN = 34;
    window.KEY_ARROW_LEFT = 37;
    window.KEY_ARROW_UP = 38;
    window.KEY_ARROW_RIGHT = 39;
    window.KEY_ARROW_DOWN = 40;
    window.KEY_DELETE = 46;
})();

//import {BunnyElement} from "../../BunnyElement";

/**
 * Adds event listener to element and stores a function in this element's custom property
 * and returns unique ID which can be used to remove event listener later
 * even anonymous functions, component methods, functions with arguments
 *
 * Simple example:
 *
 * const Component = {
 *      docBodyClickEventId: null,
 *      anonymousEventId: null,
 *
 *      init(param1, param2) {
 *          this.docBodyClickEventId = addEvent(document.body, 'click', this.bodyClicked.bind(this, param1, param2));
 *
 *          this.anonymousEventId = addEvent(document.body, 'click', e => {
 *              console.log(e)
 *          });
 *      },
 *
 *      destroy() {
 *          this.docBodyClickEventId = removeEvent(document.body, 'click', this.docBodyClickEventId);
 *
 *          this.anonymousEventId = removeEvent(document.body, 'click', this.anonymousEventId)'
 *      },
 *
 *      bodyClicked(param1, param2) {
 *          console.log(this.internalAction(param1, param2));
 *      },
 *
 *      internalAction(param1, param2) {
 *          return param1 + param2;
 *      }
 * }
 *
 * @param {HTMLElement} element
 * @param {String} eventName
 * @param {Function} eventListener
 *
 * @returns {Number}
 */
function addEvent(element, eventName, eventListener) {
  if (element.__bunny_event_handlers === undefined) {
    element.__bunny_event_handlers = {
      handlers: {},
      counter: 0
    };
  }
  element.__bunny_event_handlers.handlers[element.__bunny_event_handlers.counter] = eventListener;
  element.addEventListener(eventName, element.__bunny_event_handlers.handlers[element.__bunny_event_handlers.counter]);
  element.__bunny_event_handlers.counter++;
  return element.__bunny_event_handlers.counter - 1;
}

/**
 * Remove event listener
 *
 * @param {HTMLElement} element
 * @param {String} eventName
 * @param {Number} eventIndex
 *
 * @returns {null}
 */
function removeEvent(element, eventName, eventIndex) {
  if (element.__bunny_event_handlers !== undefined && element.__bunny_event_handlers.handlers[eventIndex] !== undefined) {
    element.removeEventListener(eventName, element.__bunny_event_handlers.handlers[eventIndex]);
    delete element.__bunny_event_handlers.handlers[eventIndex];
    // do not decrement counter, each new event handler should have next unique index
  }
  return null;
}

/**
 * Call event listener only once after "delay" ms
 * Useful for scroll, keydown and other events
 * when the actions must be done only once
 * when user stopped typing or scrolling for example
 *
 * @param {HTMLElement} element
 * @param {String} eventName
 * @param {Function} eventListener
 * @param {Number} delay
 * @returns {Number}
 */
function addEventOnce(element, eventName, eventListener) {
  var delay = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 500;

  var timeout = 0;
  return addEvent(element, eventName, function (e) {
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      eventListener(e);
    }, delay);
  });
}

function isEventCursorInside(e, element) {
  var bounds = element.getBoundingClientRect();
  return e.clientX > bounds.left && e.clientX < bounds.right && e.clientY > bounds.top && e.clientY < bounds.bottom;
}

function onClickOutside(element, callback) {
  if (document.__bunny_core_outside_callbacks === undefined) {
    document.__bunny_core_outside_callbacks = [];
  }
  var handler = function handler(event) {
    var target = event.target;
    var bTargetExists = document.contains(target) !== false;
    var bTargetIsElOrChild = event.target === element || element.contains(event.target);
    if (bTargetExists && !bTargetIsElOrChild) {
      callback(event);
    }
  };

  if (element.__bunny_core_outside_callbacks === undefined) {
    element.__bunny_core_outside_callbacks = [];
  }
  element.__bunny_core_outside_callbacks.push(handler);
  document.__bunny_core_outside_callbacks.push(handler);

  if (document.__bunny_core_outside_handler === undefined) {
    document.__bunny_core_outside_handler = function (event) {
      document.__bunny_core_outside_callbacks.forEach(function (callback) {
        callback(event);
      });
    };
    document.addEventListener('click', document.__bunny_core_outside_handler);
    document.addEventListener('touchstart', document.__bunny_core_outside_handler);
  }

  return handler;
}

function removeClickOutside(element, callback) {
  if (document.__bunny_core_outside_callbacks !== undefined) {
    var index = document.__bunny_core_outside_callbacks.indexOf(callback);
    if (index !== -1) {
      document.__bunny_core_outside_callbacks.splice(index, 1);
      if (document.__bunny_core_outside_callbacks.length === 0) {
        document.removeEventListener('click', document.__bunny_core_outside_handler);
        document.removeEventListener('touchstart', document.__bunny_core_outside_handler);
        delete document.__bunny_core_outside_handler;
      }
    }
  }

  if (element.__bunny_core_outside_callbacks !== undefined) {
    var _index = element.__bunny_core_outside_callbacks.indexOf(callback);
    if (_index !== -1) {
      element.__bunny_core_outside_callbacks.splice(_index, 1);
    }
  }
}

/**
 * Adds up, down, esc, enter keypress event on 'element' to traverse though 'items'
 *
 * @param {HTMLElement} element
 * @param {HTMLCollection|NodeList} items
 * @param {function} itemSelectCallback
 *   callback(null) if Enter was pressed and no item was selected (for example custom value entered)
 *   callback(false) if Esc was pressed (canceled)
 *   callback({HTMLElement} item) - selected item on Enter
 * @param {function} itemSwitchCallback = null
 *   callback({HTMLElement} item) - new item on arrow up/down
 *
 * @returns {function(*)}
 */
function addEventKeyNavigation(element, items, itemSelectCallback) {
  var itemSwitchCallback = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;


  var currentItemIndex = null;
  for (var k = 0; k < items.length; k++) {
    if (items[k].hasAttribute('aria-selected')) {
      currentItemIndex = k;
      break;
    }
  }

  /*let currentActiveItems = [];
  for (let k = 0; k < items.length; k++) {
    if (items[k].classList.contains(activeClass)) {
      currentActiveItems.push(items[k]);
    }
  }*/

  var _itemAdd = function _itemAdd() {
    items[currentItemIndex].focus();
    //items[currentItemIndex].classList.add(activeClass);
    //items[currentItemIndex].setAttribute('aria-selected', 'true');
    /*if (!BunnyElement.isInViewport(items[currentItemIndex])) {
      BunnyElement.scrollTo(items[currentItemIndex], 400, -200);
    }*/
    //items[currentItemIndex].scrollIntoView(false);
    if (itemSwitchCallback !== null) {
      itemSwitchCallback(items[currentItemIndex]);
    }
  };

  var _itemRemove = function _itemRemove() {
    //items[currentItemIndex].classList.remove(activeClass);
    //items[currentItemIndex].removeAttribute('aria-selected');
  };

  var handler = function handler(e) {
    var c = e.keyCode;

    var maxItemIndex = items.length - 1;

    if (c === KEY_ENTER || c === KEY_SPACE) {
      e.preventDefault();
      if (currentItemIndex !== null) {
        items[currentItemIndex].click();
        itemSelectCallback(items[currentItemIndex]);
      } else {
        itemSelectCallback(null);
      }
    } else if (c === KEY_ESCAPE) {
      e.preventDefault();
      /*for (let k = 0; k < items.length; k++) {
        if (currentActiveItems.indexOf(items[k]) === -1) {
          // remove active state
          items[k].classList.remove(activeClass);
          items[k].removeAttribute('aria-selected');
        } else {
          // set active state
          items[k].classList.add(activeClass);
          items[k].setAttribute('aria-selected', 'true');
        }
      }*/
      itemSelectCallback(false);
    } else if (c === KEY_ARROW_UP || c === KEY_ARROW_LEFT) {
      e.preventDefault();
      if (currentItemIndex !== null && currentItemIndex > 0) {
        _itemRemove();
        currentItemIndex -= 1;
        _itemAdd();
      }
    } else if (c === KEY_ARROW_DOWN || c === KEY_ARROW_RIGHT) {
      e.preventDefault();
      if (currentItemIndex === null) {
        currentItemIndex = 0;
        _itemAdd();
      } else if (currentItemIndex < maxItemIndex) {
        _itemRemove();
        currentItemIndex += 1;
        _itemAdd();
      }
    }
  };

  if (items.length > 0) {
    element.addEventListener('keydown', handler);
  }

  return handler;
}

function removeEventKeyNavigation(element, handler) {
  element.removeEventListener('keydown', handler);
}

function htmlToNode(html) {
  var e = document.createElement('div');
  e.innerHTML = html;
  return e.firstElementChild;
}

function appendHtml(parent, html) {
  parent.appendChild(htmlToNode(html));
}

/**
 * Parses <template> contents by ID and replaces all {{ var }} inside
 * Second param should be an object of var keys => var values
 * If second params is an Array of Objects, returns DocumentFragment
 * Else - Node
 *
 * @param {String} id
 * @param {Object|Array} data
 * @returns {Node|DocumentFragment} node
 */
function parseTemplate(id, data) {
  var node = null;
  var template = document.getElementById(id);
  var tpl = template.content.firstElementChild.outerHTML;

  var getDataByPath = function getDataByPath(obj, path) {
    var parts = path.split('.');
    var cur = obj;
    for (var k = 0; k < parts.length; k++) {
      var part = parts[k];
      if (cur[part] === undefined) {
        return null;
      } else if (cur[part] === null || cur[part].length === 0) {
        return '';
      } else {
        cur = cur[part];
      }
    }
    return cur;
  };

  var parseRow = function parseRow(originalTpl, rowData) {
    var newTpl = originalTpl;
    newTpl = newTpl.replace(/{{ ([a-zA-Z0-9\-._]*) }}/g, function (match, capture) {
      var res = getDataByPath(rowData, capture);
      return res === null ? match : res;
    });

    var node = htmlToNode(newTpl);
    if (node.tagName === 'TABLE') {
      node = node.rows[0];
    }

    if (template._handlers !== undefined) {
      for (var handlerName in template._handlers) {
        var el = node.querySelector('[handler="' + handlerName + '"]');
        template._handlers[handlerName](el);
      }
    }

    return node;
  };

  if (Array.isArray(data)) {
    node = document.createDocumentFragment();
    data.forEach(function (row) {
      node.appendChild(parseRow(tpl, row));
    });
  } else {
    node = parseRow(tpl, data);
  }

  return node;
}

function registerTemplateHandlers(id, handlers) {
  var tpl = document.getElementById(id);
  if (tpl._handlers === undefined) {
    tpl._handlers = {};
  }
  Object.assign(tpl._handlers, handlers);
}

function makeAccessible(element) {
  var tabIndex = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  var role = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'button';

  element.setAttribute('tabindex', tabIndex);
  element.setAttribute('role', role);
  element.addEventListener('keydown', function (e) {
    if (e.keyCode === KEY_ENTER || e.keyCode === KEY_SPACE) {
      element.click();
    }
  });
}

function isElementInside(parentElement, childElement) {
  var x = childElement;
  while (x = x.parentElement) {
    if (x === parentElement) return true;
  }
  return false;
}

function getActionObject(element) {
  var action = element.getAttribute('action');
  var parts = action.split('.');
  var Model = parts[0];
  var actionObject = null;
  if (parts[1] === undefined) {
    actionObject = window[Model];
  } else {
    var searchAction = parts[1];
    try {
      actionObject = window[Model][searchAction].bind(window[Model]);
    } catch (e) {}
  }

  if (actionObject === undefined) {
    throw new Error('Bunny Error: Model search action specified in action="' + action + '" attribute not found');
  }
  return actionObject;
}

function initObjectExtensions(obj, arg) {
  var keys = Object.keys(obj);
  keys.forEach(function (key) {
    if (key.indexOf('init') === 0) {
      obj[key](arg);
    }
  });
}

function pushToElementProperty(element, property, value) {
  if (element[property] === undefined) {
    element[property] = [];
  }
  element[property].push(value);
}

function pushCallbackToElement(element, namespace, callback) {
  pushToElementProperty(element, '__bunny_' + namespace + '_callbacks', callback);
}

function callElementCallbacks(element, namespace, cb) {
  var callbacks = element['__bunny_' + namespace + '_callbacks'];
  if (callbacks !== undefined) {

    // process each promise in direct order
    // if promise returns false, do not execute further promises
    var checkPromise = function checkPromise(index) {
      var res = cb(callbacks[index]); // actually calling callback
      if (res instanceof Promise) {
        res.then(function (cbRes) {
          if (cbRes !== false) {
            // keep going
            if (index > 0) {
              checkPromise(index - 1);
            }
          }
        });
      } else {
        if (res !== false) {
          // keep going
          if (index > 0) {
            checkPromise(index - 1);
          }
        }
      }
    };

    checkPromise(callbacks.length - 1);
  }
}

var DropdownConfig = {

  // true - use tag names to determine component elements instead of div . class names;
  // false - use class names. Elements with class names must have <div> tag name
  useTagNames: false,

  // when using DropdownUI to create new elements
  // true - add class names to new elements
  // false - do not add classes
  factoryAddClassNames: true,
  factoryAltClassNameMenu: 'w-100',

  useHiddenAttribute: false, // true - use 'hidden' HTML5 attr; false - use classNameOpened instead

  tagName: 'dropdown',
  tagNameToggleBtn: 'button',
  tagNameMenu: 'menu',
  tagNameItem: 'item',

  className: 'dropdown',
  classNameToggleBtn: 'dropdown-toggle',
  classNameMenu: 'dropdown-menu',
  classNameItem: 'dropdown-item',
  classNameActive: 'active',

  roleMenu: 'menu',
  roleMenuItem: 'menuitem',

  additionalClassNameMenu: 'w-100',

  classNameOpened: 'open',
  applyOpenedClassToDropdown: true // false - apply to menu

};

var DropdownUI = {

  Config: DropdownConfig,

  _getElement: function _getElement(dropdown, name) {
    if (this.Config.useTagNames) {
      return dropdown.getElementsByTagName(this.Config['tagName' + name])[0] || false;
    }
    return dropdown.getElementsByClassName(this.Config['className' + name])[0] || false;
  },
  _createElement: function _createElement(name) {
    var el = null;
    if (this.Config.useTagNames) {
      el = document.createElement(this.Config['tagName' + name]);
      // if element is a <button>, add type="button" to avoid form submit if dropdown inside a <form>
      if (this.Config['tagName' + name] === 'button') {
        el.setAttribute('type', 'button');
      }
    } else {
      el = document.createElement('div');
    }
    if (this.Config.factoryAddClassNames) {
      el.classList.add(this.Config['className' + name]);
    }
    return el;
  },
  getToggleBtn: function getToggleBtn(dropdown) {
    var children = dropdown.children;
    for (var k = 0; k < children.length; k++) {
      if (children[k].tagName === this.Config.tagNameToggleBtn.toUpperCase()) {
        return children[k];
      }
    }
    if (dropdown.classList.contains(this.Config.classNameToggleBtn)) {
      return dropdown;
    }
    return dropdown.getElementsByClassName(this.Config.classNameToggleBtn)[0] || false;
  },
  getTriggerElement: function getTriggerElement(dropdown) {
    return this.getToggleBtn(dropdown);
  },
  getMenu: function getMenu(dropdown) {
    return this._getElement(dropdown, 'Menu');
  },
  createMenu: function createMenu() {
    var menu = this._createElement('Menu');
    if (this.Config.factoryAltClassNameMenu) {
      menu.classList.add(this.Config.factoryAltClassNameMenu);
    }
    return menu;
  },
  removeMenu: function removeMenu(dropdown) {
    var menu = this.getMenu(dropdown);
    if (menu) {
      menu.parentNode.removeChild(menu);
    }
  },
  getMenuItems: function getMenuItems(dropdown) {
    var menu = this.getMenu(dropdown);
    if (!menu) {
      return [];
    }
    var queryStr = '';
    if (this.Config.useTagNames) {
      queryStr += this.Config.tagNameItem;
    } else {
      queryStr += '.' + this.Config.classNameItem;
    }
    queryStr += ', [role="menuitem"]';
    return menu.querySelectorAll(queryStr);
  },
  isMenuItem: function isMenuItem(dropdown, item) {
    var items = this.getMenuItems(dropdown);
    for (var k = 0; k < items.length; k++) {
      if (items[k] === item || isElementInside(items[k], item)) {
        return true;
      }
    }

    return false;
  },
  removeMenuItems: function removeMenuItems(dropdown) {
    var menu = this.getMenu(dropdown);
    if (!menu) {
      menu = this.createMenu();
      dropdown.appendChild(menu);
    } else {
      menu.innerHTML = '';
    }
  },
  setMenuItems: function setMenuItems(dropdown, newItems) {
    var menu = this.getMenu(dropdown);
    if (!menu) {
      menu = this.createMenu();
      dropdown.appendChild(menu);
    } else {
      //while (menu.firstChild) menu.removeChild(menu.firstChild);
      menu.innerHTML = '';
    }

    menu.appendChild(newItems);
  },
  getItemValue: function getItemValue(item) {
    if (item === false) {
      return false;
    }
    return item.dataset.value;
  },
  setItemValue: function setItemValue(item, value) {
    item.dataset.value = value;
  },
  createMenuItems: function createMenuItems(items) {
    var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    var f = document.createDocumentFragment();
    for (var id in items) {
      var i = this._createElement('Item');
      i.dataset.value = id;
      if (callback !== null) {
        f.appendChild(callback(i, id, items[id]));
      } else {
        this.setItemValue(i, id);
        i.textContent = items[id];
        f.appendChild(i);
      }
    }
    return f;
  },
  getDropdownByToggleBtn: function getDropdownByToggleBtn(btn) {
    return btn.parentNode;
  },
  getAllDropdowns: function getAllDropdowns() {
    if (this.Config.useTagNames) {
      return document.getElementsByTagName(this.Config.tagName);
    }
    return document.getElementsByClassName(this.Config.className);
  },
  show: function show(dropdown) {
    var trigger = this.getTriggerElement(dropdown);
    if (trigger) {
      trigger.setAttribute('aria-expanded', 'true');
    }

    var menu = this.getMenu(dropdown);
    if (this.Config.useHiddenAttribute) {
      if (menu.hasAttribute('hidden')) {
        menu.removeAttribute('hidden');
        return true;
      }
      return false;
    } else {
      var target = this.Config.applyOpenedClassToDropdown ? dropdown : menu;
      if (!target.classList.contains(this.Config.classNameOpened)) {
        target.classList.add(this.Config.classNameOpened);
        return true;
      }
      return false;
    }
  },
  hide: function hide(dropdown) {

    var menu = this.getMenu(dropdown);
    var classTarget = this.Config.applyOpenedClassToDropdown ? dropdown : menu;
    var closed = false;
    if (this.Config.useHiddenAttribute && !menu.hasAttribute('hidden')) {
      menu.setAttribute('hidden', '');
      closed = true;
    } else if (classTarget.classList.contains(this.Config.classNameOpened)) {
      classTarget.classList.remove(this.Config.classNameOpened);
      closed = true;
    }

    if (closed) {
      var trigger = this.getTriggerElement(dropdown);
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'false');
        // restore focus back to trigger element (toggle button by default)
        // only if menu item was selected
        if (this.isMenuItem(dropdown, document.activeElement)) {
          trigger.focus();
        }
      }
    }
    return closed;
  },


  /**
   *
   * @param {HTMLElement} dropdown
   * @returns {boolean}
   */
  isOpened: function isOpened(dropdown) {
    var menu = this.getMenu(dropdown);
    if (this.Config.useHiddenAttribute) {
      return !menu.hasAttribute('hidden');
    } else {
      var target = this.Config.applyOpenedClassToDropdown ? dropdown : menu;
      return target.classList.contains(this.Config.classNameOpened);
    }
  },
  setItemActive: function setItemActive(item) {
    item.classList.add(this.Config.classNameActive);
    item.setAttribute('aria-selected', 'true');
  },
  setItemInactive: function setItemInactive(item) {
    item.classList.remove(this.Config.classNameActive);
    item.removeAttribute('aria-selected');
  }
};

var Dropdown = {

  UI: DropdownUI,
  Config: DropdownConfig,

  init: function init(dropdown) {
    if (dropdown.__bunny_dropdown !== undefined) {
      return false;
    }
    dropdown.__bunny_dropdown = {};
    this._addToggleClickEvent(dropdown);
    this._setARIA(dropdown);

    initObjectExtensions(this, dropdown);

    return true;
  },
  initAll: function initAll() {
    var _this = this;

    var dropdowns = this.UI.getAllDropdowns();
    [].forEach.call(dropdowns, function (dropdown) {
      _this.init(dropdown);
    });
  },
  isHoverable: function isHoverable(dropdown) {
    return dropdown.hasAttribute('dropdown-hover');
  },
  isClosableOnItemClick: function isClosableOnItemClick(dropdown) {
    return !dropdown.hasAttribute('dropdown-keep-inside');
  },
  open: function open(dropdown) {
    var _this2 = this;

    if (this.UI.show(dropdown)) {
      // add small delay so this handler wouldn't be attached and called immediately
      // with toggle btn click event handler and instantly close dropdown menu
      setTimeout(function () {
        dropdown.__bunny_dropdown_cancel = onClickOutside(dropdown, function () {
          _this2._callCancelCallbacks(dropdown);
          _this2.close(dropdown);
        });
      }, 100);

      var items = this.UI.getMenuItems(dropdown);
      [].forEach.call(items, function (item) {
        item.__bunny_dropdown_click = addEvent(item, 'click', function () {
          _this2._callItemSelectCallbacks(dropdown, item);
          if (_this2.isClosableOnItemClick(dropdown)) {
            _this2.close(dropdown);
          }
        });
      });

      dropdown.__bunny_dropdown_key = addEventKeyNavigation(dropdown, items, function (selectedItem) {
        // item selected callback
        if (selectedItem === false) {
          _this2.close(dropdown);
          _this2._callCancelCallbacks(dropdown);
        } /*else {
          not needed anymore since click() called on item pick
          this._callItemSelectCallbacks(dropdown, selectedItem);
          }*/
        //this.close(dropdown);
      }, function (switchedItem) {
        // item switched callback
        _this2._callSwitchCallbacks(dropdown, switchedItem);
      });

      //BunnyElement.scrollToIfNeeded(items[0], 100, false, 200, -50);

      dropdown.dispatchEvent(this._getOpenEvent(dropdown));
    }
  },
  close: function close(dropdown) {
    if (this.UI.hide(dropdown)) {

      removeClickOutside(dropdown, dropdown.__bunny_dropdown_cancel);
      delete dropdown.__bunny_dropdown_cancel;

      var items = this.UI.getMenuItems(dropdown);
      [].forEach.call(items, function (item) {
        removeEvent(item, 'click', item.__bunny_dropdown_click);
        delete item.__bunny_dropdown_click;
      });

      removeEventKeyNavigation(dropdown, dropdown.__bunny_dropdown_key);
      delete dropdown.__bunny_dropdown_key;

      //BunnyElement.scrollToIfNeeded(dropdown, -100, true, 200, -50);

      dropdown.dispatchEvent(this._getCloseEvent(dropdown));
    }
  },


  /**
   * Fired when user clicks on item or presses Enter when item is active
   *
   * item is null if user pressed Enter and no item was active (for example custom value entered)
   *
   * @param dropdown
   * @param callback
   */
  onItemSelect: function onItemSelect(dropdown, callback) {
    pushCallbackToElement(dropdown, 'dropdown_item', callback);
  },


  /**
   * Fired when user clicks outside or presses Esc
   * @param dropdown
   * @param callback
   */
  onCancel: function onCancel(dropdown, callback) {
    pushCallbackToElement(dropdown, 'dropdown_cancel', callback);
  },


  /**
   * Fired when user switches to next/prev item through keyboard up/down arrow keys
   * @param dropdown
   * @param callback
   */
  onItemSwitched: function onItemSwitched(dropdown, callback) {
    pushCallbackToElement(dropdown, 'dropdown_switch', callback);
  },
  _addToggleClickEvent: function _addToggleClickEvent(dropdown) {
    var _this3 = this;

    // open dropdown on toggle btn click or hover
    var btn = this.UI.getToggleBtn(dropdown);
    if (btn) {
      addEvent(btn, 'click', this._onToggleClick.bind(this, dropdown));
      addEvent(btn, 'keydown', function (e) {
        if (e.keyCode === KEY_ENTER || e.keyCode === KEY_SPACE) {
          if (e.target === btn) {
            btn.click();
          }
        }
      });

      if (this.isHoverable(dropdown)) {
        var menu = this.UI.getMenu(dropdown);
        addEventOnce(dropdown, 'mouseover', function (e) {
          _this3.open(dropdown);
        }, 50);

        addEventOnce(dropdown, 'mouseout', function (e) {
          if (!isEventCursorInside(e, btn) && !isEventCursorInside(e, menu)) {
            // cursor is outside toggle btn and menu => close menu if required
            _this3.close(dropdown);
          }
        }, 500);
      }
    }
  },
  _callItemSelectCallbacks: function _callItemSelectCallbacks(dropdown, item) {
    callElementCallbacks(dropdown, 'dropdown_item', function (callback) {
      var res = callback(item);
      if (res instanceof Promise) {
        return new Promise(function (resolve) {
          res.then(function (promiseResult) {
            if (promiseResult === false) {
              resolve(false);
            } else {
              resolve(true);
            }
          });
        });
      } else if (res === false) {
        return false;
      }
    });
  },
  _callCancelCallbacks: function _callCancelCallbacks(dropdown) {
    callElementCallbacks(dropdown, 'dropdown_cancel', function (callback) {
      callback();
    });
  },
  _callSwitchCallbacks: function _callSwitchCallbacks(dropdown, item) {
    callElementCallbacks(dropdown, 'dropdown_switch', function (callback) {
      callback(item);
    });
  },
  _setARIA: function _setARIA(dropdown) {
    var _this4 = this;

    var btn = this.UI.getToggleBtn(dropdown);
    if (btn) {
      btn.setAttribute('aria-haspopup', 'true');
      btn.setAttribute('aria-expanded', 'false');
    }
    var menu = this.UI.getMenu(dropdown);
    if (menu) {
      menu.setAttribute('role', this.Config.roleMenu);
      menu.setAttribute('tabindex', '-1');
      var menuItems = this.UI.getMenuItems(dropdown);
      if (menuItems) {
        [].forEach.call(menuItems, function (menuItem) {
          menuItem.setAttribute('role', _this4.Config.roleMenuItem);
          menuItem.setAttribute('tabindex', '-1');
        });
      }
    }
  },
  _onToggleClick: function _onToggleClick(dropdown) {
    if (this.UI.isOpened(dropdown)) {
      this.close(dropdown);
    } else {
      this.open(dropdown);
    }
  },
  _getCloseEvent: function _getCloseEvent(dropdown) {
    return new CustomEvent('close', { detail: { dropdown: dropdown } });
  },
  _getOpenEvent: function _getOpenEvent(dropdown) {
    return new CustomEvent('open', { detail: { dropdown: dropdown } });
  }
};

document.addEventListener('DOMContentLoaded', function () {
  Dropdown.initAll();
});

var AutocompleteConfig = Object.assign({}, DropdownConfig, {

  // override
  useTagNames: true,

  tagName: 'autocomplete',

  // custom
  delay: 200,
  minChar: 2,
  showMark: false,
  allowCustomInput: false,
  classNameNotFound: 'dropdown-header',
  textNotFound: 'No results found'

});

var AutocompleteUI = Object.assign({}, DropdownUI, {

  Config: AutocompleteConfig,

  getInput: function getInput(autocomplete) {
    return autocomplete.querySelector('input:not([type="hidden"])') || false;
  },
  getHiddenInput: function getHiddenInput(autocomplete) {
    return autocomplete.querySelector('input[type="hidden"]') || false;
  },
  getTriggerElement: function getTriggerElement(autocomplete) {
    return this.getInput(autocomplete);
  },
  applyTemplateToMenuItem: function applyTemplateToMenuItem(item, data, templateId) {
    item.appendChild(parseTemplate(templateId, data));
    return item;
  },
  getItemLabel: function getItemLabel(item) {
    var label = item.querySelector('[autocompletelabel') || false;
    if (label) {
      return label.textContent;
    }
    return item.textContent;
  },
  getTemplateSelectLabel: function getTemplateSelectLabel(autocomplete) {
    var label = autocomplete.getAttribute('selectedlabel');
    if (label) {
      return document.getElementById(label);
    }
    return false;
  }
});

var Autocomplete = Object.assign({}, Dropdown, {

  UI: AutocompleteUI,
  Config: AutocompleteConfig,

  // override methods

  init: function init(autocomplete) {
    if (autocomplete.__bunny_autocomplete !== undefined) {
      return false;
    }
    autocomplete.__bunny_autocomplete = {};
    autocomplete.__bunny_autocomplete_state = this.getCurState(autocomplete);
    this._addEvents(autocomplete);
    this._setARIA(autocomplete);

    initObjectExtensions(this, autocomplete);

    return true;
  },
  _setARIA: function _setARIA(autocomplete) {
    Dropdown._setARIA(autocomplete);
    var input = this.UI.getInput(autocomplete);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
  },
  close: function close(autocomplete) {
    Dropdown.close.call(this, autocomplete);
    this.UI.removeMenuItems(autocomplete);
  },
  _addEvents: function _addEvents(autocomplete) {
    var _this = this;

    var input = this.UI.getInput(autocomplete);
    this._addEventFocus(autocomplete, input);
    this.onItemSelect(autocomplete, function (selectedItem) {
      if (selectedItem === null) {
        _this._selectItem(autocomplete, false);
      } else {
        _this._selectItem(autocomplete, selectedItem);
      }
      //input.focus();
    });
  },


  // config methods

  isCustomValueAllowed: function isCustomValueAllowed(autocomplete) {
    return autocomplete.hasAttribute('custom') || this.Config.allowCustomInput;
  },
  getCustomItemContentsTemplate: function getCustomItemContentsTemplate(autocomplete) {
    return autocomplete.getAttribute('template');
  },
  isMarkDisplayed: function isMarkDisplayed(autocomplete) {
    return autocomplete.hasAttribute('mark') || this.Config.showMark;
  },
  getMinChar: function getMinChar(autocomplete) {
    if (autocomplete.hasAttribute('min')) {
      return autocomplete.getAttribute('min');
    } else {
      return this.Config.minChar;
    }
  },
  isNotFoundDisplayed: function isNotFoundDisplayed(autocomplete) {
    return autocomplete.hasAttribute('shownotfound');
  },


  // events

  _addEventInput: function _addEventInput(autocomplete, input) {
    var _this2 = this;

    autocomplete.__bunny_autocomplete_input = addEventOnce(input, 'input', function () {
      if (input.value.length >= _this2.getMinChar(autocomplete)) {
        _this2.update(autocomplete, input.value);
      } else {
        _this2.close(autocomplete);
      }
    }, this.Config.delay);
  },
  _addEventFocus: function _addEventFocus(autocomplete, input) {
    var _this3 = this;

    input.addEventListener('focus', function () {
      if (autocomplete.__bunny_autocomplete_focus === undefined) {
        autocomplete.__bunny_autocomplete_focus = true;
        autocomplete.__bunny_autocomplete_initial_value = input.value;
        _this3._addEventFocusOut(autocomplete, input);
        _this3._addEventInput(autocomplete, input);

        // make sure if dropdown menu not opened and initiated with .open()
        // that on Enter hit form is not submitted
        autocomplete.__bunny_autocomplete_keydown_closed = addEvent(input, 'keydown', function (e) {
          if (e.keyCode === KEY_SPACE) {
            e.stopPropagation();
          }
          //if (!this.UI.isOpened(autocomplete)) {
          if (e.keyCode === KEY_ENTER /* && this.isStateChanged(autocomplete)*/) {
              e.preventDefault();
              if (input.value.length === 0) {
                _this3.clear(autocomplete);
              } else if (e.target === input && _this3.isCustomValueAllowed(autocomplete)) {
                //console.log('autocomplete custom picked');
                _this3._selectItem(autocomplete, false);
                _this3._callItemSelectCallbacks(autocomplete, null);
              }
            }
          //}
        });
      }
    });
  },
  _addEventFocusOut: function _addEventFocusOut(autocomplete, input) {
    var _this4 = this;

    // if after 300ms on focus out
    // and focus was not switched to menu item via keyboard
    // then if value is empty -> clear values
    // else if custom value not allowed but entered -> restore to previous value
    var k = addEvent(input, 'blur', function () {
      setTimeout(function () {
        if (!_this4.UI.isMenuItem(autocomplete, document.activeElement)) {
          delete autocomplete.__bunny_autocomplete_focus;
          removeEvent(input, 'blur', k);
          removeEvent(input, 'input', autocomplete.__bunny_autocomplete_input);
          delete autocomplete.__bunny_autocomplete_input;
          removeEvent(input, 'keydown', autocomplete.__bunny_autocomplete_keydown_closed);
          delete autocomplete.__bunny_autocomplete_keydown_closed;

          if (input.value.length === 0) {
            _this4.clear(autocomplete);
          } else if (!_this4.isCustomValueAllowed(autocomplete) && _this4.isStateChanged(autocomplete)) {
            _this4.restoreState(autocomplete);
          }
        }
      }, 300);
    });
  },


  // item events

  _addItemEvents: function _addItemEvents(autocomplete, items) {
    // [].forEach.call(items.childNodes, item => {
    //   item.addEventListener('click', () => {
    //     this._callItemSelectCallbacks(autocomplete, item);
    //   })
    // });
  },


  // public methods

  update: function update(autocomplete, search) {
    var _this5 = this;

    callElementCallbacks(autocomplete, 'autocomplete_before_update', function (cb) {
      cb();
    });
    var action = getActionObject(autocomplete);
    action(search).then(function (data) {
      //setTimeout(() => {
      callElementCallbacks(autocomplete, 'autocomplete_update', function (cb) {
        var res = cb(data);
        if (res !== undefined) {
          data = res;
        }
      });
      if (Object.keys(data).length > 0) {
        _this5.close(autocomplete);
        var items = void 0;
        var templateId = _this5.getCustomItemContentsTemplate(autocomplete);
        if (_this5.isMarkDisplayed(autocomplete)) {
          items = _this5.UI.createMenuItems(data, function (item, value, content) {
            if (templateId) {
              item = _this5.UI.applyTemplateToMenuItem(item, data[value], templateId);
            }
            var reg = new RegExp('(' + search + ')', 'ig');
            var html = item.innerHTML.replace(reg, '<mark>$1</mark>');
            item.innerHTML = html;
            return item;
          });
        } else {
          if (templateId) {
            items = _this5.UI.createMenuItems(data, function (item, value, content) {
              return _this5.UI.applyTemplateToMenuItem(item, data[value], templateId);
            });
          } else {
            items = _this5.UI.createMenuItems(data);
          }
        }
        _this5._addItemEvents(autocomplete, items);
        _this5.UI.setMenuItems(autocomplete, items);
        _this5._setARIA(autocomplete);
        _this5.open(autocomplete);
      } else {
        _this5.close(autocomplete);
        if (_this5.isNotFoundDisplayed(autocomplete)) {
          _this5.UI.removeMenuItems(autocomplete);
          _this5.UI.getMenu(autocomplete).appendChild(_this5.createNotFoundElement());
          _this5.open(autocomplete);
        }
      }
      //}, 1000);
    }).catch(function (e) {
      _this5.UI.getMenu(autocomplete).innerHTML = e.message;
      _this5.open(autocomplete);
      callElementCallbacks(autocomplete, 'autocomplete_update', function (cb) {
        cb(false, e);
      });
    });
  },
  createNotFoundElement: function createNotFoundElement() {
    var div = document.createElement('div');
    div.classList.add(this.Config.classNameNotFound);
    div.textContent = this.Config.textNotFound;
    return div;
  },
  onBeforeUpdate: function onBeforeUpdate(autocomplete, cb) {
    pushCallbackToElement(autocomplete, 'autocomplete_before_update', cb);
  },
  onUpdate: function onUpdate(autocomplete, cb) {
    pushCallbackToElement(autocomplete, 'autocomplete_update', cb);
  },
  restoreState: function restoreState(autocomplete) {
    var state = this.getState(autocomplete);
    this.UI.getInput(autocomplete).value = state.label;
    var hiddenInput = this.UI.getHiddenInput(autocomplete);
    if (hiddenInput) {
      hiddenInput.value = state.value;
    }

    var tplLabel = this.UI.getTemplateSelectLabel(autocomplete);
    if (tplLabel) {
      tplLabel.innerHTML = '';
    }

    this.close(autocomplete);
  },
  clear: function clear(autocomplete) {
    var input = this.UI.getInput(autocomplete);
    var hiddenInput = this.UI.getHiddenInput(autocomplete);
    input.value = '';
    if (hiddenInput) {
      hiddenInput.value = '';
    }
    autocomplete.__bunny_autocomplete_state = this.getCurState(autocomplete);
    //this._updateInputValues(autocomplete, false);

    var tplLabel = this.UI.getTemplateSelectLabel(autocomplete);
    if (tplLabel) {
      tplLabel.innerHTML = '';
    }

    this._callItemSelectCallbacks(autocomplete, false);
    this.close(autocomplete);
  },
  getValue: function getValue(autocomplete) {
    var hiddenInput = this.UI.getHiddenInput(autocomplete);
    if (hiddenInput) {
      return hiddenInput.value;
    } else {
      return this.UI.getInput(autocomplete).value;
    }
  },
  getState: function getState(autocomplete) {
    return autocomplete.__bunny_autocomplete_state;
  },
  getCurState: function getCurState(autocomplete) {
    var state = {};
    var input = this.UI.getInput(autocomplete);
    var hiddenInput = this.UI.getHiddenInput(autocomplete);
    state.label = input.value;
    if (hiddenInput) {
      state.value = hiddenInput.value;
    }
    return state;
  },
  isStateChanged: function isStateChanged(autocomplete) {
    return JSON.stringify(this.getState(autocomplete)) !== JSON.stringify(this.getCurState(autocomplete));
  },


  // private methods

  _updateInputValues: function _updateInputValues(autocomplete) {
    var item = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    var input = this.UI.getInput(autocomplete);

    if (item !== false) {
      var val = this.UI.getItemLabel(item);
      input.value = val;
      autocomplete.__bunny_autocomplete_initial_value = val;
    } else {
      if (this.isCustomValueAllowed(autocomplete)) {
        autocomplete.__bunny_autocomplete_initial_value = input.value;
      } else {
        input.value = '';
        autocomplete.__bunny_autocomplete_initial_value = '';
      }
    }

    var hiddenInput = this.UI.getHiddenInput(autocomplete);
    if (hiddenInput) {
      if (item !== false) {
        hiddenInput.value = this.UI.getItemValue(item);
      } else {
        if (this.isCustomValueAllowed(autocomplete)) {
          hiddenInput.value = input.value;
        } else {
          hiddenInput.value = '';
        }
      }
    }

    var tplLabel = this.UI.getTemplateSelectLabel(autocomplete);
    if (tplLabel) {
      tplLabel.innerHTML = item === false ? '' : item.innerHTML;
    }

    autocomplete.__bunny_autocomplete_state = this.getCurState(autocomplete);
  },


  /**
   * If item = false, tries to select a custom value;
   * If custom value not allowed restore initial value (previously selected item or input value attribute otherwise)
   *
   * @param {HTMLElement} autocomplete
   * @param {HTMLElement|false} item
   * @private
   */
  _selectItem: function _selectItem(autocomplete) {
    var item = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (item === false && !this.isCustomValueAllowed(autocomplete)) {
      // custom input not allowed, restore to value before input was focused
      this.restoreState(autocomplete);
    } else {
      this._updateInputValues(autocomplete, item);
    }

    this.close(autocomplete);
  }
});

document.addEventListener('DOMContentLoaded', function () {
  Autocomplete.initAll();
});

var NAMESPACE_SVG = 'http://www.w3.org/2000/svg';
var NAMESPACE_XLINK = 'http://www.w3.org/1999/xlink';

/**
 * Document root <svg> with defs and icons
 */

function getRootSvg() {
  var childNodes = document.body.childNodes;
  var length = childNodes.length;
  for (var k = 0; k < length; k++) {
    var node = childNodes[k];
    if (node.tagName === 'svg' || node.tagName === 'SVG') {
      return node;
    }
  }
  return false;
}

function createRootSvg() {
  var svg = document.createElementNS(NAMESPACE_SVG, 'svg');
  svg.setAttribute('height', '0');
  document.body.appendChild(svg);
  return svg;
}

/**
 * SVG <use>, spites and icons
 */

function createSvgUse(iconId) {
  var attributes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  var svg = document.createElementNS(NAMESPACE_SVG, 'svg');
  for (var attr in attributes) {
    svg.setAttribute(attr, attributes[attr]);
  }
  var use = document.createElementNS(NAMESPACE_SVG, 'use');
  use.setAttributeNS(NAMESPACE_XLINK, 'xlink:href', '#' + iconId);
  svg.appendChild(use);
  return svg;
}

function changeSvgIcon(svg, newIconId) {
  svg.firstChild.setAttributeNS(NAMESPACE_XLINK, 'xlink:href', '#' + newIconId);
}

function getSvgIcon(svg) {
  return svg.firstChild.getAttributeNS(NAMESPACE_XLINK, 'href').slice(1);
}

/**
 * SVG color matrix filter
 */

function rgbaToColorMatrix(red, green, blue) {
  var alpha = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

  var decToFloat = function decToFloat(value) {
    return Math.round(value / 255 * 10) / 10;
  };
  var redFloat = decToFloat(red);
  var greenFloat = decToFloat(green);
  var blueFloat = decToFloat(blue);
  var alphaFloat = decToFloat(alpha);
  return '0 0 0 0 ' + redFloat + ' 0 0 0 0 ' + greenFloat + ' 0 0 0 0 ' + blueFloat + ' 0 0 0 1 ' + alphaFloat;
}

function getIdForSvgColorFilter(red, green, blue) {
  var alpha = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

  return '__bunny_filter_' + red + '_' + green + '_' + blue + '_' + alpha;
}

function createOrGetSvgColorFilter(red, green, blue) {
  var alpha = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

  var id = getIdForSvgColorFilter(red, green, blue, alpha);
  var rootSvg = getRootSvg();
  if (rootSvg === false) {
    rootSvg = createRootSvg();
  }
  if (!document.getElementById(id)) {
    var filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', id);
    filter.innerHTML = '<feColorMatrix type="matrix" values="' + rgbaToColorMatrix(red, green, blue, alpha) + '" />';
    rootSvg.appendChild(filter);
  }
  return id;
}

function applySvgColorFilterToElement(element, red, green, blue) {
  var alpha = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;

  var id = createOrGetSvgColorFilter(red, green, blue, alpha);
  element.style.filter = 'url(#' + id + ')';
}

/**
 * SVG Spinner Component
 *
 * Creates inline <svg class="{className}"><use xlink:href="#{icon}"></svg>
 * and appends it to any 'element'
 *
 * Use Spinner.toggle(element) to add/remove spinner
 *
 * If `element` itself is an inline <svg>,
 *   then saves original icon ID
 *   and changes only xlink:href attribute
 *   instead of creating and appending new one <svg>
 *   Useful, for example, when search icon temporary could be replaced with spinner
 */

var SpinnerConfig = {

  icon: 'spinner',
  className: 'i-spinner', // class name with rotate animation since SVG SMIL is deprecated and is not working in IE/Edge

  tagNameFade: 'fade',
  classNameFade: null,
  classNameFadeShow: 'show',
  animationDuration: 600

};

var Spinner = {

  Config: SpinnerConfig,

  insertSpinner: function insertSpinner(element, spinner) {
    element.appendChild(spinner);
  },
  removeSpinner: function removeSpinner(element, spinner) {
    element.removeChild(spinner);
  },
  getSpinner: function getSpinner(element) {
    return element.__bunny_spinner || false;
  },
  has: function has(element) {
    return element.__bunny_spinner !== undefined;
  },
  show: function show(element) {
    var removeText = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (element.tagName === 'SVG' || element.tagName === 'svg') {
      element.__bunny_spinner = getSvgIcon(element);
      changeSvgIcon(element, this.Config.icon);
      element.classList.add(this.Config.className);
    } else {
      if (removeText) {
        element.__bunny_spinner_text = element.innerHTML;
        element.textContent = '';
      }
      element.__bunny_spinner = createSvgUse(this.Config.icon, { class: this.Config.className });
      this.insertSpinner(element, element.__bunny_spinner);
    }
  },
  hide: function hide(element) {
    var removeText = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (element.tagName === 'SVG' || element.tagName === 'svg') {
      element.classList.remove(this.Config.className);
      changeSvgIcon(element, element.__bunny_spinner);
    } else {
      this.removeSpinner(element, element.__bunny_spinner);
      if (removeText) {
        element.innerHTML = element.__bunny_spinner_text;
        delete element.__bunny_spinner_text;
      }
    }
    delete element.__bunny_spinner;
  },
  toggle: function toggle(element) {
    var removeText = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (this.has(element)) {
      this.hide(element, removeText);
      return true;
    } else {
      this.show(element, removeText);
      return false;
    }
  },
  fadePage: function fadePage() {
    var _this = this;

    var text = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : null;
    var textClass = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    return new Promise(function (resolve) {
      var fade = _this.getFade();
      if (!fade) {
        var el = document.createElement(_this.Config.tagNameFade);
        if (_this.Config.classNameFade !== null) {
          el.classList.add(_this.Config.classNameFade);
        }
        var textNode = document.createElement('div');
        textNode.classList.add('fade');
        if (textClass) {
          textNode.classList.add(textClass);
        }
        el.appendChild(textNode);
        document.body.appendChild(el);
        setTimeout(function () {
          if (text !== null) {
            textNode.textContent = text;
            textNode.classList.add('in');
          }
          _this.toggle(el);
          el.classList.add(_this.Config.classNameFadeShow);
          setTimeout(function () {
            resolve();
          }, _this.Config.animationDuration);
        }, 0);
      } else {
        resolve();
      }
    });
  },
  getFade: function getFade() {
    return document.getElementsByTagName(this.Config.tagNameFade)[0] || false;
  },
  getFadeIcon: function getFadeIcon() {
    return this.getSpinner(this.getFade());
  },
  getFadeText: function getFadeText() {
    return this.getFade().getElementsByTagName('div')[0];
  },
  unfadePage: function unfadePage() {
    var _this2 = this;

    return new Promise(function (resolve) {
      var fade = _this2.getFade();
      if (fade) {
        fade.classList.remove(_this2.Config.classNameFadeShow);
        setTimeout(function () {
          document.body.removeChild(fade);
          resolve();
        }, _this2.Config.animationDuration);
      } else {
        resolve();
      }
    });
  },
  setFadeIcon: function setFadeIcon(newIconId) {
    var className = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    var spinner = this.getFadeIcon();
    spinner.classList.remove(this.Config.className);
    changeSvgIcon(spinner, newIconId);
    if (className) {
      spinner.classList.add(className);
    }
  },
  setFadeText: function setFadeText(newText) {
    var newClassAttribute = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    var text = this.getFadeText();
    text.classList.remove('in');
    setTimeout(function () {
      text.textContent = newText;
      if (newClassAttribute) {
        text.setAttribute('class', newClassAttribute);
      }
      text.classList.add('in');
    }, 300);
  }
};

Object.assign(AutocompleteConfig, {
  iconSearch: 'search' });

Object.assign(AutocompleteUI, {
  getIcon: function getIcon(autocomplete) {
    return autocomplete.getElementsByTagName('svg')[0];
  },
  createIcon: function createIcon() {
    return createSvgUse(this.Config.iconSearch);
  },
  insertIcon: function insertIcon(autocomplete, icon) {
    autocomplete.appendChild(icon);
  }
});

Object.assign(Autocomplete, {
  initIcons: function initIcons(autocomplete) {
    var _this = this;

    var icon = this.UI.createIcon();
    this.UI.insertIcon(autocomplete, icon);
    this.onBeforeUpdate(autocomplete, function () {
      _this.showSpinner(autocomplete);
    });
    this.onUpdate(autocomplete, function (res, err) {
      _this.hideSpinner(autocomplete);
    });
  },
  showSpinner: function showSpinner(autocomplete) {
    Spinner.toggle(this.UI.getIcon(autocomplete));
  },
  hideSpinner: function hideSpinner(autocomplete) {
    Spinner.toggle(this.UI.getIcon(autocomplete));
  }
});

/**
 * CustomSelect
 * Wrapper of Bootstrap 4 dropdown list
 * Requires dropdown js
 */

var CustomSelectConfig = Object.assign({}, DropdownConfig, {

  // override
  useTagNames: true,

  tagName: 'customselect',

  roleMenu: 'textbox',
  roleMenuItem: 'option'

});

var CustomSelectUI = Object.assign({}, DropdownUI, {

  Config: CustomSelectConfig,

  /**
   *
   * @param customSelect
   * @returns {HTMLSelectElement|boolean}
   */
  getHiddenSelect: function getHiddenSelect(customSelect) {
    return customSelect.getElementsByTagName('select')[0] || false;
  },
  createHiddenSelect: function createHiddenSelect(selectAttributes, dropdownItems) {
    var _this = this;

    var e = document.createElement('select');
    e.setAttribute('hidden', '');
    e.setAttribute('role', 'textbox');

    for (var attribute in selectAttributes) {
      e.setAttribute(attribute, selectAttributes[attribute]);
    }

    [].forEach.call(dropdownItems, function (dropdownItem) {
      var o = document.createElement('option');
      var val = _this.getItemValue(dropdownItem);
      if (val === undefined) {
        throw new Error('CustomSelect: each item must have data-value attribute');
      }
      o.value = val;
      if (dropdownItem.hasAttribute('aria-selected')) {
        o.setAttribute('selected', '');
      }
      e.appendChild(o);
    });

    return e;
  },


  /**
   * Synchronizes default value and selected options with UI
   * If dropdown item has aria-selected but has no active class, add it
   * If dropdown item has no aria-selected but has active class, remove it
   * If no dropdown item selected, select 1st item and hidden option
   * If customselect has value attribute, sets selected option according to it in highest priority
   *
   * @param {HTMLElement} customSelect
   * @param {String|Array} defaultValue
   * @param {boolean} isMultiple
   */
  syncUI: function syncUI(customSelect, defaultValue, isMultiple) {
    var _this2 = this;

    console.log(defaultValue, isMultiple);
    var menuItems = this.getMenuItems(customSelect);
    var tglBtn = this.getToggleBtn(customSelect);
    var hasSelected = false;
    [].forEach.call(menuItems, function (menuItem) {
      if (defaultValue !== '') {
        var value = _this2.getItemValue(menuItem);
        if (isMultiple) {
          for (var k = 0; k < defaultValue.length; k++) {
            if (defaultValue[k] == value) {
              _this2.setItemActive(menuItem);
              hasSelected = true;
              _this2.getOptionByValue(customSelect, value).selected = true;
              break;
            }
          }
        } else if (value == defaultValue) {
          _this2.setItemActive(menuItem);
          hasSelected = true;
          _this2.getOptionByValue(customSelect, value).selected = true;
          if (tglBtn.innerHTML === '') {
            tglBtn.innerHTML = menuItem.innerHTML;
          }
        }
      } else if (menuItem.hasAttribute('aria-selected')) {
        _this2.setItemActive(menuItem);
        hasSelected = true;
        if (tglBtn.innerHTML === '') {
          tglBtn.innerHTML = menuItem.innerHTML;
        }
      } else if (menuItem.classList.contains(_this2.Config.classNameActive)) {
        _this2.setItemInactive(menuItem);
      }
    });

    if (!hasSelected) {
      this.setItemActive(menuItems[0]);
      this.getHiddenSelect(customSelect).options[0].setAttribute('selected', '');
      if (tglBtn.innerHTML === '') {
        tglBtn.innerHTML = menuItems[0].innerHTML;
      }
    }
  },
  insertHiddenSelect: function insertHiddenSelect(customSelect, hiddenSelect) {
    customSelect.appendChild(hiddenSelect);
  },
  getItemByValue: function getItemByValue(customSelect, value) {
    var menu = this.getMenu(customSelect);
    return menu.querySelector('[data-value="' + value + '"]') || false;
  },
  getLabelByValue: function getLabelByValue(customSelect, value) {
    return this.getItemByValue(customSelect, value).innerHTML;
  },
  getOptionByValue: function getOptionByValue(customSelect, value) {
    var hiddenSelect = this.getHiddenSelect(customSelect);
    return hiddenSelect.querySelector('[value="' + value + '"]') || false;
  },
  setToggleByValue: function setToggleByValue(customSelect, value) {
    var tglBtn = this.getToggleBtn(customSelect);
    var item = this.getItemByValue(customSelect, value);
    tglBtn.innerHTML = item.innerHTML;
  }
});

var CustomSelect = Object.assign({}, Dropdown, {

  UI: CustomSelectUI,
  Config: CustomSelectConfig,

  // override methods

  init: function init(customSelect) {
    if (customSelect.__bunny_customselect !== undefined) {
      return false;
    }

    if (customSelect.dataset.name === undefined) {
      throw new Error('CustomSelect: data-name attribute missing');
    }

    if (!this.UI.getMenu(customSelect)) {
      throw new Error('CustomSelect: no menu found!');
    }

    if (!this.UI.getToggleBtn(customSelect)) {
      throw new Error('CustomSelect: toggle button not found!');
    }

    customSelect.__bunny_customselect = {};

    var hiddenSelect = this.UI.createHiddenSelect(this.getAttributesForSelect(customSelect), this.UI.getMenuItems(customSelect), this.UI.getToggleBtn(customSelect).textContent);
    this.UI.insertHiddenSelect(customSelect, hiddenSelect);
    var defaultValue = this.getDefaultValue(customSelect);
    this.UI.syncUI(customSelect, defaultValue, this.isMultiple(customSelect));

    this._addCustomSelectEvents(customSelect);
    this._setARIA(customSelect);

    initObjectExtensions(this, customSelect);

    return true;
  },
  _addCustomSelectEvents: function _addCustomSelectEvents(customSelect) {
    var _this3 = this;

    this.onItemSelect(customSelect, function (item) {
      if (item !== null) {
        _this3.select(customSelect, _this3.UI.getItemValue(item));
      }
    });
  },
  getAttributesForSelect: function getAttributesForSelect(customSelect) {
    var selectAttributes = {};
    for (var k in customSelect.dataset) {
      selectAttributes[k] = customSelect.dataset[k];
    }
    return selectAttributes;
  },


  /**
   * Get default value from value="" attribute
   * which might be a string representing a single selected option value
   * or a JSON array representing selected options in multiple select
   *
   * This attribute has highest priority over aria-selected which will be updated in syncUI()
   * If value is empty string or no value attribute found then 1st option is selected
   *
   * @param customSelect
   * @returns {String|Array}
   */
  getDefaultValue: function getDefaultValue(customSelect) {
    var val = customSelect.getAttribute('value');
    if (val === null) {
      return '';
    }
    var firstChar = val[0];
    if (firstChar === undefined) {
      return '';
    } else if (firstChar === '[') {
      return JSON.parse(val);
    }
    return val;
  },
  isMultiple: function isMultiple(customSelect) {
    return customSelect.dataset.multiple !== undefined;
  },
  select: function select(customSelect, value) {
    var option = this.UI.getOptionByValue(customSelect, value);
    if (this.isMultiple(customSelect)) {
      if (option.selected) {
        this.deselect(customSelect, value);
      } else {
        var item = this.UI.getItemByValue(customSelect, value);
        this.UI.setItemActive(item);
        option.selected = true;
      }
    } else {
      if (!option.selected) {
        var curValue = this.getSelectedValue(customSelect);
        if (curValue != value) {
          this.deselect(customSelect, curValue);
        }

        var _item = this.UI.getItemByValue(customSelect, value);
        this.UI.setItemActive(_item);
        option.selected = true;
        this.UI.setToggleByValue(customSelect, value);
      }
    }
  },
  deselect: function deselect(customSelect, value) {
    var option = this.UI.getOptionByValue(customSelect, value);
    if (option.selected) {
      var item = this.UI.getItemByValue(customSelect, value);
      this.UI.setItemInactive(item);
      option.selected = false;
    }
  },


  /**
   * Get selected value
   * If select is multiple then returns array
   *
   * @param customSelect
   * @returns {String|Array}
   */
  getSelectedValue: function getSelectedValue(customSelect) {
    var hiddenSelect = this.UI.getHiddenSelect(customSelect);
    if (this.isMultiple(customSelect)) {
      var selectedOptions = [];
      [].forEach.call(hiddenSelect.options, function (option) {
        if (option.selected) {
          selectedOptions.push(option.value);
        }
      });
      return selectedOptions;
    } else {
      return hiddenSelect.options[hiddenSelect.selectedIndex].value;
    }
  }
});

document.addEventListener('DOMContentLoaded', function () {
  CustomSelect.initAll();
});

var Api = {
    get: function get(url) {
        return fetch(url).then(function (response) {
            return response.json();
        }).then(function (data) {
            if (data.message) {
                // May be show custom alert
                console.warn(data.message);
                return [];
            }
            return data;
        }); /*.catch(e => {
              console.error(e);
              return Promise.reject(e);
            });*/
    }
};

var Country = {

    Api: Api,

    search: function search(_search) {
        return this.Api.get("https://restcountries.eu/rest/v1/name/" + _search).then(function (data) {
            var countries = {};
            data.forEach(function (country) {
                countries[country.alpha2Code] = country.name;
            });
            return countries;
        });
    }
};

window.Country = Country;

document.forms.f1.addEventListener('submit', function (e) {
  e.preventDefault();
  Spinner.fadePage('Creating your account').then(function () {
    setTimeout(function () {
      Spinner.setFadeText('Account created', 't-success');
      Spinner.setFadeIcon('check', 'i-check');
    }, 1000);
  });
});

var ac = document.getElementsByTagName('autocomplete')[0];

Autocomplete.onItemSelect(ac, function (item) {
  console.log('autocomplete item selected', item);
  document.getElementById('current').textContent = Autocomplete.getValue(ac);
});

Autocomplete.onCancel(ac, function () {
  console.log('autocomplete item canceled');
  document.getElementById('current').textContent = Autocomplete.getValue(ac);
});

var dropdown = document.getElementById('dropdown1');
Dropdown.onItemSelect(dropdown, function (item) {
  console.log('item clicked', item);
});

Dropdown.onCancel(dropdown, function () {
  console.log('clicked outside or pressed ESC');
});

Dropdown.onItemSwitched(dropdown, function (item) {
  console.log('item switched', item);
});

/*const cs = document.getElementById('customselect1');
const classNames = Array.from(Dropdown.UI.getMenuItems(cs)).map(item => item.dataset.class);
Dropdown.onItemSelect(cs, (item) => {
  classNames.forEach(className => {
    cs.classList.remove(className);
  });
  const className = item.dataset.class;
  cs.classList.add(className);
});*/
