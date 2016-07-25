
(function() {
    if (Object.keys(HTMLSelectElement.prototype).indexOf('selectedOptions') === -1) {
        Object.defineProperty(HTMLSelectElement.prototype, 'selectedOptions', {
            get: function() {
                if (!this.multiple) {
                    return this.selectedIndex >= 0 ? [this.options[this.selectedIndex]] : [];
                }
                for (var i = 0, a = []; i < this.options.length; i++)
                    if (this.options[i].selected) a.push(this.options[i]);
                return a;
            }
        });
    }
})();
