var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

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

      if (value && (typeof value === 'function' || (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object')) {
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

    if (value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) === 'object' && value.constructor === Class) return value;

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
    window.KEY_BACKSPACE = 8;
    window.KEY_TAB = 9;
    window.KEY_ENTER = 13;
    window.KEY_SHIFT = 16;
    window.KEY_CTRL = 17;
    window.KEY_ALT = 18;
    window.KEY_ESCAPE = 27;
    window.KEY_PAGE_UP = 33;
    window.KEY_PAGE_DOWN = 34;
    window.KEY_ARROW_LEFT = 37;
    window.KEY_ARROW_UP = 38;
    window.KEY_ARROW_RIGHT = 39;
    window.KEY_ARROW_DOWN = 40;
    window.KEY_DELETE = 46;
})();

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
    if (!(event.target === element || element.contains(event.target))) {
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

function addEventKeyNavigation(element, items, itemSelectCallback) {
  var activeClass = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 'active';


  var currentItemIndex = null;

  var _itemAdd = function _itemAdd() {
    items[currentItemIndex].classList.add(activeClass);
    items[currentItemIndex].setAttribute('aria-selected', 'true');
    items[currentItemIndex].scrollIntoView(false);
  };

  var _itemRemove = function _itemRemove() {
    items[currentItemIndex].classList.remove(activeClass);
    items[currentItemIndex].removeAttribute('aria-selected');
  };

  var handler = function handler(e) {
    var c = e.keyCode;

    var maxItemIndex = items.length - 1;

    if (c === KEY_ENTER) {
      e.preventDefault();
      if (currentItemIndex !== null) {
        itemSelectCallback(items[currentItemIndex]);
      } else {
        // pick first item from list
        itemSelectCallback(items[0]);
      }
    } else if (c === KEY_ESCAPE) {
      e.preventDefault();
      itemSelectCallback(false);
    } else if (c === KEY_ARROW_UP) {
      e.preventDefault();
      if (currentItemIndex !== null && currentItemIndex > 0) {
        _itemRemove();
        currentItemIndex -= 1;
        _itemAdd();
      }
    } else if (c === KEY_ARROW_DOWN) {
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

  element.addEventListener('keydown', handler);

  return handler;
}

function removeEventKeyNavigation(element, handler) {
  element.removeEventListener('keydown', handler);
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
  tagNameToggleBtn: 'toggle',
  tagNameMenu: 'menu',
  tagNameItem: 'button',

  className: 'dropdown',
  classNameToggleBtn: 'dropdown-toggle',
  classNameMenu: 'dropdown-menu',
  classNameItem: 'dropdown-item',
  classNameActive: 'active',

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
    return this._getElement(dropdown, 'ToggleBtn');
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
  createMenuItems: function createMenuItems(items) {
    var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    var f = document.createDocumentFragment();
    for (var id in items) {
      var i = this._createElement('Item');
      if (callback !== null) {
        f.appendChild(callback(i, items[id]));
      } else {
        i.dataset.value = id;
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
    if (this.Config.useHiddenAttribute) {
      if (!menu.hasAttribute('hidden')) {
        menu.setAttribute('hidden', '');
        return true;
      }
      return false;
    } else {
      var target = this.Config.applyOpenedClassToDropdown ? dropdown : menu;
      if (target.classList.contains(this.Config.classNameOpened)) {
        target.classList.remove(this.Config.classNameOpened);
        return true;
      }
      return false;
    }
  },
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
  },
  setItemInactive: function setItemInactive(item) {
    item.classList.remove(this.Config.classNameActive);
  }
};

var Dropdown = {

  UI: DropdownUI,

  init: function init(dropdown) {
    if (dropdown.__bunny_dropdown !== undefined) {
      return false;
    }
    dropdown.__bunny_dropdown = {};
    this._addEvents(dropdown);
    this._setARIA(dropdown);

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
        dropdown.__bunny_dropdown_outside = onClickOutside(dropdown, function () {
          _this2.close(dropdown);
        });
      }, 100);

      var btn = this.UI.getToggleBtn(dropdown);
      if (btn) {
        btn.removeEventListener('click', dropdown.__bunny_dropdown_toggle_handler);
        delete dropdown.__bunny_dropdown_toggle_handler;
      }

      if (this.isClosableOnItemClick(dropdown)) {
        this._addItemClickEvents(dropdown);
      }

      dropdown.dispatchEvent(this._getOpenEvent(dropdown));
    }
  },
  close: function close(dropdown) {
    if (this.UI.hide(dropdown)) {

      removeClickOutside(dropdown, dropdown.__bunny_dropdown_outside);
      delete dropdown.__bunny_dropdown_outside;

      var btn = this.UI.getToggleBtn(dropdown);
      if (btn) {
        btn.addEventListener('click', this._getUniqueClickToggleBtnHandler(dropdown));
      }

      if (this.isClosableOnItemClick(dropdown)) {
        this._removeItemClickEvents(dropdown);
      }

      dropdown.dispatchEvent(this._getCloseEvent(dropdown));
    }
  },
  _addEvents: function _addEvents(dropdown) {
    var _this3 = this;

    // open dropdown on toggle btn click or hover
    var btn = this.UI.getToggleBtn(dropdown);
    if (btn) {
      btn.addEventListener('click', this._getUniqueClickToggleBtnHandler(dropdown));

      if (this.isHoverable(dropdown)) {
        (function () {
          var menu = _this3.UI.getMenu(dropdown);
          addEventOnce(dropdown, 'mouseover', function (e) {
            _this3.open(dropdown);
          }, 50);

          addEventOnce(dropdown, 'mouseout', function (e) {
            if (!isEventCursorInside(e, btn) && !isEventCursorInside(e, menu)) {
              // cursor is outside toggle btn and menu => close menu if required
              _this3.close(dropdown);
            }
          }, 500);
        })();
      }
    }
  },
  _setARIA: function _setARIA(dropdown) {
    var btn = this.UI.getToggleBtn(dropdown);
    if (btn) {
      btn.setAttribute('aria-haspopup', 'true');
    }

    /*const menu = this.UI.getMenu(dropdown);
     if (menu) {
     menu.setAttribute('role', 'menu');
     }
       const menuitems = this.UI.getMenuItems(dropdown);
     [].forEach.call(menuitems, menuitem => {
     menuitem.setAttribute('role', 'menuitem');
     })*/
  },
  _addItemClickEvents: function _addItemClickEvents(dropdown) {
    var menuItems = this.UI.getMenuItems(dropdown);
    var handler = this._getUniqueClickItemHandler(dropdown);
    [].forEach.call(menuItems, function (menuItem) {
      menuItem.addEventListener('click', handler);
    });
  },
  _removeItemClickEvents: function _removeItemClickEvents(dropdown) {
    var menuItems = this.UI.getMenuItems(dropdown);
    [].forEach.call(menuItems, function (menuItem) {
      menuItem.removeEventListener('click', dropdown.__bunny_dropdown_item_handler);
    });
    delete dropdown.__bunny_dropdown_item_handler;
  },
  _getUniqueClickItemHandler: function _getUniqueClickItemHandler(dropdown) {
    if (dropdown.__bunny_dropdown_item_handler === undefined) {
      var data = {
        self: this,
        dropdown: dropdown
      };
      dropdown.__bunny_dropdown_item_handler = this._clickItemHandler.bind(data);
    }
    return dropdown.__bunny_dropdown_item_handler;
  },
  _clickItemHandler: function _clickItemHandler(event) {
    var data = this;
    var BunnyDropdown = data.self;
    var dropdown = data.dropdown;

    setTimeout(function () {
      BunnyDropdown.close(dropdown);
    }, 50);
  },
  _getUniqueClickToggleBtnHandler: function _getUniqueClickToggleBtnHandler(dropdown) {
    if (dropdown.__bunny_dropdown_toggle_handler === undefined) {
      var data = {
        self: this,
        dropdown: dropdown
      };
      dropdown.__bunny_dropdown_toggle_handler = this._clickToggleBtnHandler.bind(data);
    }
    return dropdown.__bunny_dropdown_toggle_handler;
  },
  _clickToggleBtnHandler: function _clickToggleBtnHandler(event) {
    var data = this;
    var BunnyDropdown = data.self;
    var dropdown = data.dropdown;

    if (BunnyDropdown.UI.isOpened(dropdown)) {
      BunnyDropdown.close(dropdown);
    } else {
      BunnyDropdown.open(dropdown);
    }
  },
  _getUniqueClickOutsideHandler: function _getUniqueClickOutsideHandler(dropdown) {
    if (dropdown.__bunny_dropdown_outside_handler === undefined) {
      var data = {
        self: this,
        dropdown: dropdown
      };
      dropdown.__bunny_dropdown_outside_handler = this._clickOutsideHandler.bind(data);
    }
    return dropdown.__bunny_dropdown_outside_handler;
  },
  _clickOutsideHandler: function _clickOutsideHandler(event) {
    var data = this;
    var BunnyDropdown = data.self;
    var dropdown = data.dropdown;
    var menu = BunnyDropdown.UI.getMenu(dropdown);
    if (!(event.target === menu || menu.contains(event.target))) {
      // clicked outside of menu => close menu
      BunnyDropdown.close(dropdown);
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
            actionObject = window[Model][searchAction];
        } catch (e) {}
    }

    if (actionObject === undefined) {
        throw new Error('Bunny Error: Model search action specified in action="' + action + '" attribute not found');
    }
    return actionObject;
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
        callbacks.forEach(function (callback) {
            cb(callback);
        });
    }
}

