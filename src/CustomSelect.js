
import { Dropdown, DropdownUI, DropdownConfig } from './Dropdown';
import {
  addEventOnce,
  onClickOutside,
  removeClickOutside,
  addEventKeyNavigation,
  removeEventKeyNavigation
} from './utils/DOM/events';
import { getActionObject, pushCallbackToElement, callElementCallbacks } from './utils/core';



export const CustomSelectConfig = Object.assign({}, DropdownConfig, {

  // override
  useTagNames: true,

  tagName: 'customselect',

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

  createHiddenSelect(selectAttributes, dropdownItems, label) {
    const e = document.createElement('select');
    e.setAttribute('hidden', '');

    for(let attribute in selectAttributes) {
      e.setAttribute(attribute, selectAttributes[attribute]);
    }

    const o = document.createElement('option');
    o.value = '';
    o.textContent = label;
    e.appendChild(o);

    [].forEach.call(dropdownItems, dropdownItem => {
      const o = document.createElement('option');
      if (dropdownItem.dataset.value === undefined) {
        throw new Error('CustomSelect: each item must have data-value attribute');
      }
      o.value = dropdownItem.dataset.value;
      o.textContent = dropdownItem.textContent;
      e.appendChild(o);
    });

    return e;
  },

  insertHiddenSelect(customSelect, hiddenSelect) {
    customSelect.appendChild(hiddenSelect);
  },

  getItemByValue(customSelect, value) {
    const menu = this.getMenu(customSelect);
    return menu.querySelector(`[data-value="${value}"]`) || false;
  },

  getOptionByValue(customSelect, value) {
    const hiddenSelect = this.getHiddenSelect(customSelect);
    return hiddenSelect.querySelector(`[value="${value}"]`) || false;
  },

  getSelectedOption(customSelect) {
    const hiddenSelect = this.getHiddenSelect(customSelect);
    if (hiddenSelect.selectedIndex === 0) {
      return false;
    }
    return hiddenSelect.options[hiddenSelect.selectedIndex];
  },

  getSelectedValue(customSelect) {
    const option = this.getSelectedOption(customSelect);
    if (option === false) {
      return false;
    }
    return option.value;
  },

  getLabelByValue(customSelect, value) {
    return this.getOptionByValue(customSelect, value).textContent;
  },

  getPlaceholder(customSelect) {
    return this.getHiddenSelect(customSelect).options[0].textContent;
  },

  selectItem(customSelect, value) {
    const curSelectedValue = this.getSelectedValue(customSelect);
    if (curSelectedValue !== false) {
      this.deselectItem(customSelect, curSelectedValue);
    }

    const option = this.getOptionByValue(customSelect, value);
    option.selected = true;

    const tglBtn = this.getToggleBtn(customSelect);
    const item = this.getItemByValue(customSelect, value);
    tglBtn.textContent = option.textContent;
    this.setItemActive(item);
  },

  deselectItem(customSelect, value) {
    const option = this.getOptionByValue(customSelect, value);
    option.selected = false;

    const tglBtn = this.getToggleBtn(customSelect);
    tglBtn.textContent = this.getPlaceholder(customSelect);
    const item = this.getItemByValue(customSelect, value);
    this.setItemInactive(item);
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

    const defaultValue = customSelect.getAttribute('value');

    const hiddenSelect = this.UI.createHiddenSelect(
      this.getAttributesForSelect(customSelect),
      this.UI.getMenuItems(customSelect),
      this.UI.getToggleBtn(customSelect).textContent
    );
    this.UI.insertHiddenSelect(customSelect, hiddenSelect);

    this._addEvents(customSelect);
    this._addCustomSelectEvents(customSelect);
    this._setARIA(customSelect);

    return true;
  },

  _addCustomSelectEvents(customSelect) {
    const items = this.UI.getMenuItems(customSelect);
    [].forEach.call(items, item => {
      item.addEventListener('click', (e) => {
        this.select(customSelect, item.dataset.value);
      });
    });
  },

  getAttributesForSelect(customSelect) {
    let selectAttributes = {};
    for(let k in customSelect.dataset) {
      selectAttributes[k] = customSelect.dataset[k];
    }
    return selectAttributes;
  },

  isMultiple(customSelect) {
    return customSelect.dataset.multiple !== undefined;
  },

  select(customSelect, value) {
    this.UI.selectItem(customSelect, value);
  },

  getSelectedValue(customSelect) {
    const hiddenSelect = this.UI.getHiddenSelect(customSelect);
    return this.UI.getSelectedOption()
  }


});

document.addEventListener('DOMContentLoaded', () => {
  CustomSelect.initAll();
});

/**
 * CustomSelect base object
 * Wrapper of Bootstrap 4 dropdown list
 * Requires dropdown js
 */
