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

var BunnyFile = {

    /**
     * Download file from URL via AJAX and make Blob object or return base64 string if 2nd argument is false
     * Only files from CORS-enabled domains can be downloaded or AJAX will get security error
     *
     * @param {String} URL
     * @param {Boolean} convert_to_blob = true
     * @returns {Promise}: success(Blob object | base64 string), fail(response XHR object)
     */
    download: function download(URL) {
        var convert_to_blob = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

        var request = new XMLHttpRequest();
        var p = new Promise(function (success, fail) {
            request.onload = function () {
                if (request.status === 200) {
                    var blob = request.response;
                    success(blob);
                } else {
                    fail(request);
                }
            };
        });

        request.open('GET', URL, true);
        if (convert_to_blob) {
            request.responseType = 'blob';
        }
        request.send();

        return p;
    },


    /**
     * Get File/Blob header (signature) to parse for MIME-type or any magic numbers
     * @param {File|Blob} blob
     * @returns {Promise} callback(str:signature)
     */
    getSignature: function getSignature(blob) {
        return new Promise(function (callback) {
            var reader = new FileReader();
            reader.onloadend = function () {
                var arr = new Uint8Array(reader.result).subarray(0, 4);
                var signature = '';
                for (var i = 0; i < arr.length; i++) {
                    signature += arr[i].toString(16);
                }
                callback(signature);
            };
            reader.readAsArrayBuffer(blob);
        });
    },


    /**
     * Check if string is a valid signature for image/jpeg
     * @param {String} signature
     * @returns {boolean}
     */
    isJpeg: function isJpeg(signature) {
        var signatures = ['ffd8ffe0', 'ffd8ffe1', 'ffd8ffe2'];
        return signatures.indexOf(signature) > -1;
    },


    /**
     * Check if string is a valid signature for image/png
     * @param {String} signature
     * @returns {boolean}
     */
    isPng: function isPng(signature) {
        return signature === '89504e47';
    },


    /**
     * Convert base64 string to Blob object
     * @param {String} base64
     * @returns {Blob}
     */
    base64ToBlob: function base64ToBlob(base64) {
        // convert base64 to raw binary data held in a string
        // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
        var byteString = atob(base64.split(',')[1]);

        // separate out the mime component
        var mimeString = base64.split(',')[0].split(':')[1].split(';')[0];

        // write the bytes of the string to an ArrayBuffer
        var ab = new ArrayBuffer(byteString.length);
        var ia = new Uint8Array(ab);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }

        // write the ArrayBuffer to a blob, and you're done
        return new Blob([ab], { type: mimeString });
    },


    /**
     * Convert Blob object to base64string
     * @param {Blob} blob
     * @returns {Promise} success(base64 string), fail(error)
     */
    blobToBase64: function blobToBase64(blob) {
        var reader = new FileReader();
        var p = new Promise(function (success, fail) {
            reader.onloadend = function () {
                var base64 = reader.result;
                success(base64);
            };
            reader.onerror = function (e) {
                fail(e);
            };
        });

        reader.readAsDataURL(blob);

        return p;
    },


    /**
     * Get local browser object URL which can be used in img.src for example
     * @param {Blob} blob
     * @returns {String}
     */
    getBlobLocalURL: function getBlobLocalURL(blob) {
        if (!(blob instanceof Blob || blob instanceof File)) {
            throw new TypeError('Argument in BunnyFile.getBlobLocalURL() is not a Blob or File object');
        }
        return URL.createObjectURL(blob);
    }
};

/**
 * @component BunnyImage
 * Wrapper for Image object representing <img> tag, uses Canvas and BunnyFile
 *
 */