var AutocompleteConfig = Object.assign({}, DropdownConfig, {

  // override
  useTagNames: true,

  tagName: 'autocomplete',

  // custom
  delay: 200,
  minChar: 2,
  allowCustomInput: false

});

var AutocompleteUI = Object.assign({}, DropdownUI, {

  Config: AutocompleteConfig,

  getInput: function getInput(autocomplete) {
    return autocomplete.querySelector('input:not([type="hidden"])') || false;
  },
  getHiddenInput: function getHiddenInput(autocomplete) {
    return autocomplete.querySelector('input[type="hidden"]') || false;
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
    this._addEvents(autocomplete);
    this._setARIA(autocomplete);

    return true;
  },
  close: function close(autocomplete) {
    this._removeEventClickOutside(autocomplete);
    this._removeEventKeyNavigation(autocomplete);
    Dropdown.close.call(this, autocomplete);
  },
  open: function open(autocomplete) {
    this._addEventClickOutside(autocomplete);
    this._addEventKeyNavigation(autocomplete);
    Dropdown.open.call(this, autocomplete);
  },
  _addEvents: function _addEvents(autocomplete) {
    var input = this.UI.getInput(autocomplete);
    this._addEventInput(autocomplete, input);
    this._addEventFocus(autocomplete, input);
    this._addEventFocusOut(autocomplete, input);
  },


  // custom methods

  // config methods

  isCustomValueAllowed: function isCustomValueAllowed(autocomplete) {
    return autocomplete.hasAttribute('custom') || this.Config.allowCustomInput;
  },
  getMinChar: function getMinChar(autocomplete) {
    if (autocomplete.hasAttribute('min')) {
      return autocomplete.getAttribute('min');
    } else {
      return this.Config.minChar;
    }
  },


  // events

  _addEventInput: function _addEventInput(autocomplete, input) {
    var _this = this;

    addEventOnce(input, 'input', function () {
      if (input.value.length >= _this.getMinChar(autocomplete)) {
        _this.update(autocomplete, input.value);
      } else {
        _this.close(autocomplete);
      }
    }, this.Config.delay);
  },
  _addEventFocus: function _addEventFocus(autocomplete, input) {
    input.addEventListener('focus', function () {
      autocomplete.__bunny_autocomplete_initial_value = input.value;
    });
  },
  _addEventFocusOut: function _addEventFocusOut(autocomplete, input) {
    var _this2 = this;

    // if on focus out
    // value is empty -> clear values
    // else if value not picked from list and custom value not allowed -> restore default value
    input.addEventListener('blur', function () {
      if (input.value.length === 0) {
        _this2.clearValues(autocomplete);
      } else if (input.value.length < _this2.getMinChar(autocomplete) && !_this2.isCustomValueAllowed(autocomplete)) {
        _this2.restoreValue(autocomplete);
      }
    });
  },
  _addEventClickOutside: function _addEventClickOutside(autocomplete) {
    var _this3 = this;

    autocomplete.__bunny_autocomplete_outside = onClickOutside(autocomplete, function () {
      _this3._selectItem(autocomplete, null);
    });
  },
  _addEventKeyNavigation: function _addEventKeyNavigation(autocomplete) {
    var _this4 = this;

    autocomplete.__bunny_autocomplete_keydown = addEventKeyNavigation(this.UI.getInput(autocomplete), this.UI.getMenuItems(autocomplete), function (selectedItem) {
      if (selectedItem === false) {
        // canceled
        _this4.restoreValue(autocomplete);
      } else {
        _this4._selectItem(autocomplete, selectedItem);
      }
    }, this.Config.classNameActive);
  },
  _removeEventClickOutside: function _removeEventClickOutside(autocomplete) {
    if (autocomplete.__bunny_autocomplete_outside) {
      removeClickOutside(autocomplete, autocomplete.__bunny_autocomplete_outside);
      delete autocomplete.__bunny_autocomplete_outside;
    }
  },
  _removeEventKeyNavigation: function _removeEventKeyNavigation(autocomplete) {
    if (autocomplete.__bunny_autocomplete_keydown) {
      removeEventKeyNavigation(autocomplete, autocomplete.__bunny_autocomplete_keydown);
      delete autocomplete.__bunny_autocomplete_keydown;
    }
  },


  // item events

  _addItemEvents: function _addItemEvents(autocomplete, items) {
    var _this5 = this;

    [].forEach.call(items.childNodes, function (item) {
      item.addEventListener('click', function () {
        _this5._selectItem(autocomplete, item);
      });
    });
  },


  // public methods

  update: function update(autocomplete, search) {
    var _this6 = this;

    var action = getActionObject(autocomplete);
    action(search).then(function (data) {
      if (Object.keys(data).length > 0) {
        _this6.close(autocomplete);
        var items = _this6.UI.createMenuItems(data);
        _this6._addItemEvents(autocomplete, items);
        _this6.UI.setMenuItems(autocomplete, items);
        _this6._setARIA(autocomplete);
        _this6.open(autocomplete);
      } else {
        _this6.close(autocomplete);
      }
    });
  },
  restoreValue: function restoreValue(autocomplete) {
    if (autocomplete.__bunny_autocomplete_initial_value !== undefined) {
      this.UI.getInput(autocomplete).value = autocomplete.__bunny_autocomplete_initial_value;
    }

    this.close(autocomplete);
  },
  clearValues: function clearValues(autocomplete) {
    var input = this.UI.getInput(autocomplete);
    input.value = '';
    autocomplete.__bunny_autocomplete_initial_value = '';

    callElementCallbacks(autocomplete, 'autocomplete', function (cb) {
      cb('', '', false);
    });

    this.close(autocomplete);
  },


  // public event subscription

  onItemSelect: function onItemSelect(autocomplete, callback) {
    pushCallbackToElement(autocomplete, 'autocomplete', callback);
  },


  // private methods

  _updateInputValues: function _updateInputValues(autocomplete, item) {

    var input = this.UI.getInput(autocomplete);

    if (item !== null) {
      input.value = item.textContent;
      autocomplete.__bunny_autocomplete_initial_value = item.textContent;
    }

    var hiddenInput = this.UI.getHiddenInput(autocomplete);
    if (hiddenInput) {
      if (item !== null) {
        hiddenInput.value = item.dataset.value;
      } else {
        hiddenInput.value = '';
      }
    }
  },


  /**
   * If item = null, tries to select a custom value;
   * If custom value not allowed restore initial value (previously selected item or input value attribute otherwise)
   *
   * @param {HTMLElement} autocomplete
   * @param {HTMLElement|null} item
   * @private
   */
  _selectItem: function _selectItem(autocomplete) {
    var _this7 = this;

    var item = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    if (item === null && !this.isCustomValueAllowed(autocomplete)) {
      // custom input not allowed, restore to value before input was focused
      this.restoreValue(autocomplete);
    } else {
      this._updateInputValues(autocomplete, item);

      callElementCallbacks(autocomplete, 'autocomplete', function (cb) {
        if (item === null) {
          cb(null, _this7.UI.getInput(autocomplete).value);
        } else {
          cb(item.dataset.value, item.textContent, item);
        }
      });
    }

    this.close(autocomplete);
  }
});

