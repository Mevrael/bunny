
export var AutocompleteMarkup = {

    createEmptyDropdown() {
        var dropdown = document.createElement('div');
        return dropdown;
    },

    createDropdownItem(value, content) {
        var item = document.createElement('div');
        item.setAttribute('value', value);
        item.innerHTML = content;
        return item;
    },

    createDropdownItemsFromData(data, callback = null) {
        for (var key in data) {
            var item = this.createDropdownItem(key, data[key]);
            if (callback !== null) {
                callback(item, key, data[key]);
            }
        }
    },

    removeDropdownItems(dropdown) {
        while (dropdown.firstChild) {
            dropdown.removeChild(dropdown.firstChild);
        }
    }

};
