
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

    /*scrollTo: function(el, navbar_height = 0, speed = 10) {

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
    }*/

    /**
     * Smooth scrolling to DOM element or to relative window position
     * If target is string it should be CSS selector
     * If target is object it should be DOM element
     * If target is number - it is used to relatively scroll X pixels form current position
     *
     * Based on https://www.sitepoint.com/smooth-scrolling-vanilla-javascript/
     *
     * @param {HTMLElement, string, number} target
     * @param {object} options - duration in ms or function(distance), offset, callback function, easing function
     */
    scrollTo(target, options = {}) {
        const start = window.pageYOffset;
        const opt = {
            duration: options.duration || 750,
            offset: options.offset || 0,
            callback: options.callback,
            easing: options.easing || easeInOutQuad
        };
        let distance = 0;
        if (typeof target === 'string') {
            distance = opt.offset + document.querySelector(target).getBoundingClientRect().top;
        } else if (typeof target === 'object') {
            distance = target.getBoundingClientRect().top;
        } else {
            distance = target;
        }

        let duration = 0;
        if (typeof opt.duration === 'function') {
            duration = opt.duration(distance);
        } else {
            duration = opt.duration;
        }

        let timeStart = 0;
        let timeElapsed = 0;

        distance = distance + opt.offset;

        requestAnimationFrame( time => {
            timeStart = time;
            loop(time);
        });

        function loop(time) {
            timeElapsed = time - timeStart;
            window.scrollTo(0, opt.easing(timeElapsed, start, distance, duration));
            if (timeElapsed < duration) {
                requestAnimationFrame(loop);
            } else {
                end();
            }
        }

        function end() {
            window.scrollTo(0, start + distance);
            if (typeof opt.callback === 'function') {
                opt.callback();
            }
        }

        // Robert Penner's easeInOutQuad - http://robertpenner.com/easing/
        function easeInOutQuad(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return c / 2 * t * t + b;
            t--;
            return -c / 2 * (t * (t - 2) - 1) + b;
        }
    }

};
