
import { Dropdown, DropdownUI, DropdownConfig } from './Dropdown';
import {initObjectExtensions} from "./utils/core";

/**
 * CustomSelect
 * Wrapper of Bootstrap 4 dropdown list
 * Requires dropdown js
 */

export const CustomSelectConfig = Object.assign({}, DropdownConfig, {

  // override
  useTagNames: true,

  tagName: 'customselect',

  roleMenu: 'textbox',
  roleMenuItem: 'option',

});

export const CustomSelectUI = Object.assign({}, DropdownUI, {

  Config: CustomSelectConfig,

  /**
   *
   * @param customSelect
   * @returns {HTMLSelectElement|boolean}
   */
  getHiddenSelect(customSelect) {
    return customSelect.getElementsByTagName('select')[0] || false;
  },

  createHiddenSelect(selectAttributes, dropdownItems) {
    const e = document.createElement('select');
    e.setAttribute('hidden', '');
    e.setAttribute('role', 'textbox');

    for(let attribute in selectAttributes) {
      e.setAttribute(attribute, selectAttributes[attribute]);
    }

    [].forEach.call(dropdownItems, dropdownItem => {
      const o = document.createElement('option');
      const val = this.getItemValue(dropdownItem);
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
  syncUI(customSelect, defaultValue, isMultiple) {
    console.log(defaultValue, isMultiple);
    const menuItems = this.getMenuItems(customSelect);
    const tglBtn = this.getToggleBtn(customSelect);
    let hasSelected = false;
    [].forEach.call(menuItems, menuItem => {
      if (defaultValue !== '') {
        const value = this.getItemValue(menuItem);
        if (isMultiple) {
          for (let k = 0; k < defaultValue.length; k++) {
            if (defaultValue[k] == value) {
              this.setItemActive(menuItem);
              hasSelected = true;
              this.getOptionByValue(customSelect, value).selected = true;
              break;
            }
          }
        } else if (value == defaultValue) {
          this.setItemActive(menuItem);
          hasSelected = true;
          this.getOptionByValue(customSelect, value).selected = true;
          if (tglBtn.innerHTML === '') {
            tglBtn.innerHTML = menuItem.innerHTML;
          }
        }
      } else if (menuItem.hasAttribute('aria-selected')) {
        this.setItemActive(menuItem);
        hasSelected = true;
        if (tglBtn.innerHTML === '') {
          tglBtn.innerHTML = menuItem.innerHTML;
        }
      } else if (menuItem.classList.contains(this.Config.classNameActive)) {
        this.setItemInactive(menuItem);
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

  insertHiddenSelect(customSelect, hiddenSelect) {
    customSelect.appendChild(hiddenSelect);
  },

  getItemByValue(customSelect, value) {
    const menu = this.getMenu(customSelect);
    return menu.querySelector(`[data-value="${value}"]`) || false;
  },

  getLabelByValue(customSelect, value) {
    return this.getItemByValue(customSelect, value).innerHTML;
  },

  getOptionByValue(customSelect, value) {
    const hiddenSelect = this.getHiddenSelect(customSelect);
    return hiddenSelect.querySelector(`[value="${value}"]`) || false;
  },

  setToggleByValue(customSelect, value) {
    const tglBtn = this.getToggleBtn(customSelect);
    const item = this.getItemByValue(customSelect, value);
    tglBtn.innerHTML = item.innerHTML;
  }

});

export const CustomSelect = Object.assign({}, Dropdown, {

  UI: CustomSelectUI,
  Config: CustomSelectConfig,

  // override methods

  init(customSelect) {
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

    const hiddenSelect = this.UI.createHiddenSelect(
      this.getAttributesForSelect(customSelect),
      this.UI.getMenuItems(customSelect),
      this.UI.getToggleBtn(customSelect).textContent
    );
    this.UI.insertHiddenSelect(customSelect, hiddenSelect);
    const defaultValue = this.getDefaultValue(customSelect);
    this.UI.syncUI(customSelect, defaultValue, this.isMultiple(customSelect));

    this._addCustomSelectEvents(customSelect);
    this._setARIA(customSelect);

    initObjectExtensions(this, customSelect);

    return true;
  },

  _addCustomSelectEvents(customSelect) {
    this.onItemSelect(customSelect, (item) => {
      if (item !== null) {
        this.select(customSelect, this.UI.getItemValue(item));
      }
    });
  },

  getAttributesForSelect(customSelect) {
    let selectAttributes = {};
    for(let k in customSelect.dataset) {
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
  getDefaultValue(customSelect) {
    const val = customSelect.getAttribute('value');
    if (val === null) {
      return '';
    }
    const firstChar = val[0];
    if (firstChar === undefined) {
      return '';
    } else if (firstChar === '[') {
      return JSON.parse(val);
    }
    return val;
  },

  isMultiple(customSelect) {
    return customSelect.dataset.multiple !== undefined;
  },

  select(customSelect, value) {
    const option = this.UI.getOptionByValue(customSelect, value);
    if (this.isMultiple(customSelect)) {
      if (option.selected) {
        this.deselect(customSelect, value);
      } else {
        const item = this.UI.getItemByValue(customSelect, value);
        this.UI.setItemActive(item);
        option.selected = true;
      }
    } else {
      if (!option.selected) {
        const curValue = this.getSelectedValue(customSelect);
        if (curValue != value) {
          this.deselect(customSelect, curValue);
        }

        const item = this.UI.getItemByValue(customSelect, value);
        this.UI.setItemActive(item);
        option.selected = true;
        this.UI.setToggleByValue(customSelect, value);
      }
    }
  },

  deselect(customSelect, value) {
    const option = this.UI.getOptionByValue(customSelect, value);
    if (option.selected) {
      const item = this.UI.getItemByValue(customSelect, value);
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
  getSelectedValue(customSelect) {
    const hiddenSelect = this.UI.getHiddenSelect(customSelect);
    if (this.isMultiple(customSelect)) {
      let selectedOptions = [];
      [].forEach.call(hiddenSelect.options, option => {
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

document.addEventListener('DOMContentLoaded', () => {
  CustomSelect.initAll();
});
