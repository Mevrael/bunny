
import {
    addEvent,
    removeEvent,
    addEventOnce,
    isEventCursorInside,
    onClickOutside,
    removeClickOutside
} from './utils/DOM/events';



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

export const DropdownUI = {

    Config: DropdownConfig,

    _getElement(dropdown, name) {
        if (this.Config.useTagNames) {
            return dropdown.getElementsByTagName(this.Config['tagName' + name])[0] || false;
        }
        return dropdown.querySelector(`div.${this.Config['className' + name]}`) || false;
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
        return this._getElement(dropdown, 'ToggleBtn');
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
            queryStr += 'div.' + this.Config.classNameItem;
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
        return document.getElementsByClassName(`div.${this.Config.className}`);
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
    }

};

export const Dropdown = {

    UI: DropdownUI,

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
                    this.close(dropdown);
                });
                //document.addEventListener('click', this._getUniqueClickOutsideHandler(dropdown));
                //document.addEventListener('touchstart', this._getUniqueClickOutsideHandler(dropdown));
            }, 100);

            const btn = this.UI.getToggleBtn(dropdown);
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

    close(dropdown) {
        if (this.UI.hide(dropdown)) {

            removeClickOutside(dropdown, dropdown.__bunny_dropdown_outside);
            delete dropdown.__bunny_dropdown_outside;

            //document.removeEventListener('click', dropdown.__bunny_dropdown_outside_handler);
            //document.removeEventListener('touchstart', dropdown.__bunny_dropdown_outside_handler);
            //delete dropdown.__bunny_dropdown_outside_handler;

            const btn = this.UI.getToggleBtn(dropdown);
            if (btn) {
                btn.addEventListener('click', this._getUniqueClickToggleBtnHandler(dropdown));
            }

            if (this.isClosableOnItemClick(dropdown)) {
                this._removeItemClickEvents(dropdown);
            }

            dropdown.dispatchEvent(this._getCloseEvent(dropdown));
        }
    },




    _addEvents(dropdown) {
        // open dropdown on toggle btn click or hover
        const btn = this.UI.getToggleBtn(dropdown);
        if (btn) {
            btn.addEventListener('click', this._getUniqueClickToggleBtnHandler(dropdown));

            if (this.isHoverable(dropdown)) {
                addEventOnce(dropdown, 'mouseover', (e) => {
                    if (isEventCursorInside(e, dropdown, this.UI.getMenu(dropdown))) {
                        // cursor is inside toggle btn or menu => open menu if required
                        this.open(dropdown);
                    }
                }, 100);

                addEventOnce(dropdown, 'mouseout', (e) => {
                    if (!isEventCursorInside(e, dropdown, this.UI.getMenu(dropdown))) {
                        // cursor is outside toggle btn and menu => close menu if required
                        this.close(dropdown);
                    }
                }, 500);
            }
        }
    },




    _setARIA(dropdown) {
        const btn = this.UI.getToggleBtn(dropdown);
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




    _addItemClickEvents(dropdown) {
        const menuItems = this.UI.getMenuItems(dropdown);
        const handler = this._getUniqueClickItemHandler(dropdown);
        [].forEach.call(menuItems, menuItem => {
            menuItem.addEventListener('click', handler);
        });
    },

    _removeItemClickEvents(dropdown) {
        const menuItems = this.UI.getMenuItems(dropdown);
        [].forEach.call(menuItems, menuItem => {
            menuItem.removeEventListener('click', dropdown.__bunny_dropdown_item_handler);
        });
        delete dropdown.__bunny_dropdown_item_handler;
    },




    _getUniqueClickItemHandler(dropdown) {
        if (dropdown.__bunny_dropdown_item_handler === undefined) {
            const data = {
                self: this,
                dropdown: dropdown
            };
            dropdown.__bunny_dropdown_item_handler = this._clickItemHandler.bind(data);
        }
        return dropdown.__bunny_dropdown_item_handler;
    },

    _clickItemHandler(event) {
        const data = this;
        const BunnyDropdown = data.self;
        const dropdown = data.dropdown;

        setTimeout(() => {
            BunnyDropdown.close(dropdown);
        }, 50);
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



    _getUniqueClickOutsideHandler(dropdown) {
        if (dropdown.__bunny_dropdown_outside_handler === undefined) {
            const data = {
                self: this,
                dropdown: dropdown
            };
            dropdown.__bunny_dropdown_outside_handler = this._clickOutsideHandler.bind(data);
        }
        return dropdown.__bunny_dropdown_outside_handler;
    },

    _clickOutsideHandler(event) {
        const data = this;
        const BunnyDropdown = data.self;
        const dropdown = data.dropdown;
        const menu = BunnyDropdown.UI.getMenu(dropdown);
        if (!(event.target === menu || menu.contains(event.target))) {
            // clicked outside of menu => close menu
            BunnyDropdown.close(dropdown);
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
