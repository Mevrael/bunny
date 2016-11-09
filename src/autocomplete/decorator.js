
export var AutocompleteDecorator = {

    theme: {
        bs4: {
            classPrefix: '',

            dropdownClass: ['dropdown-menu', 'w-100'],
            dropdownItemClass: 'dropdown-item',
            showClass: 'active'

        }
    },

    buildClass(el, classProperty, theme, del = false) {
        var cls = this.theme[theme][classProperty + 'Class'];
        if (typeof cls === 'string') {
            if (del) {
                el.classList.remove(cls);
            } else {
                el.classList.add(cls);
            }
        } else {
            for(var k = 0; k < cls.length; k++) {
                if (del) {
                    el.classList.remove(cls[k]);
                } else {
                    el.classList.add(cls[k]);
                }
            }
        }
    },

    decorateDropdown(dropdown, theme = 'bs4') {
        this.buildClass(dropdown, 'dropdown', theme);
    },

    decorateDropdownItem(item, theme = 'bs4') {
        this.buildClass(item, 'dropdownItem', theme);
    },

    showDropdown(el_to_apply_class, theme = 'bs4') {
        this.buildClass(el_to_apply_class, 'show', theme)
    },

    hideDropdown(el_to_apply_class, theme = 'bs4') {
        this.buildClass(el_to_apply_class, 'show', theme, true)
    }
};