var BunnyImage = {

  IMG_CONVERT_TYPE: 'image/jpeg',
  IMG_QUALITY: 0.7,

  // SECTION: get Image object via different sources

  /**
   * Downloads image by any URL or converts from Blob, should work also for non-CORS domains
   *
   * @param {String|Blob} urlOrBlob
   * @returns {Promise} success(Image object), fail(error)
   */
  getImage: function getImage(urlOrBlob) {
    if (typeof urlOrBlob === 'string') {
      return this.getImageByURL(urlOrBlob);
    } else {
      return this.getImageByBlob(urlOrBlob);
    }
  },


  /**
   * Downloads image by any URL, should work also for non-CORS domains
   *
   * @param {String} URL
   * @returns {Promise} success(Image object), fail(error)
   */
  getImageByURL: function getImageByURL(URL) {
    return this._toImagePromise(URL, true);
  },
  _toImagePromise: function _toImagePromise(src) {
    var crossOrigin = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    var img = new Image();
    var p = new Promise(function (ok, fail) {
      img.onload = function () {
        ok(img);
      };
      img.onerror = function (e) {
        fail(e);
      };
    });
    if (crossOrigin) {
      img.crossOrigin = 'Anonymous';
    }
    img.src = src;
    return p;
  },
  getImageByBlob: function getImageByBlob(blob) {
    var url = BunnyFile.getBlobLocalURL(blob);
    return this._toImagePromise(url);
  },
  getImageByBase64: function getImageByBase64(base64) {
    var url = base64;
    return this._toImagePromise(url);
  },
  getImageByCanvas: function getImageByCanvas(canvas) {
    var url = canvas.toDataURL(this.IMG_CONVERT_TYPE, this.IMG_QUALITY);
    return this._toImagePromise(url);
  },


  // SECTION:: create different sources from Image object

  imageToCanvas: function imageToCanvas(img) {
    var width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var height = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    if (!img.complete) {
      throw new Error('Can not create canvas from Image. Image is not loaded yet.');
    }
    var canvas = document.createElement("canvas");
    if (width === null && height === null) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d").drawImage(img, 0, 0);
    } else {
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    }
    return canvas;
  },


  /**
   *
   * @param {Image|HTMLImageElement} img
   * @param {Number?} width
   * @param {Number?} height
   * @returns {string}
   */
  imageToBase64: function imageToBase64(img) {
    var width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var height = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    return this.imageToCanvas(img, width, height).toDataURL(this.IMG_CONVERT_TYPE, this.IMG_QUALITY);
  },


  /**
   *
   * @param {Image|HTMLImageElement} img
   * @param {Number?} width
   * @param {Number?} height
   * @returns {Blob}
   */
  imageToBlob: function imageToBlob(img) {
    var width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
    var height = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    return BunnyFile.base64ToBlob(this.imageToBase64(img, width, height));
  },


  // SECTION: basic Image statistics and info functions

  getImageURL: function getImageURL(img) {
    return img.src;
  },
  getImageWidth: function getImageWidth(img) {
    if (!img.complete) {
      throw new Error('Can not get Image.width. Image is not loaded yet.');
    }
    return img.width;
  },
  getImageHeight: function getImageHeight(img) {
    if (!img.complete) {
      throw new Error('Can not get Image.height. Image is not loaded yet.');
    }
    return img.height;
  },


  // SECTION: basic Image data math functions

  getImageNewAspectSizes: function getImageNewAspectSizes(img, max_width, max_height) {
    var img_width = this.getImageWidth(img);
    var img_height = this.getImageHeight(img);
    if (img_width === 0 || img_height === 0) {
      throw new Error('Image width or height is 0 in BunnyImage.getImageNewAspectSizes().');
    }
    var ratio = Math.min(max_width / img_width, max_height / img_height);

    return {
      width: Math.floor(img_width * ratio),
      height: Math.floor(img_height * ratio)
    };
  },


  // SECTION: basic Image manipulation
  // returns canvas

  /**
   * Resize image
   * @param {Image} img
   * @param {Number} max_width
   * @param {Number} max_height
   * @returns {Promise} success(Image), fail(error)
   */
  resizeImage: function resizeImage(img, max_width, max_height) {
    var sizes = this.getImageNewAspectSizes(img, max_width, max_height);
    var width = sizes.width;
    var height = sizes.height;
    var canvas = this.imageToCanvas(img, width, height);
    return canvas;
    //return this.getImageByCanvas(canvas);
  },
  resizeCanvas: function resizeCanvas(canvas, width) {
    var height = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

    if (height === null) height = width;
    var tmpCanvas = document.createElement('canvas');
    var tmpCtx = tmpCanvas.getContext('2d');
    tmpCanvas.width = width;
    tmpCanvas.height = height;
    tmpCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, width, height);
    return tmpCanvas;
  },
  crop: function crop(img, x, y, width) {
    var height = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;

    if (height === null) height = width;
    var proportion = img.naturalWidth / img.clientWidth;
    var canvas = document.createElement('canvas');
    var sizeX = width * proportion;
    var sizeY = height * proportion;
    canvas.width = sizeX;
    canvas.height = sizeY;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, x * proportion, y * proportion, sizeX, sizeY, 0, 0, sizeX, sizeY);
    return canvas;
  },
  cropByCursor: function cropByCursor(img, cursor) {
    return this.crop(img, cursor.offsetLeft, cursor.offsetTop, cursor.clientWidth, cursor.clientHeight);
  }
};

