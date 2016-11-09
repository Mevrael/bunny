
import {
  addEvent,
  removeEvent,
  addEventOnce,
  isEventCursorInside,
  onClickOutside,
  removeClickOutside,
  addEventKeyNavigation,
  removeEventKeyNavigation
} from './utils/DOM/events';

import { pushCallbackToElement, callElementCallbacks } from './utils/core';


export const DropdownConfig = {

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
  tagNameToggleBtn: 'button',
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

export const DropdownUI = {

  Config: DropdownConfig,

  _getElement(dropdown, name) {
    if (this.Config.useTagNames) {
      return dropdown.getElementsByTagName(this.Config['tagName' + name])[0] || false;
    }
    return dropdown.getElementsByClassName(this.Config['className' + name])[0] || false;
  },

  _createElement(name) {
    let el = null;
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

  getToggleBtn(dropdown) {
    const children = dropdown.children;
    for (let k = 0; k < children.length; k++) {
      if (children[k].tagName === this.Config.tagNameToggleBtn.toUpperCase()) {
        return children[k];
      }
    }
    return dropdown.getElementsByClassName(this.Config.classNameToggleBtn)[0] || false;
  },

  getMenu(dropdown) {
    return this._getElement(dropdown, 'Menu');
  },

  createMenu() {
    const menu = this._createElement('Menu');
    if (this.Config.factoryAltClassNameMenu) {
      menu.classList.add(this.Config.factoryAltClassNameMenu);
    }
    return menu;
  },

  removeMenu(dropdown) {
    const menu = this.getMenu(dropdown);
    if (menu) {
      menu.parentNode.removeChild(menu);
    }
  },

  getMenuItems(dropdown) {
    const menu = this.getMenu(dropdown);
    if (!menu) {
      return [];
    }
    let queryStr = '';
    if (this.Config.useTagNames) {
      queryStr += this.Config.tagNameItem;
    } else {
      queryStr += '.' + this.Config.classNameItem;
    }
    queryStr += ', [role="menuitem"]';
    return menu.querySelectorAll(queryStr);
  },

  setMenuItems(dropdown, newItems) {
    let menu = this.getMenu(dropdown);
    if (!menu) {
      menu = this.createMenu();
      dropdown.appendChild(menu);
    } else {
      //while (menu.firstChild) menu.removeChild(menu.firstChild);
      menu.innerHTML = '';
    }

    menu.appendChild(newItems);
  },

  createMenuItems(items, callback = null) {
    const f = document.createDocumentFragment();
    for (let id in items) {
      const i = this._createElement('Item');
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

  getDropdownByToggleBtn(btn) {
    return btn.parentNode;
  },

  getAllDropdowns() {
    if (this.Config.useTagNames) {
      return document.getElementsByTagName(this.Config.tagName);
    }
    return document.getElementsByClassName(this.Config.className);
  },

  show(dropdown) {
    const menu = this.getMenu(dropdown);
    if (this.Config.useHiddenAttribute) {
      if (menu.hasAttribute('hidden')) {
        menu.removeAttribute('hidden');
        return true;
      }
      return false;
    } else {
      const target = this.Config.applyOpenedClassToDropdown ? dropdown : menu;
      if (!target.classList.contains(this.Config.classNameOpened)) {
        target.classList.add(this.Config.classNameOpened);
        return true;
      }
      return false;
    }
  },

  hide(dropdown) {
    const menu = this.getMenu(dropdown);
    if (this.Config.useHiddenAttribute) {
      if (!menu.hasAttribute('hidden')) {
        menu.setAttribute('hidden', '');
        return true;
      }
      return false;
    } else {
      const target = this.Config.applyOpenedClassToDropdown ? dropdown : menu;
      if (target.classList.contains(this.Config.classNameOpened)) {
        target.classList.remove(this.Config.classNameOpened);
        return true;
      }
      return false;
    }
  },

  isOpened(dropdown) {
    const menu = this.getMenu(dropdown);
    if (this.Config.useHiddenAttribute) {
      return !menu.hasAttribute('hidden');
    } else {
      const target = this.Config.applyOpenedClassToDropdown ? dropdown : menu;
      return target.classList.contains(this.Config.classNameOpened);
    }
  },

  setItemActive(item) {
    item.classList.add(this.Config.classNameActive);
    item.setAttribute('aria-selected', 'true');
  },

  setItemInactive(item) {
    item.classList.remove(this.Config.classNameActive);
    item.removeAttribute('aria-selected');
  }

};

export const Dropdown = {

  UI: DropdownUI,
  Config: DropdownConfig,

  init(dropdown) {
    if (dropdown.__bunny_dropdown !== undefined) {
      return false;
    }
    dropdown.__bunny_dropdown = {};
    this._addEvents(dropdown);
    this._setARIA(dropdown);

    return true;
  },

  initAll() {
    const dropdowns = this.UI.getAllDropdowns();
    [].forEach.call(dropdowns, dropdown => {
      this.init(dropdown);
    })
  },




  isHoverable(dropdown) {
    return dropdown.hasAttribute('dropdown-hover');
  },

  isClosableOnItemClick(dropdown) {
    return !dropdown.hasAttribute('dropdown-keep-inside');
  },




  open(dropdown) {
    if (this.UI.show(dropdown)) {
      // add small delay so this handler wouldn't be attached and called immediately
      // with toggle btn click event handler and instantly close dropdown menu
      setTimeout(() => {
        dropdown.__bunny_dropdown_outside = onClickOutside(dropdown, () => {
          callElementCallbacks(dropdown, 'dropdown_outside', callback => {
            callback();
          });
          this.close(dropdown);
        });
      }, 100);

      const btn = this.UI.getToggleBtn(dropdown);
      if (btn) {
        btn.removeEventListener('click', dropdown.__bunny_dropdown_toggle_handler);
        delete dropdown.__bunny_dropdown_toggle_handler;
      }

      const items = this.UI.getMenuItems(dropdown);
      [].forEach.call(items, item => {
        item.__bunny_dropdown_click = addEvent(item, 'click', () => {
          this._callItemSelectCallbacks(dropdown, item);

          if (this.isClosableOnItemClick(dropdown)) {
            this.close(dropdown);
          }
        });
      });

      dropdown.__bunny_dropdown_key = addEventKeyNavigation(dropdown, items, (selectedItem) => {
        // item selected callback
        this._callItemSelectCallbacks(dropdown, selectedItem);

        this.close(dropdown);
      }, (switchedItem) => {
        // item switched callback
        callElementCallbacks(dropdown, 'dropdown_key', selectCallback => {
          selectCallback(switchedItem);
        });
      }, this.Config.classNameActive);

      dropdown.dispatchEvent(this._getOpenEvent(dropdown));
    }
  },

  close(dropdown) {
    if (this.UI.hide(dropdown)) {

      removeClickOutside(dropdown, dropdown.__bunny_dropdown_outside);
      delete dropdown.__bunny_dropdown_outside;

      const btn = this.UI.getToggleBtn(dropdown);
      if (btn) {
        btn.addEventListener('click', this._getUniqueClickToggleBtnHandler(dropdown));
      }

      const items = this.UI.getMenuItems(dropdown);
      [].forEach.call(items, item => {
        removeEvent(item, 'click', item.__bunny_dropdown_click);
        delete item.__bunny_dropdown_click;
      });

      removeEventKeyNavigation(dropdown, dropdown.__bunny_dropdown_key);
      delete dropdown.__bunny_dropdown_key;

      dropdown.dispatchEvent(this._getCloseEvent(dropdown));
    }
  },




  onItemSelect(dropdown, callback) {
    pushCallbackToElement(dropdown, 'dropdown_item', callback);
  },

  onClickOutside(dropdown, callback) {
    pushCallbackToElement(dropdown, 'dropdown_outside', callback);
  },

  onItemSwitched(dropdown, callback) {
    pushCallbackToElement(dropdown, 'dropdown_key', callback);
  },




  _addEvents(dropdown) {
    // open dropdown on toggle btn click or hover
    const btn = this.UI.getToggleBtn(dropdown);
    if (btn) {
      btn.addEventListener('click', this._getUniqueClickToggleBtnHandler(dropdown));

      if (this.isHoverable(dropdown)) {
        const menu = this.UI.getMenu(dropdown);
        addEventOnce(dropdown, 'mouseover', (e) => {
          this.open(dropdown);
        }, 50);

        addEventOnce(dropdown, 'mouseout', (e) => {
          if (!isEventCursorInside(e, btn) && !isEventCursorInside(e, menu)) {
            // cursor is outside toggle btn and menu => close menu if required
            this.close(dropdown);
          }
        }, 500);
      }
    }
  },


  _callItemSelectCallbacks(dropdown, item) {
    callElementCallbacks(dropdown, 'dropdown_item', callback => {
      const res = callback(item);
      if (res instanceof Promise) {
        return new Promise(resolve => {
          res.then(promiseResult => {
            if (promiseResult === false) {
              resolve(false);
            } else {
              resolve(true);
            }
          })
        })
      } else if (res === false) {
        return false;
      }
    });
  },




  _setARIA(dropdown) {
    const btn = this.UI.getToggleBtn(dropdown);
    if (btn) {
      btn.setAttribute('aria-haspopup', 'true');
    }
  },



  _getUniqueClickToggleBtnHandler(dropdown) {
    if (dropdown.__bunny_dropdown_toggle_handler === undefined) {
      const data = {
        self: this,
        dropdown: dropdown
      };
      dropdown.__bunny_dropdown_toggle_handler = this._clickToggleBtnHandler.bind(data);
    }
    return dropdown.__bunny_dropdown_toggle_handler;
  },

  _clickToggleBtnHandler(event) {
    const data = this;
    const BunnyDropdown = data.self;
    const dropdown = data.dropdown;

    if (BunnyDropdown.UI.isOpened(dropdown)) {
      BunnyDropdown.close(dropdown);
    } else {
      BunnyDropdown.open(dropdown);
    }
  },




  _getCloseEvent(dropdown) {
    return new CustomEvent('close', {detail: {dropdown: dropdown}});
  },

  _getOpenEvent(dropdown) {
    return new CustomEvent('open', {detail: {dropdown: dropdown}});
  }

};

document.addEventListener('DOMContentLoaded', () => {
  Dropdown.initAll();
});
