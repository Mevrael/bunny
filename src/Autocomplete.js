
import './constants/keycodes';
import { Dropdown, DropdownUI, DropdownConfig } from './Dropdown';
import {
  addEventOnce,
  onClickOutside,
  removeClickOutside,
  addEventKeyNavigation,
  removeEventKeyNavigation
} from './utils/DOM/events';
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
  }

});



export const Autocomplete = Object.assign({}, Dropdown, {

  UI: AutocompleteUI,
  Config: AutocompleteConfig,

  // override methods

  init(autocomplete) {
    if (autocomplete.__bunny_autocomplete !== undefined) {
      return false;
    }
    autocomplete.__bunny_autocomplete = {};
    this._addEvents(autocomplete);
    this._setARIA(autocomplete);

    return true;
  },

  close(autocomplete) {
    this._removeEventClickOutside(autocomplete);
    this._removeEventKeyNavigation(autocomplete);
    Dropdown.close.call(this, autocomplete);
  },

  open(autocomplete) {
    this._addEventClickOutside(autocomplete);
    this._addEventKeyNavigation(autocomplete);
    Dropdown.open.call(this, autocomplete);
  },

  _addEvents(autocomplete) {
    const input = this.UI.getInput(autocomplete);
    this._addEventInput(autocomplete, input);
    this._addEventFocus(autocomplete, input);
    this._addEventFocusOut(autocomplete, input);
  },


  // custom methods

  // config methods

  isCustomValueAllowed(autocomplete) {
    return autocomplete.hasAttribute('custom') || this.Config.allowCustomInput;
  },

  getMinChar(autocomplete) {
    if (autocomplete.hasAttribute('min')) {
      return autocomplete.getAttribute('min')
    } else {
      return this.Config.minChar;
    }
  },

  // events

  _addEventInput(autocomplete, input) {
    addEventOnce(input, 'input', () => {
      if (input.value.length >= this.getMinChar(autocomplete)) {
        this.update(autocomplete, input.value);
      } else {
        this.close(autocomplete);
      }
    }, this.Config.delay);
  },

  _addEventFocus(autocomplete, input) {
    input.addEventListener('focus', () => {
      autocomplete.__bunny_autocomplete_initial_value = input.value;
    })
  },

  _addEventFocusOut(autocomplete, input) {
    // if on focus out
    // value is empty -> clear values
    // else if value not picked from list and custom value not allowed -> restore default value
    input.addEventListener('blur', () => {
      if (input.value.length === 0) {
        this.clearValues(autocomplete);
      } else if (input.value.length < this.getMinChar(autocomplete) && !this.isCustomValueAllowed(autocomplete)) {
        this.restoreValue(autocomplete);
      }
    })
  },

  _addEventClickOutside(autocomplete) {
    autocomplete.__bunny_autocomplete_outside = onClickOutside(autocomplete, () => {
      this._selectItem(autocomplete, null);
    });
  },

  _addEventKeyNavigation(autocomplete) {
    autocomplete.__bunny_autocomplete_keydown = addEventKeyNavigation(
      this.UI.getInput(autocomplete),
      this.UI.getMenuItems(autocomplete),
      (selectedItem) => {
        if (selectedItem === false) {
          // canceled
          this.restoreValue(autocomplete);
        } else {
          this._selectItem(autocomplete, selectedItem);
        }

      },
      this.Config.classNameActive
    );
  },

  _removeEventClickOutside(autocomplete) {
    if (autocomplete.__bunny_autocomplete_outside) {
      removeClickOutside(autocomplete, autocomplete.__bunny_autocomplete_outside);
      delete autocomplete.__bunny_autocomplete_outside;
    }
  },

  _removeEventKeyNavigation(autocomplete) {
    if (autocomplete.__bunny_autocomplete_keydown) {
      removeEventKeyNavigation(autocomplete, autocomplete.__bunny_autocomplete_keydown);
      delete autocomplete.__bunny_autocomplete_keydown;
    }
  },

  // item events

  _addItemEvents(autocomplete, items) {
    [].forEach.call(items.childNodes, item => {
      item.addEventListener('click', () => {
        this._selectItem(autocomplete, item);
      })
    });
  },

  // public methods

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

  restoreValue(autocomplete) {
    if (autocomplete.__bunny_autocomplete_initial_value !== undefined) {
      this.UI.getInput(autocomplete).value = autocomplete.__bunny_autocomplete_initial_value;
    }

    this.close(autocomplete);
  },

  clearValues(autocomplete) {
    const input = this.UI.getInput(autocomplete);
    input.value = '';
    autocomplete.__bunny_autocomplete_initial_value = '';

    callElementCallbacks(autocomplete, 'autocomplete', cb => {
      cb('', '', false);
    });

    this.close(autocomplete);
  },

  // public event subscription

  onItemSelect(autocomplete, callback) {
    pushCallbackToElement(autocomplete, 'autocomplete', callback)
  },

  // private methods

  _updateInputValues(autocomplete, item) {

    const input = this.UI.getInput(autocomplete);

    if (item !== null) {
      input.value = item.textContent;
      autocomplete.__bunny_autocomplete_initial_value = item.textContent;
    }

    const hiddenInput = this.UI.getHiddenInput(autocomplete);
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
  _selectItem(autocomplete, item = null) {
    if (item === null && !this.isCustomValueAllowed(autocomplete)) {
      // custom input not allowed, restore to value before input was focused
      this.restoreValue(autocomplete);
    } else {
      this._updateInputValues(autocomplete, item);

      callElementCallbacks(autocomplete, 'autocomplete', cb => {
        if (item === null) {
          cb(null, this.UI.getInput(autocomplete).value);
        } else {
          cb(item.dataset.value, item.textContent, item);
        }
      });
    }

    this.close(autocomplete);
  },

});

document.addEventListener('DOMContentLoaded', () => {
  Autocomplete.initAll();
});