'use strict';

/**
 * Base object Ajax
 */

var Ajax = {

    /**
     * Sends an async HTTP (AJAX) request or if last parameter is false - returns created instance
     * with ability to modify native XMLHttpRequest (.request property) and manually send request when needed.
     *
     * @param {string} method - HTTP method (GET, POST, HEAD, ...)
     * @param {string} url - URI for current domain or full URL for cross domain AJAX request
     *        Please note that in cross domain requests only GET, POST and HEAD methods allowed as well as
     *        only few headers available. For more info visit
     *        https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS
     * @param {object} data - key: value pair of data to send. Data is automatically URL encoded
     * @param {callback(responseText)} on_success - callback on response with status code 200
     * @param {callback(responseText, responseStatusCode)} on_error = null - custom handler
     *        for response with status code different from 200
     * @param {object} headers = {} - key: value map of headers to send
     * @param {boolean} do_send = true - instantly makes requests
     *
     * @returns {Object}
     */
    create: function create(method, url, data, on_success) {
        var on_error = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
        var headers = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : {};
        var do_send = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : true;


        var t = Object.create(this);
        t.method = method;
        t.url = url;
        t.data = data;
        t.request = new XMLHttpRequest();
        t.onSuccess = on_success;
        t.onError = on_error;
        t.headers = headers;
        t.request.onreadystatechange = function () {
            if (t.request.readyState === XMLHttpRequest.DONE) {
                if (t.request.status === 200) {
                    t.onSuccess(t.request.responseText);
                } else {
                    if (t.onError !== null) {
                        t.onError(t.request.responseText, t.request.status);
                    } else {
                        console.error('Bunny AJAX error: unhandled error with response status ' + t.request.status + ' and body: ' + t.request.responseText);
                    }
                }
            }
        };

        if (do_send) {
            t.send();
        }

        return t;
    },


    /**
     * Should be called on instance created with factory Ajax.create() method
     * Opens request, applies headers, builds data URL encoded string and sends request
     */
    send: function send() {

        this.request.open(this.method, this.url);

        for (var header in this.headers) {
            this.request.setRequestHeader(header, this.headers[header]);
        }

        var str_data = '';

        if (this.data instanceof FormData) {
            this.request.send(this.data);
        } else {
            for (var name in this.data) {
                str_data = str_data + name + '=' + encodeURIComponent(this.data[name]) + '&';
            }
            this.request.send(str_data);
        }
    },


    /**
     * Sends a form via ajax POST with header Content-Type: application/x-www-form-urlencoded
     * Data is automatically taken form all form input values
     *
     * @param {object} form_el - Form document element
     * @param {callback(responseText)} on_success - callback for status code 200
     * @param {callback(responseText, responseStatusCode)} on_error = null - custom handler for non 200 status codes
     * @param {object} headers = {'Content-Type': 'application/x-www-form-urlencoded'} - key: value map of headers
     */
    sendForm: function sendForm(form_el, on_success) {
        var on_error = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        var headers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { 'Content-Type': 'application/x-www-form-urlencoded' };

        var data = {};
        form_el.querySelectorAll('[name]').forEach(function (input) {
            data[input.getAttribute('name')] = input.value;
        });
        this.create('POST', form_el.getAttribute('action'), data, on_success, on_error, headers, true);
    },


    /**
     * Sends a form via ajax POST with header Content-Type: multipart/form-data which is required for file uploading
     * Data is automatically taken form all form input values
     *
     * @param {object} form_el - Form document element
     * @param {callback(responseText)} on_success - callback for status code 200
     * @param {callback(responseText, responseStatusCode)} on_error = null - custom handler for non 200 status codes
     * @param {object} headers = {'Content-Type': 'multipart/form-data'} - key: value map of headers
     */
    sendFormWithFiles: function sendFormWithFiles(form_el, on_success) {
        var on_error = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        var headers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { 'Content-Type': 'multipart/form-data' };

        this.sendForm(form_el, on_success, on_error, headers);
    },


    /**
     * Sends a simple GET request. By default adds header X-Requested-With: XMLHttpRequest
     * which allows back-end applications to detect if request is ajax.
     * However for making a cross domain requests this header might not be acceptable
     * and in this case pass an empty object {} as a last argument to send no headers
     *
     * @param {string} url - URI or full URL for cross domain requests
     * @param {callback(responseText)} on_success - callback for status code 200
     * @param {callback(responseText, responseStatusCode)} on_error = null - custom handler for non 200 status codes
     * @param headers = {'X-Requested-With': 'XMLHttpRequest'} key: value map of headers
     */
    get: function get(url, on_success) {
        var on_error = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        var headers = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : { 'X-Requested-With': 'XMLHttpRequest' };

        this.create('GET', url, {}, on_success, on_error, headers, true);
    },

    post: function post(url, data, on_success) {
        var on_error = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
        var headers = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : { 'X-Requested-With': 'XMLHttpRequest' };

        this.create('POST', url, data, on_success, on_error, headers, true);
    }

};

