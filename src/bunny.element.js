
export var Element = {

    getCurrentDocumentPosition() {
        return Math.abs(document.body.getBoundingClientRect().y);
    },

    getPosition: function(el) {
        var curtop = 0;
        if (el.offsetParent) {
            do {
                curtop += el.offsetTop;
            } while (el = el.offsetParent);
            return curtop;
        } else {
            return 0;
        }
    },

    scrollTo: function(el, navbar_height = 0, speed = 10) {

        const current_position = this.getCurrentDocumentPosition();
        const destination_position = this.getPosition(el);

        const distance = Math.abs(destination_position - current_position);
        const step = Math.round(distance / 40);

        let time = speed;
        for (let k = 0; k < distance; k = k + step) {
            setTimeout(() => {
                if (destination_position > current_position) {
                    // element is located after current position, scroll down
                    window.scrollTo(0, current_position + k - navbar_height);
                } else {
                    // element is located above current position, scroll up
                    console.log(current_position - k - navbar_height);
                    window.scrollTo(0, current_position - k - navbar_height);
                }
            }, time);
            time = time + speed;
        }

        // last frame
        setTimeout(() => {
            window.scrollTo(0, destination_position - navbar_height);
        }, time)
    }

};