document.addEventListener('DOMContentLoaded', function () {
  Autocomplete.initAll();
});

var CustomSelectConfig = Object.assign({}, DropdownConfig, {

  // override
  useTagNames: true,

  tagName: 'customselect'

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
  createHiddenSelect: function createHiddenSelect(selectAttributes, dropdownItems, label) {
    var e = document.createElement('select');
    e.setAttribute('hidden', '');

    for (var attribute in selectAttributes) {
      e.setAttribute(attribute, selectAttributes[attribute]);
    }

    var o = document.createElement('option');
    o.value = '';
    o.textContent = label;
    e.appendChild(o);

    [].forEach.call(dropdownItems, function (dropdownItem) {
      var o = document.createElement('option');
      if (dropdownItem.dataset.value === undefined) {
        throw new Error('CustomSelect: each item must have data-value attribute');
      }
      o.value = dropdownItem.dataset.value;
      o.textContent = dropdownItem.textContent;
      e.appendChild(o);
    });

    return e;
  },
  insertHiddenSelect: function insertHiddenSelect(customSelect, hiddenSelect) {
    customSelect.appendChild(hiddenSelect);
  },
  getItemByValue: function getItemByValue(customSelect, value) {
    var menu = this.getMenu(customSelect);
    return menu.querySelector('[data-value="' + value + '"]') || false;
  },
  getOptionByValue: function getOptionByValue(customSelect, value) {
    var hiddenSelect = this.getHiddenSelect(customSelect);
    return hiddenSelect.querySelector('[value="' + value + '"]') || false;
  },
  getSelectedOption: function getSelectedOption(customSelect) {
    var hiddenSelect = this.getHiddenSelect(customSelect);
    if (hiddenSelect.selectedIndex === 0) {
      return false;
    }
    return hiddenSelect.options[hiddenSelect.selectedIndex];
  },
  getSelectedValue: function getSelectedValue(customSelect) {
    var option = this.getSelectedOption(customSelect);
    if (option === false) {
      return false;
    }
    return option.value;
  },
  getLabelByValue: function getLabelByValue(customSelect, value) {
    return this.getOptionByValue(customSelect, value).textContent;
  },
  getPlaceholder: function getPlaceholder(customSelect) {
    return this.getHiddenSelect(customSelect).options[0].textContent;
  },
  selectItem: function selectItem(customSelect, value) {
    var curSelectedValue = this.getSelectedValue(customSelect);
    if (curSelectedValue !== false) {
      this.deselectItem(customSelect, curSelectedValue);
    }

    var option = this.getOptionByValue(customSelect, value);
    option.selected = true;

    var tglBtn = this.getToggleBtn(customSelect);
    var item = this.getItemByValue(customSelect, value);
    console.log(tglBtn, option);
    tglBtn.textContent = option.textContent;
    this.setItemActive(item);
  },
  deselectItem: function deselectItem(customSelect, value) {
    var option = this.getOptionByValue(customSelect, value);
    option.selected = false;

    var tglBtn = this.getToggleBtn(customSelect);
    tglBtn.textContent = this.getPlaceholder(customSelect);
    var item = this.getItemByValue(customSelect, value);
    this.setItemInactive(item);
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

    customSelect.__bunny_customselect = {};

    var defaultValue = customSelect.getAttribute('value');

    var hiddenSelect = this.UI.createHiddenSelect(this.getAttributesForSelect(customSelect), this.UI.getMenuItems(customSelect), this.UI.getToggleBtn(customSelect).textContent);
    this.UI.insertHiddenSelect(customSelect, hiddenSelect);

    this._addEvents(customSelect);
    this._addCustomSelectEvents(customSelect);
    this._setARIA(customSelect);

    return true;
  },
  _addCustomSelectEvents: function _addCustomSelectEvents(customSelect) {
    var _this = this;

    var items = this.UI.getMenuItems(customSelect);
    [].forEach.call(items, function (item) {
      item.addEventListener('click', function (e) {
        _this.select(customSelect, item.dataset.value);
      });
    });
  },
  getAttributesForSelect: function getAttributesForSelect(customSelect) {
    var selectAttributes = {};
    for (var k in customSelect.dataset) {
      selectAttributes[k] = customSelect.dataset[k];
    }
    return selectAttributes;
  },
  isMultiple: function isMultiple(customSelect) {
    return customSelect.dataset.multiple !== undefined;
  },
  select: function select(customSelect, value) {
    this.UI.selectItem(customSelect, value);
  },
  getSelectedValue: function getSelectedValue(customSelect) {
    var hiddenSelect = this.UI.getHiddenSelect(customSelect);
    return this.UI.getSelectedOption();
  }
});