var BunnyElement = {
  getCurrentDocumentPosition: function getCurrentDocumentPosition() {
    var top = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    //return Math.abs(document.body.getBoundingClientRect().y);
    return top ? window.scrollY : window.scrollY + window.innerHeight;
  },
  getPosition: function getPosition(el) {
    var top = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    var curTop = 0;
    var originalEl = el;
    if (el.offsetParent) {
      do {
        curTop += el.offsetTop;
      } while (el = el.offsetParent);
    }
    if (!top) {
      curTop += originalEl.offsetHeight;
    }
    return curTop;
  },
  isInViewport: function isInViewport(el) {
    var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var top = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    var docPos = this.getCurrentDocumentPosition(top);
    var elPos = this.getPosition(el, top);
    return elPos + offset <= docPos;
  },
  scrollToIfNeeded: function scrollToIfNeeded(target) {
    var viewportOffset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
    var viewportTop = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    var duration = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 500;
    var scrollOffset = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : 0;

    if (!this.isInViewport(target, viewportOffset, viewportTop)) {
      this.scrollTo(target, duration, scrollOffset);
    }
  },


  /**
   * Smooth scrolling to DOM element or to relative window position
   * If target is string it should be CSS selector
   * If target is object it should be DOM element
   * If target is number - it is used to relatively scroll X pixels form current position
   *
   * Based on https://www.sitepoint.com/smooth-scrolling-vanilla-javascript/
   *
   * @param {HTMLElement, string, number} target
   * @param {Number|function} duration
   * @param {Number} offset
   */
  scrollTo: function scrollTo(target) {
    var duration = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 500;
    var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

    return new Promise(function (onAnimationEnd) {

      var element = void 0;
      if (typeof target === 'string') {
        element = document.querySelector(target);
      } else if ((typeof target === 'undefined' ? 'undefined' : babelHelpers.typeof(target)) === 'object') {
        element = target;
      } else {
        // number
        element = null;
      }

      if (element !== null && element.offsetParent === null) {
        // element is not visible, scroll to top of parent element
        element = element.parentNode;
      }

      var start = window.pageYOffset;
      var distance = 0;
      if (element !== null) {
        distance = element.getBoundingClientRect().top;
      } else {
        // number
        distance = target;
      }
      distance = distance + offset;

      if (typeof duration === 'function') {
        duration = duration(distance);
      }

      var timeStart = 0;
      var timeElapsed = 0;

      requestAnimationFrame(function (time) {
        timeStart = time;
        loop(time);
      });

      function loop(time) {
        timeElapsed = time - timeStart;
        window.scrollTo(0, easeInOutQuad(timeElapsed, start, distance, duration));
        if (timeElapsed < duration) {
          requestAnimationFrame(loop);
        } else {
          end();
        }
      }

      function end() {
        window.scrollTo(0, start + distance);
        onAnimationEnd();
      }

      // Robert Penner's easeInOutQuad - http://robertpenner.com/easing/
      function easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
      }
    });
  },
  hide: function hide(element) {
    return new Promise(function (resolve) {
      element.style.opacity = 0;
      element.style.overflow = 'hidden';
      var steps = 40;
      var step_delay_ms = 10;
      var height = element.offsetHeight;
      var height_per_step = Math.round(height / steps);
      element._originalHeight = height;

      var _loop = function _loop(k) {
        if (k === steps) {
          setTimeout(function () {
            element.style.display = 'none';
            element.style.height = '0px';
            resolve();
          }, step_delay_ms * k);
        } else {
          setTimeout(function () {
            element.style.height = height_per_step * (steps - k) + 'px';
          }, step_delay_ms * k);
        }
      };

      for (var k = 1; k <= steps; k++) {
        _loop(k);
      }
    });
  },
  show: function show(element) {
    if (element._originalHeight === undefined) {
      throw new Error('element._originalHeight is undefined. Save original height when hiding element or use BunnyElement.hide()');
    }
    return new Promise(function (resolve) {
      element.style.display = '';
      var steps = 40;
      var step_delay_ms = 10;
      var height = element._originalHeight;
      var height_per_step = Math.round(height / steps);
      delete element._originalHeight;

      var _loop2 = function _loop2(k) {
        if (k === steps) {
          setTimeout(function () {
            element.style.opacity = 1;
            element.style.height = '';
            element.style.overflow = '';
            resolve();
          }, step_delay_ms * k);
        } else {
          setTimeout(function () {
            element.style.height = height_per_step * k + 'px';
          }, step_delay_ms * k);
        }
      };

      for (var k = 1; k <= steps; k++) {
        _loop2(k);
      }
    });
  },
  remove: function remove(element) {
    element.parentNode.removeChild(element);
  }
};

