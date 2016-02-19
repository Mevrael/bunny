
import { AutocompleteMarkup } from './autocomplete/markup';
import { AutocompleteDecorator } from './autocomplete/decorator';
import { AutocompleteController } from './autocomplete/controller';

export var Autocomplete = {

    _autocompleteContainers: [],
    _options: {
        theme: 'bs4',
        minCharLimit: 2,
        inputDelay: 300,
        allowCustomInput: false,
        defaultCustomHiddenInputValue: ''
    },

    /**
     *
     * @param {string} input_id
     * @param {string} hidden_input_id
     * @param {string} ajax_url
     * @param {object} options
     */
    create(input_id, hidden_input_id, ajax_url, options = {}) {

        for(var i in this._options) {
            if (options[i] === undefined) {
                options[i] = this._options[i];
            }
        }

        var container_id = input_id + '_autocomplete';

        var container = document.getElementById(container_id);

        var input = document.getElementById(input_id);

        var default_value = input.getAttribute('value');

        var hidden_input = document.getElementById(hidden_input_id);

        var default_hidden_value = null;
        if (hidden_input !== null) {
            default_hidden_value = hidden_input.value;
        }

        var dropdown = AutocompleteMarkup.createEmptyDropdown();
        AutocompleteDecorator.decorateDropdown(dropdown, options.theme);

        this._autocompleteContainers[container_id] = {
            ajaxUrl: ajax_url,
            container: container,
            input: input,
            hiddenInput: hidden_input,
            dropdown: dropdown,
            dropdownItems: [],
            itemSelectHandlers: [],
            defaultValue: default_value,
            defaultHiddenValue: default_hidden_value,
            _picked: false, // is picked from list, used in blur (focus out) event
            options: options
        };

        container.appendChild(dropdown);

        AutocompleteController.attachInputTypeEvent(container_id);
        AutocompleteController.attachInputOutEvent(container_id);

    },

    get(container_id) {
        return this._autocompleteContainers[container_id];
    },

    setItems(container_id, data) {
        var cont = this._autocompleteContainers[container_id];
        AutocompleteMarkup.removeDropdownItems(cont.dropdown);
        AutocompleteMarkup.createDropdownItemsFromData(data, function(item) {
            AutocompleteDecorator.decorateDropdownItem(item, cont.options.theme);
            cont.dropdownItems.push(item);
            cont.dropdown.appendChild(item);
        });
        AutocompleteController.attachItemSelectEvent(container_id);
    },

    show(container_id) {
        AutocompleteDecorator.showDropdown(this._autocompleteContainers[container_id].container,
            this._autocompleteContainers[container_id].options.theme);
    },

    hide(container_id) {
        AutocompleteDecorator.hideDropdown(this._autocompleteContainers[container_id].container,
            this._autocompleteContainers[container_id].options.theme);
    },

    onItemSelect(container_id, handler) {
        this._autocompleteContainers[container_id].itemSelectHandlers.push(handler);
    },

    restoreDefaultValue(container_id) {
        var ac = this.get(container_id);
        ac.input.value = this.get(container_id).defaultValue;
        if (ac.defaultHiddenValue !== null) {
            ac.hiddenInput.value = ac.defaultHiddenValue;
        }
    }

};
