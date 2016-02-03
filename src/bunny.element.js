
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

    scrollTo: function(el) {
        window.scrollTo(0, this.getPosition(el));
    }

};
