
export const DropdownConfig = {

    // true - use tag names to determine component elements instead of class names;
    // false - use class names
    useTagNames: false,
    useHiddenAttribute: false, // true - use 'hidden' HTML5 attr; false - use classNameOpened instead

    tagName: 'dropdown',
    tagNameToggleBtn: 'dropdownbutton',
    tagNameMenu: 'dropdownmenu',
    tagNameItem: 'dropdownitem',

    className: 'dropdown',
    classNameToggleBtn: 'dropdown-toggle',
    classNameMenu: 'dropdown-menu',
    classNameItem: 'dropdown-item',

    classNameOpened: 'open',
    applyOpenedClassToDropdown: true // false - apply to menu

};

export const DropdownUI = {

    config: DropdownConfig,

    _getElement(dropdown, name) {
        if (this.config.useTagNames) {
            return dropdown.getElementsByTagName(this.config['tagName' + name])[0] || false;
        }
        return dropdown.getElementsByClassName(this.config['className' + name])[0] || false;
    },

    getToggleBtn(dropdown) {
        return this._getElement(dropdown, 'ToggleBtn');
    },

    getMenu(dropdown) {
        return this._getElement(dropdown, 'Menu');
    },

    getMenuItems(dropdown) {
        const menu = this.getMenu(dropdown);
        if (!menu) {
            return [];
        }
        let queryStr = '';
        if (this.config.useTagNames) {
            queryStr += this.config.tagNameItem;
        } else {
            queryStr += '.' + this.config.classNameItem;
        }
        queryStr += ', [role="menuitem"]';
        return menu.querySelectorAll(queryStr);
    },

    getDropdownByToggleBtn(btn) {
        return btn.parentNode;
    },

    getAllDropdowns() {
        if (this.config.useTagNames) {
            return document.getElementsByTagName(this.config.tagName);
        }
        return document.getElementsByClassName(this.config.className);
    },

    show(dropdown) {
        const menu = this.getMenu(dropdown);
        if (this.config.useHiddenAttribute) {
            if (menu.hasAttribute('hidden')) {
                menu.removeAttribute('hidden');
                return true;
            }
            return false;
        } else {
            const target = this.config.applyOpenedClassToDropdown ? dropdown : menu;
            if (!target.classList.contains(this.config.classNameOpened)) {
                target.classList.add(this.config.classNameOpened);
                return true;
            }
            return false;
        }
    },

    hide(dropdown) {
        const menu = this.getMenu(dropdown);
        if (this.config.useHiddenAttribute) {
            if (!menu.hasAttribute('hidden')) {
                menu.setAttribute('hidden', '');
                return true;
            }
            return false;
        } else {
            const target = this.config.applyOpenedClassToDropdown ? dropdown : menu;
            if (target.classList.contains(this.config.classNameOpened)) {
                target.classList.remove(this.config.classNameOpened);
                return true;
            }
            return false;
        }
    },

    isOpened(dropdown) {
        const menu = this.getMenu(dropdown);
        if (this.config.useHiddenAttribute) {
            return !menu.hasAttribute('hidden');
        } else {
            const target = this.config.applyOpenedClassToDropdown ? dropdown : menu;
            return target.classList.contains(this.config.classNameOpened);
        }
    }

};

