
export const BunnyElement = {

    getCurrentDocumentPosition() {
        return Math.abs(document.body.getBoundingClientRect().y);
    },

    getPosition(el) {
        let curTop = 0;
        if (el.offsetParent) {
            do {
                curTop += el.offsetTop;
            } while (el = el.offsetParent);
            return curTop;
        } else {
            return 0;
        }
    },

    /**
     * Smooth scrolling to DOM element or to relative window position
     * If target is string it should be CSS selector
     * If target is object it should be DOM element
     * If target is number - it is used to relatively scroll X pixels form current position
     *
     * Based on https://www.sitepoint.com/smooth-scrolling-vanilla-javascript/
     *
     * @param {HTMLElement, string, number} target
     * @param {Number|function} duration
     * @param {Number} offset
     */
    scrollTo(target, duration = 500, offset = 0) {
        return new Promise(onAnimationEnd => {

            let element;
            if (typeof target === 'string') {
                element = document.querySelector(target);
            } else if (typeof target === 'object') {
                element = target;
            } else {
                // number
                element = null;
            }

            if (element !== null && element.offsetParent === null) {
                // element is not visible, scroll to top of parent element
                element = element.parentNode;
            }

            const start = window.pageYOffset;
            let distance = 0;
            if (element !== null) {
                distance = element.getBoundingClientRect().top;
            } else {
                // number
                distance = target;
            }
            distance = distance + offset;

            if (typeof duration === 'function') {
                duration = duration(distance);
            }

            let timeStart = 0;
            let timeElapsed = 0;

            requestAnimationFrame( time => {
                timeStart = time;
                loop(time);
            });

            function loop(time) {
                timeElapsed = time - timeStart;
                window.scrollTo(0, easeInOutQuad(timeElapsed, start, distance, duration));
                if (timeElapsed < duration) {
                    requestAnimationFrame(loop);
                } else {
                    end();
                }
            }

            function end() {
                window.scrollTo(0, start + distance);
                onAnimationEnd();
            }

            // Robert Penner's easeInOutQuad - http://robertpenner.com/easing/
            function easeInOutQuad(t, b, c, d) {
                t /= d / 2;
                if (t < 1) return c / 2 * t * t + b;
                t--;
                return -c / 2 * (t * (t - 2) - 1) + b;
            }
        });
    }

};
