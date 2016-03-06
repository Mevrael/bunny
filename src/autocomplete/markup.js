
export var AutocompleteMarkup = {

    createEmptyDropdown() {
        var dropdown = document.createElement('div');
        return dropdown;
    },

    createDropdownItem(value, content) {
        var item = document.createElement('button');
        item.setAttribute('type', 'button');
        item.setAttribute('value', value);
        item.textContent = content;
        return item;
    },

    createDropdownItemsFromData(data, callback = null) {
        var fragment = document.createDocumentFragment();
        for (var key in data) {
            var item = this.createDropdownItem(key, data[key]);
            if (callback !== null) {
                callback(item, key, data[key]);
            }
            fragment.appendChild(item);
        }
        return fragment;
    },

    removeDropdown(dropdown) {
        /*while (dropdown.firstChild) {
            dropdown.removeChild(dropdown.firstChild);
        }*/
        if (dropdown.parentNode !== null) {
            dropdown.parentNode.removeChild(dropdown);
        }
    },

    insertDropdown(container, dropdown) {
        var el = container.getElementsByTagName('input')[0];
        el.parentNode.insertBefore(dropdown, el.nextSibling);
    }

};