document.addEventListener('DOMContentLoaded', function () {
  CustomSelect.initAll();
});

/**
 * CustomSelect base object
 * Wrapper of Bootstrap 4 dropdown list
 * Requires dropdown js
 */
var CustomSelect$1 = CustomSelect2 = {

  /**
   * CustomSelect factory, creates new object and initializes it
   * SHOULD contain "data-name" attribute
   *
   * No need of adding hidden inputs manually, they are created automatically by CustomSelect
   *
   *  TODO: move UI outside of CustomSelect logic and controller
   *  TODO: save container by id in private collection/singleton
   *
   *
   * @param {HTMLElement} dropdown_container  -  container containing dropdown, dropdown-toggle, dropdown-menu,
   * dropdown-item's;
   * dropdown-toggle is used as label (non-selected option)
   * dropdown-menu should contain at least one dropdown-item
   * dropdown-item should have data-value="value"
   * dropdown-item may have data-selected
   * in this container hidden native <select> is created
   *
   * @param {Object} selectAttributes  -  additional attributes to be set on hidden <select>,
   * if multiple no need to add "[]" at the end
   *
   *
   * @returns {Object} select  - object to be used as 1st argument in all CustomSelect public methods
   */
  create: function create(dropdown_container) {
    var selectAttributes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    if (dropdown_container.dataset.name === undefined) {
      throw new Error('CustomSelect: data-name attribute missing');
    }

    var defaultValue = dropdown_container.getAttribute('value');

    var dataset = {};
    for (var k in dropdown_container.dataset) {
      dataset[k] = dropdown_container.dataset[k];
    }

    selectAttributes = Object.assign({}, dataset, selectAttributes);

    var select = {};
    select.container = dropdown_container;
    if (selectAttributes.multiple) {
      selectAttributes.name += '[]';
    }

    select.toggle = this._getCustomToggleInput(select);
    select.toggleDefaultLabel = select.toggle.textContent;
    select.dropdown = this._getDropdown(select);

    var items = this._getDropdownItems(select);
    select.dropdownItems = {};

    select.select = this._createHiddenSelect(selectAttributes, items);
    this._insertHiddenSelect(select, select.select);

    for (var _k = 0; _k < items.length; _k++) {
      var item = items[_k];
      select.dropdownItems[item.dataset.value] = item;
      this._attachDropdownItemClickEvent(select, item);
      if (item.dataset.selected !== undefined || defaultValue == item.dataset.value) {
        this._select(select, item.dataset.value, false);
      }
    }

    dropdown_container._select = select;

    return select;
  },
  initAll: function initAll() {
    var _this2 = this;

    var container = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;

    container.getElementsByTagName('customselect').forEach(function (custom_select) {
      _this2.create(custom_select);
    });
  },
  _createHiddenSelect: function _createHiddenSelect(selectAttributes, items) {
    var e = document.createElement('select');
    e.setAttribute('hidden', '');

    for (var attribute in selectAttributes) {
      e.setAttribute(attribute, selectAttributes[attribute]);
    }

    var o = document.createElement('option');
    o.value = '';
    e.appendChild(o);

    for (var k = 0; k < items.length; k++) {
      var item = items[k];
      var _o = document.createElement('option');
      _o.value = item.dataset.value;
      e.appendChild(_o);
    }

    return e;
  },
  _insertHiddenSelect: function _insertHiddenSelect(select, hiddenSelect) {
    select.container.appendChild(hiddenSelect);
  },


  /**
   * Get select option DOM element by value
   * @param {Object} select
   * @param {String} value
   * @returns {HTMLElement|undefined}
   */
  getOption: function getOption(select, value) {
    return select.dropdownItems[value];
  },
  hideOption: function hideOption(select, value) {
    this.getOption(select, value).setAttribute('hidden', '');
  },
  showOption: function showOption(select, value) {
    this.getOption(select, value).removeAttribute('hidden');
  },
  select: function select(_select, value) {
    if (!this.isSelected(_select, value)) {
      if (this.isMultiple(_select)) {
        this._select(_select, value);
      } else {
        var oldValue = null;
        if (!this.hasNoSelectedOptions(_select)) {
          oldValue = _select.select.selectedOptions[0].value;
          this._deselect(_select, _select.select.selectedOptions[0].value, false);
        }
        this._select(_select, value, true, oldValue);
      }
    } else {
      this._deselect(_select, value);
    }
  },
  _select: function _select(select, value) {
    var fire_event = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
    var oldValue = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;

    var option = this.getOption(select, value);
    option.classList.add('active');
    option.dataset.selected = '';

    this._getHiddenOptionByValue(select, value).selected = true;

    //const hiddenOption = this._createHiddenOption(value);
    //this._insertHiddenOption(select, hiddenOption);

    if (!this.isMultiple(select)) {
      this.setLabelByValue(select, value);
    }

    if (fire_event) {
      this._fireChangeEventOnSelect(select, value, oldValue, option.textContent, true);
    }
  },
  deselect: function deselect(select, value) {
    if (this.isSelected(select, value)) {
      this._deselect(select, value);
    }
  },
  _deselect: function _deselect(select, value) {
    var fire_event = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    var option = this.getOption(select, value);
    var label = option.textContent;
    option.classList.remove('active');
    delete option.dataset.selected;

    //this._removeHiddenOption(select, value);
    this._getHiddenOptionByValue(select, value).selected = false;

    if (this.hasNoSelectedOptions(select)) {
      this.setDefaultLabel(select);
    }

    if (fire_event) {
      this._fireChangeEventOnSelect(select, value, value, label, false);
    }
  },
  hasNoSelectedOptions: function hasNoSelectedOptions(select) {
    return select.select.selectedOptions.length === 0 || select.select.selectedOptions.length === 1 && select.select.selectedOptions[0].value === '';
  },
  isSelected: function isSelected(select, value) {
    for (var k = 0; k < select.select.selectedOptions.length; k++) {
      if (select.select.selectedOptions[k].value === value) {
        return true;
      }
    }
    return false;
  },
  isMultiple: function isMultiple(select) {
    return select.select.multiple;
  },
  isRequired: function isRequired(select) {
    return select.select.required;
  },
  getSelectedOptions: function getSelectedOptions(select) {
    var selected_values = this.getSelectedValues(select);
    var selected_options = {};
    for (var k = 0; k < selected_values.length; k++) {
      var value = selected_values[k];
      selected_options[value] = select.dropdownItems[value];
    }
    return selected_options;
  },
  getSelectedValues: function getSelectedValues(select) {
    var selectedValues = [];
    for (var k = 0; k < select.select.selectedOptions.length; k++) {
      selectedValues.push(select.select.selectedOptions[k].value);
    }
    return selectedValues;
  },
  getOptionLabel: function getOptionLabel(select, value) {
    var option = this.getOption(select, value);
    return option.textContent;
  },
  setLabel: function setLabel(select, label) {
    select.toggle.textContent = label;
    this._setToggleActive(select);
  },
  setLabelByValue: function setLabelByValue(select, value) {
    var label = this.getOptionLabel(select, value);
    this.setLabel(select, label);
  },
  setDefaultLabel: function setDefaultLabel(select) {
    this.setLabel(select, select.toggleDefaultLabel);
    this._setToggleInactive(select);
  },
  _attachDropdownItemClickEvent: function _attachDropdownItemClickEvent(select, item) {
    var _this3 = this;

    item.addEventListener('click', function () {
      var value = item.dataset.value;
      _this3.select(select, value);
    });
  },
  _fireChangeEventOnSelect: function _fireChangeEventOnSelect(select, value, oldValue, label) {
    var selected = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;

    var event = new CustomEvent('change', { detail: { value: value, oldValue: oldValue, label: label, selected: selected } });
    select.container.dispatchEvent(event);
  },
  _getCustomToggleInput: function _getCustomToggleInput(select) {
    var toggle = select.container.getElementsByClassName('dropdown-toggle')[0];
    if (toggle === undefined) {
      throw new Error('CustomSelect must have a child element with class="dropdown-toggle"');
    }
    return toggle;
  },
  _getDropdown: function _getDropdown(select) {
    var dropdown = select.container.getElementsByClassName('dropdown-menu')[0];
    if (dropdown === undefined) {
      throw new Error('CustomSelect must have a child element with class="dropdown-menu"');
    }
    return dropdown;
  },


  /**
   * Get all dropdown items and custom input with empty value
   * @param {Object} select
   * @returns {Array} of HTMLElement
   * @private
   */
  _getDropdownItems: function _getDropdownItems(select) {
    var items = select.dropdown.getElementsByClassName('dropdown-item');
    if (items.length === 0) {
      throw new Error('Dropdown in CustomSelect must have at least one child element with class="dropdown-item"');
    }
    for (var k = 0; k < items.length; k++) {
      var item = items[k];
      if (item.dataset.value === undefined) {
        throw new Error('All Dropdown Items in CustomSelect must have data-value attribute');
      }
    }
    return items;
  },
  _setToggleActive: function _setToggleActive(select) {
    select.toggle.classList.add('dropdown-active');
  },
  _setToggleInactive: function _setToggleInactive(select) {
    select.toggle.classList.remove('dropdown-active');
  },
  _getHiddenOptionByValue: function _getHiddenOptionByValue(select, value) {
    for (var k = 0; k < select.select.options.length; k++) {
      if (select.select.options[k].value == value) {
        return select.select.options[k];
      }
    }
    throw new Error('CustomSelect: option with value "' + value + '" not found');
  }
};

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
        }).catch(function (e) {
            console.error(e);
        });
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

Autocomplete.onItemSelect(document.getElementsByTagName('autocomplete')[0], function (id, label) {
    if (id !== null) {
        document.getElementById('current').textContent = id;
    } else {
        document.getElementById('current').textContent = '';
    }
});
