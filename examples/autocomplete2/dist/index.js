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
    var delay = arguments.length <= 3 || arguments[3] === undefined ? 500 : arguments[3];

    var timeout = 0;
    return addEvent(element, eventName, function (e) {
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            eventListener(e);
        }, delay);
    });
}

function isEventCursorInside(e, parent, child) {
    var bounds = parent.getBoundingClientRect();
    var childBounds = child.getBoundingClientRect();
    return e.clientX > bounds.left && e.clientX < bounds.right && e.clientY > bounds.top && e.clientY < bounds.bottom || e.clientX > childBounds.left && e.clientX < childBounds.right && e.clientY > childBounds.top && e.clientY < childBounds.bottom;
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
        var index = element.__bunny_core_outside_callbacks.indexOf(callback);
        if (index !== -1) {
            element.__bunny_core_outside_callbacks.splice(index, 1);
        }
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
    tagNameToggleBtn: 'toggle',
    tagNameMenu: 'menu',
    tagNameItem: 'button',

    className: 'dropdown',
    classNameToggleBtn: 'dropdown-toggle',
    classNameMenu: 'dropdown-menu',
    classNameItem: 'dropdown-item',

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
        return dropdown.querySelector('div.' + this.Config['className' + name]) || false;
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
            queryStr += 'div.' + this.Config.classNameItem;
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
        var callback = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

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
        return document.getElementsByClassName('div.' + this.Config.className);
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
                //document.addEventListener('click', this._getUniqueClickOutsideHandler(dropdown));
                //document.addEventListener('touchstart', this._getUniqueClickOutsideHandler(dropdown));
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

            //document.removeEventListener('click', dropdown.__bunny_dropdown_outside_handler);
            //document.removeEventListener('touchstart', dropdown.__bunny_dropdown_outside_handler);
            //delete dropdown.__bunny_dropdown_outside_handler;

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
                addEventOnce(dropdown, 'mouseover', function (e) {
                    if (isEventCursorInside(e, dropdown, _this3.UI.getMenu(dropdown))) {
                        // cursor is inside toggle btn or menu => open menu if required
                        _this3.open(dropdown);
                    }
                }, 100);

                addEventOnce(dropdown, 'mouseout', function (e) {
                    if (!isEventCursorInside(e, dropdown, _this3.UI.getMenu(dropdown))) {
                        // cursor is outside toggle btn and menu => close menu if required
                        _this3.close(dropdown);
                    }
                }, 500);
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
    },
    isCustomValueAllowed: function isCustomValueAllowed(autocomplete) {
        return autocomplete.hasAttribute('custom') || this.Config.allowCustomInput;
    },
    getMinChar: function getMinChar(autocomplete) {
        if (autocomplete.hasAttribute('min')) {
            return autocomplete.getAttribute('min');
        } else {
            return this.Config.minChar;
        }
    }
});

var Autocomplete = Object.assign({}, Dropdown, {

    UI: AutocompleteUI,
    Config: AutocompleteConfig,

    // override methods

    close: function close(autocomplete) {
        if (autocomplete.__bunny_autocomplete_outside) {
            removeClickOutside(autocomplete, autocomplete.__bunny_autocomplete_outside);
            delete autocomplete.__bunny_autocomplete_outside;
        }
        Dropdown.close.call(this, autocomplete);
    },
    open: function open(autocomplete) {
        var _this = this;

        autocomplete.__bunny_autocomplete_outside = onClickOutside(autocomplete, function () {
            if (!_this.UI.isCustomValueAllowed(autocomplete)) {
                // custom input not allowed, restore to value before input was focused
                if (autocomplete.__bunny_autocomplete_initial_value !== undefined) {
                    _this.UI.getInput(autocomplete).value = autocomplete.__bunny_autocomplete_initial_value;
                }
            } else {
                // custom input is allowed, empty hidden value
                _this._selectItem(autocomplete, null);
            }
        });
        Dropdown.open.call(this, autocomplete);
    },
    _addEvents: function _addEvents(autocomplete) {
        var _this2 = this;

        var input = this.UI.getInput(autocomplete);
        addEventOnce(input, 'input', function () {
            if (input.value.length >= _this2.UI.getMinChar(autocomplete)) {
                _this2.update(autocomplete, input.value);
            } else {
                _this2.close(autocomplete);
                //this.UI.removeMenu();
            }
        }, this.Config.delay);

        input.addEventListener('focus', function () {
            autocomplete.__bunny_autocomplete_initial_value = input.value;
        });
    },


    // custom methods

    update: function update(autocomplete, search) {
        var _this3 = this;

        var action = getActionObject(autocomplete);
        action(search).then(function (data) {
            if (Object.keys(data).length > 0) {
                _this3.close(autocomplete);
                var items = _this3.UI.createMenuItems(data);
                _this3._addItemEvents(autocomplete, items);
                _this3.UI.setMenuItems(autocomplete, items);
                _this3._setARIA(autocomplete);
                _this3.open(autocomplete);
            } else {
                _this3.close(autocomplete);
            }
        });
    },
    _addItemEvents: function _addItemEvents(autocomplete, items) {
        var _this4 = this;

        [].forEach.call(items.childNodes, function (item) {
            item.addEventListener('click', function () {
                _this4._selectItem(autocomplete, item);
            });
        });
    },
    _updateInputValues: function _updateInputValues(autocomplete, item) {

        var input = this.UI.getInput(autocomplete);

        if (item !== null) {
            input.value = item.textContent;
        }

        var hiddenInput = this.UI.getHiddenInput(autocomplete);
        if (hiddenInput) {
            if (item !== null) {
                hiddenInput.value = item.dataset.value;
            } else {
                hiddenInput.value = input.value;
            }
        }
    },
    _selectItem: function _selectItem(autocomplete) {
        var _this5 = this;

        var item = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

        this._updateInputValues(autocomplete, item);

        callElementCallbacks(autocomplete, 'autocomplete', function (cb) {
            if (item === null) {
                cb(null, _this5.UI.getInput(autocomplete).value);
            } else {
                cb(item.dataset.value, item.textContent, item);
            }
        });

        this.close(autocomplete);
    },
    onItemSelect: function onItemSelect(autocomplete, callback) {
        pushCallbackToElement(autocomplete, 'autocomplete', callback);
    }
});

document.addEventListener('DOMContentLoaded', function () {
    Autocomplete.initAll();
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
        document.getElementById('current').textContent = 'CUSTOM ' + label;
    }
});