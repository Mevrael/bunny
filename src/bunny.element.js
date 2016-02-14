
export var Element = {

    getPosition: function(el) {
        var curtop = 0;
        if (el.offsetParent) {
            do {
                curtop += el.offsetTop;
            } while (el = el.offsetParent);
            return [curtop];
        }
    },

    scrollTo: function(el, navbar_height = 0) {
        window.scrollTo(0, this.getPosition(el) - navbar_height);
    }

};
