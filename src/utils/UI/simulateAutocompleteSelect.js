
import '../../constants/keycodes';

import simulateKeydown from './simulateKeydown';
import simulateEvent from './simulateEvent';

/**
 *
 * @param {HTMLInputElement} input
 * @param {string} value
 * @param {number} speed (optional, default 1)
 * @returns {Promise}
 */
export default function simulateAutocompleteSelect(input, value, speed = 1) {

    const p = new Promise(ok => {
        input.value = value;
        setTimeout(() => {
            input.focus();
            simulateEvent(input, 'input');
            setTimeout(() => {
                simulateKeydown(input, KEY_ARROW_DOWN);
                simulateKeydown(input, KEY_ENTER);
                input.blur();
                setTimeout(() => {
                    ok();
                }, 300 * speed);
            }, 800 * speed);
        }, 800 * speed);
    });
    return p;
}