export default CustomSelect2 = {

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
  create(dropdown_container, selectAttributes = {}) {
    if (dropdown_container.dataset.name === undefined) {
      throw new Error('CustomSelect: data-name attribute missing')
    }

    const defaultValue = dropdown_container.getAttribute('value');

    let dataset = {};
    for(let k in dropdown_container.dataset) {
      dataset[k] = dropdown_container.dataset[k];
    }

    selectAttributes = Object.assign({}, dataset, selectAttributes);


    const select = {};
    select.container = dropdown_container;
    if (selectAttributes.multiple) {
      selectAttributes.name += '[]';
    }

    select.toggle = this._getCustomToggleInput(select);
    select.toggleDefaultLabel = select.toggle.textContent;
    select.dropdown = this._getDropdown(select);

    const items = this._getDropdownItems(select);
    select.dropdownItems = {};

    select.select = this._createHiddenSelect(selectAttributes, items);
    this._insertHiddenSelect(select, select.select);

    for (let k = 0; k < items.length; k++) {
      let item = items[k];
      select.dropdownItems[item.dataset.value] = item;
      this._attachDropdownItemClickEvent(select, item);
      if (item.dataset.selected !== undefined || defaultValue == item.dataset.value) {
        this._select(select, item.dataset.value, false);
      }
    }

    dropdown_container._select = select;

    return select;
  },

  initAll(container = document) {
    container.getElementsByTagName('customselect').forEach( custom_select => {
      this.create(custom_select);
    });
  },

  _createHiddenSelect(selectAttributes, items) {
    const e = document.createElement('select');
    e.setAttribute('hidden', '');

    for(let attribute in selectAttributes) {
      e.setAttribute(attribute, selectAttributes[attribute]);
    }

    const o = document.createElement('option');
    o.value = '';
    e.appendChild(o);

    for (let k = 0; k < items.length; k++) {
      let item = items[k];
      const o = document.createElement('option');
      o.value = item.dataset.value;
      e.appendChild(o);
    }

    return e;
  },

  _insertHiddenSelect(select, hiddenSelect) {
    select.container.appendChild(hiddenSelect);
  },

  /**
   * Get select option DOM element by value
   * @param {Object} select
   * @param {String} value
   * @returns {HTMLElement|undefined}
   */
  getOption(select, value) {
    return select.dropdownItems[value];
  },

  hideOption(select, value) {
    this.getOption(select, value).setAttribute('hidden', '');
  },

  showOption(select, value) {
    this.getOption(select, value).removeAttribute('hidden');
  },

  select(select, value) {
    if (!this.isSelected(select, value)) {
      if (this.isMultiple(select)) {
        this._select(select, value);
      } else {
        let oldValue = null;
        if (!this.hasNoSelectedOptions(select)) {
          oldValue = select.select.selectedOptions[0].value;
          this._deselect(select, select.select.selectedOptions[0].value, false);
        }
        this._select(select, value, true, oldValue);
      }
    } else {
      this._deselect(select, value);
    }
  },

  _select(select, value, fire_event = true, oldValue = null) {
    const option = this.getOption(select, value);
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

  deselect(select, value) {
    if (this.isSelected(select, value)) {
      this._deselect(select, value);
    }
  },

  _deselect(select, value, fire_event = true) {
    const option = this.getOption(select, value);
    const label = option.textContent;
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

  hasNoSelectedOptions(select) {
    return select.select.selectedOptions.length === 0
      || select.select.selectedOptions.length === 1 && select.select.selectedOptions[0].value === ''
  },

  isSelected(select, value) {
    for (let k = 0; k < select.select.selectedOptions.length; k++) {
      if (select.select.selectedOptions[k].value === value) {
        return true;
      }
    }
    return false;
  },

  isMultiple(select) {
    return select.select.multiple;
  },

  isRequired(select) {
    return select.select.required;
  },

  getSelectedOptions(select) {
    const selected_values = this.getSelectedValues(select);
    const selected_options = {};
    for (let k = 0; k < selected_values.length; k++) {
      let value = selected_values[k];
      selected_options[value] = select.dropdownItems[value];
    }
    return selected_options;
  },

  getSelectedValues(select) {
    let selectedValues = [];
    for (let k = 0; k < select.select.selectedOptions.length; k++) {
      selectedValues.push(select.select.selectedOptions[k].value);
    }
    return selectedValues;
  },

  getOptionLabel(select, value) {
    const option = this.getOption(select, value);
    return option.textContent;
  },

  setLabel(select, label) {
    select.toggle.textContent = label;
    this._setToggleActive(select);
  },

  setLabelByValue(select, value) {
    const label = this.getOptionLabel(select, value);
    this.setLabel(select, label);
  },

  setDefaultLabel(select) {
    this.setLabel(select, select.toggleDefaultLabel);
    this._setToggleInactive(select);
  },




  _attachDropdownItemClickEvent(select, item) {
    item.addEventListener('click', () => {
      const value = item.dataset.value;
      this.select(select, value);
    });
  },

  _fireChangeEventOnSelect(select, value, oldValue, label, selected = true) {
    const event = new CustomEvent('change', {detail: {value: value, oldValue: oldValue, label: label, selected: selected}});
    select.container.dispatchEvent(event);
  },




  _getCustomToggleInput(select) {
    const toggle = select.container.getElementsByClassName('dropdown-toggle')[0];
    if (toggle === undefined) {
      throw new Error('CustomSelect must have a child element with class="dropdown-toggle"');
    }
    return toggle;
  },

  _getDropdown(select) {
    const dropdown = select.container.getElementsByClassName('dropdown-menu')[0];
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
  _getDropdownItems(select) {
    const items = select.dropdown.getElementsByClassName('dropdown-item');
    if (items.length === 0) {
      throw new Error('Dropdown in CustomSelect must have at least one child element with class="dropdown-item"');
    }
    for (let k = 0; k < items.length; k++) {
      let item = items[k];
      if (item.dataset.value === undefined) {
        throw new Error('All Dropdown Items in CustomSelect must have data-value attribute');
      }
    }
    return items;
  },




  _setToggleActive(select) {
    select.toggle.classList.add('dropdown-active');
  },

  _setToggleInactive(select) {
    select.toggle.classList.remove('dropdown-active');
  },



  _getHiddenOptionByValue(select, value) {
    for (let k = 0; k < select.select.options.length; k++) {
      if (select.select.options[k].value == value) {
        return select.select.options[k];
      }
    }
    throw new Error('CustomSelect: option with value "' + value + '" not found');
  }

};
