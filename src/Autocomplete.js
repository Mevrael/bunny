
import { Dropdown, DropdownUI, DropdownConfig } from './Dropdown';
import {
  addEventOnce,
  addEvent,
  removeEvent,
  parseTemplate
} from './utils/DOM';
import {
  getActionObject,
  pushCallbackToElement,
  callElementCallbacks,
  initObjectExtensions
} from './utils/core';



export const AutocompleteConfig = Object.assign({}, DropdownConfig, {

  // override
  useTagNames: true,

  tagName: 'autocomplete',

  // custom
  delay: 200,
  minChar: 2,
  showMark: false,
  allowCustomInput: false,
  classNameNotFound: 'dropdown-header',
  textNotFound: 'No results found',

});



export const AutocompleteUI = Object.assign({}, DropdownUI, {

  Config: AutocompleteConfig,

  getInput(autocomplete) {
    return autocomplete.querySelector('input:not([type="hidden"])') || false;
  },

  getHiddenInput(autocomplete) {
    return autocomplete.querySelector('input[type="hidden"]') || false;
  },

  getTriggerElement(autocomplete) {
    return this.getInput(autocomplete);
  },

  applyTemplateToMenuItem(item, data, templateId) {
    item.appendChild(parseTemplate(templateId, data));
    return item;
  },

  getItemLabel(item) {
    const label = item.querySelector('[autocompletelabel') || false;
    if (label) {
      return label.textContent;
    }
    return item.textContent;
  },

  getTemplateSelectLabel(autocomplete) {
    const label = autocomplete.getAttribute('selectedlabel');
    if (label) {
      return document.getElementById(label);
    }
    return false;
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
    autocomplete.__bunny_autocomplete_state = this.getCurState(autocomplete);
    this._addEvents(autocomplete);
    this._setARIA(autocomplete);

    initObjectExtensions(this, autocomplete);

    return true;
  },

  _setARIA(autocomplete) {
    Dropdown._setARIA(autocomplete);
    const input = this.UI.getInput(autocomplete);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
  },

  close(autocomplete) {
    Dropdown.close.call(this, autocomplete);
    this.UI.removeMenuItems(autocomplete);
  },

  _addEvents(autocomplete) {
    const input = this.UI.getInput(autocomplete);
    this._addEventFocus(autocomplete, input);
    this.onItemSelect(autocomplete, (selectedItem) => {
      if (selectedItem === null) {
        this._selectItem(autocomplete, false);
      } else {
        this._selectItem(autocomplete, selectedItem);
      }
      //input.focus();
    });
  },

  // config methods

  isCustomValueAllowed(autocomplete) {
    return autocomplete.hasAttribute('custom') || this.Config.allowCustomInput;
  },

  getCustomItemContentsTemplate(autocomplete) {
    return autocomplete.getAttribute('template');
  },

  isMarkDisplayed(autocomplete) {
    return autocomplete.hasAttribute('mark') || this.Config.showMark;
  },

  getMinChar(autocomplete) {
    if (autocomplete.hasAttribute('min')) {
      return autocomplete.getAttribute('min')
    } else {
      return this.Config.minChar;
    }
  },

  isNotFoundDisplayed(autocomplete) {
    return autocomplete.hasAttribute('shownotfound');
  },

  // events

  _addEventInput(autocomplete, input) {
    autocomplete.__bunny_autocomplete_input = addEventOnce(input, 'input', () => {
      if (input.value.length >= this.getMinChar(autocomplete)) {
        this.update(autocomplete, input.value);
      } else {
        this.close(autocomplete);
      }
    }, this.Config.delay);
  },

  _addEventFocus(autocomplete, input) {
    input.addEventListener('focus', () => {
      if (autocomplete.__bunny_autocomplete_focus === undefined) {
        autocomplete.__bunny_autocomplete_focus = true;
        autocomplete.__bunny_autocomplete_initial_value = input.value;
        this._addEventFocusOut(autocomplete, input);
        this._addEventInput(autocomplete, input);

        // make sure if dropdown menu not opened and initiated with .open()
        // that on Enter hit form is not submitted
        autocomplete.__bunny_autocomplete_keydown_closed = addEvent(input, 'keydown', (e) => {
          if (e.keyCode === KEY_SPACE) {
            e.stopPropagation();
          }
          //if (!this.UI.isOpened(autocomplete)) {
          if (e.keyCode === KEY_ENTER/* && this.isStateChanged(autocomplete)*/) {
            e.preventDefault();
            if (input.value.length === 0) {
              this.clear(autocomplete);
            } else if (e.target === input && this.isCustomValueAllowed(autocomplete)) {
              //console.log('autocomplete custom picked');
              this._selectItem(autocomplete, false);
              this._callItemSelectCallbacks(autocomplete, null);
            }
          }
          //}
        });
      }
    })
  },

  _addEventFocusOut(autocomplete, input) {
    // if after 300ms on focus out
    // and focus was not switched to menu item via keyboard
    // then if value is empty -> clear values
    // else if custom value not allowed but entered -> restore to previous value
    const k = addEvent(input, 'blur', () => {
      setTimeout(() => {
        if (!this.UI.isMenuItem(autocomplete, document.activeElement)) {
          delete autocomplete.__bunny_autocomplete_focus;
          removeEvent(input, 'blur', k);
          removeEvent(input, 'input', autocomplete.__bunny_autocomplete_input);
          delete autocomplete.__bunny_autocomplete_input;
          removeEvent(input, 'keydown', autocomplete.__bunny_autocomplete_keydown_closed);
          delete autocomplete.__bunny_autocomplete_keydown_closed;

          if (input.value.length === 0) {
            this.clear(autocomplete);
          } else if (!this.isCustomValueAllowed(autocomplete) && this.isStateChanged(autocomplete)) {
            this.restoreState(autocomplete);
          }
        }
      }, 300);
    })
  },



  // item events

  _addItemEvents(autocomplete, items) {
    // [].forEach.call(items.childNodes, item => {
    //   item.addEventListener('click', () => {
    //     this._callItemSelectCallbacks(autocomplete, item);
    //   })
    // });
  },

  // public methods

  update(autocomplete, search) {
    callElementCallbacks(autocomplete, 'autocomplete_before_update', cb => {
      cb();
    });
    const action = getActionObject(autocomplete);
    action(search).then(data => {
      //setTimeout(() => {
      callElementCallbacks(autocomplete, 'autocomplete_update', cb => {
        const res = cb(data);
        if (res !== undefined) {
          data = res;
        }
      });
      if (Object.keys(data).length > 0) {
        this.close(autocomplete);
        let items;
        const templateId = this.getCustomItemContentsTemplate(autocomplete);
        if (this.isMarkDisplayed(autocomplete)) {
          items = this.UI.createMenuItems(data, (item, value, content) => {
            if (templateId) {
              item = this.UI.applyTemplateToMenuItem(item, data[value], templateId);
            }
            const reg = new RegExp('(' + search + ')', 'ig');
            const html = item.innerHTML.replace(reg, '<mark>$1</mark>');
            item.innerHTML = html;
            return item;
          });
        } else {
          if (templateId) {
            items = this.UI.createMenuItems(data, (item, value, content) => {
              return this.UI.applyTemplateToMenuItem(item, data[value], templateId);
            });
          } else {
            items = this.UI.createMenuItems(data);
          }
        }
        this._addItemEvents(autocomplete, items);
        this.UI.setMenuItems(autocomplete, items);
        this._setARIA(autocomplete);
        this.open(autocomplete);
      } else {
        this.close(autocomplete);
        if (this.isNotFoundDisplayed(autocomplete)) {
          this.UI.removeMenuItems(autocomplete);
          this.UI.getMenu(autocomplete).appendChild(this.createNotFoundElement());
          this.open(autocomplete);
        }
      }
      //}, 1000);
    }).catch(e => {
      this.UI.getMenu(autocomplete).innerHTML = e.message;
      this.open(autocomplete);
      callElementCallbacks(autocomplete, 'autocomplete_update', cb => {
        cb(false, e);
      });
    });
  },

  createNotFoundElement() {
    const div = document.createElement('div');
    div.classList.add(this.Config.classNameNotFound);
    div.textContent = this.Config.textNotFound;
    return div;
  },

  onBeforeUpdate(autocomplete, cb) {
    pushCallbackToElement(autocomplete, 'autocomplete_before_update', cb);
  },

  onUpdate(autocomplete, cb) {
    pushCallbackToElement(autocomplete, 'autocomplete_update', cb);
  },

  restoreState(autocomplete) {
    const state = this.getState(autocomplete);
    this.UI.getInput(autocomplete).value = state.label;
    const hiddenInput = this.UI.getHiddenInput(autocomplete);
    if (hiddenInput) {
      hiddenInput.value = state.value;
    }

    const tplLabel = this.UI.getTemplateSelectLabel(autocomplete);
    if (tplLabel) {
      tplLabel.innerHTML = '';
    }

    this.close(autocomplete);
  },

  clear(autocomplete) {
    const input = this.UI.getInput(autocomplete);
    const hiddenInput = this.UI.getHiddenInput(autocomplete);
    input.value = '';
    if (hiddenInput) {
      hiddenInput.value = '';
    }
    autocomplete.__bunny_autocomplete_state = this.getCurState(autocomplete);
    //this._updateInputValues(autocomplete, false);

    const tplLabel = this.UI.getTemplateSelectLabel(autocomplete);
    if (tplLabel) {
      tplLabel.innerHTML = '';
    }

    this._callItemSelectCallbacks(autocomplete, false);
    this.close(autocomplete);
  },

  getValue(autocomplete) {
    const hiddenInput = this.UI.getHiddenInput(autocomplete);
    if (hiddenInput) {
      return hiddenInput.value;
    } else {
      return this.UI.getInput(autocomplete).value;
    }
  },

  getState(autocomplete) {
    return autocomplete.__bunny_autocomplete_state;
  },

  getCurState(autocomplete) {
    const state = {};
    const input = this.UI.getInput(autocomplete);
    const hiddenInput = this.UI.getHiddenInput(autocomplete);
    state.label = input.value;
    if (hiddenInput) {
      state.value = hiddenInput.value;
    }
    return state;
  },

  isStateChanged(autocomplete) {
    return JSON.stringify(this.getState(autocomplete)) !== JSON.stringify(this.getCurState(autocomplete));
  },

  // private methods

  _updateInputValues(autocomplete, item = false) {
    const input = this.UI.getInput(autocomplete);

    if (item !== false) {
      const val = this.UI.getItemLabel(item);
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

    const hiddenInput = this.UI.getHiddenInput(autocomplete);
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

    const tplLabel = this.UI.getTemplateSelectLabel(autocomplete);
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
  _selectItem(autocomplete, item = false) {
    if (item === false && !this.isCustomValueAllowed(autocomplete)) {
      // custom input not allowed, restore to value before input was focused
      this.restoreState(autocomplete);
    } else {
      this._updateInputValues(autocomplete, item);
    }

    this.close(autocomplete);
  },

});

document.addEventListener('DOMContentLoaded', () => {
  Autocomplete.initAll();
});
