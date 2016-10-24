var AutocompleteMarkup = {
    createEmptyDropdown: function createEmptyDropdown() {
        var dropdown = document.createElement('div');
        return dropdown;
    },
    createDropdownItem: function createDropdownItem(value, content) {
        var item = document.createElement('button');
        item.setAttribute('type', 'button');
        item.setAttribute('value', value);
        item.textContent = content;
        return item;
    },
    createDropdownItemsFromData: function createDropdownItemsFromData(data) {
        var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

        var fragment = document.createDocumentFragment();
        for (var key in data) {
            var item = this.createDropdownItem(key, data[key]);
            if (callback !== null) {
                callback(item, key, data[key]);
            }
            fragment.appendChild(item);
        }
        return fragment;
    },
    removeDropdown: function removeDropdown(dropdown) {
        /*while (dropdown.firstChild) {
            dropdown.removeChild(dropdown.firstChild);
        }*/
        if (dropdown.parentNode !== null) {
            dropdown.parentNode.removeChild(dropdown);
        }
    },
    insertDropdown: function insertDropdown(container, dropdown) {
        var el = container.getElementsByTagName('input')[0];
        el.parentNode.insertBefore(dropdown, el.nextSibling);
    }
};

var AutocompleteDecorator = {

    theme: {
        bs4: {
            classPrefix: '',

            dropdownClass: ['dropdown-menu', 'w-100'],
            dropdownItemClass: 'dropdown-item',
            showClass: 'open'

        }
    },

    buildClass: function buildClass(el, classProperty, theme) {
        var del = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

        var cls = this.theme[theme][classProperty + 'Class'];
        if (typeof cls === 'string') {
            if (del) {
                el.classList.remove(cls);
            } else {
                el.classList.add(cls);
            }
        } else {
            for (var k = 0; k < cls.length; k++) {
                if (del) {
                    el.classList.remove(cls[k]);
                } else {
                    el.classList.add(cls[k]);
                }
            }
        }
    },
    decorateDropdown: function decorateDropdown(dropdown) {
        var theme = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'bs4';

        this.buildClass(dropdown, 'dropdown', theme);
    },
    decorateDropdownItem: function decorateDropdownItem(item) {
        var theme = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'bs4';

        this.buildClass(item, 'dropdownItem', theme);
    },
    showDropdown: function showDropdown(el_to_apply_class) {
        var theme = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'bs4';

        this.buildClass(el_to_apply_class, 'show', theme);
    },
    hideDropdown: function hideDropdown(el_to_apply_class) {
        var theme = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'bs4';

        this.buildClass(el_to_apply_class, 'show', theme, true);
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

var AutocompleteController = {
    attachInputTypeEvent: function attachInputTypeEvent(container_id) {
        var _this = this;

        var data_handler = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : JSON.parse;
        var ajax_headers = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        var ac = Autocomplete.get(container_id);
        var timer = 0;
        ac._picked = false;
        ac.input.addEventListener('input', function () {
            clearTimeout(timer);
            timer = setTimeout(function () {
                _this._handleDataLoad(container_id, data_handler, ajax_headers);
            }, ac.options.inputDelay);
        });

        ac.input.addEventListener('change', function (e) {
            // if value was reset by script
            if (ac.input.value === '' && !e.isTrusted) {
                Autocomplete.hide(container_id);
            }
        });
    },
    _handleDataLoad: function _handleDataLoad(container_id, data_handler, ajax_headers) {
        var ac = Autocomplete.get(container_id);
        if (ac.input.value.length >= ac.options.minCharLimit) {

            var ajax_url = ac.ajaxUrl.replace('{search}', encodeURI(ac.input.value));
            Ajax.get(ajax_url, function (data) {
                var $data = data_handler(data);
                if ($data.length !== 0) {
                    Autocomplete.setItems(container_id, $data);
                    Autocomplete.show(container_id);
                } else {
                    Autocomplete.hide(container_id);
                }
            }, function (response_text, status_code) {
                if (ac.options.ajaxErrorHandler !== null) {
                    ac.options.ajaxErrorHandler(response_text, status_code);
                }
                Autocomplete.hide(container_id);
            }, ajax_headers);
        } else {
            // if dropdown already displayed and user deleted value, hide dropdown
            Autocomplete.hide(container_id);
        }
    },
    attachInputFocusEvent: function attachInputFocusEvent(container_id) {
        var ac = Autocomplete.get(container_id);
        ac.input.addEventListener('focus', function (e) {
            ac._picked = false;
            ac._valueOnFocus = this.value;
        });
    },
    attachInputOutEvent: function attachInputOutEvent(container_id) {
        var ac = Autocomplete.get(container_id);
        ac.input.addEventListener('blur', function (e) {
            var input = this;
            setTimeout(function () {
                if (!ac._picked) {
                    // if item was not picked from list
                    if (ac.options.allowCustomInput) {
                        // custom input allowed, keep input value as is
                        // if there is hidden input set it to options default value (empty)
                        if (ac.hiddenInput !== null) {
                            ac.hiddenInput.value = ac.options.defaultCustomHiddenInputValue;
                        }
                    } else {
                        // custom input not allowed, restore default
                        if (ac._valueOnFocus !== input.value) {
                            // restore default only if value changed
                            Autocomplete.restoreDefaultValue(container_id);
                        }
                    }
                    // hide dropdown
                    Autocomplete.hide(container_id);
                }
                ac._picked = false;
            }, 150);
        });
    },
    attachItemSelectEvent: function attachItemSelectEvent(container_id) {
        var ac = Autocomplete.get(container_id);
        var self = this;
        for (var k = 0; k < ac.dropdownItems.length; k++) {
            ac.dropdownItems[k].addEventListener('mousedown', function (e) {
                if (e.button === 0) {
                    e.preventDefault();
                    self.selectItem(container_id, this);
                }
            });
        }
    },
    selectItem: function selectItem(container_id, item_el) {
        var ac = Autocomplete.get(container_id);
        var attr_val = item_el.getAttribute('value');
        if (attr_val === null) {
            attr_val = item_el.innerHTML;
        }
        ac._picked = true;
        Autocomplete.hide(container_id);
        ac.input.value = item_el.innerHTML;
        if (ac.hiddenInput !== null) {
            ac.hiddenInput.value = attr_val;
        }
        for (var i = 0; i < ac.itemSelectHandlers.length; i++) {
            ac.itemSelectHandlers[i](attr_val, item_el.innerHTML);
        }
    },
    attachInputKeydownEvent: function attachInputKeydownEvent(container_id) {
        var ac = Autocomplete.get(container_id);
        var self = this;
        ac.input.addEventListener('keydown', function (e) {
            var c = e.keyCode;

            if (Autocomplete.isOpened(container_id)) {
                if (c === 9) {
                    // tab
                    if (ac._currentItemIndex === null) {
                        self.selectItem(container_id, ac.dropdownItems[0]);
                    } else {
                        self.selectItem(container_id, ac.dropdownItems[ac._currentItemIndex]);
                    }
                } else if (c === 13) {
                    // Enter
                    e.preventDefault();
                    if (ac._currentItemIndex !== null) {
                        self.selectItem(container_id, ac.dropdownItems[ac._currentItemIndex]);
                    } else {
                        // pick first item from list
                        self.selectItem(container_id, ac.dropdownItems[0]);
                    }
                } else if (c === 27) {
                    // Esc
                    Autocomplete.restoreDefaultValue(container_id);
                    Autocomplete.hide(container_id);
                    e.preventDefault();
                } else if (c === 38) {
                    // up
                    if (ac._currentItemIndex !== null && ac._currentItemIndex > 0) {
                        ac.dropdownItems[ac._currentItemIndex].classList.toggle('active');
                        ac._currentItemIndex -= 1;
                        ac.dropdownItems[ac._currentItemIndex].classList.toggle('active');
                        ac.dropdownItems[ac._currentItemIndex].scrollIntoView(false);
                    }
                } else if (c === 40) {
                    // down
                    if (ac._currentItemIndex === null) {
                        ac._currentItemIndex = 0;
                        ac.dropdownItems[0].classList.toggle('active');
                    } else {
                        if (ac._currentItemIndex + 1 < ac.dropdownItems.length) {
                            ac.dropdownItems[ac._currentItemIndex].classList.toggle('active');
                            ac._currentItemIndex += 1;
                            ac.dropdownItems[ac._currentItemIndex].classList.toggle('active');
                            ac.dropdownItems[ac._currentItemIndex].scrollIntoView(false);
                        }
                    }
                }
            } else if (c === 13) {
                // Enter
                self.callCustomItemSelectHandlers(container_id);
            }
        });
    },
    callCustomItemSelectHandlers: function callCustomItemSelectHandlers(container_id) {
        var ac = Autocomplete.get(container_id);
        if (ac.input.value.length >= ac.options.minCustomCharLimit) {
            for (var k = 0; k < ac.itemSelectHandlersCustom.length; k++) {
                ac.itemSelectHandlersCustom[k](ac.input.value);
            }
        }
    }
};

var Autocomplete = {

    _autocompleteContainers: [],
    _options: {
        theme: 'bs4',
        minCharLimit: 2,
        minCustomCharLimit: 3,
        inputDelay: 200,
        allowCustomInput: false,
        defaultCustomHiddenInputValue: '',
        ajaxHeaders: {},
        ajaxErrorHandler: null
    },

    /**
     *
     * @param {string} input_id
     * @param {string} hidden_input_id
     * @param {string} ajax_url
     * @param {object} options
     */
    create: function create(input_id, hidden_input_id, ajax_url) {
        var data_handler = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : JSON.parse;
        var options = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : {};


        for (var i in this._options) {
            if (options[i] === undefined) {
                options[i] = this._options[i];
            }
        }

        if (ajax_url.indexOf('{search}') === -1) {
            console.error('BunnyJS Autocomplete.create() error: ajax_url must contain a {search}');
            return false;
        }

        var container_id = input_id + '_autocomplete';

        var container = document.getElementById(container_id);

        if (container === null) {
            console.error('BunnyJS Autocomplete.create() error: container for input with ID "' + input_id + '_autocomplete" not found.' + 'Input must be inside a container.');
            return false;
        }

        var input = document.getElementById(input_id);

        var default_value = input.getAttribute('value');
        if (default_value === null) {
            default_value = '';
        }

        var hidden_input = document.getElementById(hidden_input_id);

        var default_hidden_value = null;
        if (hidden_input !== null) {
            default_hidden_value = hidden_input.value;
        }

        /*var dropdown = AutocompleteMarkup.createEmptyDropdown();
        AutocompleteDecorator.decorateDropdown(dropdown, options.theme);*/

        var dropdown = null;

        this._autocompleteContainers[container_id] = {
            ajaxUrl: ajax_url,
            container: container,
            input: input,
            hiddenInput: hidden_input,
            dropdown: dropdown,
            dropdownItems: [],
            itemSelectHandlers: [],
            itemSelectHandlersCustom: [],
            defaultValue: default_value,
            defaultHiddenValue: default_hidden_value,
            dataHandler: data_handler,
            _picked: false, // is picked from list, used in blur (focus out) event
            _onFocusValue: default_value, // value on focus
            _isOpened: false,
            _currentItemIndex: null, // currently active dropdown item index of dropdownItems when navigating with up/down keys
            options: options
        };

        //container.appendChild(dropdown);

        AutocompleteController.attachInputTypeEvent(container_id, data_handler, options.ajaxHeaders);
        AutocompleteController.attachInputFocusEvent(container_id);
        AutocompleteController.attachInputOutEvent(container_id);
        AutocompleteController.attachInputKeydownEvent(container_id);
    },
    get: function get(container_id) {
        return this._autocompleteContainers[container_id];
    },
    setItems: function setItems(container_id, data) {

        //var t0 = performance.now();

        var cont = this._autocompleteContainers[container_id];

        if (cont.dropdown !== null) {
            AutocompleteMarkup.removeDropdown(cont.dropdown);
            cont.dropdownItems = [];
            cont._currentItemIndex = null;
        }

        var dropdown = AutocompleteMarkup.createEmptyDropdown();
        AutocompleteDecorator.decorateDropdown(dropdown, cont.options.theme);

        var items_fragment = AutocompleteMarkup.createDropdownItemsFromData(data, function (item, value) {
            AutocompleteDecorator.decorateDropdownItem(item, cont.options.theme);
            cont.dropdownItems.push(item);
            //cont.dropdown.appendChild(item);
        });

        dropdown.appendChild(items_fragment);
        cont.dropdown = dropdown;
        AutocompleteMarkup.insertDropdown(cont.container, dropdown);

        AutocompleteController.attachItemSelectEvent(container_id);

        //var t1 = performance.now();
        //console.log("setItems() call took " + (t1 - t0) + " milliseconds.");
    },
    show: function show(container_id) {
        this._autocompleteContainers[container_id]._isOpened = true;
        AutocompleteDecorator.showDropdown(this._autocompleteContainers[container_id].container, this._autocompleteContainers[container_id].options.theme);
    },
    hide: function hide(container_id) {
        this._autocompleteContainers[container_id]._isOpened = false;
        AutocompleteDecorator.hideDropdown(this._autocompleteContainers[container_id].container, this._autocompleteContainers[container_id].options.theme);
    },
    isOpened: function isOpened(container_id) {
        return this._autocompleteContainers[container_id]._isOpened;
    },
    onItemSelect: function onItemSelect(container_id, handler) {
        this._autocompleteContainers[container_id].itemSelectHandlers.push(handler);
    },
    onCustomItemSelect: function onCustomItemSelect(container_id, handler) {
        this._autocompleteContainers[container_id].itemSelectHandlersCustom.push(handler);
    },
    restoreDefaultValue: function restoreDefaultValue(container_id) {
        var ac = this.get(container_id);
        ac.input.value = this.get(container_id).defaultValue;
        if (ac.defaultHiddenValue !== null) {
            ac.hiddenInput.value = ac.defaultHiddenValue;
        }
    }
};

Autocomplete.create('country', 'country_id', 'https://restcountries.eu/rest/v1/name/{search}', function (response_data) {
    // Result for autocomplete should be an assoc array in format id: value
    // in this example free service is used to search countries and data it provides does not match required format for autocomplete.
    // With Autocomplete.create() 4th argument data_handler response text can be formatted manually.
    // For better performance server should return data in id: value format.
    data = JSON.parse(response_data);
    var result = {};
    data.forEach(function (country) {
        result[country.alpha2Code] = country.name;
    });
    return result;
});
