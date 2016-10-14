
import './constants/keycodes';
import { Dropdown, DropdownUI, DropdownConfig } from './Dropdown';
import { addEventOnce, onClickOutside, removeClickOutside } from './utils/DOM/events';
import { getActionObject, pushCallbackToElement, callElementCallbacks } from './utils/core';

export const AutocompleteConfig = Object.assign({}, DropdownConfig, {

    // override
    useTagNames: true,

    tagName: 'autocomplete',

    // custom
    delay: 200,
    minChar: 2,
    allowCustomInput: false,

});

export const AutocompleteUI = Object.assign({}, DropdownUI, {

    Config: AutocompleteConfig,

    getInput(autocomplete) {
        return autocomplete.querySelector('input:not([type="hidden"])') || false;
    },

    getHiddenInput(autocomplete) {
        return autocomplete.querySelector('input[type="hidden"]') || false;
    },

    isCustomValueAllowed(autocomplete) {
        return autocomplete.hasAttribute('custom') || this.Config.allowCustomInput;
    },

    getMinChar(autocomplete) {
        if (autocomplete.hasAttribute('min')) {
            return autocomplete.getAttribute('min')
        } else {
            return this.Config.minChar;
        }
    }

});



export const Autocomplete = Object.assign({}, Dropdown, {

    UI: AutocompleteUI,
    Config: AutocompleteConfig,

    // override methods

    close(autocomplete) {
        if (autocomplete.__bunny_autocomplete_outside) {
            removeClickOutside(autocomplete, autocomplete.__bunny_autocomplete_outside);
            delete autocomplete.__bunny_autocomplete_outside;
        }
        Dropdown.close.call(this, autocomplete);
    },

    open(autocomplete) {
        autocomplete.__bunny_autocomplete_outside = onClickOutside(autocomplete, () => {
            if (!this.UI.isCustomValueAllowed(autocomplete)) {
                // custom input not allowed, restore to value before input was focused
                if (autocomplete.__bunny_autocomplete_initial_value !== undefined) {
                    this.UI.getInput(autocomplete).value = autocomplete.__bunny_autocomplete_initial_value;
                }
            } else {
                // custom input is allowed, empty hidden value
                this._selectItem(autocomplete, null);
            }
        });
        Dropdown.open.call(this, autocomplete);
    },

    _addEvents(autocomplete) {
        const input = this.UI.getInput(autocomplete);
        addEventOnce(input, 'input', () => {
            if (input.value.length >= this.UI.getMinChar(autocomplete)) {
                this.update(autocomplete, input.value);
            } else {
                this.close(autocomplete);
                //this.UI.removeMenu();
            }
        }, this.Config.delay);

        input.addEventListener('focus', () => {
            autocomplete.__bunny_autocomplete_initial_value = input.value;
        })
    },


    // custom methods

    update(autocomplete, search) {
        const action = getActionObject(autocomplete);
        action(search).then(data => {
            if (Object.keys(data).length > 0) {
                this.close(autocomplete);
                const items = this.UI.createMenuItems(data);
                this._addItemEvents(autocomplete, items);
                this.UI.setMenuItems(autocomplete, items);
                this._setARIA(autocomplete);
                this.open(autocomplete);
            } else {
                this.close(autocomplete);
            }
        });
    },

    _addItemEvents(autocomplete, items) {
        [].forEach.call(items.childNodes, item => {
            item.addEventListener('click', () => {
                this._selectItem(autocomplete, item);
            })
        });
    },

    _updateInputValues(autocomplete, item) {

        const input = this.UI.getInput(autocomplete);

        if (item !== null) {
            input.value = item.textContent;
        }

        const hiddenInput = this.UI.getHiddenInput(autocomplete);
        if (hiddenInput) {
            if (item !== null) {
                hiddenInput.value = item.dataset.value;
            } else {
                hiddenInput.value = input.value;
            }
        }
    },

    _selectItem(autocomplete, item = null) {
        this._updateInputValues(autocomplete, item);

        callElementCallbacks(autocomplete, 'autocomplete', cb => {
            if (item === null) {
                cb(null, this.UI.getInput(autocomplete).value);
            } else {
                cb(item.dataset.value, item.textContent, item);
            }
        });

        this.close(autocomplete);
    },

    onItemSelect(autocomplete, callback) {
        pushCallbackToElement(autocomplete, 'autocomplete', callback)
    },

});

document.addEventListener('DOMContentLoaded', () => {
    Autocomplete.initAll();
});