var ValidationConfig = {

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
var ValidationLang = {

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
var _bn_getFile = function _bn_getFile(input) {
    // if there is custom file upload logic, for example, images are resized client-side
    // generated Blobs should be assigned to fileInput._file
    // and can be sent via ajax with FormData

    // if file was deleted, custom field can be set to an empty string

    // Bunny Validation detects if there is custom Blob assigned to file input
    // and uses this file for validation instead of original read-only input.files[]
    if (input._file !== undefined && input._file !== '') {
        if (input._file instanceof Blob === false) {
            console.error("Custom file for input " + input.name + " is not an instance of Blob");
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
var ValidationValidators = {
    required: function required(input) {
        return new Promise(function (valid, invalid) {
            if (input.hasAttribute('required')) {
                // input is required, check value
                if (input.getAttribute('type') !== 'file' && input.value === '' || (input.type === 'radio' || input.type === 'checkbox') && !input.checked || input.getAttribute('type') === 'file' && _bn_getFile(input) === false) {
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
    email: function email(input) {
        return new Promise(function (valid, invalid) {
            if (input.value.length > 0 && input.getAttribute('type') === 'email') {
                // input is email, parse string to match email regexp
                var Regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
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
    url: function url(input) {
        return new Promise(function (valid, invalid) {
            if (input.value.length > 0 && input.getAttribute('type') === 'url') {
                // input is URL, parse string to match website URL regexp
                var Regex = /(^|\s)((https?:\/\/)?[\w-]+(\.[\w-]+)+\.?(:\d+)?(\/\S*)?)/gi;
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
    tel: function tel(input) {
        return new Promise(function (valid, invalid) {
            if (input.value.length > 0 && input.getAttribute('type') === 'tel') {
                // input is tel, parse string to match tel regexp
                var Regex = /^[0-9\-\+\(\)\#\ \*]{6,20}$/;
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
    maxLength: function maxLength(input) {
        return new Promise(function (valid, invalid) {
            if (input.getAttribute('maxlength') !== null && input.value.length > input.getAttribute('maxlength')) {
                invalid({ maxLength: input.getAttribute('maxlength') });
            } else {
                valid();
            }
        });
    },
    minLength: function minLength(input) {
        return new Promise(function (valid, invalid) {
            if (input.getAttribute('minlength') !== null && input.value.length < input.getAttribute('minlength')) {
                invalid({ minLength: input.getAttribute('minlength') });
            } else {
                valid();
            }
        });
    },
    maxFileSize: function maxFileSize(input) {
        return new Promise(function (valid, invalid) {
            if (input.getAttribute('type') === 'file' && input.hasAttribute('maxfilesize') && _bn_getFile(input) !== false) {
                var maxFileSize = parseFloat(input.getAttribute('maxfilesize')); // in MB
                var fileSize = (_bn_getFile(input).size / 1000000).toFixed(2); // in MB
                if (fileSize <= maxFileSize) {
                    valid(input);
                } else {
                    invalid({ maxFileSize: maxFileSize, fileSize: fileSize });
                }
            } else {
                valid(input);
            }
        });
    },


    // if file input has "accept" attribute and it contains "image",
    // then check if uploaded file is a JPG or PNG
    image: function image(input) {
        return new Promise(function (valid, invalid) {
            if (input.getAttribute('type') === 'file' && input.getAttribute('accept').indexOf('image') > -1 && _bn_getFile(input) !== false) {
                BunnyFile.getSignature(_bn_getFile(input)).then(function (signature) {
                    if (BunnyFile.isJpeg(signature) || BunnyFile.isPng(signature)) {
                        valid();
                    } else {
                        invalid({ signature: signature });
                    }
                }).catch(function (e) {
                    invalid(e);
                });
            } else {
                valid();
            }
        });
    },
    minImageDimensions: function minImageDimensions(input) {
        return new Promise(function (valid, invalid) {
            if (input.hasAttribute('mindimensions') && _bn_getFile(input) !== false) {
                var _input$getAttribute$s = input.getAttribute('mindimensions').split('x'),
                    _input$getAttribute$s2 = babelHelpers.slicedToArray(_input$getAttribute$s, 2),
                    minWidth = _input$getAttribute$s2[0],
                    minHeight = _input$getAttribute$s2[1];

                BunnyImage.getImageByBlob(_bn_getFile(input)).then(function (img) {
                    var width = BunnyImage.getImageWidth(img);
                    var height = BunnyImage.getImageHeight(img);
                    if (width < minWidth || height < minHeight) {
                        invalid({ width: width, height: height, minWidth: minWidth, minHeight: minHeight });
                    } else {
                        valid();
                    }
                }).catch(function (e) {
                    invalid(e);
                });
            } else {
                valid();
            }
        });
    },
    maxImageDimensions: function maxImageDimensions(input) {
        return new Promise(function (valid, invalid) {
            if (input.hasAttribute('maxdimensions') && _bn_getFile(input) !== false) {
                var _input$getAttribute$s3 = input.getAttribute('maxdimensions').split('x'),
                    _input$getAttribute$s4 = babelHelpers.slicedToArray(_input$getAttribute$s3, 2),
                    maxWidth = _input$getAttribute$s4[0],
                    maxHeight = _input$getAttribute$s4[1];

                BunnyImage.getImageByBlob(_bn_getFile(input)).then(function (img) {
                    var width = BunnyImage.getImageWidth(img);
                    var height = BunnyImage.getImageHeight(img);
                    if (width > maxWidth || height > maxHeight) {
                        invalid({ width: width, height: height, maxWidth: maxWidth, maxHeight: maxHeight });
                    } else {
                        valid();
                    }
                }).catch(function (e) {
                    invalid(e);
                });
            } else {
                valid();
            }
        });
    },
    requiredFromList: function requiredFromList(input) {
        return new Promise(function (valid, invalid) {
            var id = void 0;
            if (input.hasAttribute('requiredfromlist')) {
                id = input.getAttribute('requiredfromlist');
            } else {
                id = input.name + '_id';
            }
            var srcInput = document.getElementById(id);
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
    minOptions: function minOptions(input) {
        return new Promise(function (valid, invalid) {
            if (input.hasAttribute('minoptions')) {
                var minOptionsCount = parseInt(input.getAttribute('minoptions'));
                var inputGroup = ValidationUI.getInputGroup(input);
                var hiddenInputs = inputGroup.getElementsByTagName('input');
                var selectedOptionsCount = 0;
                [].forEach.call(hiddenInputs, function (hiddenInput) {
                    if (hiddenInput !== input && hiddenInput.value !== '') {
                        selectedOptionsCount++;
                    }
                });
                if (selectedOptionsCount < minOptionsCount) {
                    invalid({ minOptionsCount: minOptionsCount });
                } else {
                    valid();
                }
            } else {
                valid();
            }
        });
    },
    confirmation: function confirmation(input) {
        return new Promise(function (valid, invalid) {
            if (input.name.indexOf('_confirmation') > -1) {
                var originalInputId = input.name.substr(0, input.name.length - 13);
                var originalInput = document.getElementById(originalInputId);
                if (originalInput.value == input.value) {
                    valid();
                } else {
                    invalid({ originalLabel: ValidationUI.getLabel(ValidationUI.getInputGroup(originalInput)).textContent });
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
    ajax: function ajax(input) {
        return new Promise(function (valid, invalid) {
            if (input.dataset.ajax !== undefined && input.value.length > 0) {
                var url = input.dataset.ajax.replace('{value}', encodeURIComponent(input.value));
                Ajax.get(url, function (data) {
                    data = JSON.parse(data);
                    if (data.message !== undefined && data.message !== '') {
                        invalid(data.message);
                    } else {
                        valid();
                    }
                }, function () {
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
var ValidationUI = {

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
    insertErrorNode: function insertErrorNode(inputGroup, errorNode) {
        inputGroup.appendChild(errorNode);
    },


    /**
     * DOM algorithm - where to add/remove error class
     *
     * @param {HTMLElement} inputGroup
     */
    toggleErrorClass: function toggleErrorClass(inputGroup) {
        inputGroup.classList.toggle(this.config.classInputGroupError);
    },


    /**
     * Create DOM element for error message
     *
     * @returns {HTMLElement}
     */
    createErrorNode: function createErrorNode() {
        var el = document.createElement(this.config.tagNameError);
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
    getErrorNode: function getErrorNode(inputGroup) {
        return inputGroup.getElementsByClassName(this.config.classError)[0] || false;
    },


    /**
     * Removes error node and class from input group if exists
     *
     * @param {HTMLElement} inputGroup
     */
    removeErrorNode: function removeErrorNode(inputGroup) {
        var el = this.getErrorNode(inputGroup);
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
    setErrorMessage: function setErrorMessage(inputGroup, message) {
        var errorNode = this.getErrorNode(inputGroup);
        if (errorNode === false) {
            // container for error message doesn't exists, create new
            errorNode = this.createErrorNode();
            this.toggleErrorClass(inputGroup);
            this.insertErrorNode(inputGroup, errorNode);
        }
        // set or update error message
        errorNode.textContent = message;
    },


    /**
     * Marks input as valid
     *
     * @param {HTMLElement} inputGroup
     */
    setInputValid: function setInputValid(inputGroup) {
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
    getInput: function getInput(inputGroup) {
        return inputGroup.querySelector(this.config.selectorInput) || false;
    },


    /**
     * Find closest parent inputGroup element by Input element
     *
     * @param {HTMLElement} input
     *
     * @returns {HTMLElement}
     */
    getInputGroup: function getInputGroup(input) {
        var el = input;
        while ((el = el.parentNode) && !el.classList.contains(this.config.classInputGroup)) {}
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
    getInputsInSection: function getInputsInSection(node) {
        var resolving = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        var inputGroups = this.getInputGroupsInSection(node);
        var inputs = void 0;
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
        for (var k = 0; k < inputGroups.length; k++) {
            var input = this.getInput(inputGroups[k]);
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
    getLabel: function getLabel(inputGroup) {
        return inputGroup.getElementsByTagName('label')[0] || false;
    },


    /**
     * Find all input groups within section
     *
     * @param {HTMLElement} node
     *
     * @returns {HTMLCollection}
     */
    getInputGroupsInSection: function getInputGroupsInSection(node) {
        return node.getElementsByClassName(this.config.classInputGroup);
    }
};

var Validation = {

    validators: ValidationValidators,
    lang: ValidationLang,
    ui: ValidationUI,

    init: function init(form) {
        var _this = this;

        var inline = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        // disable browser built-in validation
        form.setAttribute('novalidate', '');

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var submitBtns = form.querySelectorAll('[type="submit"]');
            [].forEach.call(submitBtns, function (submitBtn) {
                submitBtn.disabled = true;
            });
            _this.validateSection(form).then(function (result) {
                [].forEach.call(submitBtns, function (submitBtn) {
                    submitBtn.disabled = false;
                });
                if (result === true) {
                    form.submit();
                } else {
                    _this.focusInput(result[0]);
                }
            });
        });

        if (inline) {
            this.initInline(form);
        }
    },
    initInline: function initInline(node) {
        var _this2 = this;

        var inputs = this.ui.getInputsInSection(node);
        inputs.forEach(function (input) {
            input.addEventListener('change', function () {
                _this2.checkInput(input).catch(function (e) {});
            });
        });
    },
    validateSection: function validateSection(node) {
        var _this3 = this;

        if (node.__bunny_validation_state === undefined) {
            node.__bunny_validation_state = true;
        } else {
            throw new Error('Bunny Validation: validation already in progress.');
        }
        return new Promise(function (resolve) {
            var resolvingInputs = _this3.ui.getInputsInSection(node, true);
            if (resolvingInputs.length === 0) {
                // nothing to validate, end
                _this3._endSectionValidation(node, resolvingInputs, resolve);
            } else {
                // run async validation for each input
                // when last async validation will be completed, call validSection or invalidSection
                var promises = [];

                var _loop = function _loop(i) {
                    var input = resolvingInputs.inputs[i].input;

                    _this3.checkInput(input).then(function () {
                        _this3._addValidInput(resolvingInputs, input);
                        if (resolvingInputs.unresolvedLength === 0) {
                            _this3._endSectionValidation(node, resolvingInputs, resolve);
                        }
                    }).catch(function (errorMessage) {
                        _this3._addInvalidInput(resolvingInputs, input);
                        if (resolvingInputs.unresolvedLength === 0) {
                            _this3._endSectionValidation(node, resolvingInputs, resolve);
                        }
                    });
                };

                for (var i = 0; i < resolvingInputs.length; i++) {
                    _loop(i);
                }

                // if there are not resolved promises after 3s, terminate validation, mark pending inputs as invalid
                setTimeout(function () {
                    if (resolvingInputs.unresolvedLength > 0) {
                        var unresolvedInputs = _this3._getUnresolvedInputs(resolvingInputs);
                        for (var i = 0; i < unresolvedInputs.length; i++) {
                            var _input = unresolvedInputs[i];
                            var inputGroup = _this3.ui.getInputGroup(_input);
                            _this3._addInvalidInput(resolvingInputs, _input);
                            _this3.ui.setErrorMessage(inputGroup, 'Validation terminated after 3s');
                            if (resolvingInputs.unresolvedLength === 0) {
                                _this3._endSectionValidation(node, resolvingInputs, resolve);
                            }
                        }
                    }
                }, 3000);
            }
        });
    },
    focusInput: function focusInput(input) {
        var delay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 500;
        var offset = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : -50;

        BunnyElement.scrollTo(input, delay, offset);
        input.focus();
        if (input.offsetParent !== null && input.setSelectionRange !== undefined && ['text', 'search', 'url', 'tel', 'password'].indexOf(input.type) !== -1 && typeof input.setSelectionRange === 'function') {
            input.setSelectionRange(input.value.length, input.value.length);
        }
    },
    checkInput: function checkInput(input) {
        var _this4 = this;

        return new Promise(function (valid, invalid) {
            _this4._checkInput(input, 0, valid, invalid);
        });
    },
    _addValidInput: function _addValidInput(resolvingInputs, input) {
        resolvingInputs.unresolvedLength--;
        for (var k in resolvingInputs.inputs) {
            if (input === resolvingInputs.inputs[k].input) {
                resolvingInputs.inputs[k].isValid = true;
                break;
            }
        }
    },
    _addInvalidInput: function _addInvalidInput(resolvingInputs, input) {
        resolvingInputs.unresolvedLength--;
        resolvingInputs.invalidLength++;
        for (var k in resolvingInputs.inputs) {
            if (input === resolvingInputs.inputs[k].input) {
                resolvingInputs.inputs[k].isValid = false;
                resolvingInputs.invalidInputs[k] = input;
                break;
            }
        }
    },
    _getUnresolvedInputs: function _getUnresolvedInputs(resolvingInputs) {
        var unresolvedInputs = [];
        for (var k in resolvingInputs.inputs) {
            if (!resolvingInputs.inputs[k].isValid) {
                unresolvedInputs.push(resolvingInputs.inputs[k].input);
            }
        }
        return unresolvedInputs;
    },
    _endSectionValidation: function _endSectionValidation(node, resolvingInputs, resolve) {
        delete node.__bunny_validation_state;

        if (resolvingInputs.invalidLength === 0) {
            // form or section is valid
            return resolve(true);
        } else {
            var invalidInputs = [];
            for (var k in resolvingInputs.invalidInputs) {
                invalidInputs.push(resolvingInputs.invalidInputs[k]);
            }
            // form or section has invalid inputs
            return resolve(invalidInputs);
        }
    },
    _checkInput: function _checkInput(input, index, valid, invalid) {
        var _this5 = this;

        var validators = Object.keys(this.validators);
        var currentValidatorName = validators[index];
        var currentValidator = this.validators[currentValidatorName];
        currentValidator(input).then(function () {
            index++;
            if (validators[index] !== undefined) {
                _this5._checkInput(input, index, valid, invalid);
            } else {
                var inputGroup = _this5.ui.getInputGroup(input);
                // if has error message, remove it
                _this5.ui.removeErrorNode(inputGroup);

                if (input.form !== undefined && input.form.hasAttribute('showvalid')) {
                    // mark input as valid
                    _this5.ui.setInputValid(inputGroup);
                }

                valid();
            }
        }).catch(function (data) {
            // get input group and label
            var inputGroup = _this5.ui.getInputGroup(input);
            var label = _this5.ui.getLabel(inputGroup);

            // get error message
            var errorMessage = _this5._getErrorMessage(currentValidatorName, input, label, data);

            // set error message
            _this5.ui.setErrorMessage(inputGroup, errorMessage);
            invalid(errorMessage);
        });
    },
    _getErrorMessage: function _getErrorMessage(validatorName, input, label, data) {
        var message = '';
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

        for (var paramName in data) {
            message = message.replace('{' + paramName + '}', data[paramName]);
        }
        return message;
    }
};

document.addEventListener('DOMContentLoaded', function () {
    [].forEach.call(document.forms, function (form) {
        if (form.getAttribute('validator') === 'bunny') {
            var inline = form.hasAttribute('validator-inline');
            Validation.init(form, inline);
        }
    });
});

Validation.init(document.forms[0], true);
