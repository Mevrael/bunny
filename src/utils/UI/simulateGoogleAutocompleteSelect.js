
import '../../constants/keycodes';

import simulateKeydown from './simulateKeydown';

/**
 *
 * @param {HTMLInputElement} input
 * @param {string} value
 * @returns {Promise}
 */
export default function simulateGoogleAutocompleteSelect(input, value) {

    const p = new Promise(ok => {
        input.value = value;
        setTimeout(() => {
            input.focus();
            setTimeout(() => {
                simulateKeydown(input, KEY_ARROW_DOWN);
                simulateKeydown(input, KEY_ENTER);
                input.blur();
                ok();
            }, 300)
        }, 1000);
    });
    return p;
}
