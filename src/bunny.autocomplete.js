
import { AutocompleteMarkup } from './autocomplete/markup';
import { AutocompleteDecorator } from './autocomplete/decorator';
import { AutocompleteController } from './autocomplete/controller';

export var Autocomplete = {

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
    create(input_id, hidden_input_id, ajax_url, data_handler = JSON.parse, options = {}) {

        for(var i in this._options) {
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
            console.error('BunnyJS Autocomplete.create() error: container for input with ID "' + input_id + '_autocomplete" not found.' +
                'Input must be inside a container.');
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

    get(container_id) {
        return this._autocompleteContainers[container_id];
    },

    setItems(container_id, data) {

        //var t0 = performance.now();

        var cont = this._autocompleteContainers[container_id];

        if (cont.dropdown !== null) {
            AutocompleteMarkup.removeDropdown(cont.dropdown);
            cont.dropdownItems = [];
            cont._currentItemIndex = null;
        }

        var dropdown = AutocompleteMarkup.createEmptyDropdown();
        AutocompleteDecorator.decorateDropdown(dropdown, cont.options.theme);

        var items_fragment = AutocompleteMarkup.createDropdownItemsFromData(data, function(item, value) {
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

    show(container_id) {
        this._autocompleteContainers[container_id]._isOpened = true;
        AutocompleteDecorator.showDropdown(this._autocompleteContainers[container_id].container,
            this._autocompleteContainers[container_id].options.theme);
    },

    hide(container_id) {
        this._autocompleteContainers[container_id]._isOpened = false;
        AutocompleteDecorator.hideDropdown(this._autocompleteContainers[container_id].container,
            this._autocompleteContainers[container_id].options.theme);
    },

    isOpened(container_id) {
        return this._autocompleteContainers[container_id]._isOpened;
    },

    onItemSelect(container_id, handler) {
        this._autocompleteContainers[container_id].itemSelectHandlers.push(handler);
    },

    onCustomItemSelect(container_id, handler) {
        this._autocompleteContainers[container_id].itemSelectHandlersCustom.push(handler);
    },

    restoreDefaultValue(container_id) {
        var ac = this.get(container_id);
        ac.input.value = this.get(container_id).defaultValue;
        if (ac.defaultHiddenValue !== null) {
            ac.hiddenInput.value = ac.defaultHiddenValue;
        }
    }

};
