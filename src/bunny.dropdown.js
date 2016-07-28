
export const Dropdown = {

    _collection: {},

    init(dropdown) {
        dropdown = this._elOrId(dropdown);
        if (dropdown._dropdown === undefined) {
            dropdown._dropdown = true;
        } else {
            return false;
        }
        
        if (dropdown.id !== undefined) {
            this._collection[dropdown.id] = dropdown;
        }
        const toggle_btn = this.getDropdownToggleBtn(dropdown);
        if (toggle_btn !== null) {
            this._makeUnclosableInside(dropdown);
            this._attachToggleClickEvent(dropdown);
            this._attachToggleBtnMethods(dropdown);
        }
        return true;
    },

    _elOrId(dropdown) {
        if (typeof dropdown === 'string') {
            return document.getElementById(dropdown);
        }
        return dropdown;
    },

    _attachToggleClickEvent(dropdown) {
        this.getDropdownToggleBtn(dropdown).addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle(dropdown);
        });
    },

    get(id) {
        return this._collection[id];
    },

    getDropdownToggleBtn(dropdown) {
        dropdown = this._elOrId(dropdown);
        //return dropdown.getElementsByClassName('dropdown-toggle')[0];
        return dropdown.querySelector('[data-toggle="dropdown"]');
    },

    getDropdownMenu(dropdown) {
        dropdown = this._elOrId(dropdown);
        return dropdown.getElementsByClassName('dropdown-menu')[0];
    },

    isClosableInside(dropdown) {
        return dropdown.hasAttribute('data-close-inside');
    },

    _makeUnclosableInside(dropdown) {
        if (this.isClosableInside(dropdown)) {
            this.getDropdownMenu(dropdown).addEventListener('click', (e) => {
                e.stopPropagation();
            })
        }
    },

    _getCloseEvent(dropdown) {
        return new CustomEvent('close', {detail: {dropdown: dropdown}});
    },

    _getOpenEvent(dropdown) {
        return new CustomEvent('open', {detail: {dropdown: dropdown}});
    },

    _bodyHandler(dropdown) {
        if (dropdown.classList.contains('open')) {
            this.close(dropdown);
        }
    },

    _getUniqueBodyHandler(dropdown) {
        if (dropdown._bodyHandler === undefined) {
            dropdown._bodyHandler = this._bodyHandler.bind(this, dropdown);
        }
        return dropdown._bodyHandler;
    },

    close(dropdown) {
        dropdown = this._elOrId(dropdown);
        dropdown.classList.remove('open');
        document.body.removeEventListener('click', this._getUniqueBodyHandler(dropdown));
        this.getDropdownToggleBtn(dropdown).dispatchEvent(this._getCloseEvent(dropdown));
    },

    _attachToggleBtnMethods(dropdown) {
        const toggle_btn = this.getDropdownToggleBtn(dropdown);
        toggle_btn.close = function() {
            this.close(dropdown);
        };
        toggle_btn.open = function() {
            this.open(dropdown);
        };
        toggle_btn.toggle = function() {
            this.toggle(dropdown);
        };
    },

    open(dropdown) {
        dropdown = this._elOrId(dropdown);
        dropdown.classList.add('open');
        document.body.addEventListener('click', this._getUniqueBodyHandler(dropdown));
        this.getDropdownToggleBtn(dropdown).dispatchEvent(this._getOpenEvent(dropdown));
    },

    toggle(dropdown) {
        dropdown = this._elOrId(dropdown);
        if (!dropdown.classList.contains('open')) {
            this.open(dropdown);
        } else {
            this.close(dropdown);
        }
    }

};

[].forEach.call(document.getElementsByClassName('dropdown'), dropdown => {
    Dropdown.init(dropdown);
});