export const Dropdown = {

    ui: DropdownUI,

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
        const dropdowns = this.ui.getAllDropdowns();
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
        if (this.ui.show(dropdown)) {
            // add small delay so this handler wouldn't be attached and called immediately
            // with toggle btn click event handler and instantly close dropdown menu
            setTimeout(() => {
                document.addEventListener('click', this._getUniqueClickOutsideHandler(dropdown));
                document.addEventListener('touchstart', this._getUniqueClickOutsideHandler(dropdown));
            }, 100);

            const btn = this.ui.getToggleBtn(dropdown);
            btn.removeEventListener('click', dropdown.__bunny_dropdown_toggle_handler);
            delete dropdown.__bunny_dropdown_toggle_handler;

            if (this.isClosableOnItemClick(dropdown)) {
                this._addItemClickEvents(dropdown);
            }

            dropdown.dispatchEvent(this._getOpenEvent(dropdown));
        }
    },

    close(dropdown) {
        if (this.ui.hide(dropdown)) {
            document.removeEventListener('click', dropdown.__bunny_dropdown_outside_handler);
            document.removeEventListener('touchstart', dropdown.__bunny_dropdown_outside_handler);
            delete dropdown.__bunny_dropdown_outside_handler;

            const btn = this.ui.getToggleBtn(dropdown);
            btn.addEventListener('click', this._getUniqueClickToggleBtnHandler(dropdown));

            if (this.isClosableOnItemClick(dropdown)) {
                this._removeItemClickEvents(dropdown);
            }

            dropdown.dispatchEvent(this._getCloseEvent(dropdown));
        }
    },




    _addEvents(dropdown) {
        // open dropdown on toggle btn click or hover
        const btn = this.ui.getToggleBtn(dropdown);
        if (btn) {
            btn.addEventListener('click', this._getUniqueClickToggleBtnHandler(dropdown));

            if (this.isHoverable(dropdown)) {
                function once(el, event, cb, delay = 500) {
                    let timeout = 0;
                    el.addEventListener(event, (e) => {
                        clearTimeout(timeout);
                        timeout = setTimeout(() => {
                            cb(e);
                        }, delay)
                    });
                }

                once(dropdown, 'mouseover', (e) => {
                    //console.log(e.clientX, e.clientY);
                    const bounds = dropdown.getBoundingClientRect();
                    const menu = this.ui.getMenu(dropdown);
                    const menuBounds = menu.getBoundingClientRect();
                    //console.log(bounds)
                    if (e.clientX > bounds.left && e.clientX < bounds.right
                        && e.clientY > bounds.top && e.clientY < bounds.bottom ||
                        e.clientX > menuBounds.left && e.clientX < menuBounds.right
                        && e.clientY > menuBounds.top && e.clientY < menuBounds.bottom
                    ) {
                        // cursor is inside toggle btn or menu => open menu if required
                        this.open(dropdown);
                    }
                }, 100);

                once(dropdown, 'mouseout', (e) => {
                    const bounds = dropdown.getBoundingClientRect();
                    const menu = this.ui.getMenu(dropdown);
                    const menuBounds = menu.getBoundingClientRect();
                    //console.log(bounds)
                    if (!(e.clientX > bounds.left && e.clientX < bounds.right
                        && e.clientY > bounds.top && e.clientY < bounds.bottom ||
                        e.clientX > menuBounds.left && e.clientX < menuBounds.right
                        && e.clientY > menuBounds.top && e.clientY < menuBounds.bottom)) {
                        // cursor is outside toggle btn and menu => close menu if required
                        this.close(dropdown);
                    }

                }, 500);
            }
        }


    },




    _setARIA(dropdown) {
        const btn = this.ui.getToggleBtn(dropdown);
        if (btn) {
            btn.setAttribute('aria-haspopup', 'true');
        }

        const menu = this.ui.getMenu(dropdown);
        if (menu) {
            menu.setAttribute('role', 'menu');
        }

        const menuitems = this.ui.getMenuItems(dropdown);
        [].forEach.call(menuitems, menuitem => {
            menuitem.setAttribute('role', 'menuitem');
            if (!menuitem.hasAttribute('tabindex')) {
                menuitem.setAttribute('tabindex', '0');
            }
        })
    },




    _addItemClickEvents(dropdown) {
        const menuItems = this.ui.getMenuItems(dropdown);
        const handler = this._getUniqueClickItemHandler(dropdown);
        [].forEach.call(menuItems, menuItem => {
            menuItem.addEventListener('click', handler);
        });
    },

    _removeItemClickEvents(dropdown) {
        const menuItems = this.ui.getMenuItems(dropdown);
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

        if (BunnyDropdown.ui.isOpened(dropdown)) {
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
        const menu = BunnyDropdown.ui.getMenu(dropdown);
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
